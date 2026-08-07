const { findGaps, RULES } = require('./gaps');

const ev = (type, extractedEntities) => ({ type, extractedEntities });

const missingTypes = (gaps) => gaps.map((gap) => gap.missingType);

describe('findGaps — nothing to say', () => {
  test.each([
    ['a case with no evidence', []],
    ['a non-array', undefined],
    ['null', null],
  ])('returns no gaps for %s', (_label, input) => {
    expect(findGaps(input)).toEqual([]);
  });

  test('an entity with no rule against it raises nothing', () => {
    // Dates and urgency language are deliberately not gap triggers: nearly
    // every document has them, so they would flag on every case.
    const gaps = findGaps([
      ev('whatsapp', { dates: ['12/08/2026'], suspicious_keywords: ['URGENT'] }),
    ]);
    expect(gaps).toEqual([]);
  });

  test('a case holding all three evidence types has no gaps', () => {
    const entities = {
      amounts: ['Rs 45,000'],
      upi_ids: ['meera.k@okaxis'],
      phone_numbers: ['+91 90000 11111'],
    };
    const gaps = findGaps([
      ev('whatsapp', entities),
      ev('screenshot', entities),
      ev('bank_statement', entities),
    ]);
    expect(gaps).toEqual([]);
  });
});

describe('findGaps — the three rules', () => {
  test('an amount with no bank statement', () => {
    const gaps = findGaps([ev('whatsapp', { amounts: ['Rs 45,000'] })]);
    expect(missingTypes(gaps)).toEqual(['bank_statement']);
    expect(gaps[0].values).toEqual(['Rs 45,000']);
    expect(gaps[0].detail).toContain('bank statement');
  });

  test('a UPI ID with no screenshot', () => {
    const gaps = findGaps([ev('whatsapp', { upi_ids: ['meera.k@okaxis'] })]);
    expect(missingTypes(gaps)).toEqual(['screenshot']);
    expect(gaps[0].values).toEqual(['meera.k@okaxis']);
    expect(gaps[0].detail).toContain('screenshot');
  });

  test('a phone number with no chat export', () => {
    const gaps = findGaps([ev('screenshot', { phone_numbers: ['+91 90000 11111'] })]);
    expect(missingTypes(gaps)).toEqual(['whatsapp']);
    expect(gaps[0].values).toEqual(['+91 90000 11111']);
    expect(gaps[0].detail).toContain('chat export');
  });

  test('a rule stays quiet when its evidence type is already present', () => {
    // The chat export holds a phone number, but a chat export is exactly what
    // that rule would ask for — so only the other two fire.
    const gaps = findGaps([
      ev('whatsapp', {
        amounts: ['Rs 45,000'],
        upi_ids: ['meera.k@okaxis'],
        phone_numbers: ['+91 90000 11111'],
      }),
    ]);
    expect(missingTypes(gaps)).toEqual(['bank_statement', 'screenshot']);
  });

  test('uploading the missing type clears that gap', () => {
    const chat = ev('whatsapp', { amounts: ['Rs 45,000'] });
    expect(missingTypes(findGaps([chat]))).toEqual(['bank_statement']);

    const statement = ev('bank_statement', { amounts: ['45000.00'] });
    expect(findGaps([chat, statement])).toEqual([]);
  });

  test('gaps come back in rule order', () => {
    const gaps = findGaps([
      ev('screenshot', { amounts: ['Rs 45,000'], phone_numbers: ['+91 90000 11111'] }),
    ]);
    const ruleOrder = RULES.map((rule) => rule.missingType);
    const returned = missingTypes(gaps);
    expect(returned).toEqual(ruleOrder.filter((type) => returned.includes(type)));
  });

  test('every gap carries the shape the dashboard renders', () => {
    const [gap] = findGaps([ev('whatsapp', { amounts: ['Rs 45,000'] })]);
    expect(gap).toEqual({
      missingType: expect.any(String),
      title: expect.any(String),
      detail: expect.any(String),
      values: expect.arrayContaining([expect.any(String)]),
    });
  });
});

describe('findGaps — entities pooled across the case', () => {
  test('an entity in one document is judged against the whole case', () => {
    const gaps = findGaps([
      ev('whatsapp', { phone_numbers: ['+91 90000 11111'] }),
      ev('screenshot', { amounts: ['Rs 9,000'] }),
    ]);
    // The amount came from the screenshot, the chat export satisfies the phone
    // rule, and neither document is a statement.
    expect(missingTypes(gaps)).toEqual(['bank_statement']);
  });

  test('collects values from every document', () => {
    const gaps = findGaps([
      ev('whatsapp', { amounts: ['Rs 45,000'] }),
      ev('screenshot', { amounts: ['Rs 12,000'] }),
    ]);
    expect(gaps[0].values).toEqual(['Rs 45,000', 'Rs 12,000']);
  });

  test('the same value in two documents is listed once, trimmed', () => {
    const gaps = findGaps([
      ev('whatsapp', { upi_ids: ['meera.k@okaxis'] }),
      ev('bank_statement', { upi_ids: ['  meera.k@okaxis  '] }),
    ]);
    expect(gaps[0].values).toEqual(['meera.k@okaxis']);
  });
});

describe('findGaps — malformed model output', () => {
  test('a bare string instead of a list still triggers', () => {
    const gaps = findGaps([ev('screenshot', { amounts: 'Rs 1,200' })]);
    expect(missingTypes(gaps)).toEqual(['bank_statement']);
    expect(gaps[0].values).toEqual(['Rs 1,200']);
  });

  test.each([
    ['empty lists', { amounts: [], upi_ids: [], phone_numbers: [] }],
    ['nulls', { amounts: null, upi_ids: null, phone_numbers: null }],
    ['empty strings', { amounts: '', upi_ids: '', phone_numbers: '' }],
    ['no entities at all', {}],
  ])('raises nothing for %s', (_label, entities) => {
    expect(findGaps([ev('screenshot', entities)])).toEqual([]);
  });

  test('drops nulls and blanks from inside a list', () => {
    const gaps = findGaps([ev('whatsapp', { amounts: [null, '', '  ', 'Rs 500'] })]);
    expect(gaps[0].values).toEqual(['Rs 500']);
  });

  test('survives a document with no entities key', () => {
    expect(() => findGaps([{ type: 'whatsapp' }])).not.toThrow();
    expect(findGaps([{ type: 'whatsapp' }])).toEqual([]);
  });

  test('stringifies a non-string value rather than dropping it', () => {
    const gaps = findGaps([ev('whatsapp', { amounts: [45000] })]);
    expect(gaps[0].values).toEqual(['45000']);
  });
});

describe('the rules themselves', () => {
  test('there is one rule per supported evidence type', () => {
    // A gap can only ever name something the upload screen accepts, or it
    // sends a victim to find a file Argus would then refuse.
    expect(RULES.map((rule) => rule.missingType).sort()).toEqual([
      'bank_statement',
      'screenshot',
      'whatsapp',
    ]);
  });

  test('every rule has copy to render', () => {
    RULES.forEach((rule) => {
      expect(rule.title).toEqual(expect.any(String));
      expect(rule.detail).toEqual(expect.any(String));
      expect(rule.entityKey).toEqual(expect.any(String));
    });
  });
});

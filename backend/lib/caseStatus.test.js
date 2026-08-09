const { STATUSES, DEFAULT_STATUS, isStatus, rejectionReason } = require('./caseStatus');

describe('the statuses themselves', () => {
  test('are the four the product documents, in reading order', () => {
    expect(STATUSES).toEqual(['building', 'ready_to_file', 'filed', 'resolved']);
  });

  test('a new case starts as building', () => {
    expect(DEFAULT_STATUS).toBe('building');
    expect(STATUSES).toContain(DEFAULT_STATUS);
  });
});

describe('isStatus', () => {
  test.each(STATUSES)('accepts %s', (status) => {
    expect(isStatus(status)).toBe(true);
  });

  test.each([
    ['an unknown name', 'archived'],
    ['a near miss', 'ready-to-file'],
    ['wrong case', 'Building'],
    ['an empty string', ''],
    ['undefined', undefined],
    ['null', null],
    ['a number', 2],
    ['an object', { status: 'filed' }],
    ['an array', ['filed']],
  ])('refuses %s', (_label, value) => {
    expect(isStatus(value)).toBe(false);
  });
});

describe('rejectionReason — the one rule', () => {
  test('an empty case cannot call itself ready to file', () => {
    expect(rejectionReason('ready_to_file', 0)).toEqual(expect.stringContaining('evidence'));
  });

  test('one piece of evidence is enough', () => {
    expect(rejectionReason('ready_to_file', 1)).toBeNull();
    expect(rejectionReason('ready_to_file', 9)).toBeNull();
  });

  test.each(STATUSES.filter((s) => s !== 'ready_to_file'))(
    'an empty case may still be %s',
    (status) => {
      expect(rejectionReason(status, 0)).toBeNull();
    },
  );
});

describe('rejectionReason — no forced sequence', () => {
  // Cases do not run in a line: evidence arrives after filing, and something
  // filed long ago resolves on its own. Every pair has to be allowed.
  const pairs = STATUSES.flatMap((from) => STATUSES.map((to) => [from, to]));

  test.each(pairs)('%s -> %s is allowed on a case with evidence', (_from, to) => {
    expect(rejectionReason(to, 1)).toBeNull();
  });

  test('including moving backwards', () => {
    expect(rejectionReason('building', 3)).toBeNull();
    expect(rejectionReason('ready_to_file', 3)).toBeNull();
  });
});

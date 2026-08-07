const {
  scoreEvidence,
  scoreCase,
  riskLabel,
  riskLevel,
  POINTS,
  BANDS,
  MAX_SCORE,
} = require('./riskScore');

/** Evidence is only ever read for its entities here, so that is all it needs. */
const ev = (extractedEntities) => ({ extractedEntities });

describe('scoreEvidence — one document on its own', () => {
  test('scores nothing when there are no entities', () => {
    expect(scoreEvidence(ev({}))).toBe(0);
  });

  test('scores each suspicious keyword', () => {
    expect(scoreEvidence(ev({ suspicious_keywords: ['URGENT'] }))).toBe(POINTS.suspiciousKeyword);
    expect(scoreEvidence(ev({ suspicious_keywords: ['URGENT', 'OTP'] }))).toBe(
      POINTS.suspiciousKeyword * 2,
    );
  });

  describe('amount tiers', () => {
    // The thresholds are exclusive — `largest > TIER`, not >=. A statement for
    // exactly ten thousand is the boundary case that decides whether an
    // ordinary rent payment scores.
    test.each([
      ['below tier 1', '9,999', 0],
      ['exactly tier 1', '10,000', 0],
      ['just over tier 1', '10,001', POINTS.amountOverTier1],
      ['exactly tier 2', '50,000', POINTS.amountOverTier1],
      ['just over tier 2', '50,001', POINTS.amountOverTier1 + POINTS.amountOverTier2],
    ])('%s', (_label, amount, expected) => {
      expect(scoreEvidence(ev({ amounts: [amount] }))).toBe(expected);
    });

    test('tiers are cumulative, so a larger sum always outranks a smaller one', () => {
      const small = scoreEvidence(ev({ amounts: ['Rs 25,000'] }));
      const large = scoreEvidence(ev({ amounts: ['Rs 75,000'] }));
      expect(large).toBeGreaterThan(small);
      expect(large).toBe(POINTS.amountOverTier1 + POINTS.amountOverTier2);
    });

    test('only the largest amount counts, not each one', () => {
      expect(scoreEvidence(ev({ amounts: ['Rs 100', 'Rs 75,000', 'Rs 200'] }))).toBe(
        POINTS.amountOverTier1 + POINTS.amountOverTier2,
      );
    });

    // The model returns amounts however they appeared in the evidence.
    test.each([
      ['rupee prefix', 'Rs 75,000'],
      ['symbol prefix', '₹75,000'],
      ['indian grouping', '1,00,000'],
      ['statement decimals', '75000.00'],
      ['a bare number', 75000],
    ])('reads %s', (_label, amount) => {
      expect(scoreEvidence(ev({ amounts: [amount] }))).toBe(
        POINTS.amountOverTier1 + POINTS.amountOverTier2,
      );
    });

    test('ignores an amount with no number in it', () => {
      expect(scoreEvidence(ev({ amounts: ['a large sum'] }))).toBe(0);
    });
  });

  describe('a phone number beside a payment handle', () => {
    test('scores nothing for either alone', () => {
      expect(scoreEvidence(ev({ phone_numbers: ['+91 90000 11111'] }))).toBe(0);
      expect(scoreEvidence(ev({ upi_ids: ['meera.k@okaxis'] }))).toBe(0);
    });

    test('scores when both appear together', () => {
      expect(
        scoreEvidence(ev({ phone_numbers: ['+91 90000 11111'], upi_ids: ['meera.k@okaxis'] })),
      ).toBe(POINTS.phoneAndUpiTogether);
    });
  });

  test('adds the rules together', () => {
    expect(
      scoreEvidence(
        ev({
          suspicious_keywords: ['URGENT'],
          amounts: ['Rs 75,000'],
          phone_numbers: ['+91 90000 11111'],
          upi_ids: ['meera.k@okaxis'],
        }),
      ),
    ).toBe(
      POINTS.suspiciousKeyword +
        POINTS.amountOverTier1 +
        POINTS.amountOverTier2 +
        POINTS.phoneAndUpiTogether,
    );
  });

  test('never exceeds the maximum', () => {
    const manyKeywords = Array.from({ length: 20 }, (_, i) => `keyword-${i}`);
    expect(scoreEvidence(ev({ suspicious_keywords: manyKeywords }))).toBe(MAX_SCORE);
  });
});

// extractedEntities is Mixed in the schema and comes from a language model, so
// none of these shapes are hypothetical.
describe('scoreEvidence — malformed model output', () => {
  test.each([
    ['the whole document missing', undefined],
    ['a null document', null],
    ['no entities key', {}],
    ['null entities', { extractedEntities: null }],
  ])('survives %s', (_label, evidence) => {
    expect(scoreEvidence(evidence)).toBe(0);
  });

  test('treats a bare string as a single value', () => {
    expect(scoreEvidence(ev({ suspicious_keywords: 'OTP' }))).toBe(POINTS.suspiciousKeyword);
    expect(scoreEvidence(ev({ amounts: 'Rs 75,000' }))).toBe(
      POINTS.amountOverTier1 + POINTS.amountOverTier2,
    );
  });

  test('drops nulls and empty strings rather than counting them', () => {
    expect(scoreEvidence(ev({ suspicious_keywords: [null, '', 'OTP', undefined] }))).toBe(
      POINTS.suspiciousKeyword,
    );
  });

  test('ignores an amount that is an object', () => {
    expect(scoreEvidence(ev({ amounts: [{ value: 75000 }] }))).toBe(0);
  });

  test('ignores a non-finite number', () => {
    expect(scoreEvidence(ev({ amounts: [NaN, Infinity] }))).toBe(0);
  });

  test('an empty list is the same as an absent field', () => {
    expect(scoreEvidence(ev({ suspicious_keywords: [], amounts: [], phone_numbers: [] }))).toBe(0);
  });
});

describe('scoreCase — the whole case', () => {
  test.each([
    ['no evidence', []],
    ['a non-array', undefined],
    ['null', null],
  ])('scores nothing for %s', (_label, input) => {
    expect(scoreCase(input)).toBe(0);
  });

  test('a single document scores exactly as it does alone', () => {
    const only = ev({ suspicious_keywords: ['URGENT', 'OTP'] });
    expect(scoreCase([only])).toBe(scoreEvidence(only));
  });

  test('takes the strongest document, not the sum', () => {
    const strong = ev({ suspicious_keywords: ['a', 'b'] }); // 30
    const weak = ev({ suspicious_keywords: ['c'] }); // 15
    // Summing would give 45 + corroboration; the base is the strongest alone.
    expect(scoreCase([strong, weak])).toBe(30 + POINTS.additionalEvidence);
  });

  test('adds the corroboration bonus once per additional document', () => {
    const doc = ev({ suspicious_keywords: ['URGENT'] });
    expect(scoreCase([doc])).toBe(POINTS.suspiciousKeyword);
    expect(scoreCase([doc, doc])).toBe(POINTS.suspiciousKeyword + POINTS.additionalEvidence);
    expect(scoreCase([doc, doc, doc])).toBe(POINTS.suspiciousKeyword + POINTS.additionalEvidence * 2);
  });

  test('never exceeds the maximum', () => {
    const heavy = ev({ suspicious_keywords: ['a', 'b', 'c', 'd', 'e', 'f'] });
    expect(scoreCase([heavy, heavy, heavy])).toBe(MAX_SCORE);
  });
});

describe('band boundaries', () => {
  // These are the boundaries the interface colours against, so an off-by-one
  // here silently changes when a case turns red.
  test.each([
    [0, 'low', 'Low risk'],
    [30, 'low', 'Low risk'],
    [31, 'medium', 'Medium risk'],
    [65, 'medium', 'Medium risk'],
    [66, 'high', 'High risk'],
    [100, 'high', 'High risk'],
  ])('%i is %s', (score, level, label) => {
    expect(riskLevel(score)).toBe(level);
    expect(riskLabel(score)).toBe(label);
  });

  test.each([
    ['below zero', -20, 'Low risk'],
    ['above the maximum', 500, 'High risk'],
    ['not a number', 'nonsense', 'Low risk'],
    ['undefined', undefined, 'Low risk'],
  ])('clamps %s rather than throwing', (_label, score, expected) => {
    expect(riskLabel(score)).toBe(expected);
  });

  test('the bands cover the whole scale without a gap', () => {
    expect(BANDS[BANDS.length - 1].ceiling).toBe(MAX_SCORE);
    for (let score = 0; score <= MAX_SCORE; score += 1) {
      expect(['low', 'medium', 'high']).toContain(riskLevel(score));
    }
  });
});

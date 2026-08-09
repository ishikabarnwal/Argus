const { buildCaseBundle, safeName } = require('./bundle');

// A stored name is whatever the uploader's machine called the file, so these
// are the shapes an archive has to survive rather than honour.
describe('safeName — names that could escape the archive', () => {
  test.each([
    ['a plain name', 'receipt.png', 'receipt.png'],
    ['a unix path', 'evidence/receipt.png', 'receipt.png'],
    ['a windows path', 'C:\\Users\\me\\receipt.png', 'receipt.png'],
    ['parent traversal', '../../../etc/passwd', 'passwd'],
    ['traversal with separators kept', '..\\..\\windows\\system32\\a.dll', 'a.dll'],
    ['a leading dot', '.hidden', 'hidden'],
    ['spaces and punctuation', 'my receipt (1).png', 'my_receipt__1_.png'],
  ])('%s', (_label, input, expected) => {
    expect(safeName(input, 'fallback')).toBe(expected);
  });

  test.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
    ['only separators', '///'],
    ['only dots', '...'],
    ['only unsafe characters', '???'],
  ])('falls back for %s', (_label, input) => {
    // '???' becomes '___', which is safe — the fallback is for names that
    // reduce to nothing at all.
    expect(safeName(input, 'fallback')).toMatch(/^(fallback|_+)$/);
  });

  test('never keeps a path separator', () => {
    ['a/b', 'a\\b', '/a', 'a/'].forEach((name) => {
      expect(safeName(name, 'fallback')).not.toMatch(/[/\\]/);
    });
  });

  test('is bounded, so one absurd name cannot dominate the archive', () => {
    expect(safeName('x'.repeat(500), 'fallback').length).toBeLessThanOrEqual(80);
  });
});

describe('buildCaseBundle — a case with no stored originals', () => {
  // Every item is pasted text, so nothing is fetched and no network is
  // touched. This is also the "handle zero files gracefully" case.
  const evidence = [
    {
      type: 'whatsapp',
      uploadedAt: new Date('2026-08-02T10:00:00Z'),
      extractedEntities: { amounts: ['Rs 45,000'] },
    },
    {
      type: 'bank_statement',
      uploadedAt: new Date('2026-08-03T10:00:00Z'),
      extractedEntities: { upi_ids: ['meera.k@okaxis'] },
    },
  ];

  const caseDoc = { caseId: 'CASE-2026-0001', riskScore: 55, status: 'filed' };

  test('still produces a real ZIP', async () => {
    const { zip } = await buildCaseBundle({ caseDoc, evidence });

    // PK\x03\x04 — the local file header every ZIP starts with.
    expect(zip.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    expect(zip.length).toBeGreaterThan(500);
  });

  test('reports nothing included and nothing missing', async () => {
    const { included, missing } = await buildCaseBundle({ caseDoc, evidence });
    expect(included).toBe(0);
    expect(missing).toEqual([]);
  });

  test('contains the report and nothing else', async () => {
    const { zip } = await buildCaseBundle({ caseDoc, evidence });
    const text = zip.toString('latin1');
    expect(text).toContain('report.pdf');
    expect(text).not.toContain('originals/');
    expect(text).not.toContain('MISSING.txt');
  });

  test('works for a case with no evidence at all', async () => {
    const { zip, included } = await buildCaseBundle({ caseDoc, evidence: [] });
    expect(zip.subarray(0, 2).toString()).toBe('PK');
    expect(included).toBe(0);
  });
});

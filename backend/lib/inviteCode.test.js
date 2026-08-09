const { grantsInvestigator, invitesEnabled } = require('./inviteCode');

const CODE = 'a-real-invite-code-9f2b';

describe('grantsInvestigator — the code that works', () => {
  test('grants on an exact match', () => {
    expect(grantsInvestigator(CODE, CODE)).toBe(true);
  });

  test('tolerates whitespace around a pasted code', () => {
    expect(grantsInvestigator(`  ${CODE}`, CODE)).toBe(true);
    expect(grantsInvestigator(`${CODE}\n`, CODE)).toBe(true);
    expect(grantsInvestigator(CODE, ` ${CODE} `)).toBe(true);
  });
});

describe('grantsInvestigator — everything else', () => {
  test.each([
    ['a wrong code', 'not-the-code'],
    ['the right code with a character changed', 'a-real-invite-code-9f2c'],
    ['a prefix of the right code', 'a-real-invite'],
    ['the right code with something appended', `${CODE}x`],
    ['different case', CODE.toUpperCase()],
    ['an empty string', ''],
    ['only whitespace', '   '],
  ])('refuses %s', (_label, submitted) => {
    expect(grantsInvestigator(submitted, CODE)).toBe(false);
  });

  test.each([
    ['undefined', undefined],
    ['null', null],
    ['a number', 12345],
    ['an object', { code: CODE }],
    ['an array', [CODE]],
    ['a boolean', true],
  ])('refuses %s without throwing', (_label, submitted) => {
    expect(() => grantsInvestigator(submitted, CODE)).not.toThrow();
    expect(grantsInvestigator(submitted, CODE)).toBe(false);
  });
});

// The failure that would matter most: a deployment that never set the
// variable handing the role to anyone who leaves the field blank.
describe('grantsInvestigator — when no code is configured', () => {
  test.each([
    ['unset', undefined],
    ['empty', ''],
    ['whitespace only', '  '],
    ['null', null],
  ])('refuses everything when the expected code is %s', (_label, expected) => {
    expect(grantsInvestigator('', expected)).toBe(false);
    expect(grantsInvestigator('   ', expected)).toBe(false);
    expect(grantsInvestigator(undefined, expected)).toBe(false);
    expect(grantsInvestigator('anything at all', expected)).toBe(false);
  });

  test('an empty submission never matches an empty configuration', () => {
    // Both sides blank is the case a plain === would wave through.
    expect(grantsInvestigator('', '')).toBe(false);
  });
});

describe('invitesEnabled', () => {
  const original = process.env.INVESTIGATOR_INVITE_CODE;

  afterEach(() => {
    if (original === undefined) delete process.env.INVESTIGATOR_INVITE_CODE;
    else process.env.INVESTIGATOR_INVITE_CODE = original;
  });

  test('false when unset', () => {
    delete process.env.INVESTIGATOR_INVITE_CODE;
    expect(invitesEnabled()).toBe(false);
  });

  test('false when blank', () => {
    process.env.INVESTIGATOR_INVITE_CODE = '   ';
    expect(invitesEnabled()).toBe(false);
  });

  test('true when set', () => {
    process.env.INVESTIGATOR_INVITE_CODE = CODE;
    expect(invitesEnabled()).toBe(true);
  });
});

describe('the environment default', () => {
  const original = process.env.INVESTIGATOR_INVITE_CODE;

  afterEach(() => {
    if (original === undefined) delete process.env.INVESTIGATOR_INVITE_CODE;
    else process.env.INVESTIGATOR_INVITE_CODE = original;
  });

  test('falls back to INVESTIGATOR_INVITE_CODE when no expectation is passed', () => {
    process.env.INVESTIGATOR_INVITE_CODE = CODE;
    expect(grantsInvestigator(CODE)).toBe(true);
    expect(grantsInvestigator('wrong')).toBe(false);
  });
});

/**
 * Case identifiers.
 *
 * The backend takes caseId as a free-form string and does not generate one,
 * so the format is a front-end convention: CASE-<year>-<four digits>, the
 * same shape the homepage preview shows. Random rather than sequential
 * because nothing here can see the other cases; collisions just mean two
 * uploads land in one case file, and the field is editable.
 */

const PATTERN = /^CASE-\d{4}-\d{4}$/

export function generateCaseId(now = new Date()) {
  const suffix = String(Math.floor(Math.random() * 10_000)).padStart(4, '0')
  return `CASE-${now.getFullYear()}-${suffix}`
}

/** Whether an id follows the house format. Non-matching ids still work. */
export function isHouseFormat(caseId) {
  return PATTERN.test(caseId)
}

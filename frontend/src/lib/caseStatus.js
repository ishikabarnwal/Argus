/**
 * Case status — presentation rules.
 *
 * The list is mirrored in backend/lib/caseStatus.js, which is authoritative:
 * the API decides what a case may be set to and refuses the rest. What lives
 * here is the wording shown to a person and the token each status is drawn
 * in, neither of which the backend has any business knowing.
 *
 * Ordered as they read, not as a sequence anyone is held to — any status can
 * follow any other, because real cases do not progress in a line.
 */

const STATUSES = [
  { value: 'building', label: 'Building' },
  { value: 'ready_to_file', label: 'Ready to file' },
  { value: 'filed', label: 'Filed' },
  { value: 'resolved', label: 'Resolved' },
]

const BY_VALUE = new Map(STATUSES.map((status) => [status.value, status]))

/** Human wording. Falls back to the raw value rather than rendering nothing. */
export function statusLabel(value) {
  return BY_VALUE.get(value)?.label ?? value ?? 'Unknown'
}

/**
 * The CSS custom property carrying this status's colour.
 *
 * Built from the value rather than kept in a second map here, so adding a
 * status means adding one token and one line above instead of three.
 */
export function statusColorVar(value) {
  return BY_VALUE.has(value) ? `var(--status-${value})` : 'var(--text-tertiary)'
}

export { STATUSES }

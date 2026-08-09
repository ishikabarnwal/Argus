import { statusColorVar, statusLabel } from '../lib/caseStatus'
import './StatusBadge.css'

/**
 * Where a case has got to, as a chip.
 *
 * Used on the case list and on the case itself, so both read the same — a
 * status that looked one way in a list and another on the page it belongs to
 * would be two things to learn instead of one.
 */
export default function StatusBadge({ status }) {
  if (!status) return null

  return (
    <span className="status-badge" style={{ '--status': statusColorVar(status) }}>
      <span className="status-badge__dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  )
}

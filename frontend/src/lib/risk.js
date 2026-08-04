/**
 * Fraud risk scoring — presentation rules.
 *
 * Red is reserved across the whole product for confirmed fraud signals, so a
 * score only earns it in the top band. Everything below is caution orange or,
 * at the bottom, the informational blue — never green, which would promise a
 * safety this cannot establish.
 *
 * The bands are duplicated in backend/lib/riskScore.js, which is authoritative:
 * real scores and labels arrive from the API already computed. What lives here
 * is the mapping from a score to a CSS colour, which is a front-end concern the
 * backend has no business knowing, plus labelling for the landing page mock,
 * which has no API behind it. Keep the boundaries in step with the backend and
 * with the --risk-* tokens in styles/tokens.css.
 */

/** Ordered low to high. The last ceiling is the top of the scale. */
const BANDS = [
  { ceiling: 30, level: 'low', label: 'Low risk' },
  { ceiling: 65, level: 'medium', label: 'Medium risk' },
  { ceiling: 100, level: 'high', label: 'High risk' },
]

/** Lowest score that earns alert red. */
export const HIGH_RISK_THRESHOLD = BANDS[1].ceiling + 1

function bandFor(score) {
  const clamped = Math.min(Math.max(Number(score) || 0, 0), 100)
  return BANDS.find((band) => clamped <= band.ceiling)
}

/** @returns {'low' | 'medium' | 'high'} */
export function riskLevel(score) {
  return bandFor(score).level
}

/** The middle band's token predates the three-band scale and is still named
 *  --risk-elevated, so the mapping is spelled out rather than derived. */
const COLOR_VAR = {
  low: '--risk-low',
  medium: '--risk-elevated',
  high: '--risk-high',
}

/** CSS custom property carrying the colour for this score. */
export function riskColorVar(score) {
  return `var(${COLOR_VAR[riskLevel(score)]})`
}

/** Human-readable band, for labels and screen readers. */
export function riskLabel(score) {
  return bandFor(score).label
}

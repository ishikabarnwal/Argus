/**
 * Fraud risk scoring — presentation rules.
 *
 * Red is reserved across the whole product for confirmed fraud signals.
 * A risk score therefore only earns red once it crosses the high-risk
 * threshold; everything below it is caution orange.
 *
 * Keep HIGH_RISK_THRESHOLD in step with the --risk-* tokens in
 * styles/tokens.css. This module is the single source of truth for the
 * rule — components should call these helpers rather than comparing
 * scores inline, so the threshold can move in one edit.
 */

/** Scores are 0–100. At or above this, the score is shown in alert red. */
export const HIGH_RISK_THRESHOLD = 70

/** @returns {'high' | 'elevated'} */
export function riskLevel(score) {
  return score >= HIGH_RISK_THRESHOLD ? 'high' : 'elevated'
}

/** CSS custom property carrying the colour for this score. */
export function riskColorVar(score) {
  return riskLevel(score) === 'high' ? 'var(--risk-high)' : 'var(--risk-elevated)'
}

/** Human-readable band, for labels and screen readers. */
export function riskLabel(score) {
  return riskLevel(score) === 'high' ? 'High risk' : 'Elevated risk'
}

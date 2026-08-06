/**
 * Fraud risk scoring — rule-based, deliberately.
 *
 * Every number below is a judgement call, not a measurement. Keeping the rules
 * explicit and in one file means the score can be explained to the person it is
 * about ("this is high because three urgency phrases and a ₹75,000 transfer
 * appear together"), which a trained model could not do here.
 *
 * Scoring happens in two steps, because the rules operate at two levels:
 *
 *   scoreEvidence()  one document on its own
 *   scoreCase()      every document on a case, plus corroboration
 *
 * A single Evidence document cannot know how many siblings it has, so the
 * "more evidence, more confirmed pattern" rule can only live at case level.
 */

const { list } = require('./entities')

/** Points per rule. Adjust here; nothing else hard-codes these. */
const POINTS = {
  suspiciousKeyword: 15,
  amountOverTier1: 20,
  amountOverTier2: 25,
  phoneAndUpiTogether: 15,
  additionalEvidence: 10,
}

/** Rupee thresholds. Tiers are cumulative — see scoreEvidence(). */
const AMOUNT_TIER_1 = 10_000
const AMOUNT_TIER_2 = 50_000

const MAX_SCORE = 100

/** Upper bound of each band. Ordered low to high; the last must be MAX_SCORE. */
const BANDS = [
  { ceiling: 30, label: 'Low risk' },
  { ceiling: 65, label: 'Medium risk' },
  { ceiling: MAX_SCORE, label: 'High risk' },
]

/**
 * Pull a number out of whatever the model called an amount: "₹25,000",
 * "Rs 25000", "1,00,000" (Indian grouping is only commas), or a bare number.
 * Returns null when there is no number in there at all.
 */
function parseAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null

  const match = value.replace(/[,\s]/g, '').match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

/**
 * Score one piece of evidence on its own, 0-100.
 *
 * The two amount tiers are cumulative: ₹75,000 is over both thresholds and
 * scores 20 + 25 = 45, so a larger sum always outranks a smaller one. Making
 * them exclusive instead is a one-line change (drop the first `if`).
 */
function scoreEvidence(evidence) {
  const entities = evidence?.extractedEntities
  let score = 0

  score += list(entities, 'suspicious_keywords').length * POINTS.suspiciousKeyword

  const amounts = list(entities, 'amounts').map(parseAmount).filter((n) => n !== null)
  const largest = amounts.length > 0 ? Math.max(...amounts) : 0
  if (largest > AMOUNT_TIER_1) score += POINTS.amountOverTier1
  if (largest > AMOUNT_TIER_2) score += POINTS.amountOverTier2

  // A contact number beside a payment handle is the shape of a scam: someone
  // to talk to, somewhere to send money. Either alone is unremarkable.
  const hasPhone = list(entities, 'phone_numbers').length > 0
  const hasUpi = list(entities, 'upi_ids').length > 0
  if (hasPhone && hasUpi) score += POINTS.phoneAndUpiTogether

  return Math.min(score, MAX_SCORE)
}

/**
 * Score a whole case from its evidence.
 *
 * The base is the HIGHEST single-document score, not the sum. Summing would
 * double-count corroboration: two ordinary documents at 60 each would total 120
 * and cap at 100, making every multi-document case "High risk" and rendering
 * the +10 corroboration bonus meaningless. Taking the maximum keeps the
 * strongest single signal as the floor and lets corroboration add on top of it,
 * which is what the bonus is for.
 */
function scoreCase(evidenceList) {
  const documents = Array.isArray(evidenceList) ? evidenceList : []
  if (documents.length === 0) return 0

  const strongest = Math.max(...documents.map(scoreEvidence))
  const corroboration = (documents.length - 1) * POINTS.additionalEvidence

  return Math.min(strongest + corroboration, MAX_SCORE)
}

/** Band name for a score. Out-of-range input is clamped, not rejected. */
function riskLabel(score) {
  const clamped = Math.min(Math.max(Number(score) || 0, 0), MAX_SCORE)
  return BANDS.find((band) => clamped <= band.ceiling).label
}

module.exports = {
  scoreEvidence,
  scoreCase,
  riskLabel,
  POINTS,
  BANDS,
  MAX_SCORE,
}

/**
 * Missing-evidence detection — rule-based, like the score beside it.
 *
 * The difference between Argus and something that just processes an upload is
 * meant to be this: it says what is *not* there. Every rule below has the same
 * shape — an entity type turned up somewhere in the case, and the evidence
 * type that would corroborate it was never uploaded.
 *
 * There are exactly three, one per supported evidence type. That is a scope
 * rule, not a coincidence: a gap can only ever name something the product can
 * actually accept, or it is telling a victim to go and find a file Argus would
 * then refuse. See docs/PROJECT_NOTES.md.
 *
 * These are hints, not findings. They are drawn in gap violet, never in red —
 * red means a confirmed fraud signal, and "you have not uploaded X" is not
 * one. A gap says the case is thin here, and it inherits every miss the
 * extraction made: an amount the model did not pick up is an amount that
 * cannot be flagged as unsupported.
 */

const { list } = require('./entities');

/**
 * The values that triggered a gap travel as their own list rather than being
 * written into the sentence. They are account numbers, UPI IDs and amounts —
 * evidence in themselves — and the frontend sets those in mono with
 * tabular-nums, which it cannot do to a number buried in a paragraph. It also
 * keeps `detail` count-agnostic, so no rule needs a plural form.
 */
const RULES = [
  {
    entityKey: 'amounts',
    missingType: 'bank_statement',
    title: 'No bank statement',
    detail:
      'Money is named in the evidence, but no bank statement has been uploaded to show it leaving an account.',
  },
  {
    entityKey: 'upi_ids',
    missingType: 'screenshot',
    title: 'No screenshot of the payment',
    detail:
      'A payment handle turned up in the text, but no screenshot has been uploaded to show a transfer to it.',
  },
  {
    entityKey: 'phone_numbers',
    missingType: 'whatsapp',
    title: 'No chat export',
    detail:
      'A contact number turned up in the text, but no chat export has been uploaded to show the conversation.',
  },
];

/**
 * Every distinct value of one entity key across the whole case.
 *
 * Deduped because the same UPI ID appearing in a chat and again in a
 * screenshot is one handle, not two, and listing it twice in a message that
 * says "no screenshot proves this" reads as though there were more of them
 * than there are.
 */
function valuesAcrossCase(evidenceList, key) {
  const values = evidenceList.flatMap((item) =>
    list(item?.extractedEntities, key)
      .map((value) => (typeof value === 'string' ? value.trim() : String(value)))
      .filter((value) => value.length > 0),
  );

  return [...new Set(values)];
}

/**
 * Gaps for one case, given every piece of evidence on it.
 *
 * Derived on every read rather than stored: unlike the risk score there is no
 * number anyone needs to stay stable between uploads, and a stored copy would
 * be one more thing to recompute and keep honest. Returns [] for a case with
 * no evidence — nothing has been claimed yet, so nothing is missing.
 *
 * @returns {{ missingType: string, title: string, detail: string, values: string[] }[]}
 */
function findGaps(evidenceList) {
  const documents = Array.isArray(evidenceList) ? evidenceList : [];
  if (documents.length === 0) return [];

  const present = new Set(documents.map((item) => item?.type));

  return RULES.filter((rule) => !present.has(rule.missingType))
    .map((rule) => ({ rule, values: valuesAcrossCase(documents, rule.entityKey) }))
    .filter(({ values }) => values.length > 0)
    .map(({ rule, values }) => ({
      missingType: rule.missingType,
      title: rule.title,
      detail: rule.detail,
      values,
    }));
}

module.exports = { findGaps, RULES };

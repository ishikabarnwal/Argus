/**
 * Reading the entity object that came back from the model.
 *
 * extractedEntities is Mixed in the schema and is model output, so any field
 * may be absent, a bare string where a list was asked for, or a list holding
 * nulls and non-strings. Every rule module has to defend against the same
 * shapes, and two copies of that defence would drift — which is why this is
 * its own file rather than a private helper inside whichever module needed it
 * first.
 */

/** Always a clean array of non-empty values, whatever the field arrived as. */
function list(entities, key) {
  const value = entities?.[key];
  if (Array.isArray(value)) return value.filter((item) => item != null && item !== '');
  if (value == null || value === '') return [];
  return [value];
}

/**
 * The distinct values of one entity key in ONE piece of evidence, trimmed.
 *
 * The graph needs per-document values and everything else needs per-case
 * ones, and the two have to normalise identically — a value trimmed in one
 * place and not the other would be two different nodes for one phone number.
 * So the case-wide version is defined in terms of this rather than beside it.
 */
function valuesIn(entities, key) {
  const cleaned = list(entities, key)
    .map((value) => (typeof value === 'string' ? value.trim() : String(value)))
    .filter((value) => value.length > 0);

  return [...new Set(cleaned)];
}

/**
 * Every distinct value of one entity key across a whole case.
 *
 * Deduped, because the same UPI ID appearing in a chat and again in a
 * screenshot is one handle, not two. Callers depend on that: the gap rules
 * would otherwise claim more unsupported values than exist, and the report
 * would list the same account number twice.
 */
function valuesAcrossCase(evidenceList, key) {
  return [...new Set(evidenceList.flatMap((item) => valuesIn(item?.extractedEntities, key)))];
}

/**
 * Pull a number out of whatever the model called an amount: "₹25,000",
 * "Rs 25000", "1,00,000" (Indian grouping is only commas), "45000.00", or a
 * bare number. Returns null when there is no number in there at all.
 *
 * Shared, so that two modules asking "is this the same sum of money?" cannot
 * come to different answers — the score counts an amount over a threshold and
 * the graph decides whether two documents named the same payment.
 */
function parseAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const match = value.replace(/[,\s]/g, '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

module.exports = { list, valuesIn, valuesAcrossCase, parseAmount };

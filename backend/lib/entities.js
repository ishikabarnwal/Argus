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

module.exports = { list };

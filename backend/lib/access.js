/**
 * Who may see a case.
 *
 * One rule, in one place, because it is now asked twice — reading a case and
 * exporting one — and two copies of an access check are two chances to fix a
 * bug in only one of them.
 *
 * Callers answer 404 rather than 403 when this returns false. "Not yours" and
 * "no such case" are deliberately indistinguishable from outside: a 403 would
 * confirm the ID is real, which is all anyone needs to walk the
 * CASE-YYYY-NNNN space and learn who has filed what.
 */

/** Investigators read everything; everyone else reads only what they own. */
function canRead(caseDoc, user) {
  if (user.role === 'investigator') return true;
  return Boolean(caseDoc.userId) && caseDoc.userId.toString() === user.id;
}

module.exports = { canRead };

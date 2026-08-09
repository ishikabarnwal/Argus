/**
 * Where a case has got to.
 *
 * The order below is the order these read in, not a sequence anyone is held
 * to. Real cases do not progress in a line: evidence turns up after a
 * complaint is filed and the case goes back to being built, or something
 * filed months ago resolves without anything else happening. So any status
 * can follow any other, and the only rule is the one below.
 *
 * The score and the gaps say what a case *is*; this says what its owner has
 * done about it. Nothing derives it — it is the one field on a case that a
 * person sets by hand.
 */

const STATUSES = ['building', 'ready_to_file', 'filed', 'resolved'];

const DEFAULT_STATUS = 'building';

function isStatus(value) {
  return typeof value === 'string' && STATUSES.includes(value);
}

/**
 * Why a case may not take a status, or null if it may.
 *
 * One rule: a case with nothing in it is not ready to file. "Ready to file"
 * is a claim about a case being worth taking somewhere, and an empty one
 * cannot be.
 *
 * In practice a case only exists once something has been uploaded to it, so
 * this rarely fires — it is a guard against the state being set to something
 * the case cannot back up, not a hurdle anyone meets in normal use.
 *
 * @returns {string | null}
 */
function rejectionReason(status, evidenceCount) {
  if (status === 'ready_to_file' && evidenceCount < 1) {
    return 'A case needs at least one piece of evidence before it can be ready to file';
  }
  return null;
}

module.exports = { STATUSES, DEFAULT_STATUS, isStatus, rejectionReason };

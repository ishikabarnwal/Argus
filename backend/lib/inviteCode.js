/**
 * The investigator invite code.
 *
 * An investigator reads every case in the system, so the role cannot be
 * self-claimed on a form. A code the deployment's administrator sets and
 * hands out privately is the smallest thing that lets a real investigator
 * register themselves without opening the role to everyone.
 *
 * A wrong code is not an error. It produces an ordinary victim account, with
 * no message saying the code was rejected — a form that answers "that code is
 * wrong" is a free oracle for guessing at it. Whoever was given a real code
 * knows they were; whoever was not learns nothing by trying.
 */

const crypto = require('crypto');

/**
 * Hash before comparing, so the comparison is over two fixed-width values.
 *
 * timingSafeEqual throws on length mismatch, and guarding that with a length
 * check first would leak the length of the real code through both the timing
 * and the control flow. Digests are always 32 bytes, whatever went in.
 */
function digest(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

/**
 * Whether a submitted code grants the investigator role.
 *
 * Trimmed on both sides: a code arriving by chat or email picks up a trailing
 * newline often enough that not trimming would reject codes that are right.
 *
 * `expected` is a parameter with an environment default so the rule can be
 * tested without setting environment variables around it. Nothing should pass
 * it explicitly outside tests.
 *
 * @param {unknown} submitted whatever arrived in the request body
 * @returns {boolean}
 */
function grantsInvestigator(submitted, expected = process.env.INVESTIGATOR_INVITE_CODE) {
  // No code configured means the door is shut, not that an empty submission
  // opens it. This is the check that stops a deployment which never set the
  // variable from handing the role to anyone who leaves the field blank.
  if (typeof expected !== 'string' || expected.trim().length === 0) return false;
  if (typeof submitted !== 'string' || submitted.trim().length === 0) return false;

  return crypto.timingSafeEqual(digest(submitted.trim()), digest(expected.trim()));
}

/** Whether this deployment accepts invite codes at all. Never logs the code. */
function invitesEnabled() {
  return typeof process.env.INVESTIGATOR_INVITE_CODE === 'string'
    && process.env.INVESTIGATOR_INVITE_CODE.trim().length > 0;
}

module.exports = { grantsInvestigator, invitesEnabled };

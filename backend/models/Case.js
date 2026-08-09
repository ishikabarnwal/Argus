const mongoose = require('mongoose');
const { STATUSES, DEFAULT_STATUS } = require('../lib/caseStatus');

/**
 * A case is the unit a victim actually has: one fraud, several pieces of
 * evidence. Evidence documents carry the caseId, so this collection exists
 * only to hold what belongs to the case as a whole rather than to any one
 * upload — currently the risk score.
 *
 * The score is derived data. It is stored rather than computed per request so
 * a case has a stable, inspectable score between uploads, and it is rewritten
 * from scratch whenever evidence is added; see recalculateCase() in
 * routes/evidence.js. Nothing should ever edit riskScore on its own.
 */
const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
  },
  // Who the case belongs to. Written once when the case is first created and
  // never rewritten by a later rescore.
  //
  // Not required, because cases created before accounts existed have no owner.
  // Those are unreachable for any 'user' account by design — an unowned case
  // cannot be shown to someone who might not be the victim — and remain
  // visible to investigators, who can read everything anyway.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  riskLabel: {
    type: String,
    required: true,
  },
  evidenceCount: {
    type: Number,
    required: true,
  },
  // The one field on a case that a person sets rather than a rule derives.
  // Deliberately absent from the $set in recalculateCase(): rescoring a case
  // must not quietly reset where its owner said it had got to. The default
  // applies on insert only, which is when the case is first uploaded to.
  status: {
    type: String,
    enum: STATUSES,
    default: DEFAULT_STATUS,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Case', caseSchema);

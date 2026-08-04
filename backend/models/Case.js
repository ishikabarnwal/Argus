const mongoose = require('mongoose');

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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Case', caseSchema);

const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['whatsapp', 'screenshot', 'bank_statement'],
    required: true,
  },
  rawText: {
    type: String,
    required: true,
  },
  extractedEntities: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  caseId: {
    type: String,
    required: true,
  },
  // Where the original upload is kept, and what it was called when it
  // arrived. Both absent for pasted text, which has no file behind it, and
  // for uploads made while storage was switched off — so the dashboard has
  // to treat the original as optional rather than assume it is there.
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Evidence', evidenceSchema);

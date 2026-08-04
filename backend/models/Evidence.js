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
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Evidence', evidenceSchema);

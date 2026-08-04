const express = require('express');
const multer = require('multer');
const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const { scoreCase, riskLabel } = require('../lib/riskScore');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const EVIDENCE_TYPES = ['whatsapp', 'screenshot', 'bank_statement'];

/**
 * Rescore a case from every piece of evidence currently on it and store the
 * result, returning the saved Case document.
 *
 * Always a full recomputation rather than an adjustment of the previous score:
 * the corroboration bonus depends on the number of documents and the base is
 * the strongest of them, so neither can be updated incrementally without
 * re-reading the set anyway. Recomputing also makes the score self-healing —
 * a case scored under older rules is corrected the next time it is touched.
 */
async function recalculateCase(caseId) {
  const evidence = await Evidence.find({ caseId });
  const riskScore = scoreCase(evidence);

  return Case.findOneAndUpdate(
    { caseId },
    {
      caseId,
      riskScore,
      riskLabel: riskLabel(riskScore),
      evidenceCount: evidence.length,
      updatedAt: new Date(),
    },
    { new: true, upsert: true },
  );
}

router.post('/upload', upload.single('file'), async (req, res) => {
  const { caseId, type, text } = req.body;

  if (!caseId) {
    return res.status(400).json({ error: 'caseId is required' });
  }
  if (!EVIDENCE_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of ${EVIDENCE_TYPES.join(', ')}` });
  }
  if (!req.file && !text) {
    return res.status(400).json({ error: "Provide either 'file' or 'text'" });
  }

  // Resolve to plain text first (running OCR ourselves when a file is given)
  // so we always have rawText to store, then reuse the ai-service /extract
  // text path for entity extraction instead of re-uploading the file there.
  let rawText = text;
  if (req.file) {
    const ocrForm = new FormData();
    ocrForm.append('file', new Blob([req.file.buffer]), req.file.originalname);

    const ocrResponse = await fetch(`${AI_SERVICE_URL}/ocr`, {
      method: 'POST',
      body: ocrForm,
    });
    if (!ocrResponse.ok) {
      const detail = await ocrResponse.text();
      return res.status(502).json({ error: 'ai-service /ocr request failed', detail });
    }
    ({ text: rawText } = await ocrResponse.json());
  }

  const extractForm = new FormData();
  extractForm.append('text', rawText);

  const extractResponse = await fetch(`${AI_SERVICE_URL}/extract`, {
    method: 'POST',
    body: extractForm,
  });
  if (!extractResponse.ok) {
    const detail = await extractResponse.text();
    return res.status(502).json({ error: 'ai-service /extract request failed', detail });
  }
  const extractedEntities = await extractResponse.json();

  const evidence = await Evidence.create({
    type,
    rawText,
    extractedEntities,
    caseId,
  });

  // The new document changes both the base score and the corroboration bonus,
  // so the case is rescored before the response goes out.
  await recalculateCase(caseId);

  res.status(201).json(evidence);
});

router.get('/:caseId', async (req, res) => {
  const { caseId } = req.params;
  const evidence = await Evidence.find({ caseId }).sort({ uploadedAt: 1 });

  // Cases uploaded before scoring existed have no Case document. Scoring them
  // on first read backfills them rather than reporting a case as zero-risk
  // because a row happens to be missing.
  let caseDoc = await Case.findOne({ caseId });
  if (!caseDoc && evidence.length > 0) {
    caseDoc = await recalculateCase(caseId);
  }

  const riskScore = caseDoc ? caseDoc.riskScore : 0;

  res.json({
    caseId,
    riskScore,
    riskLabel: riskLabel(riskScore),
    evidenceCount: evidence.length,
    evidence,
  });
});

module.exports = router;

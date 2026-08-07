const express = require('express');
const multer = require('multer');
const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const { scoreCase, riskLabel } = require('../lib/riskScore');
const { findGaps } = require('../lib/gaps');
const { buildGraph } = require('../lib/graph');
const { canRead } = require('../lib/access');
const { storeOriginal } = require('../lib/storage');
const { requireAuth, requireRole } = require('../middleware/auth');

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
async function recalculateCase(caseId, ownerId) {
  const evidence = await Evidence.find({ caseId });
  const riskScore = scoreCase(evidence);

  const update = {
    $set: {
      riskScore,
      riskLabel: riskLabel(riskScore),
      evidenceCount: evidence.length,
      updatedAt: new Date(),
    },
  };

  // $setOnInsert, not $set: ownership is decided when the case is created and
  // must survive every later rescore untouched.
  if (ownerId) update.$setOnInsert = { userId: ownerId };

  return Case.findOneAndUpdate({ caseId }, update, { new: true, upsert: true });
}

/**
 * Files the OCR path cannot read.
 *
 * ai-service /ocr does PIL.Image.open() on whatever bytes it is handed, so a
 * WhatsApp .txt export raises UnidentifiedImageError there and the upload
 * comes back as a 502. Text files have to be read here instead — they are
 * already text, and there is nothing for OCR to do.
 *
 * This lived in the frontend, which meant the API only worked when called
 * through its own UI: the documented `.txt` upload failed for anyone using
 * the endpoint directly. The rule belongs on the side that knows what /ocr
 * can open.
 *
 * multer's field names, not the browser's: mimetype and originalname rather
 * than type and name. The extension check is not redundant — browsers and
 * curl both send application/octet-stream for a .txt often enough.
 */
function isTextFile(file) {
  return (
    Boolean(file.mimetype?.startsWith('text/')) || /\.(txt|csv|log|md)$/i.test(file.originalname)
  );
}

/** Statuses the platform returns when nothing is listening behind it yet. */
const UPSTREAM_DOWN = [502, 503, 504];

/** Enough of a real error to be useful, not enough to be a wall of text. */
const MAX_DETAIL = 400;

/**
 * Explain a failed ai-service call.
 *
 * The service sleeps on free hosting and takes about half a minute to wake.
 * While it does, the platform in front of it answers with its own styled HTML
 * error page — and this used to forward that page verbatim as `detail`, so an
 * entire HTML document, base64 font data and all, was rendered on the upload
 * screen. Nothing in it told the user that waiting would fix it.
 *
 * So a body that starts with markup is treated as infrastructure noise and
 * dropped, and an unreachable service is reported as 503 with the one fact
 * that matters. Same reasoning as describe_gemini_error() in the ai-service:
 * a condition that clears itself should say so rather than read as a crash.
 */
async function upstreamFailure(res, response, endpoint) {
  const body = await response.text();

  if (UPSTREAM_DOWN.includes(response.status)) {
    return res.status(503).json({
      error:
        'The AI service is not responding. On free hosting it sleeps after a spell of ' +
        'inactivity and takes about half a minute to wake — try the upload again shortly.',
    });
  }

  const isMarkup = body.trimStart().startsWith('<');

  return res.status(502).json({
    error: `ai-service ${endpoint} request failed`,
    ...(isMarkup ? {} : { detail: body.slice(0, MAX_DETAIL) }),
  });
}

// Investigators are read-only, so uploading is restricted to the 'user' role.
router.post('/upload', requireAuth, requireRole('user'), upload.single('file'), async (req, res) => {
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

  // Checked before any OCR or model call: adding to someone else's case is
  // refused, and there is no reason to spend a Gemini request finding that out.
  const existingCase = await Case.findOne({ caseId });
  if (existingCase && !canRead(existingCase, req.user)) {
    return res.status(403).json({ error: 'That case ID belongs to another account' });
  }

  // Resolve to plain text first (reading or OCR'ing the file ourselves when
  // one is given) so we always have rawText to store, then reuse the
  // ai-service /extract text path for entity extraction instead of
  // re-uploading the file there.
  let rawText = text;
  if (req.file && isTextFile(req.file)) {
    // Already text. Sending it to /ocr is not merely wasteful — it fails, so
    // this branch is what makes a WhatsApp export uploadable at all.
    rawText = req.file.buffer.toString('utf8');
  } else if (req.file) {
    const ocrForm = new FormData();
    ocrForm.append('file', new Blob([req.file.buffer]), req.file.originalname);

    const ocrResponse = await fetch(`${AI_SERVICE_URL}/ocr`, {
      method: 'POST',
      body: ocrForm,
    });
    if (!ocrResponse.ok) {
      return upstreamFailure(res, ocrResponse, '/ocr');
    }
    ({ text: rawText } = await ocrResponse.json());
  }

  // An empty file, a screenshot OCR could make nothing of, and a scanned PDF
  // with no text layer all land here. Without this they reach
  // Evidence.create(), where rawText is required, and come back as a 500 — a
  // validation problem reported as a server fault.
  if (!rawText.trim()) {
    return res.status(400).json({ error: 'No readable text in that upload' });
  }

  const extractForm = new FormData();
  extractForm.append('text', rawText);

  const extractResponse = await fetch(`${AI_SERVICE_URL}/extract`, {
    method: 'POST',
    body: extractForm,
  });
  if (!extractResponse.ok) {
    return upstreamFailure(res, extractResponse, '/extract');
  }
  const extractedEntities = await extractResponse.json();

  // Kept last, and never allowed to fail the upload.
  //
  // By this point the file has been read and a Gemini request has been spent
  // on it. Losing all of that because object storage was briefly unreachable
  // would be the wrong trade: evidence with no stored original is still a
  // timeline entry, still scored, still part of the case. The record simply
  // carries no fileUrl, the dashboard offers no link, and nothing claims an
  // original exists when it does not.
  let stored = null;
  if (req.file) {
    try {
      stored = await storeOriginal({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        caseId,
      });
    } catch (error) {
      console.error('Storing the original upload failed:', error.message);
    }
  }

  const evidence = await Evidence.create({
    type,
    rawText,
    extractedEntities,
    caseId,
    fileUrl: stored?.url,
    fileName: stored?.name,
  });

  // The new document changes both the base score and the corroboration bonus,
  // so the case is rescored before the response goes out. On a brand new case
  // this is also what records the owner.
  await recalculateCase(caseId, req.user.id);

  res.status(201).json(evidence);
});

router.get('/:caseId', requireAuth, async (req, res) => {
  const { caseId } = req.params;
  const caseDoc = await Case.findOne({ caseId });

  // 404 rather than 403 when the case exists but belongs to someone else. A
  // 403 would confirm the ID is real, which is all an attacker needs to walk
  // the CASE-YYYY-NNNN space and learn who has filed what. "Not yours" and
  // "not a case" are deliberately indistinguishable from outside.
  if (!caseDoc || !canRead(caseDoc, req.user)) {
    return res.status(404).json({ error: 'No case with that ID' });
  }

  const evidence = await Evidence.find({ caseId }).sort({ uploadedAt: 1 });

  res.json({
    caseId,
    riskScore: caseDoc.riskScore,
    riskLabel: riskLabel(caseDoc.riskScore),
    evidenceCount: evidence.length,
    // Computed here rather than stored on the case: see findGaps().
    gaps: findGaps(evidence),
    // Derived for the same reason, and cheap: it is a pass over the entities
    // already loaded, with nothing to keep in sync if the rules change.
    graph: buildGraph(evidence),
    evidence,
  });
});

module.exports = router;

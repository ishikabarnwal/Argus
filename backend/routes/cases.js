const express = require('express');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const { canRead } = require('../lib/access');
const { buildCaseBundle } = require('../lib/bundle');
const { isStatus, rejectionReason } = require('../lib/caseStatus');
const { renderCaseReport } = require('../lib/report');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/cases — the caller's cases, most recently updated first.
 *
 * This endpoint is what makes the investigator role observable: without a
 * listing they could "see every case" but have no way to find one short of
 * guessing case IDs. Same route for both roles, different filter.
 */
router.get('/', requireAuth, async (req, res) => {
  const isInvestigator = req.user.role === 'investigator';
  const filter = isInvestigator ? {} : { userId: req.user.id };

  const cases = await Case.find(filter).sort({ updatedAt: -1 }).populate('userId', 'email');

  res.json({
    cases: cases.map((c) => ({
      caseId: c.caseId,
      status: c.status,
      riskScore: c.riskScore,
      riskLabel: c.riskLabel,
      evidenceCount: c.evidenceCount,
      updatedAt: c.updatedAt,
      // Only investigators are told whose case it is; for a user every case in
      // this list is their own, so the field would be noise.
      ...(isInvestigator ? { ownerEmail: c.userId?.email ?? null } : {}),
    })),
  });
});

/**
 * PATCH /api/cases/:caseId/status — move a case along.
 *
 * Restricted to the 'user' role, so investigators cannot set it. That is the
 * same line drawn everywhere else: they read every case and change none of
 * them, and a status is a claim about what its owner has done.
 *
 * Any status may follow any other. Cases do not run in a line — see the note
 * in lib/caseStatus.js — so the only refusal is a case with nothing in it
 * calling itself ready to file.
 */
router.patch('/:caseId/status', requireAuth, requireRole('user'), async (req, res) => {
  const { caseId } = req.params;
  const { status } = req.body || {};

  if (!isStatus(status)) {
    return res.status(400).json({ error: 'Unknown case status' });
  }

  const caseDoc = await Case.findOne({ caseId });

  // 404 for a case that is not theirs, as everywhere else — see lib/access.js.
  if (!caseDoc || !canRead(caseDoc, req.user)) {
    return res.status(404).json({ error: 'No case with that ID' });
  }

  // Counted rather than read off the case: evidenceCount there is a
  // denormalised copy maintained by uploads, and a rule about whether a case
  // can make a claim should be checked against the evidence itself.
  const evidenceCount = await Evidence.countDocuments({ caseId });

  const reason = rejectionReason(status, evidenceCount);
  if (reason) {
    return res.status(409).json({ error: reason });
  }

  caseDoc.status = status;
  caseDoc.updatedAt = new Date();
  await caseDoc.save();

  res.json({ caseId, status: caseDoc.status });
});

/**
 * POST /api/cases/:caseId/report — the case as a PDF.
 *
 * POST rather than GET because it produces a document rather than reading
 * one, and because a report is the kind of thing worth being able to log as
 * an action later. It is not cached and each call renders fresh, so a report
 * always reflects the evidence as it stands rather than as it stood.
 *
 * Investigators can export too: reading a case and exporting it are the same
 * privilege, and refusing the download while allowing the screen would be
 * theatre.
 */
router.post('/:caseId/report', requireAuth, async (req, res) => {
  const { caseId } = req.params;
  const caseDoc = await Case.findOne({ caseId });

  // Same 404-not-403 as reading a case; see lib/access.js.
  if (!caseDoc || !canRead(caseDoc, req.user)) {
    return res.status(404).json({ error: 'No case with that ID' });
  }

  const evidence = await Evidence.find({ caseId }).sort({ uploadedAt: 1 });
  const pdf = await renderCaseReport({ caseDoc, evidence });

  // caseId is a free-form string chosen at upload time, so it cannot go into
  // a header as-is: a quote would break out of the filename and a CRLF would
  // be header injection. Anything outside the house format is flattened.
  const filename = `argus-${caseId.replace(/[^A-Za-z0-9._-]/g, '_')}.pdf`;

  // Content-Length so the browser can show real download progress rather
  // than an indeterminate spinner.
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', pdf.length);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdf);
});

/**
 * POST /api/cases/:caseId/bundle — the report and every stored original, as
 * a ZIP.
 *
 * Same access as the report, and for the same reason: this is a way of
 * reading a case, not a new privilege. Investigators get it too.
 *
 * Slower than the report — it fetches each original back from storage — so
 * the frontend says so while it waits. A case whose evidence was all pasted
 * text has no originals and still gets a valid ZIP with the report in it.
 */
router.post('/:caseId/bundle', requireAuth, async (req, res) => {
  const { caseId } = req.params;
  const caseDoc = await Case.findOne({ caseId });

  if (!caseDoc || !canRead(caseDoc, req.user)) {
    return res.status(404).json({ error: 'No case with that ID' });
  }

  const evidence = await Evidence.find({ caseId }).sort({ uploadedAt: 1 });
  const { zip, missing } = await buildCaseBundle({ caseDoc, evidence });

  // Worth a line in the log: a file recorded on the case that storage would
  // not give back is a real problem, and the only other trace of it is a note
  // inside a ZIP nobody may open.
  if (missing.length > 0) {
    console.warn(`bundle ${caseId}: ${missing.length} original(s) could not be fetched`);
  }

  const safeCaseId = caseId.replace(/[^A-Za-z0-9._-]/g, '_');

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Length', zip.length);
  res.setHeader('Content-Disposition', `attachment; filename="argus-${safeCaseId}-bundle.zip"`);
  res.send(zip);
});

module.exports = router;

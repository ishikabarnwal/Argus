const express = require('express');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const { canRead } = require('../lib/access');
const { renderCaseReport } = require('../lib/report');
const { requireAuth } = require('../middleware/auth');

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

module.exports = router;

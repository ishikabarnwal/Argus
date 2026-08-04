const express = require('express');
const Case = require('../models/Case');
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

module.exports = router;

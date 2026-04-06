import express from 'express';
import { auth, optionalAuth, requireAdminPermission, requireRoles } from '../middleware/auth.js';
import { makeReference } from '../utils/reference.js';

const router = express.Router();

router.post('/', optionalAuth, async (req, res) => {
  try {
    const referenceNo = makeReference('RPT');
    return res.status(202).json({
      msg: 'Issue report submission is currently disabled.',
      referenceNo,
      stored: false,
    });
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to submit report' });
  }
});

router.get('/', auth, requireRoles('admin', 'superadmin'), async (_req, res) => {
  try {
    return res.json([]);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch reports' });
  }
});

router.patch('/:id/status', auth, requireRoles('admin', 'superadmin'), requireAdminPermission('reports', 'edit'), async (req, res) => {
  try {
    return res.status(410).json({ msg: 'Report management is disabled.' });
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to update report' });
  }
});

export default router;

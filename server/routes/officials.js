import express from 'express';
import Official from '../models/Official.js';
import { auth, requireAdminPermission, requireRoles } from '../middleware/auth.js';
import { logSystemEvent } from '../utils/notifications.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const officials = await Official.find({ active: true }).sort({ level: 1, rankOrder: 1, createdAt: 1 });
    return res.json(officials);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch officials' });
  }
});

router.get('/all', auth, requireRoles('admin', 'superadmin'), async (_req, res) => {
  try {
    const officials = await Official.find().sort({ active: -1, level: 1, rankOrder: 1, createdAt: 1 });
    return res.json(officials);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch officials' });
  }
});

router.post('/', auth, requireRoles('admin', 'superadmin'), requireAdminPermission('officials', 'add'), async (req, res) => {
  try {
    const official = await Official.create(req.body);
    await logSystemEvent({
      user: req.user.id,
      type: 'official-management',
      title: `Created official ${official.name}`,
      referenceNo: official._id.toString(),
      metadata: { action: 'create', module: 'officials' },
    });
    return res.status(201).json(official);
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to create official' });
  }
});

router.put('/:id', auth, requireRoles('admin', 'superadmin'), requireAdminPermission('officials', 'edit'), async (req, res) => {
  try {
    const official = await Official.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!official) return res.status(404).json({ msg: 'Official not found' });
    await logSystemEvent({
      user: req.user.id,
      type: 'official-management',
      title: `${official.active === false ? 'Updated archived official' : 'Updated official'} ${official.name}`,
      referenceNo: official._id.toString(),
      metadata: { action: req.body.active === false ? 'archive' : req.body.active === true ? 'restore' : 'update', module: 'officials' },
    });
    return res.json(official);
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to update official' });
  }
});

router.delete('/:id', auth, requireRoles('admin', 'superadmin'), requireAdminPermission('officials', 'delete'), async (req, res) => {
  try {
    const official = await Official.findByIdAndDelete(req.params.id);
    if (!official) return res.status(404).json({ msg: 'Official not found' });
    await logSystemEvent({
      user: req.user.id,
      type: 'official-management',
      title: `Deleted official ${official.name}`,
      referenceNo: official._id.toString(),
      metadata: { action: 'delete', module: 'officials' },
    });
    return res.json({ msg: 'Official removed' });
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to delete official' });
  }
});

export default router;

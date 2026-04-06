import express from 'express';
import Department from '../models/Department.js';
import { auth, optionalAuth, requireAdminPermission, requireRoles } from '../middleware/auth.js';
import { makeReference } from '../utils/reference.js';
import { logSystemEvent } from '../utils/notifications.js';

const router = express.Router();

router.get('/departments', async (_req, res) => {
  try {
    const departments = await Department.find({ active: true }).sort({ name: 1 });
    return res.json(departments);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch departments' });
  }
});

router.post('/departments', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    await logSystemEvent({
      user: req.user.id,
      type: 'department-management',
      title: `Created department ${dept.name}`,
      referenceNo: dept._id.toString(),
      metadata: { action: 'create', module: 'departments' },
    });
    return res.status(201).json(dept);
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to create department' });
  }
});

router.put('/departments/:id', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const updated = await Department.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!updated) {
      return res.status(404).json({ msg: 'Department not found' });
    }
    await logSystemEvent({
      user: req.user.id,
      type: 'department-management',
      title: `Updated department ${updated.name}`,
      referenceNo: updated._id.toString(),
      metadata: { action: 'update', module: 'departments' },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to update department' });
  }
});

router.delete('/departments/:id', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ msg: 'Department not found' });
    }
    await logSystemEvent({
      user: req.user.id,
      type: 'department-management',
      title: `Deleted department ${deleted.name}`,
      referenceNo: deleted._id.toString(),
      metadata: { action: 'delete', module: 'departments' },
    });
    return res.json({ msg: 'Department removed' });
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to delete department' });
  }
});

router.post('/messages', optionalAuth, async (req, res) => {
  try {
    const referenceNo = makeReference('MSG');
    return res.status(202).json({
      msg: 'Contact submission is currently disabled.',
      referenceNo,
      stored: false,
    });
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to send message' });
  }
});

router.get('/messages', auth, requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    return res.json([]);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch messages' });
  }
});

router.patch('/messages/:id/status', auth, requireRoles('admin', 'superadmin'), requireAdminPermission('messages', 'edit'), async (req, res) => {
  try {
    return res.status(410).json({ msg: 'Message management is disabled.' });
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to update message status' });
  }
});

export default router;

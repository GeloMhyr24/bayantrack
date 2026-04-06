import express from 'express';
import Announcement from '../models/Announcement.js';
import { auth, requireAdminPermission, requireRoles } from '../middleware/auth.js';
import { logSystemEvent } from '../utils/notifications.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { module, search, featured, limit } = req.query;
    const query = {};

    if (module && module !== 'all-news-updates') {
      query.module = module;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const max = Number(limit) > 0 ? Number(limit) : 50;
    query.archived = { $ne: true };

    const items = await Announcement.find(query).sort({ createdAt: -1 }).limit(max);
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch announcements' });
  }
});

router.get('/all', auth, requireRoles('admin', 'superadmin'), async (_req, res) => {
  try {
    const items = await Announcement.find().sort({ createdAt: -1 });
    return res.json(items);
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to fetch announcements' });
  }
});

router.post('/', auth, requireRoles('admin', 'superadmin'), requireAdminPermission('announcements', 'add'), async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user.id,
    };
    const item = await Announcement.create(payload);
    await logSystemEvent({
      user: req.user.id,
      type: 'announcement-management',
      title: `Created announcement ${item.title}`,
      referenceNo: item._id.toString(),
      metadata: { action: 'create', module: 'announcements' },
    });
    return res.status(201).json(item);
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to create announcement' });
  }
});

router.put('/:id', auth, requireRoles('admin', 'superadmin'), requireAdminPermission('announcements', 'edit'), async (req, res) => {
  try {
    const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!updated) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }
    await logSystemEvent({
      user: req.user.id,
      type: 'announcement-management',
      title: `Updated announcement ${updated.title}`,
      referenceNo: updated._id.toString(),
      metadata: { action: 'update', module: 'announcements' },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to update announcement' });
  }
});

router.delete('/:id', auth, requireRoles('admin', 'superadmin'), requireAdminPermission('announcements', 'delete'), async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }
    await logSystemEvent({
      user: req.user.id,
      type: 'announcement-management',
      title: `Deleted announcement ${deleted.title}`,
      referenceNo: deleted._id.toString(),
      metadata: { action: 'delete', module: 'announcements' },
    });
    return res.json({ msg: 'Announcement removed' });
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to delete announcement' });
  }
});

router.patch('/:id/archive', auth, requireRoles('admin', 'superadmin'), requireAdminPermission('announcements', 'archive'), async (req, res) => {
  try {
    const { archived } = req.body;
    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { archived: Boolean(archived) },
      { returnDocument: 'after' },
    );
    if (!updated) return res.status(404).json({ msg: 'Announcement not found' });
    await logSystemEvent({
      user: req.user.id,
      type: 'announcement-management',
      title: `${Boolean(archived) ? 'Archived' : 'Restored'} announcement ${updated.title}`,
      referenceNo: updated._id.toString(),
      metadata: { action: Boolean(archived) ? 'archive' : 'restore', module: 'announcements' },
    });
    return res.json(updated);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to archive announcement' });
  }
});

export default router;

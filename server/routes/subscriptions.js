import express from 'express';
import Subscription from '../models/Subscription.js';
import { auth, optionalAuth, requireAdminPermission, requireRoles } from '../middleware/auth.js';
import { logSystemEvent } from '../utils/notifications.js';

const router = express.Router();

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { email, source } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ msg: 'Valid email is required' });
    }

    const payload = {
      email: String(email).toLowerCase().trim(),
      status: 'active',
      source: source || 'homepage',
      createdBy: req.user?.id || null,
    };

    const item = await Subscription.findOneAndUpdate(
      { email: payload.email },
      payload,
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    if (req.user?.id) {
      await logSystemEvent({ user: req.user.id, type: 'subscription', title: `Subscribed ${payload.email}`, referenceNo: item._id.toString(), metadata: { action: 'create', module: 'subscribers' } });
    }

    return res.status(201).json(item);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to save subscription' });
  }
});

router.get('/', auth, requireRoles('admin', 'superadmin'), async (_req, res) => {
  try {
    const items = await Subscription.find().sort({ createdAt: -1 }).limit(500);
    return res.json(items);
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to fetch subscriptions' });
  }
});

router.patch('/:id/status', auth, requireRoles('admin', 'superadmin'), requireAdminPermission('subscribers', 'edit'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'unsubscribed'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const item = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' },
    );
    if (!item) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }
    await logSystemEvent({ user: req.user.id, type: 'subscription', title: `${status === 'active' ? 'Restored' : 'Archived'} subscriber ${item.email}`, referenceNo: item._id.toString(), metadata: { action: status === 'active' ? 'restore' : 'archive', module: 'subscribers' } });
    return res.json(item);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to update subscription' });
  }
});

router.delete('/:id', auth, requireRoles('admin', 'superadmin'), requireAdminPermission('subscribers', 'delete'), async (req, res) => {
  try {
    const item = await Subscription.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }
    await logSystemEvent({ user: req.user.id, type: 'subscription', title: `Deleted subscriber ${item.email}`, referenceNo: item._id.toString(), metadata: { action: 'delete', module: 'subscribers' } });
    return res.json({ msg: 'Subscription deleted' });
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to delete subscription' });
  }
});

export default router;

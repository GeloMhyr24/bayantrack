import express from 'express';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import ServiceRequest from '../models/ServiceRequest.js';
import IssueReport from '../models/IssueReport.js';
import ContactMessage from '../models/ContactMessage.js';
import Announcement from '../models/Announcement.js';
import Subscription from '../models/Subscription.js';
import SystemSetting from '../models/SystemSetting.js';
import { auth, requireRoles } from '../middleware/auth.js';
import { logSystemEvent } from '../utils/notifications.js';

const router = express.Router();
const DEFAULT_ADMIN_PERMISSIONS = {
  officials: { view: true, add: true, edit: true, archive: true, delete: true },
  announcements: { view: true, add: true, edit: true, archive: true, delete: true },
  reports: { view: true, add: true, edit: true, archive: true, delete: true },
  serviceRequests: { view: true, add: true, edit: true, archive: true, delete: true },
  messages: { view: true, add: true, edit: true, archive: true, delete: true },
  subscribers: { view: true, add: true, edit: true, archive: true, delete: true },
};

async function getOrCreateSettings() {
  let settings = await SystemSetting.findOne();
  if (!settings) {
    settings = await SystemSetting.create({});
  }
  return settings;
}

router.get('/users', auth, requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const query = {};
    const roleFilter = String(req.query.role || '').trim().toLowerCase();
    const approvalFilter = String(req.query.approval || '').trim().toLowerCase();

    if (roleFilter) {
      query.role = roleFilter === 'user' ? 'resident' : roleFilter;
    }

    if (approvalFilter === 'approved') {
      query.status = 'active';
    } else if (approvalFilter === 'not-approved') {
      query.status = { $ne: 'active' };
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch users' });
  }
});

router.patch('/users/:id/status', auth, requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { status, role, validIdStatus, reason } = req.body;
    const update = {};
    const previousUser = await User.findById(req.params.id).select('-password');
    if (!previousUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (req.user.role === 'admin') {
      if (previousUser.role !== 'resident') {
        return res.status(403).json({ msg: 'Admins can only review resident accounts.' });
      }
      if (role && role !== previousUser.role) {
        return res.status(403).json({ msg: 'Admins cannot change user roles.' });
      }
    }

    if (status) update.status = status;
    if (role && ['resident', 'admin', 'superadmin'].includes(role)) update.role = role;
    if (role === 'admin') {
      update.adminPermissions = DEFAULT_ADMIN_PERMISSIONS;
    }
    if (validIdStatus && ['pending', 'approved', 'rejected'].includes(validIdStatus)) {
      update.validIdStatus = validIdStatus;
    }
    if (status === 'active') {
      update.validIdStatus = 'approved';
    }
    if (status === 'suspended') {
      update.validIdStatus = 'rejected';
    }
    if (status) {
      update.statusReason = String(reason || '').trim();
      update.statusReviewedAt = new Date();
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' }).select('-password');

    // When account is archived/suspended, also archive linked resident submissions.
    if (status === 'suspended') {
      await ServiceRequest.updateMany({ user: user._id }, { status: 'rejected' });
      await IssueReport.updateMany({ user: user._id }, { status: 'rejected', adminChecked: true, user: null });
      await ContactMessage.updateMany({ user: user._id }, { status: 'closed', user: null });
      await Subscription.updateMany({ createdBy: user._id }, { status: 'unsubscribed', createdBy: null });
      await Announcement.updateMany({ createdBy: user._id }, { createdBy: null });
    }

    await logSystemEvent({
      user: req.user.id,
      type: 'user-management',
      title: `Updated user ${user.username} to ${status || user.status}`,
      referenceNo: user._id.toString(),
      metadata: { action: status === 'suspended' ? 'archive' : status === 'active' ? 'restore' : 'update', module: 'users', targetRole: user.role },
    });

    return res.json(user);
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to update user' });
  }
});

router.patch('/users/:id/children/:childId/status', auth, requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['approved', 'rejected'].includes(String(status || '').trim())) {
      return res.status(400).json({ msg: 'Invalid child request status.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (req.user.role === 'admin' && user.role !== 'resident') {
      return res.status(403).json({ msg: 'Admins can only review resident child requests.' });
    }

    const child = user.children.id(req.params.childId);
    if (!child) return res.status(404).json({ msg: 'Child request not found.' });

    child.status = status;
    child.reviewReason = String(reason || '').trim();
    child.reviewedAt = new Date();
    await user.save();

    await logSystemEvent({
      user: req.user.id,
      type: 'child-access',
      title: `${status === 'approved' ? 'Approved' : 'Rejected'} child access for ${child.fullName}`,
      referenceNo: child._id.toString(),
      metadata: { module: 'users', action: status, parentUserId: user._id.toString() },
    });

    return res.json(user);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to update child access status.' });
  }
});

router.delete('/users/:id/children/:childId', auth, requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (req.user.role === 'admin' && user.role !== 'resident') {
      return res.status(403).json({ msg: 'Admins can only manage resident child links.' });
    }

    const child = user.children.id(req.params.childId);
    if (!child) return res.status(404).json({ msg: 'Child link not found.' });
    const childName = child.fullName;

    child.deleteOne();
    await user.save();

    await logSystemEvent({
      user: req.user.id,
      type: 'child-access',
      title: `Removed child access link for ${childName}`,
      referenceNo: user._id.toString(),
      metadata: { module: 'users', action: 'delete-child-link' },
    });

    return res.json(user);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to remove child link.' });
  }
});

router.patch('/users/:id/permissions', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const { adminPermissions } = req.body;
    if (!adminPermissions || typeof adminPermissions !== 'object') {
      return res.status(400).json({ msg: 'adminPermissions payload is required.' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.role !== 'admin') {
      return res.status(400).json({ msg: 'Permissions can only be set for admin users.' });
    }

    user.adminPermissions = {
      ...DEFAULT_ADMIN_PERMISSIONS,
      ...adminPermissions,
      officials: { ...DEFAULT_ADMIN_PERMISSIONS.officials, ...(adminPermissions.officials || {}) },
      announcements: { ...DEFAULT_ADMIN_PERMISSIONS.announcements, ...(adminPermissions.announcements || {}) },
      reports: { ...DEFAULT_ADMIN_PERMISSIONS.reports, ...(adminPermissions.reports || {}) },
      serviceRequests: { ...DEFAULT_ADMIN_PERMISSIONS.serviceRequests, ...(adminPermissions.serviceRequests || {}) },
      messages: { ...DEFAULT_ADMIN_PERMISSIONS.messages, ...(adminPermissions.messages || {}) },
      subscribers: { ...DEFAULT_ADMIN_PERMISSIONS.subscribers, ...(adminPermissions.subscribers || {}) },
    };
    await user.save();
    await logSystemEvent({
      user: req.user.id,
      type: 'user-management',
      title: `Updated admin permissions for ${user.username}`,
      referenceNo: user._id.toString(),
      metadata: { action: 'permissions', module: 'users' },
    });
    return res.json(user);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to update admin permissions' });
  }
});

router.delete('/users/:id', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role === 'superadmin' && user.username === 'superAdmin123') {
      return res.status(400).json({ msg: 'Protected superadmin account cannot be deleted.' });
    }

    await Promise.all([
      ServiceRequest.deleteMany({ user: user._id }),
      IssueReport.deleteMany({ user: user._id }),
      ContactMessage.deleteMany({ user: user._id }),
      ActivityLog.deleteMany({ user: user._id }),
      Subscription.deleteMany({ createdBy: user._id }),
      Announcement.updateMany({ createdBy: user._id }, { createdBy: null }),
      User.deleteOne({ _id: user._id }),
    ]);

    await logSystemEvent({
      user: req.user.id,
      type: 'user-management',
      title: `Deleted user ${user.username}`,
      referenceNo: user._id.toString(),
      metadata: { action: 'delete', module: 'users', targetRole: user.role },
    });

    return res.json({ msg: 'User and linked records deleted' });
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to delete user' });
  }
});

router.get('/activity/me', auth, async (req, res) => {
  try {
    const activities = await ActivityLog.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50);
    return res.json(activities);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch activity logs' });
  }
});

router.get('/activity', auth, requireRoles('admin', 'superadmin'), async (_req, res) => {
  try {
    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(150)
      .populate('user', 'username role');

    const rows = activities
      .filter((a) => a.user)
      .map((a) => ({
        _id: a._id,
        type: a.type,
        title: a.title,
        referenceNo: a.referenceNo,
        createdAt: a.createdAt,
        userId: a.user?._id,
        userName: a.user?.username || 'unknown',
        userRole: a.user?.role || 'unknown',
      }));

    return res.json(rows);
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to fetch activity logs' });
  }
});

router.get('/notifications', auth, requireRoles('admin', 'superadmin'), async (_req, res) => {
  try {
    return res.json({ count: 0, items: [] });
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to fetch notifications' });
  }
});

router.get('/system-settings', auth, requireRoles('admin', 'superadmin'), async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json(settings);
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to fetch system settings' });
  }
});

router.patch('/system-settings', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const allowed = [
      'autoArchiveReports',
      'requireAnnouncementReview',
      'emailDigest',
      'allowResidentRegistration',
      'maintenanceMode',
      'maintenanceMessage',
      'sessionTimeoutMinutes',
      'lockoutWindowMinutes',
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    const settings = await getOrCreateSettings();
    const updated = await SystemSetting.findByIdAndUpdate(
      settings._id,
      { $set: update },
      { returnDocument: 'after' },
    );
    await logSystemEvent({
      user: req.user.id,
      type: 'system-settings',
      title: 'Updated system settings',
      referenceNo: updated?._id?.toString?.() || '',
      metadata: { action: 'update', module: 'settings', fields: Object.keys(update) },
    });
    return res.json(updated);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to update system settings' });
  }
});

export default router;

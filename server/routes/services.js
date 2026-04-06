import express from 'express';
import ServiceRequest from '../models/ServiceRequest.js';
import ServiceCatalog from '../models/ServiceCatalog.js';
import EvacuationCenter from '../models/EvacuationCenter.js';
import EmergencyHotline from '../models/EmergencyHotline.js';
import User from '../models/User.js';
import { auth, requireAdminPermission, requireRoles } from '../middleware/auth.js';
import { makeReference } from '../utils/reference.js';
import { logSystemEvent } from '../utils/notifications.js';

const router = express.Router();

const SERVICE_CATALOG = [
  {
    code: 'barangay-clearance',
    title: 'Barangay Clearance',
    desc: 'Official document certifying good moral character and residency.',
    usage: 'Employment, Bank Accounts',
    requirements: ['Valid ID', 'Recent Cedula'],
    time: '15 Mins',
  },
  {
    code: 'certificate-of-indigency',
    title: 'Certificate of Indigency',
    desc: 'Certification of financial status for assistance programs.',
    usage: 'Medical Assistance, Scholarships',
    requirements: ['Valid ID', 'Purok Leader Endorsement'],
    time: '15 Mins',
  },
  {
    code: 'barangay-id',
    title: 'Barangay ID',
    desc: 'Identification card for verified barangay residents.',
    usage: 'Barangay Transactions, Identity Verification',
    requirements: ['Valid ID', 'Proof of Residency', '2x2 Photo'],
    time: '20 Mins',
  },
  {
    code: 'residency-certificate',
    title: 'Residency Certificate',
    desc: 'Proof that the requester is a resident of Barangay Mambog II.',
    usage: 'School, employment, local verification',
    requirements: ['Valid ID', 'Proof of current address'],
    time: '15 Mins',
  },
];

const EMERGENCY_HOTLINES = [
  {
    name: 'Barangay Mambog II Hall',
    type: 'ADMIN',
    number: '(046) 417-0000',
    desc: 'General inquiries, barangay clearance, disputes.',
    when: ['Business hours concerns', 'Certificate follow-ups'],
    prepare: ['Name', 'Address', 'Nature of inquiry'],
  },
  {
    name: 'Bacoor PNP',
    type: 'POLICE',
    number: '(046) 417-6366',
    desc: 'Crime reporting, immediate police assistance.',
    when: ['Crime in progress', 'Suspicious persons', 'Traffic accidents'],
    prepare: ['Location', 'Description of suspect/incident'],
  },
  {
    name: 'BFP Bacoor (Fire)',
    type: 'FIRE',
    number: '(046) 417-6060',
    desc: 'Fire emergencies and rescue operations.',
    when: ['Smoke or fire visible', 'Chemical spills'],
    prepare: ['Exact address', 'Type of building'],
  },
];

function toRad(v) {
  return (Number(v) * Math.PI) / 180;
}

function kmBetween(aLat, aLng, bLat, bLng) {
  const earthKm = 6371;
  const dLat = toRad(Number(bLat) - Number(aLat));
  const dLng = toRad(Number(bLng) - Number(aLng));
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return earthKm * c;
}

async function seedEvacuationCentersIfNeeded() {
  const count = await EvacuationCenter.countDocuments();
  if (count > 0) return;

  await EvacuationCenter.insertMany([
    {
      name: 'Mambog II Covered Court',
      address: 'Mambog II Covered Court, Bacoor City, Cavite',
      active: true,
      capacity: 450,
      hazardsCovered: ['typhoon', 'flood', 'earthquake', 'fire'],
      location: { lat: 14.4149, lng: 120.9526 },
      notes: 'Primary evacuation center designated by barangay.',
    },
    {
      name: 'Mambog Elementary School',
      address: 'Mambog Elementary School, Bacoor City, Cavite',
      active: true,
      capacity: 320,
      hazardsCovered: ['typhoon', 'flood', 'earthquake'],
      location: { lat: 14.417, lng: 120.95 },
      notes: 'Secondary evacuation center for families.',
    },
  ]);
}

async function seedCatalogIfNeeded() {
  const count = await ServiceCatalog.countDocuments();
  if (count === 0) {
    await ServiceCatalog.insertMany(
      SERVICE_CATALOG.map((item, idx) => ({
        ...item,
        active: true,
        sortOrder: idx + 1,
      })),
    );
  }
}

async function seedEmergencyHotlinesIfNeeded() {
  const count = await EmergencyHotline.countDocuments();
  if (count > 0) return;
  await EmergencyHotline.insertMany(EMERGENCY_HOTLINES.map((x) => ({ ...x, active: true })));
}

router.get('/catalog', (_req, res) => {
  return seedCatalogIfNeeded()
    .then(async () => {
      const rows = await ServiceCatalog.find({ active: true }).sort({ sortOrder: 1, createdAt: 1 });
      return res.json(rows);
    })
    .catch(() => res.status(500).json({ msg: 'Failed to fetch service catalog' }));
});

router.get('/catalog/all', auth, requireRoles('admin', 'superadmin'), async (_req, res) => {
  try {
    await seedCatalogIfNeeded();
    const rows = await ServiceCatalog.find().sort({ sortOrder: 1, createdAt: 1 });
    return res.json(rows);
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to fetch service catalog' });
  }
});

router.post('/catalog', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const payload = {
      ...req.body,
      code: String(req.body.code || '').trim().toLowerCase(),
    };
    if (!payload.code || !payload.title) {
      return res.status(400).json({ msg: 'Service code and title are required.' });
    }
    const created = await ServiceCatalog.create(payload);
    await logSystemEvent({ user: req.user.id, type: 'service-catalog', title: `Created service catalog item ${created.title}`, referenceNo: created._id.toString(), metadata: { action: 'create', module: 'service-catalog' } });
    return res.status(201).json(created);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to create service catalog item' });
  }
});

router.put('/catalog/:id', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const updated = await ServiceCatalog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' },
    );
    if (!updated) return res.status(404).json({ msg: 'Service catalog item not found' });
    await logSystemEvent({ user: req.user.id, type: 'service-catalog', title: `Updated service catalog item ${updated.title}`, referenceNo: updated._id.toString(), metadata: { action: 'update', module: 'service-catalog' } });
    return res.json(updated);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to update service catalog item' });
  }
});

router.patch('/catalog/:id/archive', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const { active } = req.body;
    const updated = await ServiceCatalog.findByIdAndUpdate(
      req.params.id,
      { active: Boolean(active) },
      { returnDocument: 'after' },
    );
    if (!updated) return res.status(404).json({ msg: 'Service catalog item not found' });
    await logSystemEvent({ user: req.user.id, type: 'service-catalog', title: `${Boolean(active) ? 'Restored' : 'Archived'} service catalog item ${updated.title}`, referenceNo: updated._id.toString(), metadata: { action: Boolean(active) ? 'restore' : 'archive', module: 'service-catalog' } });
    return res.json(updated);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to archive service catalog item' });
  }
});

router.delete('/catalog/:id', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const deleted = await ServiceCatalog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: 'Service catalog item not found' });
    await logSystemEvent({ user: req.user.id, type: 'service-catalog', title: `Deleted service catalog item ${deleted.title}`, referenceNo: deleted._id.toString(), metadata: { action: 'delete', module: 'service-catalog' } });
    return res.json({ msg: 'Service catalog item removed' });
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to delete service catalog item' });
  }
});

router.post('/requests', auth, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id).select('firstName lastName email children');
    if (!parentUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const referenceNo = makeReference('SVC');
    const actingChild = req.user.actingChild
      ? (parentUser.children || []).find((child) => String(child._id) === String(req.user.actingChild.id))
      : null;
    const request = await ServiceRequest.create({
      ...req.body,
      user: req.user.id,
      referenceNo,
      history: [{ status: 'pending', by: req.user.id, note: 'Request submitted' }],
    });

    await logSystemEvent({
      user: req.user.id,
      type: 'service-request',
      title: `Submitted ${request.serviceType}${actingChild ? ` under child access for ${actingChild.fullName}` : ''}`,
      referenceNo,
      metadata: { module: 'service-requests', action: 'create', actingChild: actingChild ? { fullName: actingChild.fullName, email: actingChild.email } : null },
    });

    return res.status(201).json(request);
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to submit service request' });
  }
});

router.get('/requests/me', auth, async (req, res) => {
  try {
    const items = await ServiceRequest.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch your requests' });
  }
});

router.get('/requests/track/:referenceNo', auth, async (req, res) => {
  try {
    const item = await ServiceRequest.findOne({ referenceNo: req.params.referenceNo });
    if (!item) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    if (req.user.role === 'resident' && item.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Forbidden' });
    }

    return res.json(item);
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to track request' });
  }
});

router.get('/requests', auth, requireRoles('admin', 'superadmin'), async (_req, res) => {
  try {
    const items = await ServiceRequest.find().sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch requests' });
  }
});

router.patch('/requests/:id/status', auth, requireRoles('admin', 'superadmin'), requireAdminPermission('serviceRequests', 'edit'), async (req, res) => {
  try {
    const { status, note } = req.body;

    if (req.user.role === 'admin' && status && !['in-review'].includes(status)) {
      return res.status(403).json({ msg: 'Admin can only set status to in-review' });
    }

    const item = await ServiceRequest.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Request not found' });
    }
    const residentUser = await User.findById(item.user).select('firstName lastName email children');

    if (status) {
      item.status = status;
      item.history.push({ status, by: req.user.id, note: note || '' });
    }

    await item.save();

    await logSystemEvent({
      user: req.user.id,
      type: 'service-request',
      title: `Updated service request ${item.referenceNo} to ${item.status}`,
      referenceNo: item.referenceNo,
      metadata: { byRole: req.user.role, action: item.status === 'rejected' ? 'archive' : 'update', module: 'service-requests', residentUser: item.user },
    });

    return res.json(item);
  } catch (err) {
    return res.status(400).json({ msg: 'Failed to update request status' });
  }
});

router.get('/evacuation-centers/public', async (_req, res) => {
  try {
    return res.json([]);
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to fetch evacuation centers' });
  }
});

router.get('/evacuation-centers', auth, requireRoles('superadmin'), async (_req, res) => {
  try {
    return res.json([]);
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to fetch evacuation centers' });
  }
});

router.get('/emergency-hotlines', async (req, res) => {
  try {
    await seedEmergencyHotlinesIfNeeded();
    const includeInactive = req.user?.role === 'superadmin' || req.user?.role === 'admin';
    const rows = await EmergencyHotline.find(includeInactive ? {} : { active: true }).sort({ name: 1 });
    return res.json(rows);
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to fetch emergency hotlines' });
  }
});

router.post('/emergency-hotlines', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const payload = {
      ...req.body,
      when: Array.isArray(req.body.when) ? req.body.when : String(req.body.when || '').split(',').map((x) => x.trim()).filter(Boolean),
      prepare: Array.isArray(req.body.prepare) ? req.body.prepare : String(req.body.prepare || '').split(',').map((x) => x.trim()).filter(Boolean),
    };
    const created = await EmergencyHotline.create(payload);
    await logSystemEvent({ user: req.user.id, type: 'hotline-management', title: `Created emergency hotline ${created.name}`, referenceNo: created._id.toString(), metadata: { action: 'create', module: 'hotlines' } });
    return res.status(201).json(created);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to create emergency hotline' });
  }
});

router.put('/emergency-hotlines/:id', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const payload = {
      ...req.body,
      when: Array.isArray(req.body.when) ? req.body.when : String(req.body.when || '').split(',').map((x) => x.trim()).filter(Boolean),
      prepare: Array.isArray(req.body.prepare) ? req.body.prepare : String(req.body.prepare || '').split(',').map((x) => x.trim()).filter(Boolean),
    };
    const updated = await EmergencyHotline.findByIdAndUpdate(req.params.id, payload, { returnDocument: 'after' });
    if (!updated) return res.status(404).json({ msg: 'Emergency hotline not found' });
    await logSystemEvent({ user: req.user.id, type: 'hotline-management', title: `Updated emergency hotline ${updated.name}`, referenceNo: updated._id.toString(), metadata: { action: 'update', module: 'hotlines' } });
    return res.json(updated);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to update emergency hotline' });
  }
});

router.patch('/emergency-hotlines/:id/archive', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const updated = await EmergencyHotline.findByIdAndUpdate(
      req.params.id,
      { active: Boolean(req.body.active) },
      { returnDocument: 'after' },
    );
    if (!updated) return res.status(404).json({ msg: 'Emergency hotline not found' });
    await logSystemEvent({ user: req.user.id, type: 'hotline-management', title: `${Boolean(req.body.active) ? 'Restored' : 'Archived'} emergency hotline ${updated.name}`, referenceNo: updated._id.toString(), metadata: { action: Boolean(req.body.active) ? 'restore' : 'archive', module: 'hotlines' } });
    return res.json(updated);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to archive emergency hotline' });
  }
});

router.delete('/emergency-hotlines/:id', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const deleted = await EmergencyHotline.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: 'Emergency hotline not found' });
    await logSystemEvent({ user: req.user.id, type: 'hotline-management', title: `Deleted emergency hotline ${deleted.name}`, referenceNo: deleted._id.toString(), metadata: { action: 'delete', module: 'hotlines' } });
    return res.json({ msg: 'Emergency hotline removed' });
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to delete emergency hotline' });
  }
});

router.post('/evacuation-centers', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    return res.status(410).json({ msg: 'Evacuation center management is disabled.' });
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to create evacuation center' });
  }
});

router.put('/evacuation-centers/:id', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    return res.status(410).json({ msg: 'Evacuation center management is disabled.' });
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to update evacuation center' });
  }
});

router.delete('/evacuation-centers/:id', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    return res.status(410).json({ msg: 'Evacuation center management is disabled.' });
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to delete evacuation center' });
  }
});

router.get('/evacuation/nearest', auth, async (req, res) => {
  try {
    return res.status(410).json({ msg: 'Nearest evacuation center routing is disabled.' });
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to find nearest evacuation center' });
  }
});

export default router;

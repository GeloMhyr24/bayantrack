import express from 'express';
import SiteContent from '../models/SiteContent.js';
import { auth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

async function getOrCreateContent() {
  let content = await SiteContent.findOne();
  if (!content) {
    content = await SiteContent.create({});
  }
  return content;
}

router.get('/site', async (_req, res) => {
  try {
    const content = await getOrCreateContent();
    return res.json(content);
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to fetch site content' });
  }
});

router.patch('/site', auth, requireRoles('superadmin'), async (req, res) => {
  try {
    const content = await getOrCreateContent();
    const allowed = [
      'navbarBrandText',
      'heroEyebrow',
      'heroTitleLine1',
      'heroTitleLine2',
      'heroSubtitle',
      'heroPrimaryCta',
      'heroSecondaryCta',
      'communityCards',
      'aboutHeroTitle',
      'aboutHeroSubtitle',
      'aboutSnapshotItems',
      'aboutPopulationTrend',
      'aboutCoreGovernance',
      'aboutHistoryText',
      'aboutGovernanceText',
      'governanceTitle',
      'governanceSubtitle',
      'governanceItems',
      'servicesHeroTitle',
      'servicesHeroSubtitle',
      'emergencyHotlinesTitle',
      'emergencyHotlinesSubtitle',
      'officialsPageTitle',
      'officialsPageSubtitle',
      'footerBrandText',
      'footerDescription',
      'footerAddress',
      'footerPhone',
      'footerEmail',
      'contactOfficeHours',
      'contactLocationText',
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    update.updatedBy = req.user.id;
    const updated = await SiteContent.findByIdAndUpdate(
      content._id,
      { $set: update },
      { returnDocument: 'after' },
    );
    return res.json(updated);
  } catch (_err) {
    return res.status(400).json({ msg: 'Failed to update site content' });
  }
});

export default router;

import mongoose from 'mongoose';

const SnapshotItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const CommunityCardSchema = new mongoose.Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    sublabel: { type: String, required: true },
  },
  { _id: false },
);

const GovernanceItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false },
);

const SiteContentSchema = new mongoose.Schema(
  {
    navbarBrandText: { type: String, default: 'BAYANTRACK +' },
    heroEyebrow: { type: String, default: 'Official Government Portal' },
    heroTitleLine1: { type: String, default: 'Mambog II' },
    heroTitleLine2: { type: String, default: 'Progressive & Safe' },
    heroSubtitle: { type: String, default: 'A growing residential community in Bacoor City, dedicated to transparent governance and efficient public service.' },
    heroPrimaryCta: { type: String, default: 'Online Services' },
    heroSecondaryCta: { type: String, default: 'About The Community' },
    communityCards: {
      type: [CommunityCardSchema],
      default: [
        { value: '4102', label: 'Postal Code', sublabel: 'Bacoor City' },
        { value: '7,129', label: 'Population', sublabel: '2020 Census' },
        { value: 'IV-A', label: 'Region', sublabel: 'CALABARZON' },
        { value: 'CAVITE', label: 'Province', sublabel: 'Philippines' },
      ],
    },
    aboutHeroTitle: { type: String, default: 'About Our Community' },
    aboutHeroSubtitle: { type: String, default: 'Mambog II: A progressive residential barangay in the heart of Bacoor.' },
    aboutSnapshotItems: {
      type: [SnapshotItemSchema],
      default: [
        { label: 'Region', value: 'CALABARZON (Region IV-A)' },
        { label: 'Population (2020)', value: '7,129 Residents' },
        { label: 'City', value: 'Bacoor City, Cavite' },
        { label: 'Share of Bacoor', value: 'Approx. 1.07%' },
        { label: 'Postal Code', value: '4102' },
        { label: 'Elevation', value: '~12.7 meters ASL' },
        { label: 'Coordinates', value: '14.4239°N, 120.9523°E' },
        { label: 'Classification', value: 'Urban / Residential' },
      ],
    },
    aboutPopulationTrend: {
      type: [SnapshotItemSchema],
      default: [
        { label: '1990 Census', value: '~2,500' },
        { label: '2010 Census', value: '~5,800' },
        { label: '2020 Census', value: '7,129' },
      ],
    },
    aboutCoreGovernance: {
      type: [String],
      default: [
        'Barangay Assembly: Biannual meetings for resident consultation.',
        'Committees: Peace & Order, Health, Finance, Youth, Infrastructure.',
        'Transparency: Full disclosure of budget and projects.',
      ],
    },
    aboutHistoryText: { type: String, default: '' },
    aboutGovernanceText: { type: String, default: '' },
    governanceTitle: { type: String, default: 'Governance & Participation' },
    governanceSubtitle: { type: String, default: 'How we serve and engage with the community.' },
    governanceItems: {
      type: [GovernanceItemSchema],
      default: [
        { title: 'Barangay Assemblies', description: 'Biannual gatherings mandated by law to discuss financial reports and community projects.' },
        { title: 'Transparency', description: 'Open access to barangay budget, ordinances, and resolutions for public review.' },
        { title: 'Citizen Reporting', description: 'Active channels for feedback, complaints, and emergency reporting via BayanTrack+.' },
      ],
    },
    servicesHeroTitle: { type: String, default: 'Online Services Portal' },
    servicesHeroSubtitle: { type: String, default: 'Certificate of Indigency, Barangay Clearance, and Barangay ID requests with real database tracking.' },
    emergencyHotlinesTitle: { type: String, default: 'Emergency Hotlines' },
    emergencyHotlinesSubtitle: { type: String, default: 'Keep these numbers saved. Know what to do before you call.' },
    officialsPageTitle: { type: String, default: 'Barangay Officials Directory' },
    officialsPageSubtitle: { type: String, default: 'Meet the dedicated public servants of Barangay Mambog II, committed to transparency and efficient public service.' },
    footerBrandText: { type: String, default: 'BayanTrack+' },
    footerDescription: { type: String, default: 'The official digital portal of Barangay Mambog II, Bacoor, Cavite. Bridging the gap between the barangay hall and the home through technology and transparency.' },
    footerAddress: { type: String, default: 'Mambog II Barangay Hall, Bacoor City, Cavite 4102' },
    footerPhone: { type: String, default: '(046) 417-0000' },
    footerEmail: { type: String, default: 'admin@mambog2.gov.ph' },
    contactOfficeHours: { type: String, default: 'Monday - Friday, 8:00 AM - 5:00 PM' },
    contactLocationText: { type: String, default: 'Barangay Mambog II Hall, Bacoor City, Cavite' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

export default mongoose.model('SiteContent', SiteContentSchema);

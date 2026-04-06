
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Archive, Bell, Building2, Check, ClipboardCheck, FileText, LayoutDashboard, LogOut, Mail, Menu, Pencil, RotateCcw, Settings, Shield, Trash2, UserCog, UserX, Users, X } from "lucide-react";
import { clearAuthSession, type UserRole } from "@/lib/auth";
import { api, authHeaders } from "@/lib/api";
import { LogoutConfirmation } from "@/components/LogoutConfirmation";

interface DashboardProps { role: UserRole; }
type Panel = "overview" | "users" | "officials" | "announcements" | "reports" | "services" | "messages" | "subscriptions" | "restore" | "settings" | "notifications" | "audit";
type PermissionFlags = { view: boolean; add: boolean; edit: boolean; archive: boolean; delete: boolean };
type AdminPermissions = {
  officials: PermissionFlags;
  announcements: PermissionFlags;
  reports: PermissionFlags;
  serviceRequests: PermissionFlags;
  messages: PermissionFlags;
  subscribers: PermissionFlags;
};
type UserItem = { _id: string; username: string; firstName?: string; middleName?: string; lastName?: string; email: string; contactNumber?: string; address?: string; addressDetails?: { blk?: string; lot?: string; street?: string; subdivision?: string; barangay?: string; city?: string; province?: string; zipCode?: string; }; preferredContactMethod?: string; gender?: string; civilStatus?: string; marriageContractImage?: string; children?: Array<{ _id?: string; fullName?: string; email?: string; birthDate?: string; relationship?: string; status?: "pending" | "approved" | "rejected"; reviewReason?: string }>; role: string; status: "active" | "pending" | "suspended"; statusReason?: string; validIdType?: string; validIdStatus?: string; validIdImage?: string; avatarImage?: string; createdAt?: string; adminPermissions?: Partial<AdminPermissions>; };
type Official = { _id: string; name: string; role: string; level: "city" | "barangay"; rankOrder: number; committee?: string; description?: string; image?: string; active?: boolean; };
type AnnouncementItem = { _id: string; title: string; content?: string; category: string; module: string; source?: string; image?: string; archived?: boolean; createdAt?: string; };
type ReportItem = { _id: string; category: string; description: string; status: string; referenceNo: string; createdAt?: string; };
type ServiceRequest = { _id: string; referenceNo: string; serviceType: string; fullName: string; status: string; createdAt?: string; };
type ContactMessage = { _id: string; referenceNo: string; name: string; department: string; status: string; createdAt?: string; };
type Department = { _id: string; name: string; contactPerson: string; localNumber: string; active?: boolean };
type EvacuationCenter = { _id: string; name: string; address: string; active: boolean; capacity?: number; hazardsCovered?: string[]; notes?: string; location: { lat: number; lng: number } };
type EmergencyHotline = { _id: string; name: string; type: string; number: string; desc?: string; when?: string[]; prepare?: string[]; active?: boolean };
type Subscription = { _id: string; email: string; status: "active" | "unsubscribed"; source?: string; createdAt?: string; };
type ActivityItem = {
  _id: string;
  title: string;
  type: string;
  createdAt: string;
  referenceNo?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  metadata?: { module?: string; action?: string; [key: string]: any };
};
type SystemSettings = { autoArchiveReports: boolean; requireAnnouncementReview: boolean; emailDigest: boolean; allowResidentRegistration: boolean; maintenanceMode: boolean; maintenanceMessage: string; sessionTimeoutMinutes: number; lockoutWindowMinutes: number; };
type SiteContent = {
  navbarBrandText: string;
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  communityCards: Array<{ value: string; label: string; sublabel: string }>;
  governanceTitle: string;
  governanceSubtitle: string;
  governanceItems: Array<{ title: string; description: string }>;
  servicesHeroTitle: string;
  servicesHeroSubtitle: string;
  emergencyHotlinesTitle: string;
  emergencyHotlinesSubtitle: string;
  officialsPageTitle: string;
  officialsPageSubtitle: string;
  footerBrandText: string;
  footerDescription: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  aboutHeroTitle: string;
  aboutHeroSubtitle: string;
  aboutSnapshotItems: Array<{ label: string; value: string }>;
  aboutPopulationTrend: Array<{ label: string; value: string }>;
  aboutCoreGovernance: string[];
  aboutHistoryText: string;
  aboutGovernanceText: string;
  contactOfficeHours?: string;
  contactLocationText?: string;
};
type PendingAction = { title: string; message: string; confirmLabel: string; run: () => Promise<void>; };
type Feedback = { type: "success" | "error"; title: string; message: string; };
type UserReasonPrompt = {
  kind: "user-status" | "child-status";
  title: string;
  userId: string;
  username: string;
  nextStatus: "pending" | "suspended" | "approved" | "rejected";
  validIdStatus?: "pending" | "approved" | "rejected";
  role?: string;
  childId?: string;
  childName?: string;
};
type ChildDetailModalState = {
  parent: UserItem;
  child: NonNullable<UserItem["children"]>[number];
};

const defaultPermissionFlags = (): PermissionFlags => ({ view: true, add: true, edit: true, archive: true, delete: true });
const defaultAdminPermissions = (): AdminPermissions => ({
  officials: defaultPermissionFlags(),
  announcements: defaultPermissionFlags(),
  reports: defaultPermissionFlags(),
  serviceRequests: defaultPermissionFlags(),
  messages: defaultPermissionFlags(),
  subscribers: defaultPermissionFlags(),
});

function normalizeAdminPermissions(value?: Partial<AdminPermissions>): AdminPermissions {
  const defaults = defaultAdminPermissions();
  return {
    officials: { ...defaults.officials, ...(value?.officials || {}) },
    announcements: { ...defaults.announcements, ...(value?.announcements || {}) },
    reports: { ...defaults.reports, ...(value?.reports || {}) },
    serviceRequests: { ...defaults.serviceRequests, ...(value?.serviceRequests || {}) },
    messages: { ...defaults.messages, ...(value?.messages || {}) },
    subscribers: { ...defaults.subscribers, ...(value?.subscribers || {}) },
  };
}

function Badge({ value }: { value: string }) {
  const v = value.toLowerCase();
  const tone = v === "active" || v === "approved" || v === "resolved" || v === "completed" || v === "closed" || v === "read"
    ? "bg-emerald-100 text-emerald-700"
    : v === "pending" || v === "new" || v === "in-review"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 6;
  return (
    <div className="grid grid-cols-[minmax(84px,116px),1fr,32px] items-center gap-2 text-xs sm:grid-cols-[140px,1fr,36px]">
      <span className="truncate font-medium text-slate-600">{label}</span>
      <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-slate-900" style={{ width: `${pct}%` }} /></div>
      <span className="text-right text-slate-500">{value}</span>
    </div>
  );
}

function DonutStat({
  title,
  data,
}: {
  title: string;
  data: Array<{ label: string; value: number; color: string }>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="mt-4 text-sm text-slate-500">No data</p>
      </section>
    );
  }
  let cursor = 0;
  const segments = data.map((item) => {
    const start = cursor;
    const sweep = (item.value / total) * 360;
    cursor += sweep;
    return `${item.color} ${start}deg ${cursor}deg`;
  }).join(", ");
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 flex items-center gap-4">
        <div
          className="relative h-28 w-28 rounded-full"
          style={{ background: `conic-gradient(${segments})` }}
        >
          <div className="absolute inset-4 flex items-center justify-center rounded-full bg-white text-center">
            <div>
              <p className="text-2xl font-bold text-slate-900">{total}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Total</p>
            </div>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          {data.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="min-w-[120px] text-slate-600">{item.label}</span>
              <span className="font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryFilter({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label key={opt.value} className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${value === opt.value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}>
            <input type="radio" className="h-3 w-3 accent-current" checked={value === opt.value} onChange={() => onChange(opt.value)} />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function LabeledField({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: any;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export default function RoleDashboard({ role }: DashboardProps) {
  const navigate = useNavigate();
  const canManage = role === "superadmin";
  const canReviewUsers = role === "superadmin" || role === "admin";
  const [myPermissions, setMyPermissions] = useState<AdminPermissions>(defaultAdminPermissions());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("overview");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [reviewUserPrompt, setReviewUserPrompt] = useState<UserItem | null>(null);
  const [userReasonPrompt, setUserReasonPrompt] = useState<UserReasonPrompt | null>(null);
  const [userReasonChoice, setUserReasonChoice] = useState("Incomplete or invalid documents");
  const [userReasonCustom, setUserReasonCustom] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [childDetailModal, setChildDetailModal] = useState<ChildDetailModalState | null>(null);
  const [accountControlModal, setAccountControlModal] = useState<UserItem | null>(null);
  const [showAdminNotifications, setShowAdminNotifications] = useState(false);
  const [officialEditModal, setOfficialEditModal] = useState<Official | null>(null);
  const [announcementEditModal, setAnnouncementEditModal] = useState<AnnouncementItem | null>(null);
  const [addOfficialOpen, setAddOfficialOpen] = useState(false);
  const [addAnnouncementOpen, setAddAnnouncementOpen] = useState(false);
  const [homeEditOpen, setHomeEditOpen] = useState(false);
  const [aboutEditOpen, setAboutEditOpen] = useState(false);
  const [contactEditOpen, setContactEditOpen] = useState(false);
  const [servicesEditOpen, setServicesEditOpen] = useState(false);
  const [aboutSnapshotDraft, setAboutSnapshotDraft] = useState("");
  const [aboutTrendDraft, setAboutTrendDraft] = useState("");
  const [aboutGovDraft, setAboutGovDraft] = useState("");

  const [users, setUsers] = useState<UserItem[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<ActivityItem[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<any[]>([]);
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>([]);
  const [emergencyHotlines, setEmergencyHotlines] = useState<EmergencyHotline[]>([]);
  const [editingCenterId, setEditingCenterId] = useState<string | null>(null);
  const [evacuationCenterModalOpen, setEvacuationCenterModalOpen] = useState(false);
  const [editingHotlineId, setEditingHotlineId] = useState<string | null>(null);
  const [manageCentersOpen, setManageCentersOpen] = useState(false);
  const [manageHotlinesOpen, setManageHotlinesOpen] = useState(false);
  const [reportManageModal, setReportManageModal] = useState<ReportItem | null>(null);
  const [serviceManageModal, setServiceManageModal] = useState<ServiceRequest | null>(null);
  const [messageManageModal, setMessageManageModal] = useState<ContactMessage | null>(null);
  const [subscriptionManageModal, setSubscriptionManageModal] = useState<Subscription | null>(null);
  const [userCategory, setUserCategory] = useState("all");
  const [userApprovalCategory, setUserApprovalCategory] = useState("all");
  const [userParentCategory, setUserParentCategory] = useState("all");
  const [officialCategory, setOfficialCategory] = useState("all");
  const [subscriberCategory, setSubscriberCategory] = useState("all");
  const [activityRoleCategory, setActivityRoleCategory] = useState("all");
  const [announcementCategory, setAnnouncementCategory] = useState("all");
  const [messageCategory, setMessageCategory] = useState("all");
  const [serviceCategory, setServiceCategory] = useState("all");
  const [reportCategory, setReportCategory] = useState("all");
  const [notificationCategory, setNotificationCategory] = useState("all");

  const [newOfficial, setNewOfficial] = useState({ name: "", role: "", level: "barangay", rankOrder: 10, committee: "", description: "", image: "" });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", module: "barangay-updates", category: "Advisory", source: "Barangay Office", image: "" });
  const [newCatalogItem, setNewCatalogItem] = useState({ code: "", title: "", desc: "", usage: "", requirements: "", time: "", active: true, sortOrder: 100 });
  const [newCenter, setNewCenter] = useState({ name: "", address: "", lat: "", lng: "", hazardsCovered: "typhoon,flood,earthquake,fire", capacity: "0", notes: "", active: true });
  const [newHotline, setNewHotline] = useState({ name: "", type: "", number: "", desc: "", when: "", prepare: "", active: true });
  const [newDepartment, setNewDepartment] = useState({ name: "", contactPerson: "", localNumber: "" });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({ autoArchiveReports: true, requireAnnouncementReview: false, emailDigest: true, allowResidentRegistration: true, maintenanceMode: false, maintenanceMessage: "", sessionTimeoutMinutes: 60, lockoutWindowMinutes: 15 });
  const [siteContent, setSiteContent] = useState<SiteContent>({
    navbarBrandText: "BAYANTRACK +",
    heroEyebrow: "Official Government Portal",
    heroTitleLine1: "Mambog II",
    heroTitleLine2: "Progressive & Safe",
    heroSubtitle: "A growing residential community in Bacoor City, dedicated to transparent governance and efficient public service.",
    heroPrimaryCta: "Online Services",
    heroSecondaryCta: "About The Community",
    communityCards: [
      { value: "4102", label: "Postal Code", sublabel: "Bacoor City" },
      { value: "7,129", label: "Population", sublabel: "2020 Census" },
      { value: "IV-A", label: "Region", sublabel: "CALABARZON" },
      { value: "CAVITE", label: "Province", sublabel: "Philippines" },
    ],
    governanceTitle: "Governance & Participation",
    governanceSubtitle: "How we serve and engage with the community.",
    governanceItems: [
      { title: "Barangay Assemblies", description: "Biannual gatherings mandated by law to discuss financial reports and community projects." },
      { title: "Transparency", description: "Open access to barangay budget, ordinances, and resolutions for public review." },
      { title: "Citizen Reporting", description: "Active channels for feedback, complaints, and emergency reporting via BayanTrack+." },
    ],
    servicesHeroTitle: "Online Services Portal",
    servicesHeroSubtitle: "Certificate of Indigency, Barangay Clearance, and Barangay ID requests with real database tracking.",
    emergencyHotlinesTitle: "Emergency Hotlines",
    emergencyHotlinesSubtitle: "Keep these numbers saved. Know what to do before you call.",
    officialsPageTitle: "Barangay Officials Directory",
    officialsPageSubtitle: "Meet the dedicated public servants of Barangay Mambog II, committed to transparency and efficient public service.",
    footerBrandText: "BayanTrack+",
    footerDescription: "The official digital portal of Barangay Mambog II, Bacoor, Cavite. Bridging the gap between the barangay hall and the home through technology and transparency.",
    footerAddress: "Mambog II Barangay Hall, Bacoor City, Cavite 4102",
    footerPhone: "(046) 417-0000",
    footerEmail: "admin@mambog2.gov.ph",
    aboutHeroTitle: "About Our Community",
    aboutHeroSubtitle: "Mambog II: A progressive residential barangay in the heart of Bacoor.",
    aboutSnapshotItems: [
      { label: "Region", value: "CALABARZON (Region IV-A)" },
      { label: "Population (2020)", value: "7,129 Residents" },
      { label: "City", value: "Bacoor City, Cavite" },
      { label: "Share of Bacoor", value: "Approx. 1.07%" },
    ],
    aboutPopulationTrend: [
      { label: "1990 Census", value: "~2,500" },
      { label: "2010 Census", value: "~5,800" },
      { label: "2020 Census", value: "7,129" },
    ],
    aboutCoreGovernance: [
      "Barangay Assembly: Biannual meetings for resident consultation.",
      "Committees: Peace & Order, Health, Finance, Youth, Infrastructure.",
      "Transparency: Full disclosure of budget and projects.",
    ],
    aboutHistoryText: "",
    aboutGovernanceText: "",
    contactOfficeHours: "Monday - Friday, 8:00 AM - 5:00 PM",
    contactLocationText: "Barangay Mambog II Hall, Bacoor City, Cavite",
  });

  useEffect(() => { void loadDashboardData(); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadDashboardData(true);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [role, userCategory, userApprovalCategory]);
  useEffect(() => { void loadUsers(); }, [userCategory, userApprovalCategory]);
  useEffect(() => { if (!feedback) return; const t = setTimeout(() => setFeedback(null), 2800); return () => clearTimeout(t); }, [feedback]);

  const stats = useMemo(() => ({
    users: users.length,
    pendingUsers: users.filter((u) => u.status === "pending" || u.validIdStatus === "pending").length,
    announcements: announcements.length,
    subscribers: subscriptions.filter((s) => s.status === "active").length,
    openReports: reports.filter((r) => r.status !== "resolved").length,
    pendingServices: services.filter((s) => s.status === "pending" || s.status === "in-review").length,
    unreadMessages: messages.filter((m) => m.status === "new").length,
  }), [users, announcements, subscriptions, reports, services, messages]);

  const chartServices = useMemo(() => {
    const map = new Map<string, number>();
    services.forEach((s) => map.set(s.serviceType, (map.get(s.serviceType) || 0) + 1));
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [services]);

  const chartReports = useMemo(() => {
    const map = new Map<string, number>();
    reports.forEach((r) => map.set(r.category, (map.get(r.category) || 0) + 1));
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [reports]);

  const chartAnnouncements = useMemo(() => {
    const map = new Map<string, number>();
    announcements.forEach((a) => map.set(a.module, (map.get(a.module) || 0) + 1));
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [announcements]);

  const recentAdminNotices = useMemo(() => adminNotifications.slice(0, 6), [adminNotifications]);

  const monthlyOverview = useMemo(() => {
    const monthLabels = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleString("en-US", { month: "short" }),
      };
    });
    const counts = monthLabels.map((month) => ({ ...month, users: 0, reports: 0, services: 0, messages: 0 }));
    const monthIndex = new Map(counts.map((item) => [item.key, item]));
    const stamp = (dateValue?: string, field: "users" | "reports" | "services" | "messages" = "users") => {
      if (!dateValue) return;
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return;
      const bucket = monthIndex.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (bucket) bucket[field] += 1;
    };
    users.forEach((item) => stamp(item.createdAt, "users"));
    reports.forEach((item) => stamp(item.createdAt, "reports"));
    services.forEach((item) => stamp(item.createdAt, "services"));
    messages.forEach((item) => stamp(item.createdAt, "messages"));
    return counts;
  }, [users, reports, services, messages]);

  const statusDonutData = useMemo(() => ([
    { label: "Active Users", value: users.filter((item) => item.status === "active").length, color: "#0f766e" },
    { label: "Pending Users", value: users.filter((item) => item.status === "pending").length, color: "#d97706" },
    { label: "Suspended Users", value: users.filter((item) => item.status === "suspended").length, color: "#dc2626" },
  ]), [users]);

  const requestDonutData = useMemo(() => ([
    { label: "Services", value: services.length, color: "#2563eb" },
    { label: "Reports", value: reports.length, color: "#7c3aed" },
    { label: "Messages", value: messages.length, color: "#0891b2" },
    { label: "Subscribers", value: subscriptions.length, color: "#16a34a" },
  ]), [services, reports, messages, subscriptions]);

  const announcementCategoryOptions = [
    { value: "all", label: "All" },
    { value: "barangay-updates", label: "Barangay Updates" },
    { value: "emergency-hotlines", label: "Emergency Hotlines" },
    { value: "phivolcs-alerts", label: "PHIVOLCS Alerts" },
    { value: "fact-check", label: "Fact Checks" },
  ];
  const messageCategoryOptions = [
    { value: "all", label: "All" },
    { value: "barangay-secretary", label: "Barangay Secretary" },
    { value: "disaster-drrm", label: "Disaster DRRM" },
    { value: "health-center", label: "Health Center" },
    { value: "office-of-the-captain", label: "Office of the Captain" },
    { value: "senior-citizen-desk", label: "Senior Citizen Desk" },
  ];
  const serviceCategoryOptions = [
    { value: "all", label: "All" },
    { value: "barangay-clearance", label: "Barangay Clearance" },
    { value: "certificate-of-indigency", label: "Certificate of Indigency" },
    { value: "barangay-id", label: "Barangay ID" },
  ];
  const reportCategoryOptions = [
    { value: "all", label: "All" },
    { value: "garbage-sanitation", label: "Garbage / Sanitation" },
    { value: "potholes-road-damage", label: "Potholes / Road Damage" },
    { value: "streetlight-defect", label: "Streetlight Defect" },
    { value: "noise-complaint", label: "Noise Complaint" },
    { value: "suspicious-activity", label: "Suspicious Activity" },
    { value: "stray-animal", label: "Stray Animal" },
  ];
  const userCategoryOptions = [
    { value: "all", label: "All" },
    { value: "superadmin", label: "Superadmin" },
    { value: "admin", label: "Admin" },
    { value: "user", label: "User" },
  ];
  const userApprovalOptions = [
    { value: "all", label: "All" },
    { value: "approved", label: "Approved" },
    { value: "not-approved", label: "Not Approved" },
  ];
  const userParentOptions = [
    { value: "all", label: "All" },
    { value: "with-children", label: "Parents With Account" },
    { value: "without-children", label: "No Child Linked" },
  ];
  const officialCategoryOptions = [
    { value: "all", label: "All" },
    { value: "barangay", label: "Barangay" },
    { value: "city", label: "City" },
  ];
  const subscriberCategoryOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "unsubscribed", label: "Unsubscribed" },
  ];
  const activityRoleOptions = [
    { value: "all", label: "All" },
    { value: "superadmin", label: "Superadmin" },
    { value: "admin", label: "Admin" },
    { value: "resident", label: "Resident" },
  ];
  const notificationCategoryOptions = [
    { value: "all", label: "All" },
    { value: "users", label: "Users" },
    { value: "reports", label: "Reports" },
    { value: "services", label: "Services" },
    { value: "messages", label: "Messages" },
    { value: "announcements", label: "Announcements" },
    { value: "child-access", label: "Child Access" },
  ];

  const toKey = (value: string) =>
    String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const matchesMessageCategory = (department: string, category: string) => {
    if (category === "all") return true;
    const key = toKey(department);
    if (category === "office-of-the-captain") return key.includes("captain");
    if (category === "disaster-drrm") return key.includes("drrm") || key.includes("disaster");
    if (category === "barangay-secretary") return key.includes("secretary");
    if (category === "health-center") return key.includes("health");
    if (category === "senior-citizen-desk") return key.includes("senior");
    return key.includes(category);
  };

  const matchesServiceCategory = (serviceType: string, category: string) => {
    if (category === "all") return true;
    const key = toKey(serviceType);
    if (category === "certificate-of-indigency") return key.includes("indigency");
    if (category === "barangay-clearance") return key.includes("clearance");
    if (category === "barangay-id") return key.includes("barangay-id") || key.includes("barangayid");
    return key.includes(category);
  };

  const matchesReportCategory = (reportType: string, category: string) => {
    if (category === "all") return true;
    const key = toKey(reportType);
    if (category === "garbage-sanitation") return key.includes("garbage") || key.includes("sanitation");
    if (category === "potholes-road-damage") return key.includes("pothole") || key.includes("road-damage") || key.includes("road");
    if (category === "streetlight-defect") return key.includes("streetlight");
    if (category === "noise-complaint") return key.includes("noise");
    if (category === "suspicious-activity") return key.includes("suspicious");
    if (category === "stray-animal") return key.includes("stray") || key.includes("animal");
    return key.includes(category);
  };

  const filteredAnnouncements = useMemo(
    () => announcements.filter((a) => !a.archived && (announcementCategory === "all" || a.module === announcementCategory)),
    [announcements, announcementCategory],
  );
  const filteredUsers = useMemo(
    () => users.filter((user) => {
      if (user.status === "suspended") return false;
      if (userParentCategory === "with-children") return Array.isArray(user.children) && user.children.length > 0;
      if (userParentCategory === "without-children") return !Array.isArray(user.children) || user.children.length === 0;
      return true;
    }),
    [users, userParentCategory],
  );
  const filteredOfficials = useMemo(
    () => officials.filter((o) => o.active !== false && (officialCategory === "all" || o.level === officialCategory)),
    [officials, officialCategory],
  );
  const filteredMessages = useMemo(
    () => messages.filter((m) => m.status !== "closed" && matchesMessageCategory(m.department, messageCategory)),
    [messages, messageCategory],
  );
  const filteredServices = useMemo(
    () => services.filter((s) => s.status !== "rejected" && matchesServiceCategory(s.serviceType, serviceCategory)),
    [services, serviceCategory],
  );
  const filteredReports = useMemo(
    () => reports.filter((r) => r.status !== "rejected" && matchesReportCategory(r.category, reportCategory)),
    [reports, reportCategory],
  );
  const filteredSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.status !== "unsubscribed" && (subscriberCategory === "all" || s.status === subscriberCategory)),
    [subscriptions, subscriberCategory],
  );
  const filteredActivities = useMemo(
    () => activities.filter((a) => activityRoleCategory === "all" || a.userRole === activityRoleCategory),
    [activities, activityRoleCategory],
  );
  const filteredAdminNotifications = useMemo(
    () => adminNotifications.filter((item) => {
      if (notificationCategory === "all") return true;
      const module = String(item.metadata?.module || item.type || "").toLowerCase();
      if (notificationCategory === "users") return module.includes("user") || module.includes("child");
      if (notificationCategory === "reports") return module.includes("report");
      if (notificationCategory === "services") return module.includes("service");
      if (notificationCategory === "messages") return module.includes("message");
      if (notificationCategory === "announcements") return module.includes("announcement");
      if (notificationCategory === "child-access") return module.includes("child");
      return true;
    }),
    [adminNotifications, notificationCategory],
  );
  const archivedUsers = useMemo(() => users.filter((u) => u.status === "suspended"), [users]);
  const archivedOfficials = useMemo(() => officials.filter((o) => o.active === false), [officials]);
  const archivedAnnouncements = useMemo(() => announcements.filter((a) => a.archived), [announcements]);
  const archivedReports = useMemo(() => reports.filter((r) => r.status === "rejected"), [reports]);
  const archivedServices = useMemo(() => services.filter((s) => s.status === "rejected"), [services]);
  const archivedMessages = useMemo(() => messages.filter((m) => m.status === "closed"), [messages]);
  const archivedSubscriptions = useMemo(() => subscriptions.filter((s) => s.status === "unsubscribed"), [subscriptions]);

  const hasModulePermission = (moduleKey: keyof AdminPermissions, action: keyof PermissionFlags) => {
    if (role === "superadmin") return true;
    if (role !== "admin") return false;
    return myPermissions?.[moduleKey]?.[action] !== false;
  };

  const setSelectedAdminPermissionsAll = (enabled: boolean) => {
    setSelectedUser((p) => {
      if (!p) return p;
      const current = normalizeAdminPermissions(p.adminPermissions);
      (Object.keys(current) as Array<keyof AdminPermissions>).forEach((moduleKey) => {
        (Object.keys(current[moduleKey]) as Array<keyof PermissionFlags>).forEach((actionKey) => {
          current[moduleKey][actionKey] = enabled;
        });
      });
      return { ...p, adminPermissions: current };
    });
  };

  async function loadDashboardData(silent = false) {
    try {
      const [usersRes, officialsRes, announcementsRes, reportsRes, servicesRes, messagesRes, subscriptionsRes, activityRes, settingsRes, contentRes, catalogRes, deptRes, meRes] = await Promise.all([
        api.get("/api/admin/users", { headers: authHeaders(), params: buildUserQueryParams() }),
        api.get("/api/officials/all", { headers: authHeaders() }),
        api.get(canManage ? "/api/announcements/all" : "/api/announcements", { headers: canManage ? authHeaders() : undefined }),
        api.get("/api/reports", { headers: authHeaders() }),
        api.get("/api/services/requests", { headers: authHeaders() }),
        api.get("/api/contact/messages", { headers: authHeaders() }),
        api.get("/api/subscriptions", { headers: authHeaders() }),
        api.get("/api/admin/activity", { headers: authHeaders() }),
        api.get("/api/admin/system-settings", { headers: authHeaders() }),
        api.get("/api/content/site"),
        api.get("/api/services/catalog/all", { headers: authHeaders() }),
        api.get("/api/contact/departments"),
        api.get("/api/auth/user", { headers: authHeaders() }),
      ]);
      setUsers(usersRes.data || []); setOfficials(officialsRes.data || []); setAnnouncements(announcementsRes.data || []);
      setReports(reportsRes.data || []); setServices(servicesRes.data || []); setMessages(messagesRes.data || []);
      setSubscriptions(subscriptionsRes.data || []); setActivities(activityRes.data || []);
      setAdminNotifications([]);
      setSystemSettings((p) => ({ ...p, ...(settingsRes.data || {}) }));
      setSiteContent((p) => ({ ...p, ...(contentRes.data || {}) }));
      setMyPermissions(normalizeAdminPermissions(meRes.data?.adminPermissions));
      setServiceCatalog(catalogRes.data || []);
      setDepartments(deptRes.data || []);
      if (canManage) {
        const [evacRes, hotlineRes] = await Promise.all([
          api.get("/api/services/evacuation-centers", { headers: authHeaders() }),
          api.get("/api/services/emergency-hotlines", { headers: authHeaders() }),
        ]);
        setEvacuationCenters(evacRes.data || []);
        setEmergencyHotlines(hotlineRes.data || []);
      }
    } catch (err: any) {
      if (!silent) {
        setFeedback({ type: "error", title: "Load failed", message: err?.response?.data?.msg || "Could not load dashboard data." });
      }
    }
  }

  function buildUserQueryParams() {
    return {
      ...(userCategory !== "all" ? { role: userCategory } : {}),
      ...(userCategory === "user" && userApprovalCategory !== "all" ? { approval: userApprovalCategory } : {}),
    };
  }

  async function loadUsers() {
    try {
      const usersRes = await api.get("/api/admin/users", { headers: authHeaders(), params: buildUserQueryParams() });
      setUsers(usersRes.data || []);
    } catch (err: any) {
      setFeedback({ type: "error", title: "Load failed", message: err?.response?.data?.msg || "Could not load users." });
    }
  }

  async function runActionWithFeedback(title: string, action: () => Promise<void>) {
    await action(); await loadDashboardData(); setFeedback({ type: "success", title, message: `Completed at ${new Date().toLocaleString()}` });
  }

  const reasonOptions = [
    "Incomplete or invalid documents",
    "Fraudulent or mismatched information",
    "Duplicate account or duplicate request",
    "Needs correction or resubmission",
    "Violation of barangay registration rules",
    "Other",
  ];

  const resolveReasonText = () => {
    if (userReasonChoice === "Other") return userReasonCustom.trim();
    return userReasonChoice.trim();
  };

  async function updateUserStatusDirect(target: UserItem, nextStatus: UserItem["status"], nextValidIdStatus: "pending" | "approved" | "rejected", reason = "") {
    await runActionWithFeedback(
      nextStatus === "active" ? "User approved" : nextStatus === "suspended" ? "User rejected" : "User updated",
      () => api.patch(`/api/admin/users/${target._id}/status`, { status: nextStatus, validIdStatus: nextValidIdStatus, reason }, { headers: authHeaders() }),
    );
    setReviewUserPrompt(null);
    setSelectedUser(null);
  }

  function openUserReasonPrompt(prompt: UserReasonPrompt) {
    setUserReasonPrompt(prompt);
    setUserReasonChoice("Incomplete or invalid documents");
    setUserReasonCustom("");
  }

  async function confirmUserReasonPrompt() {
    if (!userReasonPrompt) return;
    const reason = resolveReasonText();
    if (!reason) {
      setFeedback({ type: "error", title: "Reason required", message: "Select a reason or enter a custom reason before continuing." });
      return;
    }
    setActionLoading(true);
    try {
      if (userReasonPrompt.kind === "user-status") {
        await runActionWithFeedback(
          userReasonPrompt.validIdStatus === "rejected" ? "User review updated" : "Resident updated",
          () => api.patch(`/api/admin/users/${userReasonPrompt.userId}/status`, {
            status: userReasonPrompt.nextStatus,
            validIdStatus: userReasonPrompt.validIdStatus,
            role: userReasonPrompt.role,
            reason,
          }, { headers: authHeaders() }),
        );
        setSelectedUser(null);
        setReviewUserPrompt(null);
      } else {
        await runActionWithFeedback(
          userReasonPrompt.nextStatus === "approved" ? "Child access approved" : "Child access rejected",
          () => api.patch(`/api/admin/users/${userReasonPrompt.userId}/children/${userReasonPrompt.childId}/status`, {
            status: userReasonPrompt.nextStatus,
            reason,
          }, { headers: authHeaders() }),
        );
        setSelectedUser(null);
      }
      setUserReasonPrompt(null);
    } catch (err: any) {
      setFeedback({ type: "error", title: "Action failed", message: err?.response?.data?.msg || "Please try again." });
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;
    setActionLoading(true);
    try { await pendingAction.run(); setPendingAction(null); } catch (err: any) { setFeedback({ type: "error", title: "Action failed", message: err?.response?.data?.msg || "Please try again." }); }
    finally { setActionLoading(false); }
  }

  function confirmLogout() { setIsLoggingOut(true); setTimeout(() => { clearAuthSession(); navigate("/"); }, 3000); }

  function fileToBase64(file: File, cb: (value: string) => void) {
    const reader = new FileReader();
    reader.onload = () => cb(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function pairsToLines(items: Array<{ label: string; value: string }>) {
    return (items || []).map((x) => `${x.label}|${x.value}`).join("\n");
  }

  function linesToPairs(text: string) {
    return String(text || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, ...rest] = line.split("|");
        return { label: (label || "").trim(), value: rest.join("|").trim() };
      })
      .filter((x) => x.label && x.value);
  }

  const navItems: Array<{ id: Panel; label: string; icon: JSX.Element }> = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
    { id: "users", label: "Users", icon: <Users size={16} /> },
    { id: "officials", label: "Officials", icon: <Building2 size={16} /> },
    { id: "announcements", label: "Announcements", icon: <Bell size={16} /> },
    { id: "reports", label: "Reports", icon: <AlertTriangle size={16} /> },
    { id: "services", label: "Service Requests", icon: <FileText size={16} /> },
    { id: "messages", label: "Messages", icon: <Mail size={16} /> },
    { id: "subscriptions", label: "Subscribers", icon: <Mail size={16} /> },
    { id: "restore", label: "Restore Data", icon: <Archive size={16} /> },
    { id: "settings", label: "System Settings", icon: <Settings size={16} /> },
    { id: "notifications", label: "System Notifications", icon: <Bell size={16} /> },
    { id: "audit", label: "My Activity", icon: <ClipboardCheck size={16} /> },
  ];

  const card = "space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const modalOverlay = "fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-in fade-in duration-200";
  const modalCard = "w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200";
  const btnPrimary = "inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700";
  const btnSecondary = "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50";
  const btnDanger = "inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50";
  const iconBtn = "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50";
  const iconBtnDanger = "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 bg-white text-red-700 transition hover:bg-red-50";
  const iconDangerBtn = "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 bg-white text-red-700 transition hover:bg-red-50";
  const inputBase = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:bg-white focus:outline-none";
  const sectionCard = "rounded-xl border border-slate-200 bg-slate-50/70 p-3";
  const moduleGrid = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";
  const moduleCard = "rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm transition hover:border-slate-300 hover:shadow-md";
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-3 px-4 py-4 sm:flex-nowrap sm:items-center sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-md border border-slate-200 p-2 md:hidden" onClick={() => setIsMenuOpen((v) => !v)} type="button">{isMenuOpen ? <X size={16} /> : <Menu size={16} />}</button>
            <div className="rounded-md bg-slate-900 p-2 text-white">{role === "superadmin" ? <Shield size={16} /> : <UserCog size={16} />}</div>
            <div className="min-w-0"><p className="text-xs uppercase tracking-wide text-slate-500">BayanTrack Panel</p><h1 className="text-base font-bold text-slate-900 sm:text-lg">{role === "superadmin" ? "Superadmin Dashboard" : "Admin Dashboard"}</h1></div>
          </div>
          <div className="flex items-center gap-2"><button className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700" onClick={() => setShowLogoutDialog(true)} type="button"><LogOut size={14} /> <span className="hidden sm:inline">Logout</span></button></div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute left-4 right-4 top-20 rounded-xl border border-slate-200 bg-white p-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => <button key={item.id} className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${activePanel === item.id ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`} onClick={() => { setActivePanel(item.id); setIsMenuOpen(false); }} type="button">{item.icon}<span className="min-w-0">{item.label}</span></button>)}
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 sm:px-6 md:grid-cols-[220px,1fr]">
        <aside className="hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm md:sticky md:top-24 md:block md:self-start">
          {navItems.map((item) => <button key={item.id} className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${activePanel === item.id ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`} onClick={() => { setActivePanel(item.id); setIsMenuOpen(false); }} type="button">{item.icon}<span className="min-w-0">{item.label}</span></button>)}
        </aside>

        <main className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{role === "superadmin" ? "Superadmin Control" : "Admin Workspace"}</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">Operations Overview</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">Manage the remaining active admin tools from one place.</p>
              </div>
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Quick Snapshot</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] text-slate-500">Registered Users</p><p className="mt-1 text-2xl font-bold text-slate-900">{stats.users}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] text-slate-500">Pending Approval</p><p className="mt-1 text-2xl font-bold text-slate-900">{stats.pendingUsers}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
                    {activePanel === "overview" && (
            <section className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Users</p><p className="text-3xl font-bold">{stats.users}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Pending Approval</p><p className="text-3xl font-bold">{stats.pendingUsers}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Announcements</p><p className="text-3xl font-bold">{stats.announcements}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Service Requests</p><p className="text-3xl font-bold">{stats.pendingServices}</p></div>
              </div>
            </section>
          )}

          {(["reports", "messages", "subscriptions", "restore", "settings", "notifications", "audit"] as Panel[]).includes(activePanel) && (
            <section className={card}>
              <h2 className="mb-4 text-lg font-semibold">{navItems.find((item) => item.id === activePanel)?.label}</h2>
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">This tab is currently disabled.</div>
            </section>
          )}

          {activePanel === "users" && (
            <section className={card}>
              <h2 className="mb-4 text-lg font-semibold">Users</h2>
              <CategoryFilter title="User Categories" options={userCategoryOptions} value={userCategory} onChange={setUserCategory} />
              {userCategory === "user" && (
                <CategoryFilter title="User Approval" options={userApprovalOptions} value={userApprovalCategory} onChange={setUserApprovalCategory} />
              )}
              {userCategory === "user" && (
                <CategoryFilter title="Parent Account" options={userParentOptions} value={userParentCategory} onChange={setUserParentCategory} />
              )}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Username</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="border-t border-slate-200 align-top">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{[user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || "N/A"}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{user.username}</td>
                        <td className="px-4 py-3"><Badge value={user.role} /></td>
                        <td className="px-4 py-3"><Badge value={user.status === "active" ? "approved" : user.status === "suspended" ? "rejected" : "pending"} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button className={btnSecondary} onClick={() => setSelectedUser(user)} type="button">View Details</button>
                            {canManage && !(user.role === "superadmin" && user.username === "superAdmin123") && (
                              <button
                                className={iconBtn}
                                onClick={() => setPendingAction({
                                  title: user.status === "suspended" ? "Activate User" : "Archive User",
                                  message: `${user.status === "suspended" ? "Activate" : "Archive"} ${user.username}?`,
                                  confirmLabel: user.status === "suspended" ? "Activate" : "Archive",
                                  run: () => user.status === "suspended"
                                    ? runActionWithFeedback("User status updated", () => api.patch(`/api/admin/users/${user._id}/status`, { status: "active", validIdStatus: "approved" }, { headers: authHeaders() }))
                                    : Promise.resolve(openUserReasonPrompt({ kind: "user-status", title: "Archive User", userId: user._id, username: user.username, nextStatus: "suspended", validIdStatus: "rejected", role: user.role })),
                                })}
                                type="button"
                                title={user.status === "suspended" ? "Activate user" : "Archive user"}
                                aria-label={user.status === "suspended" ? "Activate user" : "Archive user"}
                              >
                                <Archive size={16} />
                              </button>
                            )}
                            {canManage && !(user.role === "superadmin" && user.username === "superAdmin123") && (
                              <button className={btnDanger} onClick={() => setPendingAction({ title: "Delete Permanently", message: `Delete ${user.username} and linked records?`, confirmLabel: "Delete", run: () => runActionWithFeedback("User deleted", () => api.delete(`/api/admin/users/${user._id}`, { headers: authHeaders() })) })} type="button">Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && <p className="mt-2 text-sm text-slate-500">No users in this category.</p>}
            </section>
          )}

          {activePanel === "officials" && (
            <section className={card}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Officials</h2>
                {hasModulePermission("officials", "add") && (
                  <button className={btnPrimary} onClick={() => setAddOfficialOpen(true)} type="button">Add Official</button>
                )}
              </div>
              <CategoryFilter title="Official Categories" options={officialCategoryOptions} value={officialCategory} onChange={setOfficialCategory} />
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Official</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Level</th>
                      <th className="px-4 py-3 font-semibold">Committee</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOfficials.map((o) => (
                      <tr key={o._id} className="border-t border-slate-200 align-top">
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <img src={o.image || "https://placehold.co/80x80/e2e8f0/475569?text=Official"} alt={o.name} className="h-10 w-10 rounded-full border object-cover" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">{o.name}</p>
                              <p className="text-xs text-slate-500">{o.description || "No description"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{o.role}</td>
                        <td className="px-4 py-3"><Badge value={o.level} /></td>
                        <td className="px-4 py-3 text-slate-700">{o.committee || "N/A"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {hasModulePermission("officials", "edit") && <button className={btnSecondary} onClick={() => setOfficialEditModal(o)} type="button">Edit</button>}
                            {hasModulePermission("officials", "archive") && (
                              <button
                                className={iconBtn}
                                onClick={() => setPendingAction({ title: o.active === false ? "Activate Official" : "Archive Official", message: `${o.active === false ? "Activate" : "Archive"} ${o.name}?`, confirmLabel: "Confirm", run: () => runActionWithFeedback("Official updated", () => api.put(`/api/officials/${o._id}`, { ...o, active: o.active === false }, { headers: authHeaders() })) })}
                                type="button"
                                title={o.active === false ? "Activate official" : "Archive official"}
                                aria-label={o.active === false ? "Activate official" : "Archive official"}
                              >
                                <Archive size={16} />
                              </button>
                            )}
                            {hasModulePermission("officials", "delete") && <button className={btnDanger} onClick={() => setPendingAction({ title: "Delete Official", message: `Delete ${o.name}?`, confirmLabel: "Delete", run: () => runActionWithFeedback("Official removed", () => api.delete(`/api/officials/${o._id}`, { headers: authHeaders() })) })} type="button">Delete</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredOfficials.length === 0 && <p className="mt-2 text-sm text-slate-500">No officials in this category.</p>}
            </section>
          )}

          {activePanel === "announcements" && (
            <section className={card}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Announcements</h2>
                {hasModulePermission("announcements", "add") && (
                  <button className={btnPrimary} onClick={() => setAddAnnouncementOpen(true)} type="button">Create Announcement</button>
                )}
              </div>
              <CategoryFilter title="Announcement Categories" options={announcementCategoryOptions} value={announcementCategory} onChange={setAnnouncementCategory} />
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[42%]" />
                    <col className="w-[16%]" />
                    <col className="w-[14%]" />
                    <col className="w-[10%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Title</th>
                      <th className="px-4 py-3 font-semibold">Module</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnnouncements.map((a) => (
                      <tr key={a._id} className="border-t border-slate-200 align-top">
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-[15px] font-semibold leading-5 text-slate-900">{a.title}</p>
                            <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-slate-500">{a.content || "No content provided."}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] leading-5 text-slate-700 break-words">{a.module}</td>
                        <td className="px-4 py-3 text-[13px] leading-5 text-slate-700 break-words">{a.category}</td>
                        <td className="px-4 py-3 align-middle"><div className="w-fit"><Badge value={a.archived ? "archived" : "active"} /></div></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-nowrap items-center gap-2">
                            {hasModulePermission("announcements", "edit") && (
                              <button className={iconBtn} onClick={() => setAnnouncementEditModal(a)} type="button" title="Edit announcement" aria-label="Edit announcement">
                                <Pencil size={16} />
                              </button>
                            )}
                            {hasModulePermission("announcements", "archive") && (
                              <button
                                className={iconBtn}
                                onClick={() => setPendingAction({ title: a.archived ? "Activate Announcement" : "Archive Announcement", message: `${a.archived ? "Activate" : "Archive"} ${a.title}?`, confirmLabel: "Confirm", run: () => runActionWithFeedback("Announcement updated", () => api.patch(`/api/announcements/${a._id}/archive`, { archived: !a.archived }, { headers: authHeaders() })) })}
                                type="button"
                                title={a.archived ? "Activate announcement" : "Archive announcement"}
                                aria-label={a.archived ? "Activate announcement" : "Archive announcement"}
                              >
                                <Archive size={16} />
                              </button>
                            )}
                            {hasModulePermission("announcements", "delete") && (
                              <button
                                className={iconDangerBtn}
                                onClick={() => setPendingAction({ title: "Delete Announcement", message: `Delete ${a.title}?`, confirmLabel: "Delete", run: () => runActionWithFeedback("Announcement deleted", () => api.delete(`/api/announcements/${a._id}`, { headers: authHeaders() })) })}
                                type="button"
                                title="Delete announcement"
                                aria-label="Delete announcement"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredAnnouncements.length === 0 && <p className="mt-2 text-sm text-slate-500">No announcements in this category.</p>}
            </section>
          )}
          {false && (
            <section className={card}>
              <h2 className="mb-4 text-lg font-semibold">Issue Reports</h2>
              <CategoryFilter title="Report Categories" options={reportCategoryOptions} value={reportCategory} onChange={setReportCategory} />
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Reference</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Details</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r) => (
                      <tr key={r._id} className="border-t border-slate-200 align-top">
                        <td className="px-4 py-3 font-semibold text-slate-900">{r.referenceNo}</td>
                        <td className="px-4 py-3 text-slate-700">{r.category}</td>
                        <td className="px-4 py-3 text-slate-600">{r.description}</td>
                        <td className="px-4 py-3"><Badge value={r.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {hasModulePermission("reports", "edit") ? <button className={btnSecondary} onClick={() => setReportManageModal(r)} type="button">Manage</button> : null}
                            {hasModulePermission("reports", "archive") ? (
                              <button
                                className={iconBtn}
                                onClick={() => setPendingAction({ title: "Archive Report", message: `Archive ${r.referenceNo}?`, confirmLabel: "Archive", run: () => runActionWithFeedback("Report archived", () => api.patch(`/api/reports/${r._id}/status`, { status: "rejected", adminChecked: true }, { headers: authHeaders() })) })}
                                type="button"
                                title="Archive report"
                                aria-label="Archive report"
                              >
                                <Archive size={16} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredReports.length === 0 && <p className="mt-2 text-sm text-slate-500">No reports in this category.</p>}
            </section>
          )}
          {activePanel === "services" && (
            <section className={card}>
              <h2 className="mb-4 text-lg font-semibold">Service Requests</h2>
              <CategoryFilter title="Service Categories" options={serviceCategoryOptions} value={serviceCategory} onChange={setServiceCategory} />
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Reference</th>
                      <th className="px-4 py-3 font-semibold">Service</th>
                      <th className="px-4 py-3 font-semibold">Resident</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((s) => (
                      <tr key={s._id} className="border-t border-slate-200 align-top">
                        <td className="px-4 py-3 font-semibold text-slate-900">{s.referenceNo}</td>
                        <td className="px-4 py-3 text-slate-700">{s.serviceType}</td>
                        <td className="px-4 py-3 text-slate-600">{s.fullName}</td>
                        <td className="px-4 py-3"><Badge value={s.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {hasModulePermission("serviceRequests", "edit") ? <button className={btnSecondary} onClick={() => setServiceManageModal(s)} type="button">Manage</button> : null}
                            {hasModulePermission("serviceRequests", "archive") ? (
                              <button
                                className={iconBtn}
                                onClick={() => setPendingAction({ title: "Archive Service Request", message: `Archive ${s.referenceNo}?`, confirmLabel: "Archive", run: () => runActionWithFeedback("Service request archived", () => api.patch(`/api/services/requests/${s._id}/status`, { status: "rejected", note: "Archived by superadmin" }, { headers: authHeaders() })) })}
                                type="button"
                                title="Archive service request"
                                aria-label="Archive service request"
                              >
                                <Archive size={16} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredServices.length === 0 && <p className="mt-2 text-sm text-slate-500">No service requests in this category.</p>}
            </section>
          )}
          {false && (
            <section className={card}>
              <h2 className="mb-4 text-lg font-semibold">Messages</h2>
              <CategoryFilter title="Department Categories" options={messageCategoryOptions} value={messageCategory} onChange={setMessageCategory} />
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Reference</th>
                      <th className="px-4 py-3 font-semibold">Sender</th>
                      <th className="px-4 py-3 font-semibold">Department</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.map((m) => (
                      <tr key={m._id} className="border-t border-slate-200 align-top">
                        <td className="px-4 py-3 font-semibold text-slate-900">{m.referenceNo}</td>
                        <td className="px-4 py-3 text-slate-700">{m.name}</td>
                        <td className="px-4 py-3 text-slate-600">{m.department}</td>
                        <td className="px-4 py-3"><Badge value={m.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {hasModulePermission("messages", "edit") ? <button className={btnSecondary} onClick={() => setMessageManageModal(m)} type="button">Manage</button> : null}
                            {hasModulePermission("messages", "archive") ? (
                              <button
                                className={iconBtn}
                                onClick={() => setPendingAction({ title: "Archive Message", message: `Archive ${m.referenceNo}?`, confirmLabel: "Archive", run: () => runActionWithFeedback("Message archived", () => api.patch(`/api/contact/messages/${m._id}/status`, { status: "closed" }, { headers: authHeaders() })) })}
                                type="button"
                                title="Archive message"
                                aria-label="Archive message"
                              >
                                <Archive size={16} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredMessages.length === 0 && <p className="mt-2 text-sm text-slate-500">No messages in this category.</p>}
            </section>
          )}
          {false && (
            <section className={card}>
              <h2 className="mb-4 text-lg font-semibold">Stay Updated Subscribers</h2>
              <CategoryFilter title="Subscriber Categories" options={subscriberCategoryOptions} value={subscriberCategory} onChange={setSubscriberCategory} />
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Source</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.map((sub) => (
                      <tr key={sub._id} className="border-t border-slate-200 align-top">
                        <td className="px-4 py-3 font-semibold text-slate-900">{sub.email}</td>
                        <td className="px-4 py-3 text-slate-600">{sub.source || "homepage"}</td>
                        <td className="px-4 py-3"><Badge value={sub.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {hasModulePermission("subscribers", "edit") ? <button className={btnSecondary} onClick={() => setSubscriptionManageModal(sub)} type="button">Manage</button> : null}
                            {hasModulePermission("subscribers", "archive") ? (
                              <button
                                className={iconBtn}
                                onClick={() => setPendingAction({ title: sub.status === "unsubscribed" ? "Activate Subscriber" : "Archive Subscriber", message: `${sub.status === "unsubscribed" ? "Activate" : "Archive"} ${sub.email}?`, confirmLabel: "Confirm", run: () => runActionWithFeedback("Subscriber updated", () => api.patch(`/api/subscriptions/${sub._id}/status`, { status: sub.status === "unsubscribed" ? "active" : "unsubscribed" }, { headers: authHeaders() })) })}
                                type="button"
                                title={sub.status === "unsubscribed" ? "Activate subscriber" : "Archive subscriber"}
                                aria-label={sub.status === "unsubscribed" ? "Activate subscriber" : "Archive subscriber"}
                              >
                                <Archive size={16} />
                              </button>
                            ) : null}
                            {hasModulePermission("subscribers", "delete") ? <button className={btnDanger} onClick={() => setPendingAction({ title: "Delete Subscriber", message: `Delete ${sub.email}?`, confirmLabel: "Delete", run: () => runActionWithFeedback("Subscriber deleted", () => api.delete(`/api/subscriptions/${sub._id}`, { headers: authHeaders() })) })} type="button">Delete</button> : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredSubscriptions.length === 0 && <p className="mt-2 text-sm text-slate-500">No subscribers in this category.</p>}
            </section>
          )}

          {false && (
            <section className={card}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Restore Data</h2>
                <p className="text-sm text-slate-500">Restore archived records back to their active workflow state.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">Users</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr><th className="px-4 py-3 font-semibold">Name</th><th className="px-4 py-3 font-semibold">Username</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Restore</th></tr>
                      </thead>
                      <tbody>
                        {archivedUsers.map((user) => (
                          <tr key={user._id} className="border-t border-slate-200">
                            <td className="px-4 py-3"><p className="font-semibold text-slate-900">{[user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || "N/A"}</p><p className="text-xs text-slate-500">{user.email}</p></td>
                            <td className="px-4 py-3 text-slate-700">{user.username}</td>
                            <td className="px-4 py-3"><Badge value="archived" /></td>
                            <td className="px-4 py-3"><button className={iconBtn}  onClick={() => setPendingAction({ title: "Restore User", message: `Restore ${user.username}?`, confirmLabel: "Restore", run: () => runActionWithFeedback("User restored", () => api.patch(`/api/admin/users/${user._id}/status`, { status: "active" }, { headers: authHeaders() })) })} type="button" title="Restore item" aria-label="Restore item"><Archive size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {archivedUsers.length === 0 && <p className="mt-2 text-sm text-slate-500">No archived users.</p>}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">Officials</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr><th className="px-4 py-3 font-semibold">Official</th><th className="px-4 py-3 font-semibold">Role</th><th className="px-4 py-3 font-semibold">Restore</th></tr>
                      </thead>
                      <tbody>
                        {archivedOfficials.map((item) => (
                          <tr key={item._id} className="border-t border-slate-200">
                            <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                            <td className="px-4 py-3 text-slate-700">{item.role}</td>
                            <td className="px-4 py-3"><button className={iconBtn}  onClick={() => setPendingAction({ title: "Restore Official", message: `Restore ${item.name}?`, confirmLabel: "Restore", run: () => runActionWithFeedback("Official restored", () => api.put(`/api/officials/${item._id}`, { ...item, active: true }, { headers: authHeaders() })) })} type="button" title="Restore item" aria-label="Restore item"><Archive size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {archivedOfficials.length === 0 && <p className="mt-2 text-sm text-slate-500">No archived officials.</p>}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">Announcements</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr><th className="px-4 py-3 font-semibold">Title</th><th className="px-4 py-3 font-semibold">Module</th><th className="px-4 py-3 font-semibold">Restore</th></tr>
                      </thead>
                      <tbody>
                        {archivedAnnouncements.map((item) => (
                          <tr key={item._id} className="border-t border-slate-200">
                            <td className="px-4 py-3 font-semibold text-slate-900">{item.title}</td>
                            <td className="px-4 py-3 text-slate-700">{item.module}</td>
                            <td className="px-4 py-3"><button className={iconBtn}  onClick={() => setPendingAction({ title: "Restore Announcement", message: `Restore ${item.title}?`, confirmLabel: "Restore", run: () => runActionWithFeedback("Announcement restored", () => api.patch(`/api/announcements/${item._id}/archive`, { archived: false }, { headers: authHeaders() })) })} type="button" title="Restore item" aria-label="Restore item"><Archive size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {archivedAnnouncements.length === 0 && <p className="mt-2 text-sm text-slate-500">No archived announcements.</p>}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">Reports</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr><th className="px-4 py-3 font-semibold">Reference</th><th className="px-4 py-3 font-semibold">Category</th><th className="px-4 py-3 font-semibold">Restore</th></tr>
                      </thead>
                      <tbody>
                        {archivedReports.map((item) => (
                          <tr key={item._id} className="border-t border-slate-200">
                            <td className="px-4 py-3 font-semibold text-slate-900">{item.referenceNo}</td>
                            <td className="px-4 py-3 text-slate-700">{item.category}</td>
                            <td className="px-4 py-3"><button className={iconBtn}  onClick={() => setPendingAction({ title: "Restore Report", message: `Restore ${item.referenceNo}?`, confirmLabel: "Restore", run: () => runActionWithFeedback("Report restored", () => api.patch(`/api/reports/${item._id}/status`, { status: "new", adminChecked: false }, { headers: authHeaders() })) })} type="button" title="Restore item" aria-label="Restore item"><Archive size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {archivedReports.length === 0 && <p className="mt-2 text-sm text-slate-500">No archived reports.</p>}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">Service Requests</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr><th className="px-4 py-3 font-semibold">Reference</th><th className="px-4 py-3 font-semibold">Service</th><th className="px-4 py-3 font-semibold">Restore</th></tr>
                      </thead>
                      <tbody>
                        {archivedServices.map((item) => (
                          <tr key={item._id} className="border-t border-slate-200">
                            <td className="px-4 py-3 font-semibold text-slate-900">{item.referenceNo}</td>
                            <td className="px-4 py-3 text-slate-700">{item.serviceType}</td>
                            <td className="px-4 py-3"><button className={iconBtn}  onClick={() => setPendingAction({ title: "Restore Service Request", message: `Restore ${item.referenceNo}?`, confirmLabel: "Restore", run: () => runActionWithFeedback("Service request restored", () => api.patch(`/api/services/requests/${item._id}/status`, { status: "pending", note: "Restored by superadmin" }, { headers: authHeaders() })) })} type="button" title="Restore item" aria-label="Restore item"><Archive size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {archivedServices.length === 0 && <p className="mt-2 text-sm text-slate-500">No archived service requests.</p>}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">Messages</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr><th className="px-4 py-3 font-semibold">Reference</th><th className="px-4 py-3 font-semibold">Sender</th><th className="px-4 py-3 font-semibold">Restore</th></tr>
                      </thead>
                      <tbody>
                        {archivedMessages.map((item) => (
                          <tr key={item._id} className="border-t border-slate-200">
                            <td className="px-4 py-3 font-semibold text-slate-900">{item.referenceNo}</td>
                            <td className="px-4 py-3 text-slate-700">{item.name}</td>
                            <td className="px-4 py-3"><button className={iconBtn}  onClick={() => setPendingAction({ title: "Restore Message", message: `Restore ${item.referenceNo}?`, confirmLabel: "Restore", run: () => runActionWithFeedback("Message restored", () => api.patch(`/api/contact/messages/${item._id}/status`, { status: "new" }, { headers: authHeaders() })) })} type="button" title="Restore item" aria-label="Restore item"><Archive size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {archivedMessages.length === 0 && <p className="mt-2 text-sm text-slate-500">No archived messages.</p>}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">Subscribers</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr><th className="px-4 py-3 font-semibold">Email</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Restore</th></tr>
                      </thead>
                      <tbody>
                        {archivedSubscriptions.map((item) => (
                          <tr key={item._id} className="border-t border-slate-200">
                            <td className="px-4 py-3 font-semibold text-slate-900">{item.email}</td>
                            <td className="px-4 py-3"><Badge value={item.status} /></td>
                            <td className="px-4 py-3"><button className={iconBtn}  onClick={() => setPendingAction({ title: "Restore Subscriber", message: `Restore ${item.email}?`, confirmLabel: "Restore", run: () => runActionWithFeedback("Subscriber restored", () => api.patch(`/api/subscriptions/${item._id}/status`, { status: "active" }, { headers: authHeaders() })) })} type="button" title="Restore item" aria-label="Restore item"><Archive size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {archivedSubscriptions.length === 0 && <p className="mt-2 text-sm text-slate-500">No archived subscribers.</p>}
                </div>
              </div>
            </section>
          )}

          {false && (
            <section className={card}>
              <h2 className="mb-4 text-lg font-semibold">System Settings</h2>
              {!canManage && <p className="mb-3 text-sm text-slate-600">Admin access is read-only.</p>}
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center justify-between gap-2 rounded border p-3 text-sm"><span>Allow Resident Registration</span><input type="checkbox" checked={systemSettings.allowResidentRegistration} disabled={!canManage} onChange={(e) => setSystemSettings((p) => ({ ...p, allowResidentRegistration: e.target.checked }))} /></label>
                <label className="flex items-center justify-between gap-2 rounded border p-3 text-sm"><span>Maintenance Mode</span><input type="checkbox" checked={systemSettings.maintenanceMode} disabled={!canManage} onChange={(e) => setSystemSettings((p) => ({ ...p, maintenanceMode: e.target.checked }))} /></label>
                <label className="flex items-center justify-between gap-2 rounded border p-3 text-sm"><span>Auto-archive Reports</span><input type="checkbox" checked={systemSettings.autoArchiveReports} disabled={!canManage} onChange={(e) => setSystemSettings((p) => ({ ...p, autoArchiveReports: e.target.checked }))} /></label>
                <label className="flex items-center justify-between gap-2 rounded border p-3 text-sm"><span>Require Announcement Review</span><input type="checkbox" checked={systemSettings.requireAnnouncementReview} disabled={!canManage} onChange={(e) => setSystemSettings((p) => ({ ...p, requireAnnouncementReview: e.target.checked }))} /></label>
                <label className="flex items-center justify-between gap-2 rounded border p-3 text-sm"><span>Email Digest</span><input type="checkbox" checked={systemSettings.emailDigest} disabled={!canManage} onChange={(e) => setSystemSettings((p) => ({ ...p, emailDigest: e.target.checked }))} /></label>
                <label className="flex items-center justify-between gap-2 rounded border p-3 text-sm"><span>Login Lockout Window (minutes)</span><input className={`${inputBase} w-20 px-2 py-1 text-xs`} type="number" min={5} value={systemSettings.lockoutWindowMinutes} disabled={!canManage} onChange={(e) => setSystemSettings((p) => ({ ...p, lockoutWindowMinutes: Number(e.target.value) || 15 }))} /></label>
                <label className="md:col-span-2 text-sm"><span className="mb-1 block font-medium">Maintenance Message</span><textarea className="w-full rounded border p-2 text-sm" rows={2} value={systemSettings.maintenanceMessage} disabled={!canManage} onChange={(e) => setSystemSettings((p) => ({ ...p, maintenanceMessage: e.target.value }))} /></label>
              </div>
              <div className="mt-6 border-t pt-4">
                <h3 className="mb-3 font-semibold">Resident Content Editors</h3>
                {canManage ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    <button className={`${btnSecondary} justify-start text-sm`} onClick={() => setHomeEditOpen(true)} type="button">Edit Home Content</button>
                    <button className={`${btnSecondary} justify-start text-sm`} onClick={() => { setAboutSnapshotDraft(pairsToLines((siteContent as any).aboutSnapshotItems || [])); setAboutTrendDraft(pairsToLines((siteContent as any).aboutPopulationTrend || [])); setAboutGovDraft(((siteContent as any).aboutCoreGovernance || []).join("\n")); setAboutEditOpen(true); }} type="button">Edit About Content</button>
                    <button className={`${btnSecondary} justify-start text-sm`} onClick={() => setContactEditOpen(true)} type="button">Edit Contact Content</button>
                    <button className={`${btnSecondary} justify-start text-sm`} onClick={() => setServicesEditOpen(true)} type="button">Manage Services Catalog</button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Only superadmin can edit resident-facing content.</p>
                )}
              </div>
              {canManage && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="mb-3 font-semibold">Evacuation & Safety Data</h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    <button className={`${btnSecondary} justify-start text-sm`} onClick={() => setManageCentersOpen(true)} type="button">View / Manage Centers</button>
                    <button className={`${btnSecondary} justify-start text-sm`} onClick={() => setManageHotlinesOpen(true)} type="button">View / Manage Emergency Hotlines</button>
                  </div>
                </div>
              )}
              {canManage && <button className={`${btnPrimary} mt-4 text-sm`} onClick={() => setPendingAction({ title: "Save System Settings", message: "Apply updated system settings?", confirmLabel: "Save", run: () => runActionWithFeedback("System settings updated", () => api.patch("/api/admin/system-settings", systemSettings, { headers: authHeaders() })) })} type="button">Save Settings</button>}
            </section>
          )}

          {false && (
            <section className={card}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">System Notifications</h2>
                  <p className="mt-1 text-sm text-slate-500">Live system events from the centralized notification service. This view refreshes automatically every few seconds.</p>
                </div>
                <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{adminNotifications.length} updates</div>
              </div>
              <CategoryFilter title="Notification Groups" options={notificationCategoryOptions} value={notificationCategory} onChange={setNotificationCategory} />
              <div className="space-y-3">
                {filteredAdminNotifications.map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span>{item.userRole || "system"}</span>
                          <span>•</span>
                          <span>{item.type}</span>
                          {item.metadata?.module ? <><span>•</span><span>{item.metadata.module}</span></> : null}
                          {item.referenceNo ? <><span>•</span><span>{item.referenceNo}</span></> : null}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {filteredAdminNotifications.length === 0 ? <p className="text-sm text-slate-500">No notifications in this group.</p> : null}
              </div>
            </section>
          )}

          {activePanel === "audit" && (
            <section className={card}>
              <h2 className="mb-4 text-lg font-semibold">My Activity</h2>
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">My activity content is disabled for now.</div>
            </section>
          )}
        </main>
      </div>

      {selectedUser && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-5xl`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Resident Details</h3>
              <button onClick={() => setSelectedUser(null)} type="button"><X size={18} /></button>
            </div>
            <div className="grid gap-4 lg:grid-cols-[260px,1fr]">
              <div className={sectionCard}>
                <img src={selectedUser.validIdImage || selectedUser.avatarImage || "https://placehold.co/300x200/e2e8f0/475569?text=No+Image"} alt="Resident ID" className="w-full rounded-lg border border-slate-200 object-cover" />
                <button
                  className={`${btnSecondary} mt-2 w-full`}
                  onClick={() => {
                    const imageUrl = selectedUser.validIdImage || selectedUser.avatarImage;
                    if (imageUrl) window.open(imageUrl, "_blank", "noopener,noreferrer");
                  }}
                  type="button"
                >
                  View Uploaded ID
                </button>
                {canReviewUsers && selectedUser.status !== "active" ? (
                  <button
                    className={`${btnPrimary} mt-2 w-full`}
                    onClick={() => setReviewUserPrompt(selectedUser)}
                    type="button"
                  >
                    Review Details
                  </button>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2"><Badge value={selectedUser.role} /><Badge value={selectedUser.status} /><Badge value={selectedUser.validIdStatus || "pending"} /></div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className={sectionCard}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Personal Information</p>
                    <div className="space-y-1 text-slate-700">
                      <p><span className="font-semibold">Username:</span> {selectedUser.username}</p>
                      <p><span className="font-semibold">Full Name:</span> {[selectedUser.firstName, selectedUser.middleName, selectedUser.lastName].filter(Boolean).join(" ") || "N/A"}</p>
                      <p><span className="font-semibold">Gender:</span> {selectedUser.gender || "N/A"}</p>
                      <p><span className="font-semibold">Civil Status:</span> {selectedUser.civilStatus || "N/A"}</p>
                    </div>
                  </div>
                  <div className={sectionCard}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Contact Details</p>
                    <div className="space-y-1 text-slate-700">
                      <p><span className="font-semibold">Email:</span> {selectedUser.email}</p>
                      <p><span className="font-semibold">Phone:</span> {selectedUser.contactNumber || "N/A"}</p>
                      <p><span className="font-semibold">Preferred Updates:</span> Email only</p>
                    </div>
                  </div>
                  <div className={`${sectionCard} md:col-span-2`}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Address</p>
                    <div className="space-y-1 text-slate-700">
                      <p><span className="font-semibold">Full Address:</span> {selectedUser.address || "N/A"}</p>
                      {selectedUser.addressDetails && (
                        <p><span className="font-semibold">Breakdown:</span> {`Blk ${selectedUser.addressDetails.blk || "-"}, Lot ${selectedUser.addressDetails.lot || "-"}, ${selectedUser.addressDetails.street || "-"}, ${selectedUser.addressDetails.subdivision || "-"}, ${selectedUser.addressDetails.barangay || "-"}, ${selectedUser.addressDetails.city || "-"}, ${selectedUser.addressDetails.province || "-"}, ${selectedUser.addressDetails.zipCode || "-"}`}</p>
                      )}
                    </div>
                  </div>
                  <div className={`${sectionCard} md:col-span-2`}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Linked Children</p>
                    {selectedUser.children && selectedUser.children.length > 0 ? (
                      <div className="space-y-3">
                        {selectedUser.children.map((child, index) => (
                          <div key={index} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Linked Child</p>
                              <p className="mt-1 text-base font-semibold text-slate-900 break-words">{child.fullName || "N/A"}</p>
                              <p className="mt-1 text-xs text-slate-500">Open details to view email, birth date, relationship, notes, and actions.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge value={child.status || "pending"} />
                              <button
                                className={btnSecondary}
                                onClick={() => setChildDetailModal({ parent: selectedUser, child })}
                                type="button"
                              >
                                <FileText size={14} className="mr-1.5" />
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No linked children.</p>
                    )}
                  </div>
                </div>
                {canReviewUsers && (
                  <div className={sectionCard}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Account Control</p>
                      <div className={`rounded-full px-3 py-1 text-[11px] font-semibold ${selectedUser.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {selectedUser.status === "active" ? "Approved account" : "Pending review"}
                      </div>
                    </div>
                    {selectedUser.status === "active" ? (
                      <>
                        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs leading-5 text-emerald-900">
                          This resident is already approved. Open the account control modal to change role, return to pending review, suspend, or delete the account.
                        </div>
                        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1 text-sm text-slate-700">
                            <p><span className="font-semibold">Current role:</span> {selectedUser.role}</p>
                            <p><span className="font-semibold">Current status:</span> {selectedUser.status}</p>
                          </div>
                          <button
                            className={btnPrimary}
                            onClick={() => setAccountControlModal({ ...selectedUser })}
                            type="button"
                          >
                            <UserCog size={14} className="mr-1.5" />
                            Modify Account
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs leading-5 text-amber-900 md:flex-row md:items-center md:justify-between">
                        <p>
                          This resident is not approved yet. Use <span className="font-semibold">Review Details</span> to approve or reject the registration first. Account controls only appear after the account becomes approved.
                        </p>
                        <button
                          className={`${btnPrimary} shrink-0`}
                          onClick={() => setReviewUserPrompt(selectedUser)}
                          type="button"
                        >
                          Review Details
                        </button>
                      </div>
                    )}
                    {selectedUser.statusReason ? (
                      <p className="mt-3 text-xs text-slate-500">Latest review note: {selectedUser.statusReason}</p>
                    ) : null}
                  </div>
                )}
                {canManage && selectedUser.role === "admin" && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Admin Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        <button className={btnSecondary} onClick={() => setSelectedAdminPermissionsAll(true)} type="button">Enable All</button>
                        <button className={btnSecondary} onClick={() => setSelectedAdminPermissionsAll(false)} type="button">Deselect All</button>
                      </div>
                    </div>
                    {(["officials", "announcements", "reports", "serviceRequests", "messages", "subscribers"] as Array<keyof AdminPermissions>).map((moduleKey) => (
                      <div key={moduleKey} className="mb-2 rounded border p-2">
                        <p className="mb-1 text-xs font-semibold capitalize text-slate-700">{moduleKey}</p>
                        <div className="grid grid-cols-5 gap-2 text-[11px]">
                          {(["view", "add", "edit", "archive", "delete"] as Array<keyof PermissionFlags>).map((actionKey) => (
                            <label key={actionKey} className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={normalizeAdminPermissions(selectedUser.adminPermissions)[moduleKey][actionKey]}
                                onChange={(e) => setSelectedUser((p) => {
                                  if (!p) return p;
                                  const next = normalizeAdminPermissions(p.adminPermissions);
                                  next[moduleKey][actionKey] = e.target.checked;
                                  return { ...p, adminPermissions: next };
                                })}
                              />
                              <span>{actionKey}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      className={`${btnPrimary} mt-2`}
                      onClick={() => setPendingAction({
                        title: "Save Admin Permissions",
                        message: `Apply updated permissions for ${selectedUser.username}?`,
                        confirmLabel: "Save",
                        run: () => runActionWithFeedback("Admin permissions updated", () => api.patch(`/api/admin/users/${selectedUser._id}/permissions`, { adminPermissions: normalizeAdminPermissions(selectedUser.adminPermissions) }, { headers: authHeaders() })),
                      })}
                      type="button"
                    >
                      Save Permissions
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {addOfficialOpen && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-3xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Add Official</h3><button onClick={() => setAddOfficialOpen(false)} type="button"><X size={18} /></button></div>
            <div className="grid gap-3 lg:grid-cols-2 [&_input]:w-full [&_select]:w-full [&_textarea]:w-full">
              <LabeledField label="Official Name">
                <input className={inputBase} placeholder="Full name" value={newOfficial.name} onChange={(e) => setNewOfficial((p) => ({ ...p, name: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Position">
                <input className={inputBase} placeholder="Position" value={newOfficial.role} onChange={(e) => setNewOfficial((p) => ({ ...p, role: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Level">
                <select className={inputBase} value={newOfficial.level} onChange={(e) => setNewOfficial((p) => ({ ...p, level: e.target.value }))}><option value="barangay">Barangay</option><option value="city">City</option></select>
              </LabeledField>
              <LabeledField label="Rank Order">
                <input className={inputBase} type="number" placeholder="Rank order" value={newOfficial.rankOrder} onChange={(e) => setNewOfficial((p) => ({ ...p, rankOrder: Number(e.target.value) || 100 }))} />
              </LabeledField>
              <LabeledField label="Committee" className="lg:col-span-2">
                <input className={inputBase} placeholder="Committee" value={newOfficial.committee} onChange={(e) => setNewOfficial((p) => ({ ...p, committee: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Description" className="lg:col-span-2">
                <textarea className={inputBase} rows={3} placeholder="Description" value={newOfficial.description} onChange={(e) => setNewOfficial((p) => ({ ...p, description: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Image URL (Optional)" className="lg:col-span-2">
                <input className={inputBase} placeholder="Image URL (optional)" value={newOfficial.image} onChange={(e) => setNewOfficial((p) => ({ ...p, image: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Upload Image" className="lg:col-span-2">
                <input id="new-official-image" className="hidden" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) fileToBase64(file, (value) => setNewOfficial((p) => ({ ...p, image: value }))); }} />
                <label htmlFor="new-official-image" className={btnSecondary}>Choose Official Image</label>
              </LabeledField>
              {newOfficial.image && <img src={newOfficial.image} alt="Official preview" className="h-20 w-20 rounded border object-cover lg:col-span-2" />}
            </div>
            <button className={`${btnPrimary} mt-4 w-full text-sm`} onClick={() => setPendingAction({ title: "Add Official", message: "Create this official?", confirmLabel: "Add", run: () => runActionWithFeedback("Official added", () => api.post("/api/officials", newOfficial, { headers: authHeaders() }).then(() => { setAddOfficialOpen(false); setNewOfficial({ name: "", role: "", level: "barangay", rankOrder: 10, committee: "", description: "", image: "" }); })) })} type="button">Add Official</button>
          </div>
        </div>
      )}

      {addAnnouncementOpen && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-3xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Create Announcement</h3><button onClick={() => setAddAnnouncementOpen(false)} type="button"><X size={18} /></button></div>
            <div className="grid gap-3 lg:grid-cols-2 [&_input]:w-full [&_select]:w-full [&_textarea]:w-full">
              <LabeledField label="Title">
                <input className={inputBase} placeholder="Title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement((p) => ({ ...p, title: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Category">
                <input className={inputBase} placeholder="Category" value={newAnnouncement.category} onChange={(e) => setNewAnnouncement((p) => ({ ...p, category: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Module" className="lg:col-span-2">
                <select className={inputBase} value={newAnnouncement.module} onChange={(e) => setNewAnnouncement((p) => ({ ...p, module: e.target.value }))}><option value="barangay-updates">Barangay Updates</option><option value="emergency-hotlines">Emergency Hotlines</option><option value="phivolcs-alerts">PHIVOLCS Alerts</option><option value="fact-check">Fact Check</option><option value="all-news-updates">All News & Updates</option></select>
              </LabeledField>
              <LabeledField label="Content" className="lg:col-span-2">
                <textarea className={inputBase} rows={3} placeholder="Content" value={newAnnouncement.content} onChange={(e) => setNewAnnouncement((p) => ({ ...p, content: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Source">
                <input className={inputBase} placeholder="Source" value={newAnnouncement.source} onChange={(e) => setNewAnnouncement((p) => ({ ...p, source: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Image URL (Optional)">
                <input className={inputBase} placeholder="Image URL (optional)" value={newAnnouncement.image} onChange={(e) => setNewAnnouncement((p) => ({ ...p, image: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Upload Image" className="lg:col-span-2">
                <input id="new-announcement-image" className="hidden" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) fileToBase64(file, (value) => setNewAnnouncement((p) => ({ ...p, image: value }))); }} />
                <label htmlFor="new-announcement-image" className={btnSecondary}>Choose Announcement Image</label>
              </LabeledField>
              {newAnnouncement.image && <img src={newAnnouncement.image} alt="Announcement preview" className="h-20 w-28 rounded border object-cover lg:col-span-2" />}
            </div>
            <button className={`${btnPrimary} mt-4 w-full text-sm`} onClick={() => setPendingAction({ title: "Create Announcement", message: "Publish this announcement?", confirmLabel: "Publish", run: () => runActionWithFeedback("Announcement created", () => api.post("/api/announcements", newAnnouncement, { headers: authHeaders() }).then(() => { setAddAnnouncementOpen(false); setNewAnnouncement({ title: "", content: "", module: "barangay-updates", category: "Advisory", source: "Barangay Office", image: "" }); })) })} type="button">Publish Announcement</button>
          </div>
        </div>
      )}

      {reportManageModal && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Manage Report</h3><button onClick={() => setReportManageModal(null)} type="button"><X size={18} /></button></div>
            <p className="text-sm font-semibold">{reportManageModal.referenceNo}</p>
            <p className="mt-1 text-sm text-slate-600">{reportManageModal.category}: {reportManageModal.description}</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select className={`${inputBase} mt-1`} value={reportManageModal.status} onChange={(e) => setReportManageModal((p) => p ? { ...p, status: e.target.value } : p)}>
              {role === "admin" ? (
                <>
                  <option value={reportManageModal.status}>{reportManageModal.status}</option>
                  <option value="in-review">in-review</option>
                </>
              ) : (
                <>
                  <option value="pending">pending</option>
                  <option value="in-review">in-review</option>
                  <option value="resolved">resolved</option>
                  <option value="rejected">rejected</option>
                </>
              )}
            </select>
            <button className={`${btnPrimary} mt-4 w-full text-sm`} onClick={() => setPendingAction({ title: "Update Report", message: "Save report status update?", confirmLabel: "Save", run: () => runActionWithFeedback("Report updated", () => api.patch(`/api/reports/${reportManageModal._id}/status`, { status: reportManageModal.status, adminChecked: true }, { headers: authHeaders() }).then(() => setReportManageModal(null))) })} type="button">Save Status</button>
          </div>
        </div>
      )}

      {serviceManageModal && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Manage Service Request</h3><button onClick={() => setServiceManageModal(null)} type="button"><X size={18} /></button></div>
            <p className="text-sm font-semibold">{serviceManageModal.referenceNo}</p>
            <p className="mt-1 text-sm text-slate-600">{serviceManageModal.fullName} | {serviceManageModal.serviceType}</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select className={`${inputBase} mt-1`} value={serviceManageModal.status} onChange={(e) => setServiceManageModal((p) => p ? { ...p, status: e.target.value } : p)}>
              {role === "admin" ? (
                <>
                  <option value={serviceManageModal.status}>{serviceManageModal.status}</option>
                  <option value="in-review">in-review</option>
                </>
              ) : (
                <>
                  <option value="pending">pending</option>
                  <option value="in-review">in-review</option>
                  <option value="approved">approved</option>
                  <option value="completed">completed</option>
                  <option value="rejected">rejected</option>
                </>
              )}
            </select>
            <button className={`${btnPrimary} mt-4 w-full text-sm`} onClick={() => setPendingAction({ title: "Update Request", message: "Save service request status?", confirmLabel: "Save", run: () => runActionWithFeedback("Service request updated", () => api.patch(`/api/services/requests/${serviceManageModal._id}/status`, { status: serviceManageModal.status }, { headers: authHeaders() }).then(() => setServiceManageModal(null))) })} type="button">Save Status</button>
          </div>
        </div>
      )}

      {messageManageModal && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Manage Message</h3><button onClick={() => setMessageManageModal(null)} type="button"><X size={18} /></button></div>
            <p className="text-sm font-semibold">{messageManageModal.referenceNo}</p>
            <p className="mt-1 text-sm text-slate-600">{messageManageModal.name} | {messageManageModal.department}</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select className={`${inputBase} mt-1`} value={messageManageModal.status} onChange={(e) => setMessageManageModal((p) => p ? { ...p, status: e.target.value } : p)}>
              <option value="new">new</option>
              <option value="read">read</option>
              <option value="closed">closed</option>
            </select>
            <button className={`${btnPrimary} mt-4 w-full text-sm`} onClick={() => setPendingAction({ title: "Update Message", message: "Save message status?", confirmLabel: "Save", run: () => runActionWithFeedback("Message updated", () => api.patch(`/api/contact/messages/${messageManageModal._id}/status`, { status: messageManageModal.status }, { headers: authHeaders() }).then(() => setMessageManageModal(null))) })} type="button">Save Status</button>
          </div>
        </div>
      )}

      {subscriptionManageModal && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Manage Subscriber</h3><button onClick={() => setSubscriptionManageModal(null)} type="button"><X size={18} /></button></div>
            <p className="text-sm font-semibold">{subscriptionManageModal.email}</p>
            <p className="mt-1 text-xs text-slate-500">Source: {subscriptionManageModal.source || "homepage"}</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select className={`${inputBase} mt-1`} value={subscriptionManageModal.status} onChange={(e) => setSubscriptionManageModal((p) => p ? { ...p, status: e.target.value as "active" | "unsubscribed" } : p)}>
              <option value="active">active</option>
              <option value="unsubscribed">unsubscribed</option>
            </select>
            <button className={`${btnPrimary} mt-4 w-full text-sm`} onClick={() => setPendingAction({ title: "Update Subscriber", message: "Save subscriber status?", confirmLabel: "Save", run: () => runActionWithFeedback("Subscriber updated", () => api.patch(`/api/subscriptions/${subscriptionManageModal._id}/status`, { status: subscriptionManageModal.status }, { headers: authHeaders() }).then(() => setSubscriptionManageModal(null))) })} type="button">Save Status</button>
          </div>
        </div>
      )}

      {manageCentersOpen && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-4xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Evacuation Centers</h3><button onClick={() => setManageCentersOpen(false)} type="button"><X size={18} /></button></div>
            <div className="mb-3 flex justify-end">
              <button className={btnPrimary} onClick={() => { setEditingCenterId(null); setNewCenter({ name: "", address: "", lat: "", lng: "", hazardsCovered: "typhoon,flood,earthquake,fire", capacity: "0", notes: "", active: true }); setEvacuationCenterModalOpen(true); }} type="button">Add Center</button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {evacuationCenters.map((center) => (
                <div key={center._id} className="rounded border p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{center.name}</p>
                      <p className="text-xs text-slate-600">{center.address}</p>
                      <p className="text-xs text-slate-500">({center.location?.lat}, {center.location?.lng}) | Capacity: {center.capacity || 0}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className={btnSecondary} onClick={() => { setEditingCenterId(center._id); setNewCenter({ name: center.name || "", address: center.address || "", lat: String(center.location?.lat ?? ""), lng: String(center.location?.lng ?? ""), hazardsCovered: (center.hazardsCovered || []).join(","), capacity: String(center.capacity || 0), notes: center.notes || "", active: center.active !== false }); setEvacuationCenterModalOpen(true); }} type="button">Edit</button>
                      <button className={btnSecondary} onClick={() => setPendingAction({ title: center.active ? "Deactivate Center" : "Activate Center", message: `${center.active ? "Deactivate" : "Activate"} ${center.name}?`, confirmLabel: "Confirm", run: () => runActionWithFeedback("Center status updated", () => api.put(`/api/services/evacuation-centers/${center._id}`, { ...center, active: !center.active }, { headers: authHeaders() })) })} type="button">{center.active ? "Deactivate" : "Activate"}</button>
                      <button className={btnDanger} onClick={() => setPendingAction({ title: "Delete Center", message: `Delete ${center.name}?`, confirmLabel: "Delete", run: () => runActionWithFeedback("Center deleted", () => api.delete(`/api/services/evacuation-centers/${center._id}`, { headers: authHeaders() })) })} type="button">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {evacuationCenters.length === 0 && <div className="rounded border border-dashed p-4 text-center text-sm text-slate-500">No evacuation centers found.</div>}
            </div>
          </div>
        </div>
      )}

      {manageHotlinesOpen && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-4xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Emergency Hotlines</h3><button onClick={() => setManageHotlinesOpen(false)} type="button"><X size={18} /></button></div>
            <div className="mb-4 rounded-xl border p-3">
              <h4 className="mb-2 text-sm font-semibold">{editingHotlineId ? "Edit Hotline" : "Add Hotline"}</h4>
              <div className="grid gap-2 md:grid-cols-2">
                <LabeledField label="Hotline Name">
                  <input className={inputBase} placeholder="Hotline name" value={newHotline.name} onChange={(e) => setNewHotline((p) => ({ ...p, name: e.target.value }))} />
                </LabeledField>
                <LabeledField label="Type">
                  <input className={inputBase} placeholder="Type (e.g. FIRE)" value={newHotline.type} onChange={(e) => setNewHotline((p) => ({ ...p, type: e.target.value }))} />
                </LabeledField>
                <LabeledField label="Phone Number">
                  <input className={inputBase} placeholder="Number" value={newHotline.number} onChange={(e) => setNewHotline((p) => ({ ...p, number: e.target.value }))} />
                </LabeledField>
                <LabeledField label="Description">
                  <input className={inputBase} placeholder="Description" value={newHotline.desc} onChange={(e) => setNewHotline((p) => ({ ...p, desc: e.target.value }))} />
                </LabeledField>
                <LabeledField label="When To Call (Comma Separated)" className="md:col-span-2">
                  <input className={inputBase} placeholder="When to call (comma separated)" value={newHotline.when} onChange={(e) => setNewHotline((p) => ({ ...p, when: e.target.value }))} />
                </LabeledField>
                <LabeledField label="Prepare Before Calling (Comma Separated)" className="md:col-span-2">
                  <input className={inputBase} placeholder="Prepare before calling (comma separated)" value={newHotline.prepare} onChange={(e) => setNewHotline((p) => ({ ...p, prepare: e.target.value }))} />
                </LabeledField>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className={btnPrimary} onClick={() => setPendingAction({ title: editingHotlineId ? "Update Hotline" : "Add Hotline", message: editingHotlineId ? "Save hotline changes?" : "Create this hotline?", confirmLabel: editingHotlineId ? "Save" : "Add", run: () => runActionWithFeedback(editingHotlineId ? "Hotline updated" : "Hotline added", () => (editingHotlineId ? api.put(`/api/services/emergency-hotlines/${editingHotlineId}`, newHotline, { headers: authHeaders() }) : api.post("/api/services/emergency-hotlines", newHotline, { headers: authHeaders() })).then(() => { setEditingHotlineId(null); setNewHotline({ name: "", type: "", number: "", desc: "", when: "", prepare: "", active: true }); })) })} type="button">{editingHotlineId ? "Save Hotline" : "Add Hotline"}</button>
                {editingHotlineId && <button className={btnSecondary} onClick={() => { setEditingHotlineId(null); setNewHotline({ name: "", type: "", number: "", desc: "", when: "", prepare: "", active: true }); }} type="button">Cancel Edit</button>}
              </div>
            </div>
            <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {emergencyHotlines.map((hotline) => (
                <div key={hotline._id} className="rounded border p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{hotline.name} <span className="text-xs text-slate-500">({hotline.type})</span></p>
                      <p className="text-xs text-slate-600">{hotline.number}</p>
                      <p className="text-xs text-slate-500">{hotline.desc || "-"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className={btnSecondary} onClick={() => { setEditingHotlineId(hotline._id); setNewHotline({ name: hotline.name || "", type: hotline.type || "", number: hotline.number || "", desc: hotline.desc || "", when: (hotline.when || []).join(", "), prepare: (hotline.prepare || []).join(", "), active: hotline.active !== false }); }} type="button">Edit</button>
                      <button className={btnSecondary} onClick={() => setPendingAction({ title: hotline.active ? "Deactivate Hotline" : "Activate Hotline", message: `${hotline.active ? "Deactivate" : "Activate"} ${hotline.name}?`, confirmLabel: "Confirm", run: () => runActionWithFeedback("Hotline status updated", () => api.patch(`/api/services/emergency-hotlines/${hotline._id}/archive`, { active: !hotline.active }, { headers: authHeaders() })) })} type="button">{hotline.active ? "Deactivate" : "Activate"}</button>
                      <button className={btnDanger} onClick={() => setPendingAction({ title: "Delete Hotline", message: `Delete ${hotline.name}?`, confirmLabel: "Delete", run: () => runActionWithFeedback("Hotline deleted", () => api.delete(`/api/services/emergency-hotlines/${hotline._id}`, { headers: authHeaders() })) })} type="button">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {emergencyHotlines.length === 0 && <div className="rounded border border-dashed p-4 text-center text-sm text-slate-500">No hotlines found.</div>}
            </div>
          </div>
        </div>
      )}

      {officialEditModal && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-3xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Edit Official</h3><button onClick={() => setOfficialEditModal(null)} type="button"><X size={18} /></button></div>
            <div className="grid gap-3 lg:grid-cols-2 [&_input]:w-full [&_select]:w-full [&_textarea]:w-full">
              <LabeledField label="Official Name">
                <input className={inputBase} value={officialEditModal.name} onChange={(e) => setOfficialEditModal((p) => p ? { ...p, name: e.target.value } : p)} />
              </LabeledField>
              <LabeledField label="Position">
                <input className={inputBase} value={officialEditModal.role} onChange={(e) => setOfficialEditModal((p) => p ? { ...p, role: e.target.value } : p)} />
              </LabeledField>
              <LabeledField label="Level">
                <select className={inputBase} value={officialEditModal.level} onChange={(e) => setOfficialEditModal((p) => p ? { ...p, level: e.target.value as "city" | "barangay" } : p)}><option value="barangay">Barangay</option><option value="city">City</option></select>
              </LabeledField>
              <LabeledField label="Rank Order">
                <input className={inputBase} type="number" value={officialEditModal.rankOrder} onChange={(e) => setOfficialEditModal((p) => p ? { ...p, rankOrder: Number(e.target.value) || 100 } : p)} />
              </LabeledField>
              <LabeledField label="Committee" className="lg:col-span-2">
                <input className={inputBase} value={officialEditModal.committee || ""} onChange={(e) => setOfficialEditModal((p) => p ? { ...p, committee: e.target.value } : p)} />
              </LabeledField>
              <LabeledField label="Description" className="lg:col-span-2">
                <input className={inputBase} value={officialEditModal.description || ""} onChange={(e) => setOfficialEditModal((p) => p ? { ...p, description: e.target.value } : p)} />
              </LabeledField>
              <LabeledField label="Image URL (Optional)" className="lg:col-span-2">
                <input className={inputBase} value={officialEditModal.image || ""} onChange={(e) => setOfficialEditModal((p) => p ? { ...p, image: e.target.value } : p)} />
              </LabeledField>
              <LabeledField label="Upload Image" className="lg:col-span-2">
                <input id="edit-official-image" className="hidden" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) fileToBase64(file, (value) => setOfficialEditModal((p) => p ? { ...p, image: value } : p)); }} />
                <label htmlFor="edit-official-image" className={btnSecondary}>
                  Choose Official Image
                </label>
              </LabeledField>
              {officialEditModal.image && <img src={officialEditModal.image} alt="Official preview" className="h-20 w-20 rounded border object-cover lg:col-span-2" />}
            </div>
            <button className={`${btnPrimary} mt-4 w-full text-sm`} onClick={() => setPendingAction({ title: "Update Official", message: "Save official changes?", confirmLabel: "Save", run: () => runActionWithFeedback("Official updated", () => api.put(`/api/officials/${officialEditModal._id}`, officialEditModal, { headers: authHeaders() }).then(() => setOfficialEditModal(null))) })} type="button">Save Official</button>
          </div>
        </div>
      )}

      {announcementEditModal && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-3xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Edit Announcement</h3><button onClick={() => setAnnouncementEditModal(null)} type="button"><X size={18} /></button></div>
            <div className="grid gap-3 lg:grid-cols-2 [&_input]:w-full [&_select]:w-full [&_textarea]:w-full">
              <LabeledField label="Title">
                <input className={inputBase} value={announcementEditModal.title} onChange={(e) => setAnnouncementEditModal((p) => p ? { ...p, title: e.target.value } : p)} />
              </LabeledField>
              <LabeledField label="Category">
                <input className={inputBase} value={announcementEditModal.category} onChange={(e) => setAnnouncementEditModal((p) => p ? { ...p, category: e.target.value } : p)} />
              </LabeledField>
              <LabeledField label="Module" className="lg:col-span-2">
                <select className={inputBase} value={announcementEditModal.module} onChange={(e) => setAnnouncementEditModal((p) => p ? { ...p, module: e.target.value } : p)}><option value="barangay-updates">Barangay Updates</option><option value="emergency-hotlines">Emergency Hotlines</option><option value="phivolcs-alerts">PHIVOLCS Alerts</option><option value="fact-check">Fact Check</option><option value="all-news-updates">All News & Updates</option></select>
              </LabeledField>
              <LabeledField label="Content" className="lg:col-span-2">
                <textarea className={inputBase} rows={3} value={announcementEditModal.content || ""} onChange={(e) => setAnnouncementEditModal((p) => p ? { ...p, content: e.target.value } : p)} />
              </LabeledField>
              <LabeledField label="Image URL (Optional)" className="lg:col-span-2">
                <input className={inputBase} value={announcementEditModal.image || ""} onChange={(e) => setAnnouncementEditModal((p) => p ? { ...p, image: e.target.value } : p)} />
              </LabeledField>
              <LabeledField label="Upload Image" className="lg:col-span-2">
                <input id="edit-announcement-image" className="hidden" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) fileToBase64(file, (value) => setAnnouncementEditModal((p) => p ? { ...p, image: value } : p)); }} />
                <label htmlFor="edit-announcement-image" className={btnSecondary}>
                  Choose Announcement Image
                </label>
              </LabeledField>
              {announcementEditModal.image && <img src={announcementEditModal.image} alt="Announcement preview" className="h-20 w-28 rounded border object-cover lg:col-span-2" />}
            </div>
            <button className={`${btnPrimary} mt-4 w-full text-sm`} onClick={() => setPendingAction({ title: "Update Announcement", message: "Save announcement changes?", confirmLabel: "Save", run: () => runActionWithFeedback("Announcement updated", () => api.put(`/api/announcements/${announcementEditModal._id}`, announcementEditModal, { headers: authHeaders() }).then(() => setAnnouncementEditModal(null))) })} type="button">Save Announcement</button>
          </div>
        </div>
      )}

      {evacuationCenterModalOpen && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-3xl`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingCenterId ? "Edit Evacuation Center" : "Add Evacuation Center"}</h3>
              <button onClick={() => setEvacuationCenterModalOpen(false)} type="button"><X size={18} /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 [&_input]:w-full [&_textarea]:w-full">
              <LabeledField label="Center Name" className="sm:col-span-2">
                <input className={inputBase} placeholder="Center name" value={newCenter.name} onChange={(e) => setNewCenter((p) => ({ ...p, name: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Address" className="sm:col-span-2">
                <input className={inputBase} placeholder="Address" value={newCenter.address} onChange={(e) => setNewCenter((p) => ({ ...p, address: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Latitude">
                <input className={inputBase} placeholder="Latitude" value={newCenter.lat} onChange={(e) => setNewCenter((p) => ({ ...p, lat: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Longitude">
                <input className={inputBase} placeholder="Longitude" value={newCenter.lng} onChange={(e) => setNewCenter((p) => ({ ...p, lng: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Hazards Covered (Comma Separated)" className="sm:col-span-2">
                <input className={inputBase} placeholder="typhoon,flood,earthquake,fire" value={newCenter.hazardsCovered} onChange={(e) => setNewCenter((p) => ({ ...p, hazardsCovered: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Capacity">
                <input className={inputBase} placeholder="Capacity" value={newCenter.capacity} onChange={(e) => setNewCenter((p) => ({ ...p, capacity: e.target.value }))} />
              </LabeledField>
              <LabeledField label="Notes">
                <input className={inputBase} placeholder="Notes" value={newCenter.notes} onChange={(e) => setNewCenter((p) => ({ ...p, notes: e.target.value }))} />
              </LabeledField>
            </div>
            <button
              className={`${btnPrimary} mt-4 w-full text-sm`}
              onClick={() => setPendingAction({
                title: editingCenterId ? "Update Center" : "Add Center",
                message: editingCenterId ? "Save this evacuation center?" : "Create this evacuation center?",
                confirmLabel: editingCenterId ? "Save" : "Add",
                run: () =>
                  runActionWithFeedback(editingCenterId ? "Center updated" : "Center added", () =>
                    (editingCenterId
                      ? api.put(`/api/services/evacuation-centers/${editingCenterId}`, { name: newCenter.name, address: newCenter.address, location: { lat: Number(newCenter.lat), lng: Number(newCenter.lng) }, hazardsCovered: String(newCenter.hazardsCovered).split(",").map((x) => x.trim()).filter(Boolean), capacity: Number(newCenter.capacity) || 0, notes: newCenter.notes, active: newCenter.active }, { headers: authHeaders() })
                      : api.post("/api/services/evacuation-centers", { name: newCenter.name, address: newCenter.address, location: { lat: Number(newCenter.lat), lng: Number(newCenter.lng) }, hazardsCovered: String(newCenter.hazardsCovered).split(",").map((x) => x.trim()).filter(Boolean), capacity: Number(newCenter.capacity) || 0, notes: newCenter.notes, active: newCenter.active }, { headers: authHeaders() }))
                      .then(() => {
                        setEditingCenterId(null);
                        setEvacuationCenterModalOpen(false);
                        setNewCenter({ name: "", address: "", lat: "", lng: "", hazardsCovered: "typhoon,flood,earthquake,fire", capacity: "0", notes: "", active: true });
                      }),
                  ),
              })}
              type="button"
            >
              {editingCenterId ? "Save Center" : "Add Center"}
            </button>
          </div>
        </div>
      )}

      {homeEditOpen && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-5xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Edit Home Content</h3><button onClick={() => setHomeEditOpen(false)} type="button"><X size={18} /></button></div>
            <div className="mb-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Navbar & Hero</h4>
              <LabeledField label="Navbar Brand Text"><input className={inputBase} placeholder="Navbar brand text" value={siteContent.navbarBrandText} onChange={(e) => setSiteContent((p) => ({ ...p, navbarBrandText: e.target.value }))} /></LabeledField>
              <LabeledField label="Hero Eyebrow"><input className={inputBase} placeholder="Hero eyebrow" value={siteContent.heroEyebrow} onChange={(e) => setSiteContent((p) => ({ ...p, heroEyebrow: e.target.value }))} /></LabeledField>
              <div className="grid gap-2 md:grid-cols-2">
                <LabeledField label="Hero Title Line 1"><input className={inputBase} placeholder="Hero title line 1" value={siteContent.heroTitleLine1} onChange={(e) => setSiteContent((p) => ({ ...p, heroTitleLine1: e.target.value }))} /></LabeledField>
                <LabeledField label="Hero Title Line 2"><input className={inputBase} placeholder="Hero title line 2" value={siteContent.heroTitleLine2} onChange={(e) => setSiteContent((p) => ({ ...p, heroTitleLine2: e.target.value }))} /></LabeledField>
              </div>
              <LabeledField label="Hero Subtitle"><textarea className={inputBase} rows={2} placeholder="Hero subtitle" value={siteContent.heroSubtitle} onChange={(e) => setSiteContent((p) => ({ ...p, heroSubtitle: e.target.value }))} /></LabeledField>
              <div className="grid gap-2 md:grid-cols-2">
                <LabeledField label="Hero Primary CTA"><input className={inputBase} placeholder="Hero primary CTA" value={siteContent.heroPrimaryCta} onChange={(e) => setSiteContent((p) => ({ ...p, heroPrimaryCta: e.target.value }))} /></LabeledField>
                <LabeledField label="Hero Secondary CTA"><input className={inputBase} placeholder="Hero secondary CTA" value={siteContent.heroSecondaryCta} onChange={(e) => setSiteContent((p) => ({ ...p, heroSecondaryCta: e.target.value }))} /></LabeledField>
              </div>
            </div>
            <div className="mb-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Community Snapshot Cards</h4>
              <div className="grid gap-2 md:grid-cols-2">
              {siteContent.communityCards.map((c, idx) => (
                <div key={idx} className="rounded border p-3 text-xs">
                  <LabeledField label="Card Value"><input className={`${inputBase} px-2 py-1`} placeholder="Value" value={c.value} onChange={(e) => setSiteContent((p) => ({ ...p, communityCards: p.communityCards.map((x, i) => i === idx ? { ...x, value: e.target.value } : x) }))} /></LabeledField>
                  <LabeledField label="Card Label"><input className={`${inputBase} px-2 py-1`} placeholder="Label" value={c.label} onChange={(e) => setSiteContent((p) => ({ ...p, communityCards: p.communityCards.map((x, i) => i === idx ? { ...x, label: e.target.value } : x) }))} /></LabeledField>
                  <LabeledField label="Card Sublabel"><input className={`${inputBase} px-2 py-1`} placeholder="Sublabel" value={c.sublabel} onChange={(e) => setSiteContent((p) => ({ ...p, communityCards: p.communityCards.map((x, i) => i === idx ? { ...x, sublabel: e.target.value } : x) }))} /></LabeledField>
                </div>
              ))}
              </div>
            </div>
            <div className="mb-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Governance Section</h4>
              <LabeledField label="Governance Title"><input className={inputBase} placeholder="Governance title" value={siteContent.governanceTitle} onChange={(e) => setSiteContent((p) => ({ ...p, governanceTitle: e.target.value }))} /></LabeledField>
              <LabeledField label="Governance Subtitle"><input className={inputBase} placeholder="Governance subtitle" value={siteContent.governanceSubtitle} onChange={(e) => setSiteContent((p) => ({ ...p, governanceSubtitle: e.target.value }))} /></LabeledField>
              <div className="grid gap-2 md:grid-cols-3">
                {siteContent.governanceItems.map((item, idx) => (
                  <div key={idx} className="rounded border p-3 text-xs">
                    <LabeledField label="Item Title"><input className={`${inputBase} px-2 py-1`} placeholder="Item title" value={item.title} onChange={(e) => setSiteContent((p) => ({ ...p, governanceItems: p.governanceItems.map((x, i) => i === idx ? { ...x, title: e.target.value } : x) }))} /></LabeledField>
                    <LabeledField label="Item Description"><textarea className={`${inputBase} px-2 py-1`} rows={3} placeholder="Item description" value={item.description} onChange={(e) => setSiteContent((p) => ({ ...p, governanceItems: p.governanceItems.map((x, i) => i === idx ? { ...x, description: e.target.value } : x) }))} /></LabeledField>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Pages & Footer</h4>
              <LabeledField label="Services Hero Title"><input className={inputBase} placeholder="Services hero title" value={siteContent.servicesHeroTitle} onChange={(e) => setSiteContent((p) => ({ ...p, servicesHeroTitle: e.target.value }))} /></LabeledField>
              <LabeledField label="Services Hero Subtitle"><input className={inputBase} placeholder="Services hero subtitle" value={siteContent.servicesHeroSubtitle} onChange={(e) => setSiteContent((p) => ({ ...p, servicesHeroSubtitle: e.target.value }))} /></LabeledField>
              <LabeledField label="Emergency Hotlines Title"><input className={inputBase} placeholder="Emergency hotlines title" value={siteContent.emergencyHotlinesTitle} onChange={(e) => setSiteContent((p) => ({ ...p, emergencyHotlinesTitle: e.target.value }))} /></LabeledField>
              <LabeledField label="Emergency Hotlines Subtitle"><input className={inputBase} placeholder="Emergency hotlines subtitle" value={siteContent.emergencyHotlinesSubtitle} onChange={(e) => setSiteContent((p) => ({ ...p, emergencyHotlinesSubtitle: e.target.value }))} /></LabeledField>
              <LabeledField label="Officials Page Title"><input className={inputBase} placeholder="Officials page title" value={siteContent.officialsPageTitle} onChange={(e) => setSiteContent((p) => ({ ...p, officialsPageTitle: e.target.value }))} /></LabeledField>
              <LabeledField label="Officials Page Subtitle"><textarea className={inputBase} rows={2} placeholder="Officials page subtitle" value={siteContent.officialsPageSubtitle} onChange={(e) => setSiteContent((p) => ({ ...p, officialsPageSubtitle: e.target.value }))} /></LabeledField>
              <LabeledField label="Footer Brand Text"><input className={inputBase} placeholder="Footer brand text" value={siteContent.footerBrandText} onChange={(e) => setSiteContent((p) => ({ ...p, footerBrandText: e.target.value }))} /></LabeledField>
              <LabeledField label="Footer Description"><textarea className={inputBase} rows={2} placeholder="Footer description" value={siteContent.footerDescription} onChange={(e) => setSiteContent((p) => ({ ...p, footerDescription: e.target.value }))} /></LabeledField>
              <LabeledField label="Footer Address"><input className={inputBase} placeholder="Footer address" value={siteContent.footerAddress} onChange={(e) => setSiteContent((p) => ({ ...p, footerAddress: e.target.value }))} /></LabeledField>
              <div className="grid gap-2 md:grid-cols-2">
                <LabeledField label="Footer Phone"><input className={inputBase} placeholder="Footer phone" value={siteContent.footerPhone} onChange={(e) => setSiteContent((p) => ({ ...p, footerPhone: e.target.value }))} /></LabeledField>
                <LabeledField label="Footer Email"><input className={inputBase} placeholder="Footer email" value={siteContent.footerEmail} onChange={(e) => setSiteContent((p) => ({ ...p, footerEmail: e.target.value }))} /></LabeledField>
              </div>
            </div>
            <button
              className={`${btnPrimary} mt-4 w-full text-sm`}
              onClick={() => setPendingAction({
                title: "Save Home Content",
                message: "Apply homepage and shared content updates?",
                confirmLabel: "Save",
                run: () => runActionWithFeedback("Home content updated", () => api.patch("/api/content/site", {
                  navbarBrandText: siteContent.navbarBrandText,
                  heroEyebrow: siteContent.heroEyebrow,
                  heroTitleLine1: siteContent.heroTitleLine1,
                  heroTitleLine2: siteContent.heroTitleLine2,
                  heroSubtitle: siteContent.heroSubtitle,
                  heroPrimaryCta: siteContent.heroPrimaryCta,
                  heroSecondaryCta: siteContent.heroSecondaryCta,
                  communityCards: siteContent.communityCards,
                  governanceTitle: siteContent.governanceTitle,
                  governanceSubtitle: siteContent.governanceSubtitle,
                  governanceItems: siteContent.governanceItems,
                  servicesHeroTitle: siteContent.servicesHeroTitle,
                  servicesHeroSubtitle: siteContent.servicesHeroSubtitle,
                  emergencyHotlinesTitle: siteContent.emergencyHotlinesTitle,
                  emergencyHotlinesSubtitle: siteContent.emergencyHotlinesSubtitle,
                  officialsPageTitle: siteContent.officialsPageTitle,
                  officialsPageSubtitle: siteContent.officialsPageSubtitle,
                  footerBrandText: siteContent.footerBrandText,
                  footerDescription: siteContent.footerDescription,
                  footerAddress: siteContent.footerAddress,
                  footerPhone: siteContent.footerPhone,
                  footerEmail: siteContent.footerEmail,
                }, { headers: authHeaders() }).then(() => setHomeEditOpen(false))),
              })}
              type="button"
            >
              Save Home Content
            </button>
          </div>
        </div>
      )}

      {aboutEditOpen && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-4xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Edit About Content</h3><button onClick={() => setAboutEditOpen(false)} type="button"><X size={18} /></button></div>
            <div className="space-y-2">
              <LabeledField label="About Hero Title"><input className={inputBase} placeholder="About hero title" value={siteContent.aboutHeroTitle} onChange={(e) => setSiteContent((p) => ({ ...p, aboutHeroTitle: e.target.value }))} /></LabeledField>
              <LabeledField label="About Hero Subtitle"><input className={inputBase} placeholder="About hero subtitle" value={siteContent.aboutHeroSubtitle} onChange={(e) => setSiteContent((p) => ({ ...p, aboutHeroSubtitle: e.target.value }))} /></LabeledField>
              <label className="text-xs font-semibold text-slate-600">Snapshot lines (format: Label|Value)</label>
              <textarea className={inputBase} rows={5} value={aboutSnapshotDraft} onChange={(e) => setAboutSnapshotDraft(e.target.value)} />
              <label className="text-xs font-semibold text-slate-600">Population trend lines (format: Year|Count)</label>
              <textarea className={inputBase} rows={4} value={aboutTrendDraft} onChange={(e) => setAboutTrendDraft(e.target.value)} />
              <label className="text-xs font-semibold text-slate-600">Core governance lines (one line per bullet)</label>
              <textarea className={inputBase} rows={4} value={aboutGovDraft} onChange={(e) => setAboutGovDraft(e.target.value)} />
              <LabeledField label="History Text"><textarea className={inputBase} rows={3} placeholder="History text" value={siteContent.aboutHistoryText} onChange={(e) => setSiteContent((p) => ({ ...p, aboutHistoryText: e.target.value }))} /></LabeledField>
              <LabeledField label="Governance Text"><textarea className={inputBase} rows={3} placeholder="Governance text" value={siteContent.aboutGovernanceText} onChange={(e) => setSiteContent((p) => ({ ...p, aboutGovernanceText: e.target.value }))} /></LabeledField>
            </div>
            <button className={`${btnPrimary} mt-4 w-full text-sm`} onClick={() => setPendingAction({ title: "Save About Content", message: "Apply about page updates?", confirmLabel: "Save", run: () => runActionWithFeedback("About content updated", () => api.patch("/api/content/site", { aboutHeroTitle: siteContent.aboutHeroTitle, aboutHeroSubtitle: siteContent.aboutHeroSubtitle, aboutSnapshotItems: linesToPairs(aboutSnapshotDraft), aboutPopulationTrend: linesToPairs(aboutTrendDraft), aboutCoreGovernance: aboutGovDraft.split('\n').map((x) => x.trim()).filter(Boolean), aboutHistoryText: siteContent.aboutHistoryText, aboutGovernanceText: siteContent.aboutGovernanceText }, { headers: authHeaders() }).then(() => setAboutEditOpen(false))) })} type="button">Save About Content</button>
          </div>
        </div>
      )}

      {contactEditOpen && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-5xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Edit Contact Content</h3><button onClick={() => setContactEditOpen(false)} type="button"><X size={18} /></button></div>
            <div className="space-y-2">
              <LabeledField label="Office Hours"><input className={inputBase} placeholder="Office hours" value={siteContent.contactOfficeHours || ""} onChange={(e) => setSiteContent((p: any) => ({ ...p, contactOfficeHours: e.target.value }))} /></LabeledField>
              <LabeledField label="Location Text"><input className={inputBase} placeholder="Location text" value={siteContent.contactLocationText || ""} onChange={(e) => setSiteContent((p: any) => ({ ...p, contactLocationText: e.target.value }))} /></LabeledField>
            </div>
            <div className="mt-4 rounded border p-3">
              <p className="mb-2 text-sm font-semibold">Department Directory</p>
              <div className="mb-2 hidden grid-cols-12 gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
                <span className="col-span-4">Department</span>
                <span className="col-span-4">Contact Person</span>
                <span className="col-span-2">Local No.</span>
                <span className="col-span-1 text-center">Save</span>
                <span className="col-span-1 text-center">Delete</span>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {departments.map((d) => (
                  <div key={d._id} className="grid grid-cols-1 gap-2 md:grid-cols-12">
                    <input className={`${inputBase} px-2 py-1.5 text-xs md:col-span-4`} value={d.name} onChange={(e) => setDepartments((prev) => prev.map((x) => x._id === d._id ? { ...x, name: e.target.value } : x))} />
                    <input className={`${inputBase} px-2 py-1.5 text-xs md:col-span-4`} value={d.contactPerson} onChange={(e) => setDepartments((prev) => prev.map((x) => x._id === d._id ? { ...x, contactPerson: e.target.value } : x))} />
                    <input className={`${inputBase} px-2 py-1.5 text-xs md:col-span-2`} value={d.localNumber} onChange={(e) => setDepartments((prev) => prev.map((x) => x._id === d._id ? { ...x, localNumber: e.target.value } : x))} />
                    <button className={`${btnSecondary} md:col-span-1`} onClick={() => setPendingAction({ title: "Save Department", message: `Save changes for ${d.name}?`, confirmLabel: "Save", run: () => runActionWithFeedback("Department updated", () => api.put(`/api/contact/departments/${d._id}`, { name: d.name, contactPerson: d.contactPerson, localNumber: d.localNumber, active: true }, { headers: authHeaders() })) })} type="button">Save</button>
                    <button className={`${btnDanger} md:col-span-1`} onClick={() => setPendingAction({ title: "Delete Department", message: `Delete ${d.name}?`, confirmLabel: "Delete", run: () => runActionWithFeedback("Department deleted", () => api.delete(`/api/contact/departments/${d._id}`, { headers: authHeaders() })) })} type="button">Delete</button>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 border-t pt-3 md:grid-cols-12">
                <input className={`${inputBase} px-2 py-1.5 text-xs md:col-span-4`} placeholder="Department" value={newDepartment.name} onChange={(e) => setNewDepartment((p) => ({ ...p, name: e.target.value }))} />
                <input className={`${inputBase} px-2 py-1.5 text-xs md:col-span-4`} placeholder="Contact Person" value={newDepartment.contactPerson} onChange={(e) => setNewDepartment((p) => ({ ...p, contactPerson: e.target.value }))} />
                <input className={`${inputBase} px-2 py-1.5 text-xs md:col-span-2`} placeholder="Local No." value={newDepartment.localNumber} onChange={(e) => setNewDepartment((p) => ({ ...p, localNumber: e.target.value }))} />
                <button className={`${btnPrimary} md:col-span-2`} onClick={() => setPendingAction({ title: "Add Department", message: "Create this department row?", confirmLabel: "Add", run: () => runActionWithFeedback("Department added", () => api.post("/api/contact/departments", { ...newDepartment, active: true }, { headers: authHeaders() }).then(() => setNewDepartment({ name: "", contactPerson: "", localNumber: "" }))) })} type="button">Add Department</button>
              </div>
            </div>
            <button className={`${btnPrimary} mt-4 w-full text-sm`} onClick={() => setPendingAction({ title: "Save Contact Content", message: "Apply contact content updates?", confirmLabel: "Save", run: () => runActionWithFeedback("Contact content updated", () => api.patch("/api/content/site", { contactOfficeHours: (siteContent as any).contactOfficeHours, contactLocationText: (siteContent as any).contactLocationText }, { headers: authHeaders() }).then(() => setContactEditOpen(false))) })} type="button">Save Contact Content</button>
          </div>
        </div>
      )}

      {servicesEditOpen && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-5xl`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Manage Services Catalog</h3><button onClick={() => setServicesEditOpen(false)} type="button"><X size={18} /></button></div>
            <div className="mb-3 grid gap-2 md:grid-cols-2">
              <LabeledField label="Service Code"><input className={inputBase} placeholder="Code (e.g. barangay-clearance)" value={newCatalogItem.code} onChange={(e) => setNewCatalogItem((p) => ({ ...p, code: e.target.value }))} /></LabeledField>
              <LabeledField label="Service Title"><input className={inputBase} placeholder="Title" value={newCatalogItem.title} onChange={(e) => setNewCatalogItem((p) => ({ ...p, title: e.target.value }))} /></LabeledField>
              <LabeledField label="Description" className="md:col-span-2"><input className={inputBase} placeholder="Description" value={newCatalogItem.desc} onChange={(e) => setNewCatalogItem((p) => ({ ...p, desc: e.target.value }))} /></LabeledField>
              <LabeledField label="Usage"><input className={inputBase} placeholder="Usage" value={newCatalogItem.usage} onChange={(e) => setNewCatalogItem((p) => ({ ...p, usage: e.target.value }))} /></LabeledField>
              <LabeledField label="Processing Time"><input className={inputBase} placeholder="Time" value={newCatalogItem.time} onChange={(e) => setNewCatalogItem((p) => ({ ...p, time: e.target.value }))} /></LabeledField>
              <LabeledField label="Requirements (Comma Separated)" className="md:col-span-2"><input className={inputBase} placeholder="Requirements (comma separated)" value={newCatalogItem.requirements} onChange={(e) => setNewCatalogItem((p) => ({ ...p, requirements: e.target.value }))} /></LabeledField>
            </div>
            <button className={`${btnPrimary} mb-4 w-full text-sm`} onClick={() => setPendingAction({ title: editingCatalogId ? "Update Service" : "Add Service", message: editingCatalogId ? "Save this service catalog item?" : "Create this service catalog item?", confirmLabel: editingCatalogId ? "Save" : "Add", run: () => runActionWithFeedback(editingCatalogId ? "Service updated" : "Service added", () => (editingCatalogId ? api.put(`/api/services/catalog/${editingCatalogId}`, { ...newCatalogItem, requirements: String(newCatalogItem.requirements).split(",").map((x) => x.trim()).filter(Boolean) }, { headers: authHeaders() }) : api.post("/api/services/catalog", { ...newCatalogItem, requirements: String(newCatalogItem.requirements).split(",").map((x) => x.trim()).filter(Boolean) }, { headers: authHeaders() })).then(() => { setEditingCatalogId(null); setNewCatalogItem({ code: "", title: "", desc: "", usage: "", requirements: "", time: "", active: true, sortOrder: 100 }); })) })} type="button">{editingCatalogId ? "Save Service" : "Add Service"}</button>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {serviceCatalog.map((item) => (
                <div key={item._id} className="flex flex-col gap-2 rounded border p-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-semibold">{item.title}</p><p className="text-xs text-slate-500">{item.code} | {item.active ? "active" : "archived"}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button className={btnSecondary} onClick={() => { setEditingCatalogId(item._id); setNewCatalogItem({ code: item.code || "", title: item.title || "", desc: item.desc || "", usage: item.usage || "", requirements: (item.requirements || []).join(", "), time: item.time || "", active: item.active !== false, sortOrder: item.sortOrder || 100 }); }} type="button">Edit</button>
                    <button className={btnSecondary} onClick={() => setPendingAction({ title: item.active ? "Archive Service" : "Activate Service", message: `${item.active ? "Archive" : "Activate"} ${item.title}?`, confirmLabel: "Confirm", run: () => runActionWithFeedback("Service status updated", () => api.patch(`/api/services/catalog/${item._id}/archive`, { active: !item.active }, { headers: authHeaders() })) })} type="button">{item.active ? "Archive" : "Activate"}</button>
                    <button className={btnDanger} onClick={() => setPendingAction({ title: "Delete Service", message: `Delete ${item.title}?`, confirmLabel: "Delete", run: () => runActionWithFeedback("Service deleted", () => api.delete(`/api/services/catalog/${item._id}`, { headers: authHeaders() })) })} type="button">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {feedback && <div className="fixed right-2 top-20 z-50 sm:right-4 sm:top-24"><div className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}><p className="font-semibold">{feedback.title}</p><p>{feedback.message}</p></div></div>}
      {pendingAction && <div className={modalOverlay}><div className={`${modalCard} max-w-lg`}><h3 className="text-lg font-bold text-slate-900">{pendingAction.title}</h3><p className="mt-2 text-sm text-slate-600">{pendingAction.message}</p><div className="mt-6 flex gap-3"><button className={`${btnSecondary} flex-1 text-sm`} onClick={() => setPendingAction(null)} disabled={actionLoading} type="button">Cancel</button><button className={`${btnPrimary} flex-1 text-sm`} onClick={confirmPendingAction} disabled={actionLoading} type="button">{actionLoading ? "Processing..." : pendingAction.confirmLabel}</button></div></div></div>}
      {childDetailModal ? (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-2xl`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Linked Child Details</h3>
                <p className="mt-1 text-sm text-slate-500">{childDetailModal.child.fullName || "Child record"}</p>
              </div>
              <button onClick={() => setChildDetailModal(null)} type="button"><X size={18} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Email</p>
                <p className="mt-1 text-sm break-all text-slate-800">{childDetailModal.child.email || "N/A"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Birth Date</p>
                <p className="mt-1 text-sm text-slate-800">{childDetailModal.child.birthDate || "N/A"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Relationship</p>
                <p className="mt-1 text-sm text-slate-800">{childDetailModal.child.relationship || "Child"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Status</p>
                <div className="mt-1 w-fit"><Badge value={childDetailModal.child.status || "pending"} /></div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Review Note</p>
                <p className="mt-1 text-sm leading-6 text-slate-800">{childDetailModal.child.reviewReason || "No review note yet."}</p>
              </div>
            </div>
            {canReviewUsers ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Available Actions</p>
                <div className="flex flex-wrap gap-2">
                  {childDetailModal.child.status === "pending" && childDetailModal.child._id ? (
                    <>
                      <button
                        className={btnPrimary}
                        onClick={async () => {
                          const { parent, child } = childDetailModal;
                          if (!child._id) return;
                          await runActionWithFeedback(
                            "Child access approved",
                            () => api.patch(`/api/admin/users/${parent._id}/children/${child._id}/status`, { status: "approved" }, { headers: authHeaders() }),
                          );
                          setChildDetailModal(null);
                          setSelectedUser(null);
                        }}
                        type="button"
                      >
                        Approve Access
                      </button>
                      <button
                        className={btnDanger}
                        onClick={() => {
                          const { parent, child } = childDetailModal;
                          if (!child._id) return;
                          setChildDetailModal(null);
                          openUserReasonPrompt({
                            kind: "child-status",
                            title: "Reject Child Access",
                            userId: parent._id,
                            username: parent.username,
                            nextStatus: "rejected",
                            childId: child._id,
                            childName: child.fullName || "Child",
                          });
                        }}
                        type="button"
                      >
                        Reject Access
                      </button>
                    </>
                  ) : childDetailModal.child._id ? (
                    <>
                      <button
                        className={btnSecondary}
                        onClick={() => {
                          const { parent, child } = childDetailModal;
                          if (!child._id) return;
                          setChildDetailModal(null);
                          openUserReasonPrompt({
                            kind: "child-status",
                            title: "Return Child Access to Pending Review",
                            userId: parent._id,
                            username: parent.username,
                            nextStatus: "rejected",
                            childId: child._id,
                            childName: child.fullName || "Child",
                          });
                        }}
                        type="button"
                      >
                        Remove Access
                      </button>
                      <button
                        className={btnDanger}
                        onClick={() => {
                          const { parent, child } = childDetailModal;
                          setChildDetailModal(null);
                          setPendingAction({
                            title: "Remove Child Link",
                            message: `Delete the linked child access for ${child.fullName}?`,
                            confirmLabel: "Delete",
                            run: () => runActionWithFeedback("Child access removed", () => api.delete(`/api/admin/users/${parent._id}/children/${child._id}`, { headers: authHeaders() })),
                          });
                        }}
                        type="button"
                      >
                        Delete Link
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {accountControlModal ? (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-2xl`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Modify Account</h3>
                <p className="mt-1 text-sm text-slate-500">{accountControlModal.username}</p>
              </div>
              <button onClick={() => setAccountControlModal(null)} type="button"><X size={18} /></button>
            </div>
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs leading-5 text-emerald-900">
              Changes made here apply immediately to both the system and database after confirmation.
            </div>
            <div className={`grid gap-3 ${canManage ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
              {canManage ? (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Role</p>
                  <select className={inputBase} value={accountControlModal.role} onChange={(e) => setAccountControlModal((p) => p ? { ...p, role: e.target.value } : p)}>
                    <option value="resident">resident</option>
                    <option value="admin">admin</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                </div>
              ) : null}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Current Status</p>
                <div className="w-fit"><Badge value={accountControlModal.status} /></div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={btnPrimary}
                onClick={() => {
                  void updateUserStatusDirect(accountControlModal, "active", "approved");
                  setAccountControlModal(null);
                }}
                type="button"
              >
                Approve / Save
              </button>
              <button
                className={btnSecondary}
                onClick={() => {
                  openUserReasonPrompt({ kind: "user-status", title: "Return User to Pending Review", userId: accountControlModal._id, username: accountControlModal.username, nextStatus: "pending", validIdStatus: "pending", role: canManage ? accountControlModal.role : undefined });
                  setAccountControlModal(null);
                }}
                type="button"
              >
                Return to Pending
              </button>
              <button
                className={btnSecondary}
                onClick={() => {
                  openUserReasonPrompt({ kind: "user-status", title: "Suspend User", userId: accountControlModal._id, username: accountControlModal.username, nextStatus: "suspended", validIdStatus: "rejected", role: canManage ? accountControlModal.role : undefined });
                  setAccountControlModal(null);
                }}
                type="button"
              >
                Suspend
              </button>
              {canManage ? (
                <button
                  className={btnDanger}
                  onClick={() => {
                    setAccountControlModal(null);
                    setPendingAction({
                      title: "Delete Account",
                      message: `Delete ${accountControlModal.username} and linked records permanently?`,
                      confirmLabel: "Delete",
                      run: () => runActionWithFeedback("User deleted", () => api.delete(`/api/admin/users/${accountControlModal._id}`, { headers: authHeaders() })),
                    });
                  }}
                  type="button"
                >
                  Delete Account
                </button>
              ) : null}
            </div>
            {accountControlModal.statusReason ? <p className="mt-4 text-xs text-slate-500">Latest review note: {accountControlModal.statusReason}</p> : null}
          </div>
        </div>
      ) : null}
      {reviewUserPrompt && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-md`}>
            <h3 className="text-lg font-bold text-slate-900">Review User Details</h3>
            <p className="mt-2 text-sm text-slate-600">Double-check the resident details, then choose approve or reject.</p>
            <div className="mt-6 flex gap-3">
              <button className={`${btnSecondary} flex-1 text-sm`} onClick={() => setReviewUserPrompt(null)} type="button">Cancel</button>
              <button
                className={`${btnDanger} flex-1 text-sm`}
                onClick={() => {
                  const target = reviewUserPrompt;
                  setReviewUserPrompt(null);
                  openUserReasonPrompt({ kind: "user-status", title: "Reject User", userId: target._id, username: target.username, nextStatus: "suspended", validIdStatus: "rejected" });
                }}
                type="button"
              >
                Reject
              </button>
              <button
                className={`${btnPrimary} flex-1 text-sm`}
                onClick={() => {
                  const target = reviewUserPrompt;
                  void updateUserStatusDirect(target, "active", "approved");
                }}
                type="button"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
      {userReasonPrompt && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-lg`}>
            <h3 className="text-lg font-bold text-slate-900">{userReasonPrompt.title}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {userReasonPrompt.kind === "child-status"
                ? `Select the reason for updating ${userReasonPrompt.childName}'s access request.`
                : `Select the reason for updating ${userReasonPrompt.username}'s account status.`}
            </p>
            <div className="mt-4 space-y-3">
              <LabeledField label="Reason">
                <select className={inputBase} value={userReasonChoice} onChange={(e) => setUserReasonChoice(e.target.value)}>
                  {reasonOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </LabeledField>
              {userReasonChoice === "Other" ? (
                <LabeledField label="Custom Reason">
                  <textarea className={inputBase} rows={3} value={userReasonCustom} onChange={(e) => setUserReasonCustom(e.target.value)} placeholder="Enter the reason that will be emailed to the resident." />
                </LabeledField>
              ) : null}
            </div>
            <div className="mt-6 flex gap-3">
              <button className={`${btnSecondary} flex-1 text-sm`} onClick={() => setUserReasonPrompt(null)} disabled={actionLoading} type="button">Cancel</button>
              <button className={`${btnPrimary} flex-1 text-sm`} onClick={() => { void confirmUserReasonPrompt(); }} disabled={actionLoading} type="button">{actionLoading ? "Processing..." : "Submit"}</button>
            </div>
          </div>
        </div>
      )}
      <LogoutConfirmation isOpen={showLogoutDialog} isLoggingOut={isLoggingOut} onClose={() => setShowLogoutDialog(false)} onConfirm={confirmLogout} />
    </div>
  );
}




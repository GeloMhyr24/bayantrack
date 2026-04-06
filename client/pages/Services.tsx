import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
import { Reveal } from "@/components/Reveal";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle, Clock, FileText, Search, X } from "lucide-react";
import { api, authHeaders } from "@/lib/api";
import { FeedbackModal } from "@/components/FeedbackModal";

type ServiceCatalog = {
  code: string;
  title: string;
  desc: string;
  usage: string;
  requirements: string[];
  time: string;
};

type ServiceRequest = {
  _id: string;
  referenceNo: string;
  serviceType: string;
  status: string;
  createdAt: string;
};

const REQUIRED_SERVICES: ServiceCatalog[] = [
  {
    code: "barangay-clearance",
    title: "Barangay Clearance",
    desc: "Official document certifying good moral character and residency.",
    usage: "Employment, Bank Accounts",
    requirements: ["Valid ID", "Recent Cedula"],
    time: "15 Mins",
  },
  {
    code: "certificate-of-indigency",
    title: "Certificate of Indigency",
    desc: "Certification of financial status for assistance programs.",
    usage: "Medical Assistance, Scholarships",
    requirements: ["Valid ID", "Purok Leader Endorsement"],
    time: "15 Mins",
  },
  {
    code: "barangay-id",
    title: "Barangay ID",
    desc: "Identification card for verified barangay residents.",
    usage: "Barangay Transactions, Identity Verification",
    requirements: ["Valid ID", "Proof of Residency", "2x2 Photo"],
    time: "20 Mins",
  },
];

const iconMap: Record<string, typeof FileText> = {
  "barangay-clearance": FileText,
  "certificate-of-indigency": FileText,
  "barangay-id": FileText,
};

export default function Services() {
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [content, setContent] = useState<{ servicesHeroTitle: string; servicesHeroSubtitle: string }>({
    servicesHeroTitle: "Online Services Portal",
    servicesHeroSubtitle: "Certificate of Indigency, Barangay Clearance, and Barangay ID requests with real database tracking.",
  });
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [trackRef, setTrackRef] = useState("");
  const [tracked, setTracked] = useState<ServiceRequest | null>(null);
  const [formData, setFormData] = useState({ fullName: "", contactNumber: "", address: "", purpose: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [feedback, setFeedback] = useState<{ isOpen: boolean; title: string; message: string; type: "success" | "error" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  const activeService = useMemo(() => services.find((s) => s.code === activeCode), [activeCode, services]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catalogRes, contentRes] = await Promise.all([
        api.get("/api/services/catalog"),
        api.get("/api/content/site"),
      ]);
      const incoming = Array.isArray(catalogRes.data) ? catalogRes.data : [];
      const byCode = new Map(incoming.map((item: ServiceCatalog) => [item.code, item]));
      setServices(REQUIRED_SERVICES.map((svc) => byCode.get(svc.code) || svc));
      setContent((prev) => ({
        servicesHeroTitle: contentRes?.data?.servicesHeroTitle || prev.servicesHeroTitle,
        servicesHeroSubtitle: contentRes?.data?.servicesHeroSubtitle || prev.servicesHeroSubtitle,
      }));
    } catch (err) {
      console.error("Failed to load services data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCode) return;
    setIsSubmitting(true);
    setSubmitProgress(25);

    try {
      const res = await api.post(
        "/api/services/requests",
        {
          serviceType: activeCode,
          fullName: formData.fullName,
          contactNumber: formData.contactNumber,
          address: formData.address,
          purpose: formData.purpose,
        },
        { headers: authHeaders() },
      );

      setActiveCode(null);
      setShowRequestModal(false);
      setFormData({ fullName: "", contactNumber: "", address: "", purpose: "" });
      setFeedback({
        isOpen: true,
        title: "Request Submitted",
        message: `Your request was submitted successfully. Reference Number: ${res.data.referenceNo}`,
        type: "success",
      });
      await loadData();
    } catch (err: any) {
      setFeedback({ isOpen: true, title: "Submit Failed", message: err.response?.data?.msg || "Failed to submit request", type: "error" });
    } finally {
      setSubmitProgress(100);
      setTimeout(() => { setIsSubmitting(false); setSubmitProgress(0); }, 300);
    }
  };

  const trackRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTracking(true);
    setTrackProgress(30);
    try {
      const res = await api.get(`/api/services/requests/track/${trackRef}`, { headers: authHeaders() });
      setTracked(res.data);
      setTrackRef("");
    } catch (err: any) {
      setFeedback({ isOpen: true, title: "Tracking Failed", message: err.response?.data?.msg || "Request not found", type: "error" });
    } finally {
      setTrackProgress(100);
      setTimeout(() => { setIsTracking(false); setTrackProgress(0); }, 250);
    }
  };

  useEffect(() => {
    if (!isSubmitting) return;
    const t = setInterval(() => setSubmitProgress((p) => (p >= 90 ? p : p + 8)), 220);
    return () => clearInterval(t);
  }, [isSubmitting]);

  useEffect(() => {
    if (!isTracking) return;
    const t = setInterval(() => setTrackProgress((p) => (p >= 90 ? p : p + 12)), 220);
    return () => clearInterval(t);
  }, [isTracking]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-12">
          <Reveal>
            <div className="mb-10 rounded-2xl bg-[#395886] p-6 text-white sm:p-10">
              <h1 className="text-2xl font-bold sm:text-3xl">{content.servicesHeroTitle}</h1>
              <p className="mt-2 text-blue-100">{content.servicesHeroSubtitle}</p>
            </div>
          </Reveal>

          {loading && <div className="mb-6 rounded-xl border bg-white p-4 text-sm text-slate-500">Loading services...</div>}


          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-3 inline-flex rounded-md bg-blue-50 p-2 text-blue-700"><Search size={18} /></div>
              <h3 className="text-lg font-semibold text-slate-900">Track Your Request</h3>
              <p className="mt-1 text-sm text-slate-600">Track any submitted service request reference number.</p>
              <button className="mt-4 rounded-md border px-4 py-2 text-sm font-semibold" onClick={() => setShowTrackModal(true)} type="button">Track Now</button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {services.map((service, idx) => {
              const Icon = (iconMap as any)[service.code] || FileText;
              return (
                <button
                  key={service.code}
                  className={`h-full rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                    idx === 2 ? "md:col-span-2 md:w-full md:max-w-2xl md:justify-self-center" : ""
                  }`}
                  onClick={() => {
                    setActiveCode(service.code);
                    setShowRequestModal(true);
                  }}
                  type="button"
                >
                  <div className="mb-4 inline-flex rounded-full bg-slate-100 p-3 text-slate-800"><Icon size={20} /></div>
                  <h3 className="text-xl font-bold text-slate-900">{service.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{service.desc}</p>
                  <p className="mt-5 text-xs font-bold text-slate-700">Commonly used for:</p>
                  <p className="mt-1 text-xs text-slate-500">{service.usage}</p>
                  <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1"><Clock size={12} /> {service.time}</span>
                    <span className="inline-flex items-center gap-1 text-slate-900">Start <ArrowRight size={12} /></span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {showTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6">
            <button className="mb-2 ml-auto block text-slate-500" onClick={() => setShowTrackModal(false)} type="button"><X size={18} /></button>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Track Request</h3>
            {isTracking && <div className="mb-3"><p className="mb-1 text-xs text-slate-500">Checking request... {trackProgress}%</p><div className="h-2 rounded bg-slate-200"><div className="h-2 rounded bg-blue-600 transition-all" style={{ width: `${trackProgress}%` }} /></div></div>}
            <form onSubmit={trackRequest}>
              <input className="mb-3 w-full rounded-lg border px-3 py-2" placeholder="BT-SVC-YYYY-XXXXXX" value={trackRef} onChange={(e) => setTrackRef(e.target.value)} required />
              <button disabled={isTracking} type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isTracking ? "Checking..." : "Check Status"}</button>
            </form>
            {tracked && (
              <div className="mt-4 rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{tracked.referenceNo}</p>
                <p className="text-slate-600">{tracked.serviceType}</p>
                <p className="text-slate-600">Status: {tracked.status}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showRequestModal && activeService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6">
            <button className="mb-2 ml-auto block text-slate-500" onClick={() => setShowRequestModal(false)} type="button"><X size={18} /></button>
            <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{activeService.title} Request</h2>
                <p className="mt-1 text-sm text-slate-600">{activeService.desc}</p>
                {isSubmitting && <div className="mt-3"><p className="mb-1 text-xs text-slate-500">Submitting request... {submitProgress}%</p><div className="h-2 rounded bg-slate-200"><div className="h-2 rounded bg-emerald-600 transition-all" style={{ width: `${submitProgress}%` }} /></div></div>}
                <form className="mt-6 space-y-3" onSubmit={submitRequest}>
                  <input required className="w-full rounded-lg border px-3 py-2" placeholder="Full Name" value={formData.fullName} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} />
                  <input required className="w-full rounded-lg border px-3 py-2" placeholder="Contact Number" value={formData.contactNumber} onChange={(e) => setFormData((p) => ({ ...p, contactNumber: e.target.value }))} />
                  <input required className="w-full rounded-lg border px-3 py-2" placeholder="Address" value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} />
                  <select required className="w-full rounded-lg border px-3 py-2" value={formData.purpose} onChange={(e) => setFormData((p) => ({ ...p, purpose: e.target.value }))}>
                    <option value="">Purpose of Request</option>
                    <option value="employment">Employment</option>
                    <option value="school">School Requirement</option>
                    <option value="benefits">Government Assistance</option>
                    <option value="other">Other</option>
                  </select>
                  <button disabled={isSubmitting} type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? "Submitting..." : "Submit Request"}</button>
                </form>
              </div>
              <aside className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 font-semibold text-slate-900">Requirements</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {activeService.requirements.map((req) => (
                      <li key={req} className="flex items-center gap-2"><CheckCircle size={14} /> {req}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-900">Processing Time</h3>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{activeService.time}</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        title={feedback.title}
        message={feedback.message}
        type={feedback.type}
      />
      <Footer />
      <Chatbot />
    </div>
  );
}

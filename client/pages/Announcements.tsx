import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Calendar, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useNavigate, useParams } from "react-router-dom";

type AnnouncementItem = {
  _id: string;
  title: string;
  content: string;
  module: string;
  category: string;
  source: string;
  image?: string;
  featured?: boolean;
  createdAt: string;
};

const moduleOptions = [
  { key: 'all-news-updates', label: 'All News & Updates' },
  { key: 'barangay-updates', label: 'Barangay Updates' },
  { key: 'emergency-hotlines', label: 'Emergency Hotlines' },
  { key: 'phivolcs-alerts', label: 'PHIVOLCS Alerts' },
  { key: 'fact-check', label: 'Fact Check' },
];

export default function Announcements() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [featured, setFeatured] = useState<AnnouncementItem[]>([]);
  const [activeModule, setActiveModule] = useState('all-news-updates');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allRes, featuredRes] = await Promise.all([
          api.get('/api/announcements'),
          api.get('/api/announcements', { params: { featured: true, limit: 5 } }),
        ]);
        setItems(allRes.data || []);
        setFeatured(featuredRes.data || []);
      } catch (err) {
        console.error('Failed to fetch announcements', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (
      category &&
      ["barangay-updates", "emergency-hotlines", "phivolcs-alerts", "fact-check"].includes(category)
    ) {
      setActiveModule(category);
    }
  }, [category]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const byModule = activeModule === 'all-news-updates' ? true : item.module === activeModule;
      const bySearch =
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.content.toLowerCase().includes(search.toLowerCase());
      return byModule && bySearch;
    });
  }, [activeModule, items, search]);

  const getAnnouncementPath = (moduleKey: string) => {
    const normalized = String(moduleKey || "").toLowerCase();
    if (
      normalized === "barangay-updates" ||
      normalized === "emergency-hotlines" ||
      normalized === "phivolcs-alerts" ||
      normalized === "fact-check"
    ) {
      return `/announcements/${normalized}`;
    }
    return "/announcements";
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-grow">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="mb-8 rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
            <h1 className="text-2xl font-bold sm:text-3xl">Community Announcements</h1>
            <p className="mt-2 text-slate-300">Real-time updates from your barangay database.</p>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-[1fr,260px]">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                className="w-full border-0 bg-transparent text-sm outline-none"
                placeholder="Search announcements"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={activeModule}
              onChange={(e) => setActiveModule(e.target.value)}
            >
              {moduleOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">News Carousel</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {featured.map((item) => (
                <article key={item._id} className="overflow-hidden rounded-xl border border-slate-200">
                  {item.image ? (
                    <div className="aspect-[16/9] w-full bg-slate-100">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Featured</p>
                  <h3 className="line-clamp-2 font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.content}</p>
                  </div>
                </article>
              ))}
              {featured.length === 0 && <p className="text-sm text-slate-500">No featured announcements yet.</p>}
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading announcements...</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filtered.map((item) => (
                <article key={item._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  {item.image ? (
                    <div className="aspect-[16/9] w-full bg-slate-100">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="p-5">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{item.category}</span>
                    <span className="inline-flex items-center gap-1"><Calendar size={12} /> {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.content}</p>
                  <p className="mt-4 text-xs text-slate-500">Source: {item.source}</p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-900"
                    onClick={() => navigate(getAnnouncementPath(item.module))}
                  >
                    Read Details <ArrowRight size={14} />
                  </button>
                  </div>
                </article>
              ))}
              {filtered.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                  No announcements found for this filter.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}

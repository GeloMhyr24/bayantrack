import { useEffect, useMemo, useState } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { Chatbot } from "@/components/Chatbot";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { api } from '@/lib/api';

type Announcement = {
  _id: string;
  title: string;
  category: string;
  content: string;
  source: string;
  image?: string;
  createdAt: string;
};

export default function BarangayUpdate() {
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Announcement[]>([]);

  const ITEMS_PER_PAGE = 6;
  const categories = ['All', 'Advisory', 'Event', 'Alert', 'Health', 'Fact Check'];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/announcements', { params: { module: 'barangay-updates', limit: 100 } });
        setItems(res.data || []);
      } catch (err) {
        console.error('Failed to load barangay updates', err);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => items.filter((a) => (filter === 'All' ? true : a.category === filter)), [filter, items]);
  const paginated = filtered.slice(0, page * ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Header />
      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl">
        <Reveal>
          <div className="mb-8">
            <h1 className="text-[28px] md:text-3xl font-bold text-[#395886] mb-3 uppercase tracking-wide">BARANGAY UPDATES</h1>
            <p className="text-[15px] text-gray-700 max-w-3xl">Official notices, event schedules, and resolutions directly from the Barangay Council.</p>
          </div>

          <div className="flex gap-3 mb-10 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${
                filter === cat ? 'bg-[#395886] text-white border-[#395886] shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
                {cat}
              </button>
            ))}
          </div>
        </Reveal>

        {paginated.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-[14px] border border-gray-200 shadow-sm">No updates found for this category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {paginated.map((item) => (
              <Reveal>
                <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col group">
                  {item.image ? (
                    <div className="relative aspect-[16/9] w-full bg-slate-100">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      <div className="absolute right-4 top-4 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-sm uppercase tracking-wider bg-black/35 backdrop-blur-md border border-white/20">
                        {item.category}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[200px] w-full bg-[#395886] relative flex items-center justify-center p-6 text-center">
                      <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight">{item.category}</h2>
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-sm uppercase tracking-wider bg-white/10 backdrop-blur-md border border-white/20">
                        {item.category}
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-[12px] text-gray-500 mb-3 flex items-center font-medium">
                      <Calendar size={13} className="mr-1.5 text-gray-400 shrink-0" /> {new Date(item.createdAt).toLocaleDateString()}
                      <span className="text-[#395886] font-medium ml-1.5 shrink-0">• {item.source}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mt-1 mb-3 line-clamp-2 leading-tight">{item.title}</h3>
                    <p className="text-[14px] text-gray-600 line-clamp-3 mb-6 leading-relaxed flex-1">{item.content}</p>
                    <span className="text-[#395886] text-[13px] font-bold flex items-center gap-1.5 hover:underline w-fit">Read Details <ArrowRight size={14} /></span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {paginated.length < filtered.length && (
          <button onClick={() => setPage((p) => p + 1)} className="w-full py-4 bg-white text-[#395886] font-bold rounded-[14px] hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
            Load More Updates
          </button>
        )}
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}

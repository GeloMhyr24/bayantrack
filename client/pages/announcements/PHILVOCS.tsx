import { useEffect, useState } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
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

const FadeIn = ({ children }: any) => <div className="animate-fade-in h-full">{children}</div>;

export default function PHIVOLCS() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/announcements', { params: { module: 'phivolcs-alerts', limit: 100 } });
        setItems(res.data || []);
      } catch (err) {
        console.error('Failed to load PHIVOLCS alerts', err);
      }
    };
    load();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <FadeIn>
            <div className="bg-slate-900 text-white p-12 rounded-2xl text-center mb-12 shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="relative z-10">
                <Activity size={64} className="mx-auto mb-4 text-red-400 animate-pulse" />
                <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">PHIVOLCS Alerts</h1>
                <p className="max-w-2xl mx-auto text-gray-300 text-base md:text-lg">Official seismic and volcanic advisories to keep Mambog II residents prepared and safe.</p>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Reveal>
                <div className="bg-white border border-[#D5DEEF] rounded-xl shadow-sm hover:shadow-md transition-shadow h-full flex flex-col overflow-hidden">
                  {item.image ? (
                    <div className="aspect-[16/9] w-full bg-slate-100">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="p-6 flex h-full flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm uppercase tracking-wider bg-red-600">{item.category || 'Alert'}</div>
                    <span className="text-xs text-gray-400 font-medium">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <h3 className="font-bold text-[#395886] text-xl mb-2 leading-tight">{item.title}</h3>
                  <p className="text-gray-600 text-[14px] mb-6 flex-1 leading-relaxed">{item.content}</p>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100 mt-auto">
                    <p className="text-xs font-bold text-red-800 flex items-center gap-2 mb-1.5 uppercase tracking-wide"><AlertTriangle size={14} strokeWidth={2.5} /> Official Source</p>
                    <p className="text-[13px] text-red-700 leading-snug font-medium">{item.source}</p>
                  </div>
                  </div>
                </div>
              </Reveal>
            ))}
            {items.length === 0 && <div className="text-sm text-slate-500">No PHIVOLCS alerts yet.</div>}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

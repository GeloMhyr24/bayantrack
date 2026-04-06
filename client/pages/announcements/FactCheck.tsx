import { useEffect, useMemo, useState } from 'react';
import { Shield, AlertCircle, Search, Upload, CheckCircle, ArrowRight } from 'lucide-react';
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { api, authHeaders } from '@/lib/api';
import { FeedbackModal } from "@/components/FeedbackModal";

type Announcement = {
  _id: string;
  title: string;
  category: string;
  content: string;
  source: string;
  image?: string;
  createdAt: string;
};

export default function FactCheck() {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Announcement[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [claim, setClaim] = useState('');
  const [source, setSource] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ isOpen: boolean; title: string; message: string; type: "success" | "error" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  const filters = ['All', 'True', 'False', 'Misleading'];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/announcements', { params: { module: 'fact-check', limit: 100 } });
        setItems(res.data || []);
      } catch (err) {
        console.error('Failed to load fact checks', err);
      }
    };
    load();
  }, []);

  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const status = (item.category || '').toLowerCase();
      const matchesFilter = filter === 'All' || status === filter.toLowerCase();
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, items, searchQuery]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/api/contact/messages', {
        name: 'Resident Report',
        contact: source || 'N/A',
        department: 'Fact Check',
        message: claim,
      }, { headers: authHeaders() });
      setReferenceNumber(res.data.referenceNo);
      setIsReportModalOpen(false);
      setIsSuccessModalOpen(true);
      setClaim('');
      setSource('');
    } catch (err: any) {
      setFeedback({ isOpen: true, title: "Submit Failed", message: err.response?.data?.msg || "Failed to submit report", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColors = (status: string) => {
    switch (status.toUpperCase()) {
      case 'FALSE': return 'bg-[#ffe4e6] text-[#e11d48]';
      case 'TRUE': return 'bg-[#dcfce7] text-[#16a34a]';
      case 'MISLEADING': return 'bg-[#ffedd5] text-[#d97706]';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#eff2f9]">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-10 max-w-7xl">
        <Reveal>
          <div className="bg-[#212b46] rounded-2xl p-10 md:p-14 text-center shadow-lg relative overflow-hidden mb-8">
            <div className="relative z-10 flex flex-col items-center">
              <Shield size={56} strokeWidth={1.5} className="text-[#eab308] mb-4" />
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">BayanTrack Fact Check</h1>
              <p className="text-[#94a3b8] text-base md:text-lg max-w-2xl mx-auto mb-8">Combatting misinformation in our community. We verify rumors so you stay informed with the truth.</p>
              <button onClick={() => setIsReportModalOpen(true)} className="bg-[#9f1239] hover:bg-[#881337] text-white font-medium py-3 px-8 rounded-full flex items-center gap-2 transition-colors shadow-lg">
                <AlertCircle size={20} /> Report a Rumor
              </button>
            </div>
          </div>

          <div className="bg-white rounded-full shadow-sm p-2 flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
            <div className="flex items-center w-full md:w-1/2 px-4 py-2">
              <Search className="text-gray-400 mr-3" size={20} />
              <input type="text" placeholder="Search Claims..." className="w-full outline-none text-gray-700 bg-transparent" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto px-2 pb-2 md:pb-0 no-scrollbar shrink-0">
              {filters.map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${filter === f ? 'bg-[#3b4b72] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item) => (
            <Reveal>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider ${getStatusColors(item.category || 'UNKNOWN')}`}>{item.category || 'UNKNOWN'}</span>
                    <span className="text-[11px] font-bold text-[#638ECB] uppercase tracking-wider">Fact Check</span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>

                <h2 className="text-lg font-bold text-gray-900 mb-4 leading-tight">{item.title}</h2>
                {item.image ? (
                  <div className="mb-4 overflow-hidden rounded-xl border border-[#e5e7eb] bg-slate-100">
                    <div className="aspect-[16/9] w-full">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                  </div>
                ) : null}
                <div className="bg-[#f0f4ff] rounded-2xl p-5 mb-5 border border-[#e0e7ff] relative">
                  <p className="text-[#3b4b72] text-[14.5px] font-medium leading-relaxed italic">"{item.content}"</p>
                </div>
                <div className="text-[14px] text-gray-700 leading-relaxed flex-1 mb-6"><span className="font-bold text-[#212b46]">Source: </span>{item.source}</div>
                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-center"><button className="text-[#638ECB] font-semibold text-sm flex items-center gap-1.5 hover:text-[#3b4b72] transition-colors">Read Full Details <ArrowRight size={14} /></button></div>
              </div>
            </Reveal>
          ))}
        </div>

        {filteredData.length === 0 && <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow-sm">No fact checks found matching your criteria.</div>}
      </main>

      <Footer />

      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e293b]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[24px] w-full max-w-[420px] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[#3b4b72] mb-6">Report Misinformation</h2>
              <form onSubmit={handleReportSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Rumor / Claim</label>
                  <textarea required rows={4} value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="What did you hear or see?" className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#638ECB] resize-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Where did you see this?</label>
                  <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Facebook, Group chat, etc.." className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#638ECB] text-sm" />
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors"><Upload className="text-gray-400 mb-2" size={28} /><span className="text-sm text-gray-500 font-medium">Upload Screenshot (optional)</span></div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsReportModalOpen(false)} className="flex-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-gray-700 font-bold py-3.5 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#9f1239] hover:bg-[#881337] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70">{isSubmitting ? 'Submitting...' : 'Submit Report'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e293b]/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[24px] w-full max-w-[400px] shadow-2xl overflow-hidden p-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-[#dcfce7] rounded-full flex items-center justify-center mb-6 text-[#16a34a]"><CheckCircle size={40} strokeWidth={2.5} /></div>
            <h2 className="text-2xl font-black text-[#3b4b72] mb-3">Report Received</h2>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-8">Thank you for helping us fight misinformation. We will verify this claim shortly.</p>
            <div className="bg-[#e0e7ff] w-full rounded-xl p-5 mb-8"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">REFERENCE NUMBER</p><p className="text-[#3b4b72] text-lg font-bold tracking-wide">{referenceNumber}</p></div>
            <button onClick={() => setIsSuccessModalOpen(false)} className="w-full bg-[#3b4b72] hover:bg-[#2d3a5c] text-white font-bold py-4 rounded-xl transition-colors text-lg shadow-md">Close</button>
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
    </div>
  );
}

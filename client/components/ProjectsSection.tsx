import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

type AnnouncementItem = {
  _id: string;
  title: string;
  content: string;
  category: string;
  module: string;
  image?: string;
  createdAt?: string;
};

export function ProjectsSection() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/announcements?limit=6");
        setItems(res.data || []);
      } catch {
        setItems([]);
      }
    };
    void load();
  }, []);

  const active = useMemo(
    () => items[index] || { _id: "fallback", title: "No community updates yet", content: "Announcements from the system will appear here.", category: "Advisory", module: "all-news-updates" },
    [items, index],
  );

  const goPrev = () => setIndex((prev) => (items.length ? (prev - 1 + items.length) % items.length : 0));
  const goNext = () => setIndex((prev) => (items.length ? (prev + 1) % items.length : 0));

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(t);
  }, [items.length]);

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-3 tracking-tight">Projects & Activities</h2>
            <p className="text-gray-500 font-medium">Live announcement feed from your database.</p>
          </div>
          <Link to="/announcements" className="flex items-center gap-1 text-primary font-bold text-sm hover:underline">View All<ArrowRight className="w-4 h-4" /></Link>
        </div>

        <div className="group relative min-h-[300px] overflow-hidden rounded-3xl shadow-2xl sm:min-h-[360px]">
          {active.image ? (
            <img src={active.image} alt={active.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#2e3b82] to-[#6d7eb8]" />
          )}
          <div className="absolute inset-0 bg-slate-900/55" />
          <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 text-white sm:p-8 lg:p-12">
            <Badge className="mb-4 w-fit border-none bg-blue-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-blue-500 sm:mb-6">{active.category || "Advisory"}</Badge>
            <h3 className="mb-3 max-w-2xl text-xl font-extrabold leading-tight drop-shadow-md sm:mb-5 sm:text-3xl md:text-5xl">{active.title}</h3>
            <p className="mb-5 max-w-xl text-xs leading-relaxed text-white/85 sm:mb-7 sm:text-base">{active.content}</p>
            <Button size="lg" className="h-11 w-fit rounded-xl bg-white px-5 text-sm font-bold text-primary hover:bg-white/90 sm:h-12 sm:px-6 sm:text-base" onClick={() => navigate("/announcements")}>
              Read Full Story
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          <div className="absolute left-4 top-4 z-10 flex gap-2 sm:left-8 sm:top-8">
            {(items.length > 0 ? items : [active]).slice(0, 4).map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i === Math.min(index, 3) ? "w-8 bg-white" : "w-2 bg-white/40"}`} />
            ))}
          </div>
          <div className="absolute right-4 top-4 z-10 flex gap-2 sm:right-8 sm:top-8">
            <button className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20" onClick={goPrev} type="button"><ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" /></button>
            <button className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20" onClick={goNext} type="button"><ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

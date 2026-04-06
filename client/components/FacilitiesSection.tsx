import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

type AnnouncementItem = {
  _id: string;
  title: string;
  content: string;
  module: string;
  image?: string;
};

interface FacilityCardProps {
  title: string;
  description: string;
  module: string;
  image?: string;
}

function FacilityCard({ title, description, module, image }: FacilityCardProps) {
  const target = module === "emergency-hotlines" ? "/announcements/emergency-hotlines" : module === "phivolcs-alerts" ? "/announcements/phivolcs-alerts" : module === "fact-check" ? "/announcements/fact-check" : "/announcements/barangay-updates";
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-50 bg-white shadow-sm transition-all hover:translate-y-[-4px] hover:shadow-xl">
      {image ? (
        <div className="aspect-[4/3] w-full bg-slate-100">
          <img src={image} alt={title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-[#3b528a] flex items-center justify-center p-8">
          <h4 className="text-white text-2xl font-bold text-center tracking-tight">{title}</h4>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h5 className="font-bold text-primary mb-2">{title}</h5>
        <p className="mb-6 line-clamp-3 flex-1 text-xs leading-relaxed text-gray-500">{description}</p>
        <Link to={target} className="mt-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#3b528a] transition-all group-hover:gap-2 hover:underline">
          View Details
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export function FacilitiesSection() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/announcements?limit=4");
        setItems(res.data || []);
      } catch {
        setItems([]);
      }
    };
    void load();
  }, []);

  const cards = items.length > 0 ? items.map((item) => ({ title: item.title, description: item.content, module: item.module, image: item.image })) : [
    { title: "Barangay Feed", description: "Announcements will appear here once published.", module: "barangay-updates", image: "" },
    { title: "News Feed", description: "Community updates connected to your live database.", module: "all-news-updates", image: "" },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-3 tracking-tight">Community Facilities</h2>
            <p className="text-gray-500 font-medium text-sm">Live preview of current community announcements.</p>
          </div>
          <Link to="/announcements" className="flex items-center gap-1 text-primary font-bold text-sm hover:underline">
            View All Updates
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {cards.map((facility, idx) => (
            <FacilityCard key={`${facility.title}-${idx}`} {...facility} />
          ))}
        </div>
      </div>
    </section>
  );
}

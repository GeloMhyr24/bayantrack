import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface StatCardProps {
  value: string;
  label: string;
  sublabel: string;
}

function StatCard({ value, label, sublabel }: StatCardProps) {
  return (
    <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center transition-all hover:shadow-md">
      <div className="text-4xl font-extrabold text-primary mb-3 tracking-tight">{value}</div>
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</div>
      <div className="text-xs font-semibold text-gray-600">{sublabel}</div>
    </div>
  );
}

export function CommunityProfile() {
  const fallbackStats = [
    { value: "4102", label: "Postal Code", sublabel: "Bacoor City" },
    { value: "7,129", label: "Population", sublabel: "2020 Census" },
    { value: "IV-A", label: "Region", sublabel: "CALABARZON" },
    { value: "CAVITE", label: "Province", sublabel: "Philippines" },
  ];
  const [stats, setStats] = useState(fallbackStats);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/content/site");
        if (Array.isArray(res.data?.communityCards) && res.data.communityCards.length > 0) {
          setStats(res.data.communityCards);
        }
      } catch {
        setStats(fallbackStats);
      }
    };
    void load();
  }, []);

  return (
    <section className="py-24 container mx-auto px-4 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Text Content */}
        <div className="flex flex-col">
          <span className="text-blue-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">
            Community Profile
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-8 leading-tight tracking-tight">
            Welcome to Mambog II
          </h2>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            A residential haven in Bacoor City, bridging traditional community values with modern urban growth. Home to over 7,000 residents, we pride ourselves on a safe, clean, and cooperative neighborhood.
          </p>
          <Link
            to="/about"
            className="flex items-center gap-2 text-primary font-extrabold text-xl hover:gap-4 transition-all group"
          >
            Read Full Profile
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}

import { Users, FileText, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface GovernanceCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function GovernanceCard({ icon: Icon, title, description }: GovernanceCardProps) {
  return (
    <div className="bg-white p-10 rounded-2xl border border-gray-50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col items-center text-center transition-all hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.08)]">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-primary mb-4">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed max-w-[240px]">
        {description}
      </p>
    </div>
  );
}

export function GovernanceSection() {
  const fallbackItems = [
    {
      icon: Users,
      title: "Barangay Assemblies",
      description: "Biannual gatherings mandated by law to discuss financial reports and community projects.",
    },
    {
      icon: FileText,
      title: "Transparency",
      description: "Open access to barangay budget, ordinances, and resolutions for public review.",
    },
    {
      icon: MessageSquare,
      title: "Citizen Reporting",
      description: "Active channels for feedback, complaints, and emergency reporting via BayanTrack+.",
    },
  ];
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/content/site");
        setContent(res.data || null);
      } catch {
        setContent(null);
      }
    };
    void load();
  }, []);

  const items = Array.isArray(content?.governanceItems) && content.governanceItems.length > 0
    ? content.governanceItems.map((item: any, idx: number) => ({
        icon: [Users, FileText, MessageSquare][idx % 3],
        title: item.title,
        description: item.description,
      }))
    : fallbackItems;

  return (
    <section className="py-24 bg-[#f8faff]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 tracking-tight">
            {content?.governanceTitle || "Governance & Participation"}
          </h2>
          <p className="text-gray-500 font-medium">
            {content?.governanceSubtitle || "How we serve and engage with the community."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item) => (
            <GovernanceCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

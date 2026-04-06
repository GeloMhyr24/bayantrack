import { Info, ShieldCheck, Heart, Leaf, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { api } from "@/lib/api";

export default function About() {
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

  const snapshotItems = Array.isArray(content?.aboutSnapshotItems) && content.aboutSnapshotItems.length > 0
    ? content.aboutSnapshotItems
    : [
        { label: "Region", value: "CALABARZON (Region IV-A)" },
        { label: "Population (2020)", value: "7,129 Residents" },
        { label: "City", value: "Bacoor City, Cavite" },
        { label: "Share of Bacoor", value: "Approx. 1.07%" },
        { label: "Postal Code", value: "4102" },
        { label: "Elevation", value: "~12.7 meters ASL" },
        { label: "Coordinates", value: "14.4239°N, 120.9523°E" },
        { label: "Classification", value: "Urban / Residential" },
      ];

  const trendItems = Array.isArray(content?.aboutPopulationTrend) && content.aboutPopulationTrend.length > 0
    ? content.aboutPopulationTrend
    : [
        { label: "1990 Census", value: "~2,500" },
        { label: "2010 Census", value: "~5,800" },
        { label: "2020 Census", value: "7,129" },
      ];

  const coreGovernance = Array.isArray(content?.aboutCoreGovernance) && content.aboutCoreGovernance.length > 0
    ? content.aboutCoreGovernance
    : [
        "Barangay Assembly: Biannual meetings for resident consultation.",
        "Committees: Peace & Order, Health, Finance, Youth, Infrastructure.",
        "Transparency: Full disclosure of budget and projects.",
      ];

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <Header />
      <section className="bg-primary pt-24 pb-32">
        <div className="container px-4 sm:px-6 flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{content?.aboutHeroTitle || "About Our Community"}</h1>
          <p className="text-white/70 text-lg font-medium max-w-2xl leading-relaxed">{content?.aboutHeroSubtitle || "Mambog II: A progressive residential barangay in the heart of Bacoor."}</p>
        </div>
      </section>

      <Reveal>
        <section className="container px-4 sm:px-6 -mt-16 pb-24 flex flex-col gap-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-8 border-none shadow-xl shadow-primary/5 rounded-[2.5rem] bg-white overflow-hidden p-8 lg:p-12">
              <div className="flex flex-col gap-10">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary text-primary shadow-sm shrink-0"><Info className="h-5 w-5" /></div>
                  <h2 className="text-2xl font-extrabold text-primary tracking-tight leading-none">Barangay Snapshot</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {snapshotItems.map((item: any) => <SnapshotItem key={item.label} label={item.label} value={item.value} />)}
                </div>

                <div className="flex flex-col gap-6 pt-6 border-t border-primary/5">
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed"><span className="font-bold text-primary">Mambog II</span> {content?.aboutHistoryText || 'is one of the 73 barangays comprising the City of Bacoor. Historically an agricultural area known for its "Mambog" trees, it has transformed into a vibrant urban community. As part of Bacoor\'s rapid urbanization since the 1990s, Mambog II serves as a key residential hub, hosting various subdivisions and providing essential services to thousands of Cavitenos working in Metro Manila and local industries.'}</p>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed"><span className="font-bold text-primary">Governance & Development:</span> {content?.aboutGovernanceText || "The barangay operates under the Local Government Code of 1991, managed by a Sangguniang Barangay headed by the Punong Barangay. We prioritize peace and order, health services, and infrastructure development to support our growing population."}</p>
                </div>
              </div>
            </Card>

            <div className="lg:col-span-4 flex flex-col gap-8">
              <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] bg-white p-8">
                <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-brand-blue" /><h3 className="text-lg font-extrabold text-primary">Population Trend</h3></div>
                  <div className="flex flex-col gap-4">{trendItems.map((item: any, idx: number) => <TrendItem key={item.label} year={item.label} count={item.value} active={idx === trendItems.length - 1} />)}</div>
                </div>
              </Card>

              <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] bg-white p-8">
                <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-brand-blue" /><h3 className="text-lg font-extrabold text-primary">Core Governance</h3></div>
                  <ul className="flex flex-col gap-4 text-xs text-muted-foreground font-medium list-disc pl-4">{coreGovernance.map((line: string) => <li key={line}>{line}</li>)}</ul>
                </div>
              </Card>
            </div>
          </div>

          <div className="flex flex-col gap-12 mt-12">
            <div className="flex flex-col items-center text-center gap-3"><h2 className="text-3xl font-extrabold text-primary tracking-tight">Community Programs</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ProgramCard icon={<Leaf className="h-6 w-6 text-brand-green" />} title="Environmental" desc="Regular 'Linis-Ligtas' drives and strict waste segregation enforcement in coordination with CENRO." />
              <ProgramCard icon={<Heart className="h-6 w-6 text-brand-red" />} title="Health & Social" desc="Weekly medical missions, senior citizen wellness monitoring, and PWD assistance programs." />
              <ProgramCard icon={<ShieldCheck className="h-6 w-6 text-brand-blue" />} title="Peace & Order" desc="24/7 barangay tanod patrols, CCTV monitoring of major streets, and Lupong Tagapamayapa dispute resolution." />
            </div>
          </div>
        </section>
      </Reveal>

      <Footer />
      <Chatbot />
    </div>
  );
}

function SnapshotItem({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-1"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span><span className="text-sm font-extrabold text-primary">{value}</span></div>;
}

function TrendItem({ year, count, active }: { year: string; count: string; active?: boolean }) {
  return <div className={`flex justify-between items-center p-3 rounded-xl ${active ? "bg-secondary text-primary border border-primary/5 shadow-sm" : "text-muted-foreground"}`}><span className="text-xs font-bold">{year}</span><span className="text-xs font-black tracking-tight">{count}</span></div>;
}

function ProgramCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] bg-white p-8 hover:shadow-2xl transition-all"><div className="flex flex-col gap-6"><div className="h-12 w-12 flex items-center justify-center rounded-xl bg-secondary shadow-sm">{icon}</div><div className="flex flex-col gap-3"><h3 className="text-lg font-extrabold text-primary">{title}</h3><p className="text-xs text-muted-foreground font-medium leading-relaxed">{desc}</p></div></div></Card>;
}

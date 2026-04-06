import React, { useEffect, useState } from "react";
import { Phone, Siren } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { api } from "@/lib/api";

export default function EmergencyHotlines() {
  const [hotlines, setHotlines] = useState<any[]>([]);
  const [content, setContent] = useState<{ emergencyHotlinesTitle: string; emergencyHotlinesSubtitle: string }>({
    emergencyHotlinesTitle: "Emergency Hotlines",
    emergencyHotlinesSubtitle: "Keep these numbers saved. Know what to do before you call.",
  });

  useEffect(() => {
    const loadHotlines = async () => {
      try {
        const res = await api.get("/api/services/emergency-hotlines");
        setHotlines((res.data || []).filter((x: any) => x.active !== false));
      } catch {
        setHotlines([]);
      }
    };

    const loadContent = async () => {
      try {
        const res = await api.get("/api/content/site");
        setContent((prev) => ({
          emergencyHotlinesTitle: res?.data?.emergencyHotlinesTitle || prev.emergencyHotlinesTitle,
          emergencyHotlinesSubtitle: res?.data?.emergencyHotlinesSubtitle || prev.emergencyHotlinesSubtitle,
        }));
      } catch {
        setContent((prev) => prev);
      }
    };

    void loadHotlines();
    void loadContent();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      <Header />

      <main className="container mx-auto max-w-6xl flex-grow px-6 py-10">
        <Reveal>
          <div className="relative mb-10 overflow-hidden rounded-[20px] bg-gradient-to-r from-[#de2a2a] to-[#c62828] p-8 text-white shadow-md md:p-10">
            <div className="relative z-10">
              <h1 className="mb-3 flex items-center gap-3 text-3xl font-bold md:text-4xl">
                <Siren size={36} /> {content.emergencyHotlinesTitle}
              </h1>
              <p className="text-sm text-red-100 md:text-base">{content.emergencyHotlinesSubtitle}</p>
            </div>
            <div className="absolute -right-20 -top-40 h-96 w-96 rotate-45 rounded-full bg-white opacity-5"></div>
          </div>
        </Reveal>

        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {hotlines.map((hotline) => (
            <Reveal key={hotline.name}>
              <div className="relative flex h-full flex-col rounded-xl border border-gray-100 border-l-[6px] border-l-[#de2a2a] bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:p-8">
                <div className="absolute right-6 top-6 text-[#de2a2a]">
                  <Phone size={24} strokeWidth={2} />
                </div>

                <div className="mb-4">
                  <h2 className="text-xl font-bold leading-tight text-gray-900">{hotline.name}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{hotline.type}</span>
                </div>

                <div className="mb-3 text-[28px] font-bold tracking-tight text-[#de2a2a]">{hotline.number}</div>
                <p className="mb-6 text-[13px] italic text-gray-600">{hotline.desc}</p>

                <div className="mt-auto grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-[#fff1f2] p-4">
                    <h4 className="mb-2 text-[11px] font-bold uppercase text-[#9f1239]">When to call</h4>
                    <ul className="list-disc space-y-1.5 pl-4 text-[12px] text-gray-800">
                      {(hotline.when || []).map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="mb-2 text-[11px] font-bold uppercase text-gray-700">Prepare info:</h4>
                    <ul className="list-disc space-y-1.5 pl-4 text-[12px] text-gray-700">
                      {(hotline.prepare || []).map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {hotlines.length === 0 ? (
          <div className="mb-10 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            No emergency hotline records available yet.
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

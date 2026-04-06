import { Header } from "@/components/Header";
import { Reveal } from "@/components/Reveal";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
import { useEffect, useMemo, useState } from "react";
import { Building2, Info } from "lucide-react";
import { api } from "@/lib/api";

type Official = {
  _id: string;
  name: string;
  role: string;
  level: "city" | "barangay";
  rankOrder: number;
  committee?: string;
  description?: string;
  image?: string;
};

export default function Officials() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [content, setContent] = useState<{ officialsPageTitle: string; officialsPageSubtitle: string }>({
    officialsPageTitle: "Barangay Officials Directory",
    officialsPageSubtitle: "Meet the dedicated public servants of Barangay Mambog II, committed to transparency and efficient public service.",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [officialsRes, contentRes] = await Promise.all([
          api.get("/api/officials"),
          api.get("/api/content/site"),
        ]);
        setOfficials(officialsRes.data || []);
        setContent((prev) => ({
          officialsPageTitle: contentRes?.data?.officialsPageTitle || prev.officialsPageTitle,
          officialsPageSubtitle: contentRes?.data?.officialsPageSubtitle || prev.officialsPageSubtitle,
        }));
      } catch (err) {
        console.error("Failed to fetch officials", err);
      }
    };

    load();
  }, []);

  const cityOfficials = useMemo(() => officials.filter((o) => o.level === "city"), [officials]);
  const barangayOfficials = useMemo(() => officials.filter((o) => o.level === "barangay"), [officials]);

  const captain = barangayOfficials[0];
  const kagawads = barangayOfficials.slice(1);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-grow">
        <div className="min-h-screen bg-slate-50">
          <Reveal>
            <div className="py-12 md:py-16">
              <div className="container mx-auto px-4 text-center animate-slide-up sm:px-6">
                <h1 className="mb-2 text-3xl font-bold md:text-4xl">{content.officialsPageTitle}</h1>
                <p className="mx-auto max-w-2xl text-sm text-blue md:text-base">
                  {content.officialsPageSubtitle}
                </p>
              </div>
            </div>
          </Reveal>

          <div className="container mx-auto -mt-8 max-w-6xl px-4 py-12 md:px-6">
            <Reveal>
              <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {cityOfficials.map((off) => (
                  <div key={off._id} className="flex flex-col items-start gap-4 rounded-xl border-l-4 border-[#638ECB] bg-white p-6 shadow-lg transition-transform hover:translate-y-1 sm:flex-row sm:items-center sm:gap-6">
                    <img
                      src={off.image || "https://placehold.co/150x150/e2e8f0/475569?text=Official"}
                      className="h-20 w-20 rounded-full border-2 border-gray-100 object-cover md:h-24 md:w-24"
                      alt={off.name}
                    />
                    <div>
                      <h3 className="text-lg font-bold text-[#395886] md:text-xl">{off.name}</h3>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500 md:text-sm">{off.role}</p>
                      <p className="text-[10px] text-gray-400 md:text-xs">{off.description || "City government official."}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <div className="mb-16 flex flex-col gap-8 lg:flex-row">
              <div className="order-2 lg:order-1 lg:w-1/4">
                <Reveal>
                  <div className="sticky top-24 rounded-xl border border-[#D5DEEF] bg-white p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 font-bold text-[#395886]"><Building2 size={18} /> Governance</h3>
                    <ul className="space-y-4 text-sm text-gray-600">
                      <li className="flex gap-2">
                        <div className="mt-1.5 h-[6px] min-w-[6px] rounded-full bg-[#638ECB]" />
                        <span><strong>Sangguniang Barangay:</strong> The legislative body composed of the Punong Barangay and barangay council members.</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="mt-1.5 h-[6px] min-w-[6px] rounded-full bg-[#638ECB]" />
                        <span><strong>SK Council:</strong> Represents the youth, led by the SK Chairperson.</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="mt-1.5 h-[6px] min-w-[6px] rounded-full bg-[#638ECB]" />
                        <span><strong>City Coordination:</strong> Direct alignment with Bacoor City Hall for major projects.</span>
                      </li>
                    </ul>
                    <div className="mt-6 border-t border-gray-100 pt-6 text-xs text-gray-400">
                      <p className="mb-1 flex items-center gap-1 font-bold"><Info size={12} /> Source Note</p>
                      Data reflects active officials from the barangay database.
                    </div>
                  </div>
                </Reveal>
              </div>

              <div className="order-1 lg:order-2 lg:w-3/4">
                {captain && (
                  <Reveal>
                    <div className="mb-8 flex flex-col overflow-hidden rounded-xl border border-[#D5DEEF] bg-white shadow-lg md:mb-10 md:flex-row">
                      <div className="relative h-64 bg-gray-100 md:h-auto md:w-1/3">
                        <img src={captain.image || "https://placehold.co/400x400/e2e8f0/475569?text=Captain"} className="absolute inset-0 h-full w-full object-cover" alt="Captain" />
                      </div>
                      <div className="flex flex-col justify-center p-6 md:w-2/3 md:p-8">
                        <span className="mb-1 text-xs font-bold uppercase tracking-widest text-[#638ECB]">Punong Barangay</span>
                        <h2 className="mb-3 text-2xl font-bold text-[#395886] md:text-3xl">{captain.name}</h2>
                        <p className="mb-4 text-sm leading-relaxed text-gray-600">{captain.description || "Leads governance and local policy implementation."}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Executive</span>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Presiding Officer</span>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                )}

                <Reveal>
                  <h3 className="mb-6 border-b border-[#D5DEEF] pb-2 text-lg font-bold text-[#395886] md:text-xl">Sangguniang Barangay Members</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
                    {kagawads.map((off) => (
                      <div key={off._id} className="group rounded-xl border border-[#D5DEEF] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                        <div className="mb-4 flex items-center gap-4">
                          <img src={off.image || "https://placehold.co/150x150/e2e8f0/475569?text=Official"} className="h-16 w-16 rounded-full border-2 border-gray-100 object-cover transition-colors group-hover:border-[#638ECB]" alt={off.name} />
                          <div>
                            <h4 className="text-sm font-bold leading-tight text-[#395886] md:text-md">{off.name}</h4>
                            <p className="text-xs font-bold uppercase text-gray-400">{off.role}</p>
                          </div>
                        </div>
                        <div className="w-full rounded bg-[#F0F3FA] px-3 py-1.5 text-center text-xs font-medium text-[#395886]">
                          {off.committee || "Barangay Committee"}
                        </div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}

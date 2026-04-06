import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function Hero() {
  const navigate = useNavigate();
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

  return (
    <section className="relative h-[600px] w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url('https://images.pexels.com/photos/8611580/pexels-photo-8611580.jpeg')`,
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#1e2972]/80 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex flex-col justify-center max-w-5xl z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-[2px] bg-white/40" />
          <span className="text-white/80 text-xs font-bold uppercase tracking-[0.2em]">
            {content?.heroEyebrow || "Official Government Portal"}
          </span>
        </div>

        <div className="relative">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight relative z-10">
            {content?.heroTitleLine1 || "Mambog II"} <br />
            <span className="text-white/90">{content?.heroTitleLine2 || "Progressive & Safe"}</span>
          </h1>
          <div className="absolute top-1/2 left-0 -translate-y-1/2 text-7xl md:text-[120px] font-black text-white/5 whitespace-nowrap pointer-events-none select-none z-0">
           
          </div>
        </div>

        <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed relative z-10">
          {content?.heroSubtitle || "A growing residential community in Bacoor City, dedicated to transparent governance and efficient public service."}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            size="lg" 
            className="rounded-md font-bold px-8 h-14 bg-[#4f46e5] hover:bg-[#4338ca] text-white flex items-center gap-2 transition-all shadow-lg"
            onClick={() => navigate("/services")}
          >
            {content?.heroPrimaryCta || "Online Services"}
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="rounded-md font-bold px-8 h-14 bg-white text-primary hover:bg-white/90 border-transparent transition-all shadow-lg"
            onClick={() => navigate("/about")}
          >
            {content?.heroSecondaryCta || "About The Community"}
          </Button>
        </div>
      </div>
    </section>
  );
}

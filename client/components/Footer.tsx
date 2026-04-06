import { Link } from "react-router-dom";
import { Facebook, ExternalLink, MapPin, Phone, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function Footer() {
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
    <footer className="bg-[#1a233a] text-white py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
          {/* Brand Column */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                B
              </div>
              <span className="font-extrabold text-2xl tracking-tight">
                {content?.footerBrandText || "BayanTrack+"}
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-10 max-w-xs">
              {content?.footerDescription || "The official digital portal of Barangay Mambog II, Bacoor, Cavite. Bridging the gap between the barangay hall and the home through technology and transparency."}
            </p>
            <div className="flex gap-4">
              <Link to="https://www.facebook.com/BarangayMambog2" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all border border-white/10">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link to="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all border border-white/10">
                <ExternalLink className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="flex flex-col">
            <h4 className="font-bold text-lg mb-10">Quick Links</h4>
            <nav className="flex flex-col gap-6">
              <Link to="/" className="text-white/60 hover:text-white transition-colors font-medium">Home</Link>
              <Link to="/about" className="text-white/60 hover:text-white transition-colors font-medium">About Us</Link>
              <Link to="/services" className="text-white/60 hover:text-white transition-colors font-medium">Online Services</Link>
              <Link to="/announcements" className="text-white/60 hover:text-white transition-colors font-medium">Announcements</Link>
            </nav>
          </div>

          {/* Contact Column */}
          <div className="flex flex-col">
            <h4 className="font-bold text-lg mb-10">Contact Us</h4>
            <div className="flex flex-col gap-8">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/5 text-blue-400 mt-1">
                  <MapPin className="w-5 h-5" />
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  {content?.footerAddress || "Mambog II Barangay Hall, Bacoor City, Cavite 4102"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/5 text-blue-400">
                  <Phone className="w-5 h-5" />
                </div>
                <p className="text-white/60 text-sm font-medium">
                  {content?.footerPhone || "(046) 417-0000"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/5 text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
                <p className="text-white/60 text-sm font-medium">
                  {content?.footerEmail || "admin@mambog2.gov.ph"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/30 text-xs font-medium">
            © {new Date().getFullYear()} Barangay Mambog II. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <Link to="/terms" className="text-white/30 hover:text-white/50 text-xs font-medium transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="text-white/30 hover:text-white/50 text-xs font-medium transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

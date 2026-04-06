import { MapPin, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function LocationSection() {
  return (
    <section className="py-24 bg-[#f8faff]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden flex flex-col lg:flex-row">
          {/* Map Side */}
          <div className="relative min-h-[320px] lg:w-2/3 lg:min-h-[400px]">
            {/* Map Placeholder */}
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center overflow-hidden">
              {/* Replace this div with your actual map component */} 
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15456.831041076723!2d120.95071224093299!3d14.415183659068795!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d2465cce9473%3A0xbefd6c666643cbf7!2sMambog%20III%2C%20Bacoor%2C%20Cavite!5e0!3m2!1sen!2sph!4v1771863994986!5m2!1sen!2sph"
                width="100%"
                height="100%"
                className="h-full w-full border-0 opacity-100"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Barangay map"
              >
              </iframe>
             
             
    
              

            </div>
          </div>

          {/* Details Side */}
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:w-1/3 lg:p-12">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-extrabold text-primary mb-4 tracking-tight">Locate Us</h3>
            <p className="text-gray-500 text-sm mb-10 leading-relaxed">
              Barangay Mambog II Hall is centrally located to serve all puroks efficiently.
            </p>

            <div className="flex items-start gap-4 mb-10">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-primary mb-1">Standard Hours</h5>
                <p className="text-sm text-gray-500 font-medium">Mon-Fri, 8AM - 5PM</p>
              </div>
            </div>

            <Link to="/contact" className="block">
              <Button className="w-full h-14 bg-[#3b528a] hover:bg-[#2e4170] text-white rounded-xl font-bold text-lg shadow-lg">
                Contact Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

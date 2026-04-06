import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-24">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <span className="text-blue-600 text-xs font-bold uppercase tracking-[0.2em] mb-4 inline-block">
            Page Under Development
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-6 leading-tight tracking-tight">
            {title}
          </h1>
          <p className="text-gray-600 text-lg mb-10 leading-relaxed">
            We are currently building this section of the Mambog II portal. Check back soon for updates, or contact our office for immediate assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="rounded-md font-bold px-8">
              <Link to="/">Back to Home</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-md font-bold px-8">
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

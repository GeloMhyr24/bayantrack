import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-24">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h1 className="text-8xl font-extrabold text-primary/10 mb-4">404</h1>
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-6 leading-tight tracking-tight">
            Page Not Found
          </h2>
          <p className="text-gray-600 text-lg mb-10 leading-relaxed">
            The page you are looking for doesn't exist or has been moved. 
          </p>
          <Button asChild size="lg" className="rounded-md font-bold px-8">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

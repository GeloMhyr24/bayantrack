import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Barangay Updates</h1>
        <p className="text-lg text-gray-700 mb-6">
          Stay informed with the latest updates and announcements from our barangay. Here you can find news about local events, community programs, safety alerts, and more.
        </p>
        </main>
      <Footer />
    </div>
  );
}
import { AlertTriangle } from "lucide-react";
import { Chatbot } from "@/components/Chatbot";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ReportIssue() {
  return (
    <div className="flex min-h-screen flex-col bg-[#e8ecf4]">
      <Header />
      
        <main className="flex flex-grow items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg md:p-10">
            <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ffcccc] text-[#b91c1c]">
                <AlertTriangle size={32} strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Report An Issue</h1>
                <p className="text-sm text-gray-600">
                  Report Issue.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-700">
              Report issue...
            </div>
          </div>
        </main>
      

      <Footer />
      <Chatbot />
    </div>
  );
}

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { QuickActions } from "@/components/QuickActions";
import { CommunityProfile } from "@/components/CommunityProfile";
import { GovernanceSection } from "@/components/GovernanceSection";
import { ProjectsSection } from "@/components/ProjectsSection";
import { LocationSection } from "@/components/LocationSection";
import { FacilitiesSection } from "@/components/FacilitiesSection";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
import { Reveal } from "@/components/Reveal";
import { api } from "@/lib/api";


 

export default function Index() {
  const [email, setEmail] = useState("");
  const [subscribeMessage, setSubscribeMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    try {
      await api.post("/api/subscriptions", { email, source: "homepage" });
      setSubscribeMessage("Subscription saved. You will receive barangay updates.");
      setEmail("");
    } catch (err: any) {
      setSubscribeMessage(err?.response?.data?.msg || "Failed to subscribe. Please try again.");
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        <Reveal><Hero /></Reveal>
        
        <Reveal>
        <QuickActions />
        </Reveal>

        <Reveal><CommunityProfile /></Reveal>
        <Reveal><GovernanceSection /></Reveal>
        <Reveal><ProjectsSection /></Reveal>
        <Reveal><LocationSection /></Reveal>
        <Reveal><FacilitiesSection /></Reveal>


        <Reveal>
        {/* Newsletter Section */}
        <section className="bg-slate-50 py-24 border-y border-gray-100">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 tracking-tight">
              Stay Updated
            </h2>

            <p className="text-gray-500 mb-10 max-w-2xl mx-auto text-lg font-medium">
              Subscribe to receive the latest news, announcements, and emergency alerts from Barangay Mambog II.
            </p>

            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto bg-white p-2 rounded-2xl shadow-xl border border-gray-100"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium text-slate-700"
              />

              <button
                type="submit"
                className="bg-[#3b528a] text-white px-10 py-4 rounded-xl font-extrabold hover:bg-[#2e4170] transition-all shadow-lg active:scale-95"
              >
                Subscribe
              </button>
            </form>
            {subscribeMessage && <p className="mt-4 text-sm text-slate-600">{subscribeMessage}</p>}
          </div>
        </section>
        </Reveal>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Chatbot */}
      <Chatbot />
    </div>
  );
}

import type { ReactNode } from "react";
import { Header } from "../Header";
import { Footer } from "../Footer";
import { Chatbot } from "../Chatbot";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}

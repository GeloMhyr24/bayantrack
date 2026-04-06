import "./global.css";

import Login from "./pages/login/login";
import About from "./pages/about";
import Officials from "./pages/Officials";
import Services from "./pages/Services";
import Weather from "./pages/Weather";
import Contact from "./pages/Contact";
import Announcements from "./pages/Announcements";
import EmergencyHotlines from "./pages/announcements/EmergencyHotlines";
import PHIVOLCS from "./pages/announcements/PHILVOCS";
import FactCheck from "./pages/announcements/FactCheck";
import ReportIssue from "./pages/ReportIssue";
import ProfileSettings from "./pages/ProfileSettings";
import BarangayUpdate from "./pages/announcements/BarangayUpdate";
import AdminDashboard from "./pages/admin/Dashboard";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";

import ProtectedRoute from "./pages/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>
          {/* LOGIN */}
          <Route path="/" element={<Login />} />

          {/* PROTECTED HOME */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />

          {/* OTHER PAGES */}
          <Route path="/about" element={<About />} />
          <Route path="/officials" element={<Officials />} />
          <Route path="/services" element={<Services />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ReportIssue" element={<ReportIssue />} />
          <Route path="/ProfileSettings" element={<ProfileSettings />} />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ANNOUNCEMENTS */}
          <Route path="/announcements" element={<Announcements />} />
          <Route
            path="/announcements/barangay-updates"
            element={<BarangayUpdate />}
          />
          <Route
            path="/announcements/emergency-hotlines"
            element={<EmergencyHotlines />}
          />
          <Route
            path="/announcements/phivolcs-alerts"
            element={<PHIVOLCS />}
          />
          <Route
            path="/announcements/fact-check"
            element={<FactCheck />}
          />
          <Route
            path="/announcements/:category"
            element={<Announcements />}
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

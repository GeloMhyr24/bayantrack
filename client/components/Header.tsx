import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, ChevronDown, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [isAnnouncementsMenuOpen, setIsAnnouncementsMenuOpen] = React.useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [brandText, setBrandText] = React.useState("BAYANTRACK +");

  React.useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await api.get("/api/auth/user", {
          headers: { "x-auth-token": token },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    void fetchUser();
  }, []);

  React.useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await api.get("/api/content/site");
        setBrandText(res.data?.navbarBrandText || "BAYANTRACK +");
      } catch {
        setBrandText("BAYANTRACK +");
      }
    };
    void fetchBrand();
  }, []);

  const navLinks = [
    { label: "Home", href: "/home" },
    { label: "About", href: "/about" },
    { label: "Officials", href: "/officials" },
    { label: "Services", href: "/services" },
    { label: "Weather", href: "/weather" },
    { label: "Contact", href: "/contact" },
  ];

  const announcementsItems = [
    { label: "All News & Updates", path: "/announcements" },
    { label: "Barangay Updates", path: "/announcements/barangay-updates" },
    { label: "Emergency Hotlines", path: "/announcements/emergency-hotlines" },
    { label: "PHIVOLCS Alerts", path: "/announcements/phivolcs-alerts" },
    { label: "Fact Check", path: "/announcements/fact-check" },
  ];

  const isAnnouncementsActive = location.pathname.startsWith("/announcements");
  const isReportActive = location.pathname.startsWith("/ReportIssue");

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:h-20 sm:px-4">
          <Link to="/home" className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-primary/20 bg-primary text-xl font-bold text-white">
              BT
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-extrabold text-primary">{brandText}</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 xl:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={cn(
                    "relative py-1 text-sm font-semibold transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-gray-500",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="relative">
              <button
                className={cn(
                  "flex items-center gap-1 text-sm font-semibold",
                  isAnnouncementsActive ? "text-primary" : "text-gray-500 hover:text-primary",
                )}
                onClick={() => setIsAnnouncementsMenuOpen((value) => !value)}
                type="button"
              >
                Announcements <ChevronDown className="h-4 w-4" />
              </button>
              {isAnnouncementsMenuOpen ? (
                <div className="absolute right-0 top-10 z-20 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  {announcementsItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setIsAnnouncementsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/ReportIssue" className="hidden md:block">
              <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Report Issue</button>
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((value) => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"
                aria-label="Profile menu"
              >
                {user?.avatarImage ? (
                  <img src={user.avatarImage} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </button>

              {isProfileMenuOpen ? (
                <div className="absolute right-0 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <Link
                    to="/ProfileSettings"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Profile Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>

            <button
              className="p-2 xl:hidden"
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-label="Toggle navigation menu"
              type="button"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div className="border-t border-gray-100 bg-white px-4 py-3 xl:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-semibold",
                    location.pathname === link.href ? "bg-slate-100 text-primary" : "text-slate-600",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => setIsAnnouncementsMenuOpen((value) => !value)}
                type="button"
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold",
                  isAnnouncementsActive ? "bg-slate-100 text-primary" : "text-slate-600",
                )}
              >
                <span>Announcements</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isAnnouncementsMenuOpen ? "rotate-180" : "")} />
              </button>
              {isAnnouncementsMenuOpen ? (
                <div className="ml-2 flex flex-col gap-1 border-l border-slate-200 pl-3">
                  {announcementsItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm",
                        location.pathname === item.path ? "bg-slate-100 text-primary" : "text-slate-600",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
              <Link
                to="/ReportIssue"
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-semibold",
                  isReportActive ? "bg-red-50 text-red-700" : "text-slate-600",
                )}
              >
                Report Issue
              </Link>
              <Link
                to="/ProfileSettings"
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-semibold",
                  location.pathname === "/ProfileSettings" ? "bg-slate-100 text-primary" : "text-slate-600",
                )}
              >
                Profile Settings
              </Link>
            </nav>
          </div>
        ) : null}
      </header>
      <div className="h-16 sm:h-20" />
    </>
  );
}

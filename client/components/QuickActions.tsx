import { AlertTriangle, FileText, Megaphone, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ActionCardProps {
  icon: React.ElementType;
  title: string;
  colorClass: string;
  iconColorClass: string;
  bgColorClass: string;
  onClick: () => void;
}

function ActionCard({ icon: Icon, title, colorClass, iconColorClass, bgColorClass, onClick }: ActionCardProps) {
  return (
    <div className={cn(
      "flex min-h-[170px] flex-col items-center justify-center rounded-xl border-b-4 p-5 text-center shadow-md transition-all hover:scale-[1.02] sm:min-h-[190px] sm:p-6",
      bgColorClass,
      colorClass
    )} onClick={onClick}>
      <div className={cn("mb-3 rounded-full p-3 sm:mb-4 sm:p-4", iconColorClass)}>
        <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
      </div>
      <h3 className="text-base font-bold text-slate-800 sm:text-lg">{title}</h3>
    </div>
  );
}

export function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    {
      title: "Report Issue",
      icon: AlertTriangle,
      colorClass: "border-red-500",
      iconColorClass: "text-red-600 bg-red-100",
      bgColorClass: "bg-[#fef2f2]",
      onClick: () => navigate("/ReportIssue"),
    },
    {
      title: "Certificates",
      icon: FileText,
      colorClass: "border-blue-500",
      iconColorClass: "text-blue-600 bg-blue-100",
      bgColorClass: "bg-[#eff6ff]",
      onClick: () => navigate("/services"),
    },
    {
      title: "News & Alerts",
      icon: Megaphone,
      colorClass: "border-amber-500",
      iconColorClass: "text-amber-600 bg-amber-100",
      bgColorClass: "bg-[#fffbeb]",
      onClick: () => navigate("/announcements"),
    },
    {
      title: "Hotlines",
      icon: Phone,
      colorClass: "border-green-500",
      iconColorClass: "text-green-600 bg-green-100",
      bgColorClass: "bg-[#f0fdf4]",
      onClick: () => navigate("/announcements/emergency-hotlines"),
    },
  ];

  return (
    <section className="relative z-10 -mt-8 sm:-mt-14 lg:-mt-20 container mx-auto px-4 max-w-6xl">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {actions.map((action) => (
          <ActionCard key={action.title} {...action} />
        ))}
      </div>
    </section>
  );
}

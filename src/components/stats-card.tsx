import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-[#FF7A00]",
  iconBg = "bg-[#FF7A00]/10",
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-[#121212] p-4 transition-all hover:border-white/10 animate-slide-up",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl mb-3",
          iconBg,
        )}
      >
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <p className="text-xs text-[#A1A1A1] font-medium">{title}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      {subtitle && (
        <p className="text-[10px] text-[#A1A1A1] mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StreakDisplay({
  streak,
  size = "md",
  className,
}: StreakDisplayProps) {
  const isHot = streak >= 7;
  const isOnFire = streak >= 30;

  const sizes = {
    sm: {
      container: "h-9 w-9",
      icon: "h-4 w-4",
      text: "text-lg",
      label: "text-[10px]",
    },
    md: {
      container: "h-12 w-12",
      icon: "h-6 w-6",
      text: "text-2xl",
      label: "text-xs",
    },
    lg: {
      container: "h-16 w-16",
      icon: "h-8 w-8",
      text: "text-4xl",
      label: "text-sm",
    },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl",
          s.container,
          isOnFire
            ? "bg-[#FF7A00]/20 text-[#FF7A00] shadow-lg shadow-[#FF7A00]/10"
            : isHot
              ? "bg-[#FF7A00]/10 text-[#FF9F3F]"
              : "bg-white/[0.06] text-[#A1A1A1]",
        )}
      >
        <Flame
          className={cn(
            s.icon,
            (isHot || isOnFire) &&
              "animate-glow-pulse drop-shadow-[0_0_8px_rgba(255,122,0,0.6)]",
          )}
        />
      </div>
      <div>
        <p
          className={cn(
            s.text,
            "font-bold leading-none",
            isHot ? "text-[#FF7A00]" : "text-white",
          )}
        >
          {streak}
        </p>
        <p className={cn(s.label, "text-[#A1A1A1] mt-0.5")}>day streak</p>
      </div>
    </div>
  );
}

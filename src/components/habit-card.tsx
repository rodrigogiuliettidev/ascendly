"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Coins } from "lucide-react";
import { XpFloat } from "@/components/xp-toast";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  id: string;
  title: string;
  description?: string;
  xpReward: number;
  coinReward: number;
  completedToday: boolean;
  onComplete?: (id: string) => void;
}

export function HabitCard({
  id,
  title,
  description,
  xpReward,
  coinReward,
  completedToday,
  onComplete,
}: HabitCardProps) {
  const [justCompleted, setJustCompleted] = useState(false);

  const handleComplete = () => {
    if (completedToday) return;
    setJustCompleted(true);
    onComplete?.(id);
    setTimeout(() => setJustCompleted(false), 1300);
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#121212] p-4 transition-all duration-200 animate-slide-up",
        completedToday
          ? "border-[#FF7A00]/20 bg-[#FF7A00]/[0.04]"
          : "hover:border-white/10 hover:bg-white/[0.02]",
        justCompleted && "animate-pulse-glow"
      )}
    >
      {/* XP float animation */}
      <XpFloat xp={xpReward} show={justCompleted} />

      {/* Completion button */}
      <button
        onClick={handleComplete}
        disabled={completedToday}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-300",
          completedToday
            ? "border-[#FF7A00] bg-[#FF7A00] text-white shadow-lg shadow-[#FF7A00]/25"
            : "border-white/15 bg-transparent text-transparent hover:border-[#FF7A00]/50 hover:text-[#FF7A00]/50 active:scale-90"
        )}
      >
        <Check className="h-5 w-5" strokeWidth={3} />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold truncate",
          completedToday ? "text-[#A1A1A1] line-through" : "text-white"
        )}>
          {title}
        </p>
        {description && (
          <p className="text-sm text-[#A1A1A1] truncate mt-0.5">{description}</p>
        )}
      </div>

      {/* Rewards */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 rounded-lg bg-[#FF7A00]/10 px-2.5 py-1">
          <Sparkles className="h-3.5 w-3.5 text-[#FF7A00]" />
          <span className="text-xs font-semibold text-[#FF7A00]">{xpReward}</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-[#EAB308]/10 px-2.5 py-1">
          <Coins className="h-3.5 w-3.5 text-[#EAB308]" />
          <span className="text-xs font-semibold text-[#EAB308]">{coinReward}</span>
        </div>
      </div>
    </div>
  );
}

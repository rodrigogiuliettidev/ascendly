"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles, Coins, Gift, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissionCardProps {
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  coinReward: number;
  status: "IN_PROGRESS" | "COMPLETED" | "CLAIMED";
  onClaim?: () => void;
}

export function MissionCard({
  title,
  description,
  progress,
  target,
  xpReward,
  coinReward,
  status,
  onClaim,
}: MissionCardProps) {
  const percentage = Math.min(100, Math.round((progress / target) * 100));
  const isComplete = status === "COMPLETED";
  const isClaimed = status === "CLAIMED";

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-[#121212] p-4 transition-all animate-slide-up",
        isComplete && "border-emerald-500/20 bg-emerald-500/[0.03]",
        isClaimed && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p className={cn(
            "font-semibold text-sm",
            isClaimed ? "line-through text-[#A1A1A1]" : "text-white"
          )}>
            {title}
          </p>
          <p className="text-xs text-[#A1A1A1] mt-0.5">{description}</p>
        </div>
        {isComplete && (
          <Button size="sm" onClick={onClaim} className="shrink-0 gap-1.5 h-8 rounded-lg">
            <Gift className="h-3.5 w-3.5" />
            Claim
          </Button>
        )}
        {isClaimed && (
          <div className="flex items-center gap-1 text-emerald-400 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Done</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#A1A1A1]">{progress} / {target}</span>
          <span className={cn(
            "font-medium",
            isComplete || isClaimed ? "text-emerald-400" : "text-[#FF7A00]"
          )}>{percentage}%</span>
        </div>
        <Progress
          value={percentage}
          className="h-2"
          indicatorClassName={cn(
            isComplete || isClaimed
              ? "bg-emerald-500"
              : "bg-gradient-to-r from-[#FF7A00] to-[#FF9F3F]"
          )}
        />
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs">
        <span className="flex items-center gap-1 text-[#FF7A00]">
          <Sparkles className="h-3 w-3" />
          +{xpReward} XP
        </span>
        <span className="flex items-center gap-1 text-[#EAB308]">
          <Coins className="h-3 w-3" />
          +{coinReward}
        </span>
      </div>
    </div>
  );
}

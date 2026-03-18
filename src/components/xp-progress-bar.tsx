"use client";

import { Progress } from "@/components/ui/progress";

interface XPProgressBarProps {
  currentXP: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
}

export function XPProgressBar({
  currentXP,
  level,
  xpForCurrentLevel,
  xpForNextLevel,
}: XPProgressBarProps) {
  const range = xpForNextLevel - xpForCurrentLevel;
  const progress =
    range > 0
      ? Math.round(((currentXP - xpForCurrentLevel) / range) * 100)
      : 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF7A00] to-[#FF9F3F] text-xs font-bold text-white shadow-lg shadow-[#FF7A00]/20">
            {level}
          </div>
          <span className="font-medium text-white">Level {level}</span>
        </div>
        <span className="text-[#A1A1A1]">
          {currentXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
        </span>
      </div>
      <Progress
        value={progress}
        className="h-3"
        indicatorClassName="bg-gradient-to-r from-[#FF7A00] to-[#FF9F3F] transition-all duration-700 ease-out"
      />
    </div>
  );
}

"use client";

import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WeeklyProgressProps {
  completed: number;
  total: number;
  percentage: number;
}

export function WeeklyProgressCard({
  completed,
  total,
  percentage,
}: WeeklyProgressProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#121212] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#FF7A00]" />
          <span className="text-sm font-semibold text-white">
            Weekly Progress
          </span>
        </div>
        <span className="text-lg font-bold text-[#FF7A00]">{percentage}%</span>
      </div>
      <Progress
        value={percentage}
        className="h-2"
        indicatorClassName="bg-gradient-to-r from-[#FF7A00] to-[#FF9F3F]"
      />
      <p className="text-[11px] text-[#A1A1A1] mt-2">
        {completed} of {total} habits completed this week
      </p>
    </div>
  );
}

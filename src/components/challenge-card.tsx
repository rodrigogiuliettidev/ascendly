"use client";

import { Flame, Target, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  currentDay: number;
  totalDays: number;
  habitsCompletedToday: number;
  totalHabitsToday: number;
  daysRemaining: number;
  isActive: boolean;
}

export function ChallengeCard({
  currentDay,
  totalDays,
  habitsCompletedToday,
  totalHabitsToday,
  daysRemaining,
  isActive,
}: ChallengeCardProps) {
  const progress = (currentDay / totalDays) * 100;
  const todayProgress =
    totalHabitsToday > 0 ? (habitsCompletedToday / totalHabitsToday) * 100 : 0;
  const allCompleted =
    habitsCompletedToday === totalHabitsToday && totalHabitsToday > 0;

  // Circle progress calculation
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-full max-w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#121212] to-[#0B0B0B] p-5 max-[380px]:p-4">
      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FF7A00]/10 rounded-full blur-3xl" />

      <div className="relative flex items-center gap-5 max-[380px]:gap-3">
        {/* Progress Circle */}
        <div className="relative shrink-0">
          <svg
            width="110"
            height="110"
            className="transform -rotate-90 max-[380px]:h-20 max-[380px]:w-20"
          >
            {/* Background circle */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              fill="none"
              stroke="url(#challengeGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient
                id="challengeGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#FF9F3F" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{currentDay}</span>
            <span className="text-[10px] text-[#A1A1A1]">of {totalDays}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#FF7A00]" />
              30-Day Challenge
            </h3>
            <p className="text-[11px] text-[#A1A1A1] mt-0.5">
              {isActive
                ? `${daysRemaining} days remaining`
                : "Challenge completed! 🎉"}
            </p>
          </div>

          {/* Today's progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#A1A1A1] flex items-center gap-1">
                <Target className="h-3 w-3" />
                Today
              </span>
              <span
                className={cn(
                  "font-semibold",
                  allCompleted ? "text-[#10B981]" : "text-white",
                )}
              >
                {habitsCompletedToday}/{totalHabitsToday}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  allCompleted
                    ? "bg-[#10B981]"
                    : "bg-gradient-to-r from-[#FF7A00] to-[#FF9F3F]",
                )}
                style={{ width: `${todayProgress}%` }}
              />
            </div>
            {allCompleted && (
              <p className="text-[10px] text-[#10B981] font-medium">
                ✓ All habits completed today!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

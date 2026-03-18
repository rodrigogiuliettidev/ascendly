"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklyGridProps {
  habits: {
    id: string;
    title: string;
    completions: string[]; // Array of date strings "YYYY-MM-DD"
    daysOfWeek: number[];
  }[];
  weeks?: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_MAP = [1, 2, 3, 4, 5, 6, 0]; // Map index to JS day (Mon=1, Sun=0)

function getWeekDates(weekOffset: number): Date[] {
  const today = new Date();
  const currentDay = today.getUTCDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + mondayOffset - weekOffset * 7);
  monday.setUTCHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatWeekLabel(dates: Date[]): string {
  const start = dates[0];
  const end = dates[6];
  const startMonth = start.toLocaleString("default", { month: "short" });
  const endMonth = end.toLocaleString("default", { month: "short" });

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getUTCDate()} - ${end.getUTCDate()}`;
  }
  return `${startMonth} ${start.getUTCDate()} - ${endMonth} ${end.getUTCDate()}`;
}

export function WeeklyHabitGrid({ habits, weeks = 4 }: WeeklyGridProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const weekData = useMemo(() => {
    const result = [];
    for (let w = 0; w < weeks; w++) {
      const offset = currentWeekOffset + w;
      const dates = getWeekDates(offset);
      result.push({ offset, dates, label: formatWeekLabel(dates) });
    }
    return result.reverse(); // Most recent last
  }, [currentWeekOffset, weeks]);

  const canGoBack = currentWeekOffset < 12;
  const canGoForward = currentWeekOffset > 0;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#121212] to-[#0D0D0D] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF7A00]/10">
            <CalendarDays className="h-4 w-4 text-[#FF7A00]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Weekly Progress</h3>
            <p className="text-[10px] text-[#666666]">Track your consistency</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => canGoBack && setCurrentWeekOffset((o) => o + 1)}
            disabled={!canGoBack}
            className={cn(
              "p-2 rounded-xl transition-all duration-200",
              canGoBack 
                ? "hover:bg-white/5 active:scale-95 text-[#A1A1A1] hover:text-white" 
                : "opacity-30 cursor-not-allowed text-[#666666]"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => canGoForward && setCurrentWeekOffset((o) => o - 1)}
            disabled={!canGoForward}
            className={cn(
              "p-2 rounded-xl transition-all duration-200",
              canGoForward 
                ? "hover:bg-white/5 active:scale-95 text-[#A1A1A1] hover:text-white" 
                : "opacity-30 cursor-not-allowed text-[#666666]"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid Container - Full Width */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="min-w-full p-5">
          {/* Header row with day labels */}
          <div className="flex mb-3">
            <div className="w-28 shrink-0 lg:w-36" />
            <div className="flex-1 flex">
              {weekData.map((week, wi) => (
                <div key={wi} className="flex-1 min-w-0 flex justify-center gap-2 lg:gap-3 px-2">
                  {DAY_LABELS.map((day, di) => (
                    <div
                      key={di}
                      className="w-8 h-6 lg:w-10 flex items-center justify-center text-[10px] lg:text-xs font-medium text-[#666666]"
                    >
                      {wi === 0 ? day.substring(0, 1) : ""}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Habit rows */}
          {habits.map((habit, hi) => (
            <div 
              key={habit.id} 
              className={cn(
                "flex items-center py-2 transition-colors",
                hi % 2 === 0 ? "bg-white/[0.01]" : "",
                "hover:bg-white/[0.02]"
              )}
            >
              <div className="w-28 shrink-0 lg:w-36 pr-3">
                <span className="text-xs lg:text-sm text-white font-medium truncate block">
                  {habit.title}
                </span>
              </div>
              <div className="flex-1 flex">
                {weekData.map((week, wi) => (
                  <div key={wi} className="flex-1 min-w-0 flex justify-center gap-2 lg:gap-3 px-2">
                    {week.dates.map((date, di) => {
                      const dateStr = formatDate(date);
                      const dayOfWeek = DAY_MAP[di];
                      const isScheduled = habit.daysOfWeek.includes(dayOfWeek);
                      const isCompleted = habit.completions.includes(dateStr);
                      const isToday = dateStr === formatDate(new Date());
                      const isFuture = date > new Date();

                      return (
                        <div
                          key={di}
                          className={cn(
                            "w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                            isToday && "ring-2 ring-[#FF7A00]/40 ring-offset-1 ring-offset-[#0D0D0D]",
                          )}
                          title={`${habit.title} - ${dateStr}`}
                        >
                          <div
                            className={cn(
                              "w-6 h-6 lg:w-7 lg:h-7 rounded-full transition-all duration-300 cursor-pointer",
                              isFuture
                                ? "bg-white/[0.03]"
                                : isCompleted
                                  ? "bg-gradient-to-br from-[#FF7A00] to-[#FF9F3F] shadow-[0_0_12px_rgba(255,122,0,0.4)] hover:shadow-[0_0_20px_rgba(255,122,0,0.6)] hover:scale-110"
                                  : isScheduled
                                    ? "border-2 border-white/20 hover:border-white/40 hover:bg-white/5"
                                    : "bg-white/[0.03]",
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Week labels */}
          <div className="flex mt-4 pt-3 border-t border-white/[0.04]">
            <div className="w-28 shrink-0 lg:w-36" />
            <div className="flex-1 flex">
              {weekData.map((week, wi) => (
                <div
                  key={wi}
                  className="flex-1 min-w-0 text-center px-2"
                >
                  <span className="text-[10px] lg:text-xs text-[#666666] font-medium">
                    {week.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend - Full Width */}
      <div className="flex items-center justify-center gap-6 lg:gap-8 px-5 py-4 border-t border-white/[0.04] bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FF9F3F] shadow-[0_0_8px_rgba(255,122,0,0.3)]" />
          <span className="text-[10px] lg:text-xs text-[#A1A1A1]">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full border-2 border-white/20" />
          <span className="text-[10px] lg:text-xs text-[#A1A1A1]">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-white/[0.03]" />
          <span className="text-[10px] lg:text-xs text-[#A1A1A1]">Rest day</span>
        </div>
      </div>
    </div>
  );
}

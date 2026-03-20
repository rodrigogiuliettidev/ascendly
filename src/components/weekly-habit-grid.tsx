"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklyGridProps {
  habits: {
    id: string;
    title: string;
    completions: string[]; // Array of date strings "YYYY-MM-DD"
    daysOfWeek: number[];
  }[];
}

const DAY_MAP = [0, 1, 2, 3, 4, 5, 6]; // Map index to JS day (Sun=0, Sat=6)
const WEEKDAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Format date as YYYY-MM-DD using LOCAL timezone.
 * This must match the server's getLogicalDateString function.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date string in local timezone.
 */
function getTodayString(): string {
  return formatDate(new Date());
}

function getWeekDates(weekOffset: number): Date[] {
  const today = new Date();
  const currentDay = today.getDay(); // Local day of week (0-6)

  // Get Sunday of the current/offset week
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - currentDay - weekOffset * 7);
  sunday.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatWeekLabel(dates: Date[]): string {
  const start = dates[0];
  const end = dates[6];
  const startMonth = start.toLocaleString("default", { month: "short" });
  const endMonth = end.toLocaleString("default", { month: "short" });

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
}

export function WeeklyHabitGrid({ habits }: WeeklyGridProps) {
  const currentWeek = useMemo(() => {
    const dates = getWeekDates(0);
    return { dates, label: formatWeekLabel(dates) };
  }, []);

  const todayStr = useMemo(() => getTodayString(), []);

  return (
    <div className="w-full max-w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#121212] to-[#0D0D0D]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF7A00]/10">
            <CalendarDays className="h-4 w-4 text-[#FF7A00]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Weekly Progress
            </h3>
            <p className="text-[10px] text-[#666666]">Track your consistency</p>
          </div>
        </div>
        <span className="text-[10px] lg:text-xs text-[#666666] font-medium">
          {currentWeek.label}
        </span>
      </div>

      {/* Grid Container - Full Width */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="min-w-[18rem] p-3 max-[380px]:min-w-[17rem] max-[380px]:px-2 max-[380px]:py-3 sm:min-w-full sm:p-5">
          {/* Header row with day labels */}
          <div className="mb-2.5 flex sm:mb-3">
            <div className="w-20 shrink-0 pr-2 max-[380px]:w-16 max-[380px]:pr-1 sm:w-28 lg:w-36" />
            <div className="flex flex-1 justify-center gap-1 px-1 max-[380px]:gap-0.5 max-[380px]:px-0.5 sm:gap-2 sm:px-2 lg:gap-3">
              {WEEKDAY_ORDER.map((day, di) => (
                <div
                  key={di}
                  className="flex h-5 w-6 items-center justify-center text-[9px] font-medium text-[#666666] max-[380px]:h-4 max-[380px]:w-5 max-[380px]:text-[8px] sm:h-6 sm:w-8 sm:text-[10px] lg:w-10 lg:text-xs"
                >
                  {day.substring(0, 1)}
                </div>
              ))}
            </div>
          </div>

          {/* Habit rows */}
          {habits.map((habit, hi) => (
            <div
              key={habit.id}
              className={cn(
                "flex items-center py-1.5 transition-colors sm:py-2",
                hi % 2 === 0 ? "bg-white/[0.01]" : "",
                "hover:bg-white/[0.02]",
              )}
            >
              <div className="w-20 shrink-0 pr-2 max-[380px]:w-16 max-[380px]:pr-1 sm:w-28 sm:pr-3 lg:w-36">
                <span className="block truncate text-[10px] font-medium text-white max-[380px]:text-[9px] sm:text-xs lg:text-sm">
                  {habit.title}
                </span>
              </div>
              <div className="flex flex-1 justify-center gap-1 px-1 max-[380px]:gap-0.5 max-[380px]:px-0.5 sm:gap-2 sm:px-2 lg:gap-3">
                {currentWeek.dates.map((date, di) => {
                  const dateStr = formatDate(date);
                  const dayOfWeek = DAY_MAP[di];
                  const isScheduled = habit.daysOfWeek.includes(dayOfWeek);
                  const isCompleted = habit.completions.includes(dateStr);
                  const isToday = dateStr === todayStr;
                  const isFuture = dateStr > todayStr;

                  return (
                    <div
                      key={di}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-200 max-[380px]:h-5 max-[380px]:w-5 max-[380px]:rounded-md sm:h-8 sm:w-8 sm:rounded-xl lg:h-10 lg:w-10",
                        isToday &&
                          "ring-2 ring-[#FF7A00]/40 ring-offset-1 ring-offset-[#0D0D0D]",
                      )}
                      title={`${habit.title} - ${dateStr}`}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 cursor-pointer rounded-full transition-all duration-300 max-[380px]:h-3 max-[380px]:w-3 sm:h-6 sm:w-6 lg:h-7 lg:w-7",
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
            </div>
          ))}

          {/* Week labels */}
          <div className="flex mt-4 pt-3 border-t border-white/[0.04]">
            <div className="w-20 shrink-0 max-[380px]:w-16 sm:w-28 lg:w-36" />
            <div className="flex-1 text-center px-2">
              <span className="text-[10px] lg:text-xs text-[#666666] font-medium">
                {currentWeek.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend - Full Width */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/[0.04] bg-white/[0.01] px-4 py-3 sm:gap-x-6 sm:px-5 sm:py-4 lg:gap-8">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FF9F3F] shadow-[0_0_8px_rgba(255,122,0,0.3)] sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
          <span className="text-[9px] text-[#A1A1A1] sm:text-[10px] lg:text-xs">
            Completed
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-white/20 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
          <span className="text-[9px] text-[#A1A1A1] sm:text-[10px] lg:text-xs">
            Scheduled
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-white/[0.03] sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
          <span className="text-[9px] text-[#A1A1A1] sm:text-[10px] lg:text-xs">
            Rest day
          </span>
        </div>
      </div>
    </div>
  );
}

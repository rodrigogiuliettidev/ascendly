"use client";

import { useMemo } from "react";

interface HeatmapDay {
  date: string;
  count: number;
}

interface HeatmapProps {
  data: HeatmapDay[];
  weeks?: number;
}

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-[#1A1A1A]";
  if (count === 1) return "bg-[#FF7A00]/20";
  if (count === 2) return "bg-[#FF7A00]/40";
  if (count === 3) return "bg-[#FF7A00]/60";
  if (count >= 4) return "bg-[#FF7A00]/80";
  return "bg-[#FF7A00]";
}

export function Heatmap({ data, weeks = 16 }: HeatmapProps) {
  const grid = useMemo(() => {
    const today = new Date();
    const totalDays = weeks * 7;
    const dataMap = new Map(data.map((d) => [d.date, d.count]));

    const days: { date: string; count: number; dayOfWeek: number }[] = [];

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      days.push({
        date: key,
        count: dataMap.get(key) || 0,
        dayOfWeek: date.getDay(),
      });
    }

    // Group by weeks
    const weekColumns: (typeof days)[] = [];
    let currentWeek: typeof days = [];

    for (const day of days) {
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        weekColumns.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    }
    if (currentWeek.length > 0) weekColumns.push(currentWeek);

    return weekColumns;
  }, [data, weeks]);

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="w-full">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="h-[14px] text-[10px] text-[#A1A1A1] leading-[14px]"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[3px] overflow-x-auto">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, di) => {
                const day = week.find((d) => d.dayOfWeek === di);
                if (!day) {
                  return <div key={di} className="w-[14px] h-[14px]" />;
                }
                return (
                  <div
                    key={di}
                    className={`w-[14px] h-[14px] rounded-[3px] ${getIntensityClass(day.count)} transition-colors duration-200 hover:ring-1 hover:ring-[#FF7A00]/50 cursor-pointer`}
                    title={`${day.date}: ${day.count} habits`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-[10px] text-[#A1A1A1] mr-1">Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`w-[12px] h-[12px] rounded-[2px] ${getIntensityClass(level)}`}
          />
        ))}
        <span className="text-[10px] text-[#A1A1A1] ml-1">More</span>
      </div>
    </div>
  );
}

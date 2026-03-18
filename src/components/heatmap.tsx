"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function Heatmap({ data, weeks = 16 }: HeatmapProps) {
  const [compactWeeks, setCompactWeeks] = useState(weeks);
  const [tooltip, setTooltip] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 380px)");
    const applyWeeks = () => {
      setCompactWeeks(media.matches ? Math.min(weeks, 12) : weeks);
    };

    applyWeeks();
    media.addEventListener("change", applyWeeks);
    return () => media.removeEventListener("change", applyWeeks);
  }, [weeks]);

  const grid = useMemo(() => {
    const today = new Date();
    const totalDays = compactWeeks * 7;
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
  }, [compactWeeks, data]);

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  const handleMouseEnter = (
    e: React.MouseEvent,
    date: string,
    count: number,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      date,
      count,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="w-full relative">
      <div className="flex gap-1 max-[380px]:gap-0.5">
        {/* Day labels */}
        <div className="mr-1 flex flex-col gap-[3px] max-[380px]:mr-0.5 max-[380px]:gap-[2px]">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="h-[14px] text-[10px] leading-[14px] text-[#A1A1A1] max-[380px]:h-3 max-[380px]:text-[9px] max-[380px]:leading-3"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[3px] overflow-x-auto max-[380px]:gap-[2px]">
          {grid.map((week, wi) => (
            <div
              key={wi}
              className="flex flex-col gap-[3px] max-[380px]:gap-[2px]"
            >
              {Array.from({ length: 7 }, (_, di) => {
                const day = week.find((d) => d.dayOfWeek === di);
                if (!day) {
                  return (
                    <div
                      key={di}
                      className="h-[14px] w-[14px] max-[380px]:h-3 max-[380px]:w-3"
                    />
                  );
                }
                return (
                  <div
                    key={di}
                    className={cn(
                      "h-[14px] w-[14px] cursor-pointer rounded-[3px] transition-all duration-200 max-[380px]:h-3 max-[380px]:w-3",
                      getIntensityClass(day.count),
                      "hover:ring-2 hover:ring-[#FF7A00]/50 hover:scale-110",
                    )}
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, day.date, day.count)
                    }
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-lg bg-[#1A1A1A] border border-white/10 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
          }}
        >
          <p className="text-xs font-medium text-white">
            {tooltip.count} habit{tooltip.count !== 1 ? "s" : ""}
          </p>
          <p className="text-[10px] text-[#A1A1A1]">
            {formatDate(tooltip.date)}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1 max-[380px]:gap-0.5">
        <span className="text-[10px] text-[#A1A1A1] mr-1">Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-[12px] w-[12px] rounded-[2px] max-[380px]:h-[10px] max-[380px]:w-[10px]",
              getIntensityClass(level),
            )}
          />
        ))}
        <span className="text-[10px] text-[#A1A1A1] ml-1">More</span>
      </div>
    </div>
  );
}

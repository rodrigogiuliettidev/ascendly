"use client";

import { useState, useEffect } from "react";
import { Crown, Medal, Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useApi } from "@/hooks/use-api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RankingEntry {
  position: number;
  userId: string;
  name: string;
  xpEarned: number;
  level: number;
  isCurrentUser: boolean;
}

interface RankingData {
  ranking: RankingEntry[];
  userPosition: { position: number; xpEarned: number } | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const podiumColors = {
  1: {
    bg: "bg-[#FFD700]/10",
    border: "border-[#FFD700]/30",
    text: "text-[#FFD700]",
    ring: "ring-[#FFD700]/40",
    shadow: "shadow-[#FFD700]/10",
  },
  2: {
    bg: "bg-[#C0C0C0]/10",
    border: "border-[#C0C0C0]/30",
    text: "text-[#C0C0C0]",
    ring: "ring-[#C0C0C0]/40",
    shadow: "shadow-[#C0C0C0]/10",
  },
  3: {
    bg: "bg-[#CD7F32]/10",
    border: "border-[#CD7F32]/30",
    text: "text-[#CD7F32]",
    ring: "ring-[#CD7F32]/40",
    shadow: "shadow-[#CD7F32]/10",
  },
} as const;

export default function RankingPage() {
  const { user } = useAuth();
  const { get } = useApi();

  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchRanking() {
      setLoading(true);
      try {
        const res = await get<RankingData>("/api/ranking");
        setData(res);
      } catch (err) {
        console.error("Fetch ranking error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, [user, get]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF7A00]" />
      </div>
    );
  }

  const { ranking, userPosition } = data;
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Medal className="h-5 w-5 text-[#FF7A00]" />
          Weekly Ranking
        </h1>
        <p className="text-sm text-[#A1A1A1]">
          Top players this week based on XP earned
        </p>
      </div>

      {/* Podium — Top 3 */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 items-end">
          <PodiumCard entry={top3[1]} />
          <PodiumCard entry={top3[0]} isFirst />
          <PodiumCard entry={top3[2]} />
        </div>
      )}

      {/* Current user position highlight */}
      {userPosition && (
        <div className="rounded-2xl border border-[#FF7A00]/20 bg-[#FF7A00]/[0.06] p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF7A00]/20">
            <TrendingUp className="h-5 w-5 text-[#FF7A00]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              Your Position:{" "}
              <span className="text-[#FF7A00]">#{userPosition.position}</span>
            </p>
            <p className="text-xs text-[#A1A1A1]">
              {userPosition.xpEarned.toLocaleString()} XP earned this week
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {ranking.length === 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#121212] p-12 text-center">
          <p className="text-[#A1A1A1] text-sm">
            No ranking data yet. Start completing habits to climb the
            leaderboard!
          </p>
        </div>
      )}

      {/* Remaining rankings */}
      {rest.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#121212] overflow-hidden">
          {rest.map((entry, i) => (
            <div
              key={entry.position}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 border-b border-white/[0.04] last:border-0 transition-colors animate-slide-up",
                entry.isCurrentUser
                  ? "bg-[#FF7A00]/[0.06]"
                  : "hover:bg-white/[0.02]",
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Position */}
              <span
                className={cn(
                  "w-8 text-center text-sm font-bold",
                  entry.isCurrentUser ? "text-[#FF7A00]" : "text-[#A1A1A1]",
                )}
              >
                {entry.position}
              </span>

              {/* Avatar */}
              <Avatar
                className={cn(
                  "h-10 w-10",
                  entry.isCurrentUser && "ring-2 ring-[#FF7A00]/40",
                )}
              >
                <AvatarFallback className="text-xs">
                  {getInitials(entry.name)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold truncate",
                    entry.isCurrentUser ? "text-[#FF7A00]" : "text-white",
                  )}
                >
                  {entry.name}
                  {entry.isCurrentUser && (
                    <span className="text-[#A1A1A1] font-normal ml-1">
                      (you)
                    </span>
                  )}
                </p>
                <p className="text-xs text-[#A1A1A1]">Level {entry.level}</p>
              </div>

              {/* XP */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[#FF7A00]">
                  {entry.xpEarned.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#A1A1A1]">XP</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PodiumCard({
  entry,
  isFirst = false,
}: {
  entry: RankingEntry;
  isFirst?: boolean;
}) {
  const pos = entry.position as 1 | 2 | 3;
  const colors = podiumColors[pos];

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border p-4 transition-all animate-slide-up",
        colors.bg,
        colors.border,
        isFirst ? "py-6" : "py-4",
      )}
    >
      {isFirst && (
        <Crown className="h-6 w-6 text-[#FFD700] mb-2 animate-glow-pulse" />
      )}

      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold mb-2",
          pos === 1
            ? "bg-[#FFD700]/20 text-[#FFD700]"
            : pos === 2
              ? "bg-[#C0C0C0]/20 text-[#C0C0C0]"
              : "bg-[#CD7F32]/20 text-[#CD7F32]",
        )}
      >
        {pos}
      </div>

      <Avatar
        className={cn(
          "ring-2 shadow-lg mb-2",
          colors.ring,
          colors.shadow,
          isFirst ? "h-16 w-16" : "h-12 w-12",
        )}
      >
        <AvatarFallback className={cn("text-sm", isFirst && "text-lg")}>
          {getInitials(entry.name)}
        </AvatarFallback>
      </Avatar>

      <p
        className={cn(
          "font-semibold text-white text-center truncate w-full",
          isFirst ? "text-sm" : "text-xs",
        )}
      >
        {entry.name}
      </p>

      <div className="flex items-center gap-1 mt-1">
        <Sparkles className={cn("h-3 w-3", colors.text)} />
        <span className={cn("text-xs font-bold", colors.text)}>
          {entry.xpEarned.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

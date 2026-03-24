"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Sparkles,
  Coins,
  Trophy,
  Flame,
  Target,
  Crown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { XPProgressBar } from "@/components/xp-progress-bar";
import { StreakDisplay } from "@/components/streak-display";
import { HabitCard } from "@/components/habit-card";
import { MissionCard } from "@/components/mission-card";
import { StatsCard } from "@/components/stats-card";
import { Heatmap } from "@/components/heatmap";
import { AchievementPreview } from "@/components/achievement-preview";
import { XpToast } from "@/components/xp-toast";
import { ChallengeCard } from "@/components/challenge-card";
import { WeeklyProgressCard } from "@/components/weekly-progress";
import { WeeklyHabitGrid } from "@/components/weekly-habit-grid";
import { XpBalanceModal } from "@/components/xp-balance-modal";
import { useAuth } from "@/hooks/use-auth";
import { useApi } from "@/hooks/use-api";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HabitData {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  coinReward: number;
  completedToday: boolean;
}

interface MissionData {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  coinReward: number;
  status: "IN_PROGRESS" | "COMPLETED" | "CLAIMED";
}

interface RankingEntry {
  position: number;
  userId: string;
  name: string;
  xpEarned: number;
  level: number;
  isCurrentUser: boolean;
  isPlaceholder?: boolean;
}

interface AchievementData {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface ChallengeData {
  currentDay: number;
  totalDays: number;
  habitsCompletedToday: number;
  totalHabitsToday: number;
  daysRemaining: number;
  isActive: boolean;
}

interface WeeklyProgressData {
  completed: number;
  total: number;
  percentage: number;
}

interface XpSummaryData {
  gained: number;
  lost: number;
  net: number;
  total: number;
}

interface WeeklyHabitData {
  id: string;
  title: string;
  daysOfWeek: number[];
  completions: string[];
}

function xpForLevel(level: number) {
  return level * level * 100;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const { get, post } = useApi();
  const router = useRouter();

  const [habits, setHabits] = useState<HabitData[]>([]);
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [userPosition, setUserPosition] = useState<{
    position: number;
    xpEarned: number;
  } | null>(null);
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [weeklyProgress, setWeeklyProgress] =
    useState<WeeklyProgressData | null>(null);
  const [xpSummary, setXpSummary] = useState<XpSummaryData | null>(null);
  const [weeklyHabits, setWeeklyHabits] = useState<WeeklyHabitData[]>([]);
  const [showXpModal, setShowXpModal] = useState(false);
  const [heatmapData, setHeatmapData] = useState<
    { date: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [xpToast, setXpToast] = useState<{
    xp: number;
    coins: number;
    show: boolean;
  }>({ xp: 0, coins: 0, show: false });

  // Fetch all dashboard data
  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [
          habitsRes,
          missionsRes,
          rankingRes,
          achievementsRes,
          heatmapRes,
          challengeRes,
          xpRes,
          weeklyHabitsRes,
          weeklyProgressRes,
        ] = await Promise.allSettled([
          get<HabitData[]>("/api/habits"),
          get<MissionData[]>("/api/missions"),
          get<{
            ranking: RankingEntry[];
            userPosition: { position: number; xpEarned: number } | null;
          }>("/api/ranking"),
          get<AchievementData[]>("/api/achievements"),
          get<{ date: string; count: number }[]>("/api/heatmap"),
          get<ChallengeData>("/api/challenge"),
          get<XpSummaryData>("/api/xp"),
          get<{ habits: WeeklyHabitData[] }>("/api/habits/weekly"),
          get<WeeklyProgressData>("/api/habits/weekly-progress"),
        ]);

        if (habitsRes.status === "fulfilled") {
          setHabits(habitsRes.value);
        }
        if (missionsRes.status === "fulfilled") setMissions(missionsRes.value);
        if (rankingRes.status === "fulfilled") {
          setRanking(rankingRes.value.ranking.slice(0, 5));
          setUserPosition(rankingRes.value.userPosition);
        }
        if (achievementsRes.status === "fulfilled") {
          setAchievements(achievementsRes.value.slice(0, 4));
        }
        if (heatmapRes.status === "fulfilled") {
          setHeatmapData(heatmapRes.value);
        }
        if (challengeRes.status === "fulfilled") {
          setChallenge(challengeRes.value);
        }
        if (xpRes.status === "fulfilled") {
          setXpSummary(xpRes.value);
        }
        if (weeklyHabitsRes.status === "fulfilled") {
          setWeeklyHabits(weeklyHabitsRes.value.habits);
        }
        if (weeklyProgressRes.status === "fulfilled") {
          setWeeklyProgress(weeklyProgressRes.value);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, get]);

  const handleComplete = async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit || habit.completedToday) return;

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completedToday: true } : h)),
    );

    try {
      const result = await post<{
        xp: number;
        level: number;
        coins: number;
        streak: number;
        leveledUp: boolean;
      }>(`/api/habits/${id}/complete`);

      setXpToast({ xp: habit.xpReward, coins: habit.coinReward, show: true });

      // Refresh user data to get updated XP/coins/streak
      await refreshUser();

      // Refresh missions (progress may have changed)
      try {
        const updatedMissions = await get<MissionData[]>("/api/missions");
        setMissions(updatedMissions);
      } catch {
        /* ignore */
      }

      // Refresh heatmap
      try {
        const updatedHeatmap =
          await get<{ date: string; count: number }[]>("/api/heatmap");
        setHeatmapData(updatedHeatmap);
      } catch {
        /* ignore */
      }

      // Refresh achievements
      try {
        const updatedAchievements =
          await get<AchievementData[]>("/api/achievements");
        setAchievements(updatedAchievements.slice(0, 4));
      } catch {
        /* ignore */
      }

      // Refresh weekly progress
      try {
        const updatedWeeklyProgress = await get<WeeklyProgressData>(
          "/api/habits/weekly-progress",
        );
        setWeeklyProgress(updatedWeeklyProgress);
      } catch {
        /* ignore */
      }
    } catch (err) {
      // Revert optimistic update on error
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, completedToday: false } : h)),
      );
      console.error("Complete habit error:", err);
    }
  };

  const handleXpToastComplete = useCallback(() => {
    setXpToast((prev) => ({ ...prev, show: false }));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF7A00]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const completedCount = habits.filter((h) => h.completedToday).length;
  const initials = getInitials(user.name);
  const rankingValue = userPosition ? `#${userPosition.position}` : "—";
  const rankingSubtitle = userPosition ? "This week" : "No data yet";

  return (
    <div className="space-y-6 overflow-x-clip">
      {/* ── Hero: Avatar + Level + XP + Streak ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#121212] p-5">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-14 w-14 ring-2 ring-[#FF7A00]/40 shadow-lg shadow-[#FF7A00]/10">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">
              Welcome back, {user.name} 👋
            </h1>
            <p className="text-sm text-[#A1A1A1]">
              {completedCount}/{habits.length} habits completed today
            </p>
          </div>
          <StreakDisplay streak={user.streak} size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <XPProgressBar
              currentXP={user.xp}
              level={user.level}
              xpForCurrentLevel={xpForLevel(user.level)}
              xpForNextLevel={xpForLevel(user.level + 1)}
            />
          </div>
          <button
            onClick={() => setShowXpModal(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="View XP details"
          >
            <Info className="h-4 w-4 text-[#A1A1A1]" />
          </button>
        </div>
      </div>

      {/* ── Challenge + Weekly Progress ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {challenge && (
          <ChallengeCard
            currentDay={challenge.currentDay}
            totalDays={challenge.totalDays}
            habitsCompletedToday={challenge.habitsCompletedToday}
            totalHabitsToday={challenge.totalHabitsToday}
            daysRemaining={challenge.daysRemaining}
            isActive={challenge.isActive}
          />
        )}
        {weeklyProgress && (
          <WeeklyProgressCard
            completed={weeklyProgress.completed}
            total={weeklyProgress.total}
            percentage={weeklyProgress.percentage}
          />
        )}
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Total XP"
          value={user.xp.toLocaleString()}
          icon={Sparkles}
          iconColor="text-[#FF7A00]"
          iconBg="bg-[#FF7A00]/10"
        />
        <StatsCard
          title="Coins"
          value={user.coins.toLocaleString()}
          icon={Coins}
          iconColor="text-[#EAB308]"
          iconBg="bg-[#EAB308]/10"
        />
        <StatsCard
          title="Ranking"
          value={rankingValue}
          subtitle={rankingSubtitle}
          icon={Trophy}
          iconColor="text-[#FF9F3F]"
          iconBg="bg-[#FF9F3F]/10"
        />
        <StatsCard
          title="Completed"
          value={`${completedCount}/${habits.length}`}
          subtitle="habits today"
          icon={CheckCircle2}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid items-start gap-6 lg:grid-cols-5">
        {/* Today's Habits — 3 columns */}
        <div className="space-y-4 min-w-0 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-[#FF7A00]" />
              Today&apos;s Habits
            </h2>
            <Link
              href="/habits"
              className="text-xs text-[#FF7A00] font-medium flex items-center gap-0.5 hover:underline"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {habits.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-[#121212] p-8 text-center">
                <p className="text-[#A1A1A1] text-sm">
                  No habits yet.{" "}
                  <Link
                    href="/habits"
                    className="text-[#FF7A00] hover:underline"
                  >
                    Create your first habit
                  </Link>
                </p>
              </div>
            ) : (
              habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  id={habit.id}
                  title={habit.title}
                  description={habit.description || ""}
                  xpReward={habit.xpReward}
                  coinReward={habit.coinReward}
                  completedToday={habit.completedToday}
                  onComplete={handleComplete}
                />
              ))
            )}
          </div>

          {/* Habit Consistency Heatmap */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#121212] p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Flame className="h-4 w-4 text-[#FF7A00]" />
              Habit Consistency
            </h3>
            <Heatmap data={heatmapData} weeks={16} />
          </div>

          {/* Weekly Habit Grid */}
          {weeklyHabits.length > 0 && <WeeklyHabitGrid habits={weeklyHabits} />}
        </div>

        {/* Right column — Missions + Achievements + Ranking */}
        <div className="space-y-6 min-w-0 lg:col-span-2">
          {/* Achievements Preview */}
          <AchievementPreview
            achievements={achievements.map((a) => ({
              id: a.id,
              title: a.title,
              description: a.description,
              icon: a.icon || "target",
              unlocked: a.unlocked,
            }))}
          />

          {/* Daily Missions */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#FF7A00]" />
              Daily Missions
            </h2>
            <div className="space-y-2">
              {missions.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.06] bg-[#121212] p-4 text-center">
                  <p className="text-[#A1A1A1] text-sm">
                    No missions available
                  </p>
                </div>
              ) : (
                missions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    title={mission.title}
                    description={mission.description}
                    progress={mission.progress}
                    target={mission.target}
                    xpReward={mission.xpReward}
                    coinReward={mission.coinReward}
                    status={mission.status}
                    onClaim={() => {}}
                  />
                ))
              )}
            </div>
          </div>

          {/* Mini Ranking */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#FF9F3F]" />
                Global Ranking
              </h2>
              <Link
                href="/ranking"
                className="text-xs text-[#FF7A00] font-medium flex items-center gap-0.5 hover:underline"
              >
                See all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-[#121212] overflow-hidden">
              {ranking.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-[#A1A1A1] text-sm">No ranking data yet</p>
                </div>
              ) : (
                ranking.map((entry) => (
                  <div
                    key={entry.position}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 transition-colors ${
                      entry.isPlaceholder
                        ? "opacity-60"
                        : entry.isCurrentUser
                        ? "bg-[#FF7A00]/[0.06]"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <span
                      className={`w-6 text-center text-sm font-bold ${
                        entry.position === 1
                          ? "text-[#FFD700]"
                          : entry.position === 2
                            ? "text-[#C0C0C0]"
                            : entry.position === 3
                              ? "text-[#CD7F32]"
                              : entry.isCurrentUser
                                ? "text-[#FF7A00]"
                                : "text-[#A1A1A1]"
                      }`}
                    >
                      {entry.position <= 3 ? (
                        <Crown className="h-4 w-4 mx-auto" />
                      ) : (
                        entry.position
                      )}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[10px]">
                        {entry.isPlaceholder ? "—" : getInitials(entry.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`flex-1 text-sm font-medium truncate ${
                        entry.isPlaceholder
                          ? "text-[#9CA3AF]"
                          : entry.isCurrentUser
                            ? "text-[#FF7A00]"
                            : "text-white"
                      }`}
                    >
                      {entry.isPlaceholder ? "No player yet" : entry.name}
                      {entry.isCurrentUser && !entry.isPlaceholder && (
                        <span className="text-[#A1A1A1] text-xs ml-1">
                          (you)
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-semibold text-[#FF7A00]">
                      {entry.xpEarned.toLocaleString()} XP
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* XP Toast Animation */}
      <XpToast
        xp={xpToast.xp}
        coins={xpToast.coins}
        show={xpToast.show}
        onComplete={handleXpToastComplete}
      />

      {/* XP Balance Modal */}
      {xpSummary && (
        <XpBalanceModal
          open={showXpModal}
          onOpenChange={setShowXpModal}
          gained={xpSummary.gained}
          lost={xpSummary.lost}
          net={xpSummary.net}
          total={xpSummary.total}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Coins,
  Flame,
  Trophy,
  Target,
  Loader2,
  Bell,
  Clock,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useApi } from "@/hooks/use-api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AchievementData {
  id: string;
  title: string;
  description: string;
  type: string;
  unlockedAt: string | null;
}

interface NotificationPrefs {
  habitReminders: boolean;
  achievements: boolean;
  rankingUpdates: boolean;
  streakWarnings: boolean;
  missions: boolean;
  pushEnabled: boolean;
}

function xpForLevel(level: number) {
  return level * level * 100;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Colors per achievement type
const achievementColors: Record<string, string> = {
  FIRST_HABIT: "#FF7A00",
  STREAK_7: "#FF7A00",
  STREAK_30: "#FF9F3F",
  LEVEL_10: "#EAB308",
  TOP_10: "#FFD700",
  HABITS_50: "#10B981",
  COINS_500: "#EAB308",
  XP_5000: "#FF7A00",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { get, patch } = useApi();

  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      setLoading(true);
      try {
        const [achData, prefsData] = await Promise.all([
          get<AchievementData[]>("/api/achievements"),
          get<NotificationPrefs>("/api/users/notification-preferences"),
        ]);
        setAchievements(achData);
        setNotifPrefs(prefsData);
      } catch (err) {
        console.error("Fetch profile data error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, get]);

  const handleTogglePref = async (key: keyof NotificationPrefs) => {
    if (!notifPrefs) return;
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    try {
      await patch("/api/users/notification-preferences", {
        [key]: updated[key],
      });
    } catch (err) {
      // Revert on error
      setNotifPrefs(notifPrefs);
      console.error("Update notification preferences error:", err);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF7A00]" />
      </div>
    );
  }

  const level = user.level ?? 0;
  const xp = user.xp ?? 0;
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const range = nextLevelXp - currentLevelXp;
  const progress =
    range > 0 ? Math.round(((xp - currentLevelXp) / range) * 100) : 100;
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="space-y-6">
      {/* Profile Hero */}
      <div className="relative rounded-2xl border border-white/[0.06] bg-[#121212] overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#FF7A00]/30 via-[#FF9F3F]/20 to-[#FF7A00]/10" />
        <div className="px-5 pb-5 -mt-10">
          <Avatar className="h-20 w-20 ring-4 ring-[#121212] shadow-xl shadow-[#FF7A00]/10 mb-3">
            <AvatarFallback className="text-2xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold text-white">{user.name}</h1>
          <p className="text-sm text-[#A1A1A1]">{user.email}</p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF7A00] to-[#FF9F3F] text-xs font-bold text-white">
                  {level}
                </div>
                <span className="font-medium text-white">Level {level}</span>
              </div>
              <span className="text-[#A1A1A1]">
                {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
              </span>
            </div>
            <Progress
              value={progress}
              className="h-3"
              indicatorClassName="bg-gradient-to-r from-[#FF7A00] to-[#FF9F3F]"
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatItem
          icon={Sparkles}
          label="Total XP"
          value={xp.toLocaleString()}
          color="#FF7A00"
        />
        <StatItem
          icon={Coins}
          label="Coins"
          value={(user.coins ?? 0).toLocaleString()}
          color="#EAB308"
        />
        <StatItem
          icon={Flame}
          label="Streak"
          value={`${user.streak ?? 0} days`}
          color="#FF7A00"
        />
        <StatItem
          icon={Target}
          label="Level"
          value={level.toString()}
          color="#10B981"
        />
      </div>

      {/* Achievements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#FF9F3F]" />
            Achievements
          </h2>
          <span className="text-xs text-[#A1A1A1]">
            {unlockedCount}/{achievements.length} unlocked
          </span>
        </div>

        {achievements.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-[#121212] p-8 text-center">
            <p className="text-[#A1A1A1] text-sm">
              No achievements yet. Keep going!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {achievements.map((achievement, i) => {
              const unlocked = !!achievement.unlockedAt;
              const color = achievementColors[achievement.type] || "#FF7A00";
              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "flex flex-col items-center rounded-2xl border p-4 text-center transition-all animate-slide-up",
                    unlocked
                      ? "border-white/[0.06] bg-[#121212] hover:border-white/10"
                      : "border-white/[0.03] bg-[#121212]/50 opacity-40",
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl mb-2",
                      unlocked ? "shadow-lg" : "",
                    )}
                    style={{
                      backgroundColor: unlocked
                        ? `${color}15`
                        : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <Trophy
                      className="h-6 w-6"
                      style={{ color: unlocked ? color : "#A1A1A1" }}
                    />
                  </div>
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      unlocked ? "text-white" : "text-[#A1A1A1]",
                    )}
                  >
                    {achievement.title}
                  </p>
                  <p className="text-[10px] text-[#A1A1A1] mt-0.5 line-clamp-2">
                    {achievement.description}
                  </p>
                  {unlocked && (
                    <span
                      className="mt-1.5 text-[9px] font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      Unlocked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification Settings */}
      {notifPrefs && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#FF9F3F]" />
            Notification Settings
          </h2>
          <div className="rounded-2xl border border-white/[0.06] bg-[#121212] divide-y divide-white/[0.04]">
            <NotifToggle
              icon={Clock}
              label="Habit Reminders"
              description="Get reminded when it's time for a habit"
              enabled={notifPrefs.habitReminders}
              onToggle={() => handleTogglePref("habitReminders")}
            />
            <NotifToggle
              icon={Trophy}
              label="Achievements"
              description="Notifications when you unlock achievements"
              enabled={notifPrefs.achievements}
              onToggle={() => handleTogglePref("achievements")}
            />
            <NotifToggle
              icon={Sparkles}
              label="Ranking Updates"
              description="Get notified about ranking changes"
              enabled={notifPrefs.rankingUpdates}
              onToggle={() => handleTogglePref("rankingUpdates")}
            />
            <NotifToggle
              icon={Flame}
              label="Streak Warnings"
              description="Warnings when your streak is at risk"
              enabled={notifPrefs.streakWarnings}
              onToggle={() => handleTogglePref("streakWarnings")}
            />
            <NotifToggle
              icon={Target}
              label="Missions"
              description="Mission completion notifications"
              enabled={notifPrefs.missions}
              onToggle={() => handleTogglePref("missions")}
            />
            <NotifToggle
              icon={Shield}
              label="Push Notifications"
              description="Receive notifications even when app is closed"
              enabled={notifPrefs.pushEnabled}
              onToggle={() => handleTogglePref("pushEnabled")}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NotifToggle({
  icon: Icon,
  label,
  description,
  enabled,
  onToggle,
}: {
  icon: typeof Bell;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
          <Icon className="h-4 w-4 text-[#A1A1A1]" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-[11px] text-[#A1A1A1]">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-200",
          enabled ? "bg-[#FF7A00]" : "bg-white/10",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
            enabled && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#121212] p-4 text-center animate-slide-up">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl mx-auto mb-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-[#A1A1A1]">{label}</p>
    </div>
  );
}

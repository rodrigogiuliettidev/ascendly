import type {
  User,
  Habit,
  HabitCompletion,
  Mission,
  UserMission,
  Achievement,
  UserAchievement,
  Follow,
  WeeklyXp,
  Notification,
  MissionType,
  MissionStatus,
  AchievementType,
  NotificationType,
  XpLog,
  XpLogType,
  Challenge,
} from "@prisma/client";

// ─── Re-exports from Prisma for convenience ─────────────────────────────────

export type {
  User,
  Habit,
  HabitCompletion,
  Mission,
  UserMission,
  Achievement,
  UserAchievement,
  Follow,
  WeeklyXp,
  Notification,
  MissionType,
  MissionStatus,
  AchievementType,
  NotificationType,
  XpLog,
  XpLogType,
  Challenge,
};

// ─── DTOs ────────────────────────────────────────────────────────────────────

export type CreateHabitInput = {
  title: string;
  description?: string;
  xpReward?: number;
  coinReward?: number;
  penaltyXp?: number;
  reminderTime?: string;
  daysOfWeek?: number[];
};

export type UpdateHabitInput = Partial<CreateHabitInput> & {
  isActive?: boolean;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthPayload = {
  userId: string;
  email: string;
};

// ─── View models ─────────────────────────────────────────────────────────────

export type UserProfile = Pick<
  User,
  "id" | "name" | "email" | "xp" | "coins" | "streak" | "createdAt"
> & { level: number };

export type RankingEntry = {
  position: number;
  userId: string;
  name: string;
  xpEarned: number;
};

export type DashboardData = {
  user: UserProfile;
  todayHabits: (Habit & { completedToday: boolean })[];
  missions: (UserMission & { mission: Mission })[];
  ranking: { position: number; xpEarned: number } | null;
};

export type HabitWithCompletion = Habit & {
  completedToday: boolean;
  scheduledToday: boolean;
};

export type MissionWithDetails = UserMission & {
  mission: Mission;
};

export type AchievementWithStatus = Achievement & {
  unlocked: boolean;
  unlockedAt?: Date | null;
};

export type XpSummary = {
  gained: number;
  lost: number;
  net: number;
  total: number;
};

export type WeeklyProgress = {
  completed: number;
  total: number;
  percentage: number;
};

export type ChallengeProgress = {
  currentDay: number;
  totalDays: number;
  startDate: Date;
  isActive: boolean;
  habitsCompletedToday: number;
  totalHabitsToday: number;
  daysRemaining: number;
};

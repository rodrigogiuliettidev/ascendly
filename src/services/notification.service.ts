import webPush from "web-push";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

// ─── VAPID Configuration ─────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@ascendly.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Sends a push notification to a specific user and stores it in DB.
 */
export async function sendNotification(
  userId: string,
  type: NotificationType,
  message: string,
  link?: string,
  pushPayload?: PushPayload,
): Promise<void> {
  // Check user preferences
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (prefs && !isTypeEnabled(prefs, type)) {
    console.log(
      `[PushService] Notification type ${type} disabled for user ${userId}`,
    );
    return;
  }

  // Store in-app notification
  await prisma.notification.create({
    data: { userId, type, message, link },
  });

  console.log(
    `[PushService] 📩 Stored notification: ${type} for user ${userId}`,
  );

  // Send push notification if user has a subscription
  if (pushPayload && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    await sendPushToUser(userId, pushPayload);
  }
}

/**
 * Sends a Web Push to the user's registered endpoint.
 */
async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmToken: true },
  });

  if (!user?.fcmToken) return;

  try {
    const subscription = JSON.parse(user.fcmToken);
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    console.log(`[PushService] 🔔 Push sent to user ${userId}`);
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (statusCode === 410 || statusCode === 404) {
      // Subscription expired, remove it
      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: null },
      });
      console.log(
        `[PushService] Removed expired subscription for user ${userId}`,
      );
    } else {
      console.error(`[PushService] Push failed for user ${userId}:`, error);
    }
  }
}

/**
 * Checks if a notification type is enabled for the user.
 */
function isTypeEnabled(
  prefs: {
    habitReminders: boolean;
    achievements: boolean;
    rankingUpdates: boolean;
    streakWarnings: boolean;
    missions: boolean;
  },
  type: NotificationType,
): boolean {
  switch (type) {
    case "HABIT_REMINDER":
      return prefs.habitReminders;
    case "ACHIEVEMENT_UNLOCK":
      return prefs.achievements;
    case "RANKING_UPDATE":
      return prefs.rankingUpdates;
    case "STREAK_WARNING":
      return prefs.streakWarnings;
    case "MISSION_COMPLETE":
      return prefs.missions;
    case "XP_REWARD":
      return true; // Always enabled
    default:
      return true;
  }
}

// ─── Gamification Notification Helpers ────────────────────────────────────────

export async function notifyHabitCompleted(
  userId: string,
  habitTitle: string,
  xp: number,
) {
  await sendNotification(
    userId,
    "XP_REWARD",
    `You completed "${habitTitle}" and earned ${xp} XP! ⚡`,
    "/habits",
    {
      title: "XP Earned!",
      body: `You completed "${habitTitle}" and earned ${xp} XP.`,
      url: "/habits",
      tag: "xp-reward",
    },
  );
}

export async function notifyAchievementUnlocked(
  userId: string,
  achievementTitle: string,
) {
  await sendNotification(
    userId,
    "ACHIEVEMENT_UNLOCK",
    `Achievement unlocked: ${achievementTitle}! 🏆`,
    "/profile",
    {
      title: "Achievement unlocked!",
      body: `You unlocked the "${achievementTitle}" achievement.`,
      url: "/profile",
      tag: "achievement",
    },
  );
}

export async function notifyRankingUpdate(userId: string, position: number) {
  const message =
    position <= 10
      ? `You entered the Top 10! You're now ranked #${position} this week. 🔥`
      : `Ranking update: You moved to position #${position} this week.`;

  await sendNotification(userId, "RANKING_UPDATE", message, "/ranking", {
    title: position <= 10 ? "You entered the Top 10!" : "Ranking update",
    body:
      position <= 10
        ? `You are now ranked #${position} this week.`
        : `You moved to position #${position} this week.`,
    url: "/ranking",
    tag: "ranking",
  });
}

export async function notifyStreakWarning(userId: string, streak: number) {
  await sendNotification(
    userId,
    "STREAK_WARNING",
    `Your ${streak}-day streak is at risk! Complete a habit today to keep it. 🔥`,
    "/habits",
    {
      title: "Your streak is at risk!",
      body: `Complete a habit today to keep your ${streak}-day streak alive.`,
      url: "/habits",
      tag: "streak-warning",
    },
  );
}

export async function notifyHabitReminder(userId: string, habitTitle: string) {
  await sendNotification(
    userId,
    "HABIT_REMINDER",
    `Time to complete your habit: ${habitTitle} 🧘`,
    "/habits",
    {
      title: "Time to complete your habit!",
      body: `Don't forget: ${habitTitle}.`,
      url: "/habits",
      tag: `reminder-${habitTitle}`,
    },
  );
}

export async function notifyMissionCompleted(
  userId: string,
  missionTitle: string,
) {
  await sendNotification(
    userId,
    "MISSION_COMPLETE",
    `Mission completed: ${missionTitle}. Claim your reward! 🎯`,
    "/dashboard",
    {
      title: "Mission completed!",
      body: `You completed today's mission and earned rewards.`,
      url: "/dashboard",
      tag: "mission-complete",
    },
  );
}

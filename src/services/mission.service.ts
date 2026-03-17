import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/date";
import { awardXP, awardCoins } from "./xp.service";
import { notifyMissionCompleted } from "./notification.service";
import type { MissionWithDetails } from "@/types";

/**
 * Returns today's missions for a user.
 * Missions are assigned daily; if none exist for today, they are generated.
 */
export async function getTodayMissions(userId: string): Promise<MissionWithDetails[]> {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  let userMissions = await prisma.userMission.findMany({
    where: {
      userId,
      assignedAt: { gte: todayStart, lte: todayEnd },
    },
    include: { mission: true },
    orderBy: { assignedAt: "asc" },
  });

  // Auto-assign daily missions if none exist for today
  if (userMissions.length === 0) {
    userMissions = await assignDailyMissions(userId, todayStart);
  }

  return userMissions;
}

/**
 * Assigns all available missions to the user for today.
 */
async function assignDailyMissions(userId: string, todayStart: Date): Promise<MissionWithDetails[]> {
  const missions = await prisma.mission.findMany();

  if (missions.length === 0) {
    console.warn("[MissionService] No missions found in database. Run prisma db seed.");
    return [];
  }

  const created: MissionWithDetails[] = [];

  for (const mission of missions) {
    try {
      const um = await prisma.userMission.create({
        data: {
          userId,
          missionId: mission.id,
          progress: 0,
          assignedAt: todayStart,
        },
        include: { mission: true },
      });
      created.push(um);
      console.log(`[MissionService] Assigned mission "${mission.title}" to user ${userId}`);
    } catch (error) {
      // Unique constraint violation — already assigned
      console.log(`[MissionService] Mission "${mission.title}" already assigned for today`);
    }
  }

  // If all were duplicates, re-fetch
  if (created.length === 0) {
    const todayEnd = endOfDay();
    return prisma.userMission.findMany({
      where: {
        userId,
        assignedAt: { gte: todayStart, lte: todayEnd },
      },
      include: { mission: true },
      orderBy: { assignedAt: "asc" },
    });
  }

  return created;
}

/**
 * Called after a habit is completed. Updates relevant mission progress.
 */
export async function updateMissionsOnHabitComplete(
  userId: string,
  xpEarned: number
): Promise<void> {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  // Ensure missions exist for today
  const activeMissions = await prisma.userMission.findMany({
    where: {
      userId,
      status: "IN_PROGRESS",
      assignedAt: { gte: todayStart, lte: todayEnd },
    },
    include: { mission: true },
  });

  for (const um of activeMissions) {
    let increment = 0;

    switch (um.mission.type) {
      case "COMPLETE_HABITS":
        increment = 1;
        break;
      case "EARN_XP":
        increment = xpEarned;
        break;
      case "MAINTAIN_STREAK":
        increment = 1;
        break;
    }

    if (increment <= 0) continue;

    const newProgress = Math.min(um.progress + increment, um.mission.target);
    const isComplete = newProgress >= um.mission.target;

    await prisma.userMission.update({
      where: { id: um.id },
      data: {
        progress: newProgress,
        status: isComplete ? "COMPLETED" : "IN_PROGRESS",
        completedAt: isComplete ? new Date() : undefined,
      },
    });

    if (isComplete) {
      notifyMissionCompleted(userId, um.mission.title).catch(console.error);
    }

    console.log(
      `[MissionService] Updated "${um.mission.title}": ${newProgress}/${um.mission.target}${isComplete ? " ✅ COMPLETED" : ""}`
    );
  }
}

/**
 * Claims rewards for a completed mission.
 */
export async function claimMissionReward(
  userMissionId: string,
  userId: string
): Promise<{ xp: number; coins: number }> {
  const um = await prisma.userMission.findUniqueOrThrow({
    where: { id: userMissionId, userId },
    include: { mission: true },
  });

  if (um.status !== "COMPLETED") {
    throw new Error("Mission is not completed yet");
  }

  await prisma.userMission.update({
    where: { id: userMissionId },
    data: { status: "CLAIMED" },
  });

  const xpResult = await awardXP(userId, um.mission.xpReward);
  const coins = await awardCoins(userId, um.mission.coinReward);

  return { xp: xpResult.xp, coins };
}

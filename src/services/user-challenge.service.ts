import { prisma } from "@/lib/prisma";
import { getFriends } from "./social.service";

/**
 * Create a challenge between friends
 */
export async function createUserChallenge(
  senderId: string,
  receiverId: string,
  title: string,
  targetCount: number = 20,
  durationDays: number = 7,
  description?: string,
) {
  // Verify they are friends
  const friends = await getFriends(senderId);
  const isFriend = friends.some((f) => f.id === receiverId);

  if (!isFriend) {
    throw new Error("You can only challenge friends");
  }

  // Check for existing active/pending challenge between them
  const existingChallenge = await prisma.userChallenge.findFirst({
    where: {
      OR: [
        { senderId, receiverId, status: { in: ["PENDING", "ACTIVE"] } },
        {
          senderId: receiverId,
          receiverId: senderId,
          status: { in: ["PENDING", "ACTIVE"] },
        },
      ],
    },
  });

  if (existingChallenge) {
    throw new Error("An active challenge already exists between you");
  }

  const challenge = await prisma.userChallenge.create({
    data: {
      senderId,
      receiverId,
      title,
      description,
      targetCount,
      durationDays,
      status: "PENDING",
    },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
  });

  // Notify receiver
  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: "CHALLENGE_RECEIVED",
      message: `${challenge.sender.name} challenged you: "${title}"`,
      link: "/social",
    },
  });

  console.log(
    `[UserChallenge] Created: ${senderId} -> ${receiverId}: ${title}`,
  );

  return challenge;
}

/**
 * Accept a challenge
 */
export async function acceptUserChallenge(challengeId: string, userId: string) {
  const challenge = await prisma.userChallenge.findUnique({
    where: { id: challengeId },
    include: {
      sender: { select: { name: true } },
      receiver: { select: { name: true } },
    },
  });

  if (!challenge) {
    throw new Error("Challenge not found");
  }

  if (challenge.receiverId !== userId) {
    throw new Error("Not authorized to accept this challenge");
  }

  if (challenge.status !== "PENDING") {
    throw new Error("Challenge is not pending");
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + challenge.durationDays);

  // Start the challenge
  await prisma.$transaction([
    prisma.userChallenge.update({
      where: { id: challengeId },
      data: {
        status: "ACTIVE",
        startDate,
        endDate,
      },
    }),
    // Create participants
    prisma.challengeParticipant.createMany({
      data: [
        { challengeId, userId: challenge.senderId },
        { challengeId, userId: challenge.receiverId },
      ],
    }),
    // Notify sender
    prisma.notification.create({
      data: {
        userId: challenge.senderId,
        type: "CHALLENGE_ACCEPTED",
        message: `${challenge.receiver.name} accepted your challenge: "${challenge.title}"`,
        link: "/social",
      },
    }),
  ]);

  console.log(`[UserChallenge] Accepted: ${challengeId}`);

  return { success: true };
}

/**
 * Reject a challenge
 */
export async function rejectUserChallenge(challengeId: string, userId: string) {
  const challenge = await prisma.userChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    throw new Error("Challenge not found");
  }

  if (challenge.receiverId !== userId) {
    throw new Error("Not authorized to reject this challenge");
  }

  if (challenge.status !== "PENDING") {
    throw new Error("Challenge is not pending");
  }

  await prisma.userChallenge.update({
    where: { id: challengeId },
    data: { status: "REJECTED" },
  });

  console.log(`[UserChallenge] Rejected: ${challengeId}`);

  return { success: true };
}

/**
 * Get all challenges for a user
 */
export async function getUserChallenges(userId: string) {
  const challenges = await prisma.userChallenge.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: { select: { id: true, name: true, xp: true } },
      receiver: { select: { id: true, name: true, xp: true } },
      participants: {
        select: {
          userId: true,
          progress: true,
          completed: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return challenges.map((c) => {
    const myProgress = c.participants.find((p) => p.userId === userId);
    const opponentProgress = c.participants.find((p) => p.userId !== userId);
    const opponent = c.senderId === userId ? c.receiver : c.sender;
    const daysRemaining = c.endDate
      ? Math.max(
          0,
          Math.ceil((c.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        )
      : c.durationDays;

    return {
      id: c.id,
      title: c.title,
      description: c.description,
      targetCount: c.targetCount,
      durationDays: c.durationDays,
      status: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
      createdAt: c.createdAt,
      isSender: c.senderId === userId,
      opponent: {
        id: opponent.id,
        name: opponent.name,
      },
      myProgress: myProgress?.progress || 0,
      opponentProgress: opponentProgress?.progress || 0,
      myCompleted: myProgress?.completed || false,
      opponentCompleted: opponentProgress?.completed || false,
      daysRemaining,
      winnerId: c.winnerId,
    };
  });
}

/**
 * Get pending incoming challenges for a user
 */
export async function getPendingChallenges(userId: string) {
  const challenges = await prisma.userChallenge.findMany({
    where: {
      receiverId: userId,
      status: "PENDING",
    },
    include: {
      sender: { select: { id: true, name: true, xp: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return challenges.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    targetCount: c.targetCount,
    durationDays: c.durationDays,
    sender: {
      id: c.sender.id,
      name: c.sender.name,
    },
    createdAt: c.createdAt,
  }));
}

/**
 * Increment challenge progress when user completes a habit
 */
export async function updateChallengeProgress(userId: string) {
  // Find active challenges where user is a participant
  const participants = await prisma.challengeParticipant.findMany({
    where: {
      userId,
      completed: false,
      challenge: { status: "ACTIVE" },
    },
    include: {
      challenge: true,
    },
  });

  for (const participant of participants) {
    const newProgress = participant.progress + 1;
    const completed = newProgress >= participant.challenge.targetCount;

    await prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: {
        progress: newProgress,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    console.log(
      `[UserChallenge] Progress updated: ${userId} in ${participant.challengeId}: ${newProgress}/${participant.challenge.targetCount}`,
    );

    // Check if challenge should be completed
    if (completed) {
      await checkChallengeCompletion(participant.challengeId);
    }
  }
}

/**
 * Check if a challenge is completed and determine winner
 */
async function checkChallengeCompletion(challengeId: string) {
  const challenge = await prisma.userChallenge.findUnique({
    where: { id: challengeId },
    include: {
      participants: true,
      sender: { select: { name: true } },
      receiver: { select: { name: true } },
    },
  });

  if (!challenge || challenge.status !== "ACTIVE") return;

  const allCompleted = challenge.participants.every((p) => p.completed);
  const now = new Date();
  const isExpired = challenge.endDate && now > challenge.endDate;

  if (allCompleted || isExpired) {
    // Determine winner (first to complete or highest progress)
    const sorted = [...challenge.participants].sort((a, b) => {
      if (a.completed && !b.completed) return -1;
      if (!a.completed && b.completed) return 1;
      if (a.completedAt && b.completedAt) {
        return a.completedAt.getTime() - b.completedAt.getTime();
      }
      return b.progress - a.progress;
    });

    const winnerId = sorted[0]?.userId;

    await prisma.userChallenge.update({
      where: { id: challengeId },
      data: {
        status: "COMPLETED",
        winnerId,
      },
    });

    // Notify both participants
    for (const participant of challenge.participants) {
      const isWinner = participant.userId === winnerId;
      const opponentName =
        participant.userId === challenge.senderId
          ? challenge.receiver.name
          : challenge.sender.name;

      await prisma.notification.create({
        data: {
          userId: participant.userId,
          type: "CHALLENGE_COMPLETED",
          message: isWinner
            ? `🎉 You won the challenge "${challenge.title}" against ${opponentName}!`
            : `Challenge "${challenge.title}" completed. ${opponentName} won this time!`,
          link: "/social",
        },
      });
    }

    console.log(
      `[UserChallenge] Completed: ${challengeId}, winner: ${winnerId}`,
    );
  }
}

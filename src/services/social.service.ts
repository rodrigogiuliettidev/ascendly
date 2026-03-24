import { prisma } from "@/lib/prisma";
import { calculateLevel } from "./xp.service";

/**
 * Sends a follow request from sender to receiver
 */
export async function sendFollowRequest(senderId: string, receiverId: string) {
  if (senderId === receiverId) {
    throw new Error("Cannot send follow request to yourself");
  }

  // Check if already friends
  const existingFollow = await prisma.follow.findFirst({
    where: {
      OR: [
        { followerId: senderId, followingId: receiverId },
        { followerId: receiverId, followingId: senderId },
      ],
    },
  });

  if (existingFollow) {
    throw new Error("Already friends with this user");
  }

  // Check for existing request (either direction)
  const existingRequest = await prisma.followRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId, status: "PENDING" },
        { senderId: receiverId, receiverId: senderId, status: "PENDING" },
      ],
    },
  });

  if (existingRequest) {
    // If the other user already sent a request, auto-accept
    if (existingRequest.senderId === receiverId) {
      return acceptFollowRequest(existingRequest.id, senderId);
    }
    throw new Error("Follow request already sent");
  }

  const request = await prisma.followRequest.create({
    data: { senderId, receiverId },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
  });

  // Create notification for receiver
  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: "FOLLOW_REQUEST",
      message: `${request.sender.name} sent you a follow request`,
      link: "/social",
    },
  });

  console.log(`[Social] Follow request sent: ${senderId} -> ${receiverId}`);

  return request;
}

/**
 * Get pending follow requests for a user
 */
export async function getPendingRequests(userId: string) {
  const requests = await prisma.followRequest.findMany({
    where: { receiverId: userId, status: "PENDING" },
    include: {
      sender: {
        select: { id: true, name: true, email: true, xp: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    senderId: r.senderId,
    senderName: r.sender.name,
    senderEmail: r.sender.email,
    senderXp: r.sender.xp,
    senderLevel: calculateLevel(r.sender.xp),
    createdAt: r.createdAt,
  }));
}

/**
 * Get sent follow requests for a user
 */
export async function getSentRequests(userId: string) {
  const requests = await prisma.followRequest.findMany({
    where: { senderId: userId, status: "PENDING" },
    include: {
      receiver: {
        select: { id: true, name: true, xp: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    receiverId: r.receiverId,
    receiverName: r.receiver.name,
    receiverXp: r.receiver.xp,
    receiverLevel: calculateLevel(r.receiver.xp),
    createdAt: r.createdAt,
  }));
}

/**
 * Accept a follow request (creates mutual follow)
 */
export async function acceptFollowRequest(requestId: string, userId: string) {
  const request = await prisma.followRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: { select: { name: true } },
      receiver: { select: { name: true } },
    },
  });

  if (!request) {
    throw new Error("Follow request not found");
  }

  if (request.receiverId !== userId) {
    throw new Error("Not authorized to accept this request");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request already processed");
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction([
    // Update request status
    prisma.followRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    }),
    // Create mutual follows
    prisma.follow.createMany({
      data: [
        { followerId: request.senderId, followingId: request.receiverId },
        { followerId: request.receiverId, followingId: request.senderId },
      ],
      skipDuplicates: true,
    }),
    // Notify sender
    prisma.notification.create({
      data: {
        userId: request.senderId,
        type: "FOLLOW_ACCEPTED",
        message: `${request.receiver.name} accepted your follow request`,
        link: "/social",
      },
    }),
  ]);

  console.log(
    `[Social] Request accepted: ${request.senderId} <-> ${request.receiverId}`,
  );

  return { success: true };
}

/**
 * Reject a follow request
 */
export async function rejectFollowRequest(requestId: string, userId: string) {
  const request = await prisma.followRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error("Follow request not found");
  }

  if (request.receiverId !== userId) {
    throw new Error("Not authorized to reject this request");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request already processed");
  }

  await prisma.followRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });

  console.log(
    `[Social] Request rejected: ${request.senderId} -> ${request.receiverId}`,
  );

  return { success: true };
}

/**
 * Get friends (mutual followers) for a user
 */
export async function getFriends(userId: string) {
  // Get users the current user is following
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);

  // Get users who are following back (mutual)
  const friends = await prisma.user.findMany({
    where: {
      id: { in: followingIds },
      following: {
        some: { followingId: userId },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      xp: true,
      streak: true,
    },
  });

  return friends.map((f) => ({
    id: f.id,
    name: f.name,
    email: f.email,
    xp: f.xp,
    level: calculateLevel(f.xp),
    streak: f.streak,
  }));
}

/**
 * Check relationship status between two users
 */
export async function getRelationshipStatus(
  currentUserId: string,
  targetUserId: string,
): Promise<"NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIENDS"> {
  if (currentUserId === targetUserId) {
    return "NONE";
  }

  // Check if friends
  const mutualFollow = await prisma.follow.findFirst({
    where: {
      followerId: currentUserId,
      followingId: targetUserId,
    },
  });

  if (mutualFollow) {
    return "FRIENDS";
  }

  // Check for pending request
  const pendingRequest = await prisma.followRequest.findFirst({
    where: {
      status: "PENDING",
      OR: [
        { senderId: currentUserId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: currentUserId },
      ],
    },
  });

  if (pendingRequest) {
    return pendingRequest.senderId === currentUserId
      ? "PENDING_SENT"
      : "PENDING_RECEIVED";
  }

  return "NONE";
}

/**
 * Search users by name or email
 */
export async function searchUsers(query: string, currentUserId: string) {
  console.log(
    `[Social] searchUsers: query="${query}", currentUserId="${currentUserId}"`,
  );

  if (!query || query.length < 2) {
    console.log("[Social] searchUsers: query too short, returning empty");
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      NOT: { id: currentUserId },
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      xp: true,
    },
    take: 20,
  });

  console.log(`[Social] searchUsers: found ${users.length} users in database`);

  // Get relationship status for each user
  const usersWithStatus = await Promise.all(
    users.map(async (user) => {
      const status = await getRelationshipStatus(currentUserId, user.id);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: calculateLevel(user.xp),
        status,
      };
    }),
  );

  return usersWithStatus;
}

/**
 * Remove friend (unfriend)
 */
export async function removeFriend(userId: string, friendId: string) {
  await prisma.$transaction([
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: userId, followingId: friendId },
          { followerId: friendId, followingId: userId },
        ],
      },
    }),
  ]);

  console.log(`[Social] Friendship removed: ${userId} <-> ${friendId}`);

  return { success: true };
}

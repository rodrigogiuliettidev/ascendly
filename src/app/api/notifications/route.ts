import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const notifications = await prisma.notification.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json().catch(() => ({}));
    const notificationId =
      typeof body?.id === "string" && body.id.trim().length > 0
        ? body.id
        : null;

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: auth.userId, read: false },
        data: { read: true },
      });
      console.log(
        `[API] /api/notifications mark-one-read user=${auth.userId} id=${notificationId}`,
      );
      return NextResponse.json({ success: true });
    }

    await prisma.notification.updateMany({
      where: { userId: auth.userId, read: false },
      data: { read: true },
    });
    console.log(
      `[API] /api/notifications mark-all-read user=${auth.userId}`,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

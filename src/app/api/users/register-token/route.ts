import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { subscription } = body;

    if (!subscription) {
      return NextResponse.json(
        { error: "Push subscription is required" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: auth.userId },
      data: { fcmToken: JSON.stringify(subscription) },
    });

    // Ensure notification preferences exist
    await prisma.notificationPreference.upsert({
      where: { userId: auth.userId },
      update: { pushEnabled: true },
      create: { userId: auth.userId, pushEnabled: true },
    });

    console.log("[RegisterToken] Push subscription saved for user", auth.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/users/register-token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

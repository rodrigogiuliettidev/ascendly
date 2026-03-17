import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
    ninetyDaysAgo.setUTCHours(0, 0, 0, 0);

    const completions = await prisma.habitCompletion.findMany({
      where: {
        userId: auth.userId,
        completedAt: { gte: ninetyDaysAgo },
      },
      select: { completionDate: true },
    });

    const countMap = new Map();
    for (const c of completions) {
      const dateStr = c.completionDate.toISOString().split("T")[0];
      countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
    }

    const result = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      result.push({ date: dateStr, count: countMap.get(dateStr) || 0 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/heatmap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getLogicalDateString, getDaysAgo } from "@/lib/date";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const ninetyDaysAgo = getDaysAgo(90);

    console.log(
      `[Heatmap] Fetching completions for user=${auth.userId} since ${ninetyDaysAgo.toISOString()}`,
    );

    const completions = await prisma.habitCompletion.findMany({
      where: {
        userId: auth.userId,
        completionDate: { gte: ninetyDaysAgo },
      },
      select: { completionDate: true, completedAt: true },
    });

    console.log(
      `[Heatmap] Found ${completions.length} raw completions`,
    );

    // Debug: log some completion dates
    if (completions.length > 0) {
      const sample = completions.slice(-5);
      sample.forEach((c) => {
        console.log(
          `[Heatmap] Completion: completionDate=${c.completionDate.toISOString()}, ` +
          `logical=${getLogicalDateString(c.completionDate)}, ` +
          `completedAt=${c.completedAt.toISOString()}`,
        );
      });
    }

    // Group by logical date string
    const countMap = new Map<string, number>();
    for (const c of completions) {
      const dateStr = getLogicalDateString(c.completionDate);
      countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
    }

    // Debug: log grouped data
    console.log(
      `[Heatmap] Grouped into ${countMap.size} unique dates:`,
      Array.from(countMap.entries()).slice(-7),
    );

    // Build result array for the last 90 days
    const result = [];
    for (let i = 89; i >= 0; i--) {
      const d = getDaysAgo(i);
      const dateStr = getLogicalDateString(d);
      result.push({ date: dateStr, count: countMap.get(dateStr) || 0 });
    }

    // Debug: log last 7 days of result
    console.log(
      `[Heatmap] Returning last 7 days:`,
      result.slice(-7),
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/heatmap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { deleteHabit } from "@/services/habit.service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    await deleteHabit(id, auth.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/habits/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

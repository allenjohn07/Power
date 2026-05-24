import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard";

export async function GET() {
  try {
    const leaderboard = await getLeaderboard();
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard." },
      { status: 500 },
    );
  }
}

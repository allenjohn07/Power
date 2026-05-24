import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard";

/**
 * GET — Contributor standings derived from plug submissions and reliability votes.
 * Points are computed in lib/leaderboard (groupBy aggregates, not per-row scans).
 */
export async function GET() {
  try {
    const contributorStandings = await getLeaderboard();
    return NextResponse.json(contributorStandings);
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard." },
      { status: 500 },
    );
  }
}

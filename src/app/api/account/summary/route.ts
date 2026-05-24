import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findUserRank, getLeaderboard } from "@/lib/leaderboard";
import { PLUG_IMAGE_INCLUDE, serializePlug } from "@/lib/plug-images";
import { prisma } from "@/lib/prisma";
import { toClientVote } from "@/lib/votes";

/**
 * GET — Signed-in contributor profile: rank, submissions, and vote history.
 * Parallel Prisma reads keep account page latency low on first paint.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const [leaderboard, user, contributions, votes] = await Promise.all([
      getLeaderboard(),
      prisma.user.findUnique({
        where: { id: userId },
        select: { imageUrl: true },
      }),
      prisma.plug.findMany({
        where: { submittedById: userId },
        include: PLUG_IMAGE_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      prisma.plugVote.findMany({
        where: { userId },
        include: { plug: { include: PLUG_IMAGE_INCLUDE } },
        orderBy: { id: "desc" },
      }),
    ]);

    const standing = findUserRank(leaderboard, userId);

    return NextResponse.json({
      rank: standing?.rank ?? null,
      points: standing?.points ?? 0,
      plugsAdded: standing?.plugsAdded ?? contributions.length,
      votesCast: standing?.votesCast ?? votes.length,
      contributionCount: contributions.length,
      voteCount: votes.length,
      totalContributors: leaderboard.length,
      imageUrl: user?.imageUrl ?? null,
      contributions: contributions.map((plug) => serializePlug(plug, null)),
      votes: votes.map(({ plug, vote }) =>
        serializePlug(plug, toClientVote(vote)),
      ),
    });
  } catch (error) {
    console.error("GET /api/account/summary error:", error);
    return NextResponse.json(
      { error: "Failed to load account summary." },
      { status: 500 },
    );
  }
}

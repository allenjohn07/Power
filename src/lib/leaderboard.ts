import { prisma } from "@/lib/prisma";

export const PLUG_POINTS = 20;
export const VOTE_POINTS = 5;

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  imageUrl: string | null;
  plugsAdded: number;
  votesCast: number;
  points: number;
};

export function computePoints(plugsAdded: number, votesCast: number): number {
  return plugsAdded * PLUG_POINTS + votesCast * VOTE_POINTS;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const [plugGroups, voteGroups] = await Promise.all([
    prisma.plug.groupBy({
      by: ["submittedById"],
      where: { submittedById: { not: null } },
      _count: { _all: true },
    }),
    prisma.plugVote.groupBy({
      by: ["userId"],
      _count: { _all: true },
    }),
  ]);

  const plugCounts = new Map<string, number>();
  for (const group of plugGroups) {
    if (group.submittedById) {
      plugCounts.set(group.submittedById, group._count._all);
    }
  }

  const voteCounts = new Map<string, number>();
  for (const group of voteGroups) {
    voteCounts.set(group.userId, group._count._all);
  }

  const userIds = new Set([...plugCounts.keys(), ...voteCounts.keys()]);
  if (userIds.size === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, username: true, imageUrl: true },
  });

  const sorted = users
    .map((user) => {
      const plugsAdded = plugCounts.get(user.id) ?? 0;
      const votesCast = voteCounts.get(user.id) ?? 0;
      return {
        userId: user.id,
        username: user.username,
        imageUrl: user.imageUrl,
        plugsAdded,
        votesCast,
        points: computePoints(plugsAdded, votesCast),
      };
    })
    .filter((entry) => entry.points > 0)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.username.localeCompare(b.username);
    });

  return sorted.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));
}

export function findUserRank(
  leaderboard: LeaderboardEntry[],
  userId: string,
): LeaderboardEntry | null {
  return leaderboard.find((entry) => entry.userId === userId) ?? null;
}

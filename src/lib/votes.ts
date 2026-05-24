import { VoteKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ClientVote = "up" | "down";

export function toClientVote(vote: VoteKind): ClientVote {
  return vote === VoteKind.UP ? "up" : "down";
}

export function toDbVote(vote: ClientVote): VoteKind {
  return vote === "up" ? VoteKind.UP : VoteKind.DOWN;
}

/**
 * Apply a Works/Broken vote in one transaction: create, undo (same vote), or flip.
 * Denormalized upvotes/downvotes on Plug keep the feed fast without aggregating
 * PlugVote on every GET — acceptable tradeoff for a campus directory scale.
 */
export async function applyPlugVote(
  userId: string,
  plugId: number,
  vote: ClientVote,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.plugVote.findUnique({
      where: { userId_plugId: { userId, plugId } },
    });

    if (!existing) {
      await tx.plugVote.create({
        data: { userId, plugId, vote: toDbVote(vote) },
      });
      await tx.plug.update({
        where: { id: plugId },
        data:
          vote === "up"
            ? { upvotes: { increment: 1 } }
            : { downvotes: { increment: 1 } },
      });
      return toClientVote(toDbVote(vote));
    }

    if (existing.vote === toDbVote(vote)) {
      await tx.plugVote.delete({
        where: { userId_plugId: { userId, plugId } },
      });
      await tx.plug.update({
        where: { id: plugId },
        data:
          vote === "up"
            ? { upvotes: { decrement: 1 } }
            : { downvotes: { decrement: 1 } },
      });
      return null;
    }

    await tx.plugVote.update({
      where: { userId_plugId: { userId, plugId } },
      data: { vote: toDbVote(vote) },
    });
    await tx.plug.update({
      where: { id: plugId },
      data:
        vote === "up"
          ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
          : { downvotes: { increment: 1 }, upvotes: { decrement: 1 } },
    });
    return vote;
  });
}

/** Batch-resolve the signed-in user's votes for a page of plug ids (feed hydration). */
export async function getUserVotesForPlugs(
  userId: string,
  plugIds: number[],
): Promise<Map<number, ClientVote>> {
  if (plugIds.length === 0) return new Map();

  const votes = await prisma.plugVote.findMany({
    where: { userId, plugId: { in: plugIds } },
    select: { plugId: true, vote: true },
  });

  return new Map(votes.map((v) => [v.plugId, toClientVote(v.vote)]));
}

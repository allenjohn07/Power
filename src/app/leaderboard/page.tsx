"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Medal, Trophy, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PLUG_POINTS, VOTE_POINTS } from "@/lib/leaderboard";
import { fetchJson } from "@/lib/fetch-json";
import { cn, sectionLabelClass } from "@/lib/utils";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  imageUrl: string | null;
  plugsAdded: number;
  votesCast: number;
  points: number;
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <Medal className="size-5 text-amber-500" aria-label="1st place" />
    );
  }
  if (rank === 2) {
    return (
      <Medal className="size-5 text-slate-400" aria-label="2nd place" />
    );
  }
  if (rank === 3) {
    return (
      <Medal className="size-5 text-amber-700" aria-label="3rd place" />
    );
  }
  return (
    <span className="flex size-8 items-center justify-center font-mono text-sm tabular-nums text-muted-foreground">
      {rank}
    </span>
  );
}

function EntryAvatar({ imageUrl }: { imageUrl: string | null }) {
  return (
    <div className="relative size-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="36px"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <User className="size-4 text-muted-foreground" aria-hidden />
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const contributorStandings = await fetchJson<LeaderboardEntry[]>(
          "/api/leaderboard",
          { signal: ac.signal },
        );
        if (!ac.signal.aborted) setEntries(contributorStandings);
      } catch {
        if (!ac.signal.aborted) {
          setError("Could not load leaderboard.");
          setEntries([]);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="border-b border-border px-4 pt-4 pb-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:hidden">
            Leaderboard
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {PLUG_POINTS} pts per plug · {VOTE_POINTS} pts per vote
          </p>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
          <div className="mx-auto max-w-md">
            {error && (
              <p
                role="alert"
                className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
                <Trophy
                  className="mx-auto size-8 text-muted-foreground"
                  aria-hidden
                />
                <p className="mt-3 text-sm font-medium text-foreground">
                  No contributors yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add plugs or vote on the feed to earn points.
                </p>
              </div>
            ) : (
              <>
                <p className={cn(sectionLabelClass(), "mb-3")}>Top contributors</p>
                <ol className="flex flex-col gap-2" aria-label="Contributor rankings">
                {entries.map((entry) => (
                  <li
                    key={entry.userId}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-transform active:scale-[0.99]",
                      entry.rank === 1 &&
                        "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20",
                      entry.rank === 2 &&
                        "border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/30",
                      entry.rank === 3 &&
                        "border-amber-100 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10",
                    )}
                  >
                    <div className="flex w-8 shrink-0 justify-center">
                      <RankBadge rank={entry.rank} />
                    </div>
                    <EntryAvatar imageUrl={entry.imageUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        @{entry.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.plugsAdded}{" "}
                        {entry.plugsAdded === 1 ? "plug" : "plugs"} ·{" "}
                        {entry.votesCast}{" "}
                        {entry.votesCast === 1 ? "vote" : "votes"}
                      </p>
                    </div>
                    <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
                      {entry.points}
                    </span>
                  </li>
                ))}
              </ol>
              </>
            )}
          </div>
        </main>
      </div>
    </AppShell>
  );
}

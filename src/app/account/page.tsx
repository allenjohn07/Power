"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { PlugCard, type PlugWithBuilding } from "@/components/PlugCard";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/fetch-json";
import { cn } from "@/lib/utils";

type AuthTab = "login" | "register";

type AccountSummary = {
  rank: number | null;
  points: number;
  plugsAdded: number;
  votesCast: number;
  contributionCount: number;
  voteCount: number;
  totalContributors: number;
  imageUrl: string | null;
  contributions: PlugWithBuilding[];
  votes: PlugWithBuilding[];
};

function AccountSignedIn({ username }: { username: string }) {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<number | null>(null);

  const loadSummary = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<AccountSummary>("/api/account/summary", {
        signal,
      });
      if (!signal?.aborted) setSummary(data);
    } catch {
      if (!signal?.aborted) {
        setError("Could not load your account.");
        setSummary(null);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void loadSummary(ac.signal);
    return () => ac.abort();
  }, [loadSummary]);

  const handleVote = async (id: number, vote: "up" | "down") => {
    setVotingId(id);
    try {
      const res = await fetch("/api/plugs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, vote }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error();

      setSummary((prev) => {
        if (!prev) return prev;
        const nextVotes = prev.votes.flatMap((p) => {
          if (p.id !== id) return [p];
          return updated.userVote == null ? [] : [updated];
        });
        return { ...prev, votes: nextVotes };
      });
      toast.success(
        vote === "up" ? "Marked as working" : "Marked as broken",
      );
    } catch {
      toast.error("Vote failed. Please try again.");
    } finally {
      setVotingId(null);
    }
  };

  const worksCount =
    summary?.votes.filter((p) => p.userVote === "up").length ?? 0;
  const brokenCount =
    summary?.votes.filter((p) => p.userVote === "down").length ?? 0;
  const rankLabel =
    summary?.rank != null
      ? String(summary.rank)
      : summary && summary.points > 0
        ? "Unranked"
        : "Not ranked yet";

  const handleImageChange = (imageUrl: string) => {
    setSummary((prev) => (prev ? { ...prev, imageUrl } : prev));
  };

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="border-b border-border px-4 pt-4 pb-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:hidden">
            Account
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">{username}</span>
          </p>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
          <div className="mx-auto flex max-w-md flex-col gap-6">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <ProfileAvatar
                username={username}
                imageUrl={summary?.imageUrl ?? null}
                onImageChange={handleImageChange}
              />
              <p className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {username}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {worksCount} works · {brokenCount} broken
                </span>
              </p>
            </div>

            {!loading && summary && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Leaderboard standing
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                    {rankLabel}
                  </p>
                  <Link
                    href="/leaderboard"
                    className="mt-1 inline-block text-xs font-medium text-muted-foreground underline hover:text-foreground"
                  >
                    View rankings
                  </Link>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Contributions
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                    {summary.contributionCount}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {summary.contributionCount === 1 ? "plug" : "plugs"} added
                  </p>
                </div>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
              </div>
            ) : (
              <>
                <section>
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Your contributions
                  </h2>
                  {summary && summary.contributions.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
                      <p className="text-sm font-medium text-foreground">
                        No plugs added yet
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Use{" "}
                        <Link href="/add" className="font-medium underline">
                          Add plug
                        </Link>{" "}
                        on the feed to contribute.
                      </p>
                    </div>
                  ) : (
                    <ul
                      className="mt-3 flex flex-col gap-2.5"
                      aria-label="Your contributed plugs"
                    >
                      {summary?.contributions.map((plug) => (
                        <li key={plug.id}>
                          <PlugCard plug={plug} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Your votes
                  </h2>
                  {summary && summary.votes.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
                      <p className="text-sm font-medium text-foreground">
                        No votes yet
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Vote Works or Broken on plugs in the{" "}
                        <Link href="/" className="font-medium underline">
                          feed
                        </Link>
                        .
                      </p>
                    </div>
                  ) : (
                    <ul
                      className="mt-3 flex flex-col gap-2.5"
                      aria-label="Your voted plugs"
                    >
                      {summary?.votes.map((plug) => (
                        <li key={plug.id}>
                          <PlugCard
                            plug={plug}
                            onVote={handleVote}
                            isVoting={votingId === plug.id}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                toast.success("Logged out");
                signOut({ callbackUrl: "/account" });
              }}
            >
              <LogOut className="size-4" aria-hidden />
              Log out
            </Button>
          </div>
        </main>
      </div>
    </AppShell>
  );
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<AuthTab>("login");

  if (status === "loading") {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      </AppShell>
    );
  }

  if (session?.user?.name) {
    return <AccountSignedIn username={session.user.name} />;
  }

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="border-b border-border px-4 pt-4 pb-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:hidden">
            Account
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Log in or create an account to add plugs and vote.
          </p>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted p-1">
              {(
                [
                  { id: "login" as const, label: "Log in" },
                  { id: "register" as const, label: "Sign up" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    tab === id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "login" ? <LoginForm /> : <RegisterForm />}
          </div>
        </main>
      </div>
    </AppShell>
  );
}

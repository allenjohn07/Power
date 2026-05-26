"use client";

/**
 * Main plug feed — relational filters + crowdsourced reliability votes.
 * URL-synced buildingId; "Near me" uses saved building + schematic proximity.
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { LayoutGroup, motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { AnimatedAddLink } from "@/components/AnimatedAddLink";
import { AppShell } from "@/components/AppShell";
import { BuildingPicker, type BuildingOption } from "@/components/BuildingPicker";
import {
  PlugDirectoryCard,
  type PlugPointWithBuilding,
} from "@/components/PlugDirectoryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCurrentBuilding } from "@/hooks/useCurrentBuilding";
import { fetchJson } from "@/lib/fetch-json";
import { resolveBuildingPositions } from "@/lib/building-map-positions";
import { nearbyBuildingIds, type MapPosition } from "@/lib/nearby-buildings";
import {
  feedCardVariants,
  feedContainerVariants,
} from "@/lib/motion-presets";
import { springs } from "@/lib/springs";
import { cn, filterChipClass, sectionLabelClass } from "@/lib/utils";
import { parseRoomInput } from "@/lib/room-code";

type Building = {
  id: number;
  code: string;
  name: string;
  campus: string;
  mapSvgId?: string | null;
  wingsList: string[];
  floorOptions: string[];
};

type QuickFilter = "all" | "works" | "near" | "recent";

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "works", label: "Works" },
  { id: "near", label: "Near me" },
  { id: "recent", label: "Recent" },
];

export default function HomeFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { building: currentBuilding, ready: locationReady, save: saveBuilding } =
    useCurrentBuilding();

  const addHref = session?.user ? "/add" : "/account";

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [mapPositions, setMapPositions] = useState<MapPosition[]>([]);
  const [plugPointFeed, setPlugPointFeed] = useState<PlugPointWithBuilding[]>([]);
  const [buildingId, setBuildingId] = useState("");
  const [floor, setFloor] = useState("");
  const [wing, setWing] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [roomLookup, setRoomLookup] = useState("");
  const [browseAll, setBrowseAll] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const filtersInitialized = useRef(false);

  useEffect(() => {
    if (!locationReady || buildings.length === 0) return;

    const fromUrl = searchParams.get("buildingId");
    const browseAllUrl = searchParams.get("browse") === "all";
    const floorUrl = searchParams.get("floor");
    const wingUrl = searchParams.get("wing");

    if (browseAllUrl) {
      setBrowseAll(true);
      setBuildingId("");
      setFloor("");
      setWing("");
      filtersInitialized.current = true;
      return;
    }

    if (!filtersInitialized.current) {
      filtersInitialized.current = true;
      if (fromUrl) {
        setBuildingId(fromUrl);
        setBrowseAll(false);
        setFloor(floorUrl ?? "");
        setWing(wingUrl ?? "");
      } else if (currentBuilding) {
        setBuildingId(String(currentBuilding.id));
        setBrowseAll(false);
        setFloor("");
        setWing("");
      } else {
        setBrowseAll(true);
        setFloor("");
        setWing("");
      }
      return;
    }

    if (fromUrl) {
      setBuildingId(fromUrl);
      setBrowseAll(false);
      setFloor(floorUrl ?? "");
      setWing(wingUrl ?? "");
    }
  }, [locationReady, buildings.length, currentBuilding, searchParams]);

  useEffect(() => {
    const ac = new AbortController();
    fetchJson<Building[]>("/api/buildings?campus=main", {
      signal: ac.signal,
    })
      .then((campusBuildings) => {
        if (Array.isArray(campusBuildings)) setBuildings(campusBuildings);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        setError("Could not load buildings.");
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (buildings.length === 0) return;
    const ac = new AbortController();
    resolveBuildingPositions(buildings)
      .then((positions) => {
        if (!ac.signal.aborted) setMapPositions(positions);
      })
      .catch(() => {
        if (!ac.signal.aborted) setMapPositions([]);
      });
    return () => ac.abort();
  }, [buildings]);

  const selectedBuilding = useMemo(
    () => buildings.find((b) => String(b.id) === buildingId),
    [buildings, buildingId],
  );

  const nearbyIds = useMemo(() => {
    if (!currentBuilding || mapPositions.length === 0) return new Set<number>();
    return new Set(nearbyBuildingIds(mapPositions, currentBuilding.id));
  }, [mapPositions, currentBuilding]);

  const loadPlugPointFeed = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ campus: "main" });

      if (quickFilter !== "near") {
        if (buildingId && !browseAll) params.set("buildingId", buildingId);
        if (floor) params.set("floor", floor);
        if (wing) params.set("wing", wing);
      }

      try {
        const feed = await fetchJson<PlugPointWithBuilding[]>(
          `/api/plugs?${params.toString()}`,
          { signal },
        );
        if (!signal.aborted) setPlugPointFeed(feed);
      } catch (err) {
        if (signal.aborted) return;
        setError("Could not load plugs. Is the database running?");
        setPlugPointFeed([]);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [buildingId, floor, wing, browseAll, quickFilter],
  );

  useEffect(() => {
    if (!locationReady || buildings.length === 0) return;
    if (quickFilter === "near" && !currentBuilding) return;
    if (quickFilter !== "near" && !browseAll && !buildingId) return;

    const ac = new AbortController();
    void loadPlugPointFeed(ac.signal);
    return () => ac.abort();
  }, [
    loadPlugPointFeed,
    locationReady,
    buildings.length,
    browseAll,
    buildingId,
    quickFilter,
    currentBuilding,
  ]);

  const visiblePlugPoints = useMemo(() => {
    let list = plugPointFeed;
    if (quickFilter === "near" && currentBuilding) {
      list = list.filter((p) => nearbyIds.has(p.buildingId));
    }
    if (quickFilter === "works") {
      list = list.filter((p) => p.upvotes > p.downvotes && p.upvotes > 0);
    }
    if (quickFilter === "recent") {
      list = [...list].sort((a, b) => b.id - a.id);
    }
    return list;
  }, [plugPointFeed, quickFilter, currentBuilding, nearbyIds]);

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (browseAll) parts.push("All buildings");
    else if (selectedBuilding) parts.push(selectedBuilding.code);
    if (floor) parts.push(floor);
    if (wing) parts.push(`Wing ${wing}`);
    return parts.length > 0 ? parts.join(" · ") : "Filters";
  }, [browseAll, selectedBuilding, floor, wing]);

  const hasActiveFilters =
    Boolean(floor) || Boolean(wing) || Boolean(roomLookup.trim());

  const castPlugReliabilityVote = async (id: number, vote: "up" | "down") => {
    if (!session?.user) {
      router.push("/account");
      return;
    }

    setVotingId(id);
    try {
      const res = await fetch("/api/plugs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, vote }),
      });
      const updated = await res.json();
      if (res.status === 401) {
        router.push("/account");
        return;
      }
      if (!res.ok) throw new Error();
      setPlugPointFeed((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } finally {
      setVotingId(null);
    }
  };

  const handleBuildingPick = (b: BuildingOption) => {
    saveBuilding({ id: b.id, code: b.code, name: b.name });
    setBrowseAll(false);
    setBuildingId(String(b.id));
    setFloor("");
    setWing("");
    setQuickFilter("all");
    router.replace(`/?buildingId=${b.id}`, { scroll: false });
  };

  const applyQuickFilter = (id: QuickFilter) => {
    if (id === "near" && !currentBuilding) return;
    setQuickFilter(id);
    if (id === "all") {
      setBrowseAll(true);
      setBuildingId("");
      setFloor("");
      setWing("");
      router.replace("/?browse=all", { scroll: false });
    }
  };

  const feedSubtitle = useMemo(() => {
    if (quickFilter === "near" && currentBuilding) {
      return `Near ${currentBuilding.name} · schematic map proximity`;
    }
    if (quickFilter === "works") return "Community-verified working outlets";
    if (quickFilter === "recent") return "Newest submissions first";
    if (browseAll) return "All main campus plugs";
    return `Plugs in ${selectedBuilding?.name ?? "your building"}`;
  }, [quickFilter, currentBuilding, browseAll, selectedBuilding]);

  if (!locationReady) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="relative z-20 shrink-0 border-b border-border bg-background">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Image
                  src="/uploads/logo/power-logo.png"
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded-lg"
                  priority
                />
                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
                    SAIT Outlets
                  </h1>
                  <p className="truncate text-xs text-muted-foreground">
                    {feedSubtitle}
                  </p>
                </div>
              </div>
              <AnimatedAddLink href={addHref} className="shrink-0" />
            </div>

            <BuildingPicker
              buildings={buildings}
              value={browseAll ? null : selectedBuilding ?? currentBuilding}
              onSelect={handleBuildingPick}
              className="mt-3 w-full max-w-none"
            />

          <div className="mt-3 flex items-center gap-2">
            <div className="-mx-4 flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-4 py-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.91 }}
                transition={springs.snappy}
                className={cn(
                  filterChipClass(hasActiveFilters),
                  "inline-flex size-8 shrink-0 items-center justify-center p-0",
                )}
                onClick={() => setFilterSheetOpen(true)}
                aria-label={
                  hasActiveFilters
                    ? `Filters: ${filterSummary}`
                    : "Open filters"
                }
              >
                <SlidersHorizontal className="size-3.5" />
              </motion.button>
              <SheetContent
                side="bottom"
                showClose={false}
                className="max-h-[85vh] sm:max-w-lg sm:left-1/2 sm:right-auto sm:w-full sm:-translate-x-1/2"
              >
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springs.soft}
                >
                <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle className="tracking-tight">Filter outlets</SheetTitle>
                  <SheetDescription>
                    Room code, building, floor, and wing
                  </SheetDescription>
                </SheetHeader>

                <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1 pb-6">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Room code lookup
                    </span>
                    <Input
                      type="text"
                      value={roomLookup}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRoomLookup(value);
                        const parsed = parseRoomInput(value);
                        if (!parsed) return;
                        const match = buildings.find(
                          (b) => b.code === parsed.buildingCode,
                        );
                        if (match) {
                          setBrowseAll(false);
                          setBuildingId(String(match.id));
                          setWing(
                            parsed.wing &&
                              match.wingsList.includes(parsed.wing)
                              ? parsed.wing
                              : "",
                          );
                          setFloor(
                            parsed.floor &&
                              match.floorOptions.includes(parsed.floor)
                              ? parsed.floor
                              : "",
                          );
                        }
                      }}
                      placeholder="e.g. CA, CA416, NL1106"
                      className="font-mono text-xs uppercase placeholder:normal-case"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Building
                    </span>
                    <Select
                      value={browseAll ? "" : buildingId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setBrowseAll(true);
                          setBuildingId("");
                          router.replace("/?browse=all", { scroll: false });
                        } else {
                          setBrowseAll(false);
                          setBuildingId(val);
                          router.replace(`/?buildingId=${val}`, { scroll: false });
                          const b = buildings.find(
                            (x) => String(x.id) === val,
                          );
                          if (b) {
                            saveBuilding({
                              id: b.id,
                              code: b.code,
                              name: b.name,
                            });
                          }
                        }
                        setFloor("");
                        setWing("");
                      }}
                    >
                      <option value="">All buildings</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={String(b.id)}>
                          {b.code} — {b.name}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        Floor
                      </span>
                      <Select
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        disabled={!buildingId || browseAll}
                      >
                        <option value="">
                          {buildingId && !browseAll
                            ? "All floors"
                            : "Select building"}
                        </option>
                        {(selectedBuilding?.floorOptions ?? []).map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </Select>
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        Wing
                      </span>
                      <Select
                        value={wing}
                        onChange={(e) => setWing(e.target.value)}
                        disabled={
                          !selectedBuilding?.wingsList?.length || browseAll
                        }
                      >
                        <option value="">
                          {selectedBuilding?.wingsList?.length
                            ? "All wings"
                            : "No wings"}
                        </option>
                        {(selectedBuilding?.wingsList ?? []).map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </Select>
                    </label>
                  </div>

                  <motion.div whileTap={{ scale: 0.98 }} transition={springs.snappy}>
                    <Button
                      type="button"
                      className="w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                      onClick={() => setFilterSheetOpen(false)}
                    >
                      Show results
                    </Button>
                  </motion.div>
                </div>
                </motion.div>
              </SheetContent>
            </Sheet>

            <LayoutGroup id="feed-chips">
            {QUICK_FILTERS.map(({ id, label }) => {
              const active = quickFilter === id;
              const disabled = id === "near" && !currentBuilding;
              return (
                <motion.button
                  key={id}
                  type="button"
                  disabled={disabled}
                  whileTap={disabled ? undefined : { scale: 0.91 }}
                  transition={springs.snappy}
                  onClick={() => applyQuickFilter(id)}
                  title={
                    disabled
                      ? "Pick your building above to use Near me"
                      : undefined
                  }
                  className={cn(
                    "relative shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-foreground/20 text-foreground"
                      : "border-border bg-card text-muted-foreground",
                    disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="feed-chip-bg"
                      className="absolute inset-0 rounded-full bg-muted"
                      transition={springs.snappy}
                      style={{ zIndex: 0 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </motion.button>
              );
            })}
            </LayoutGroup>
            </div>
            <p
              className="shrink-0 pr-4 text-[11px] font-medium text-muted-foreground tabular-nums"
              aria-live="polite"
            >
              {loading
                ? "…"
                : `${visiblePlugPoints.length} plug${visiblePlugPoints.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : visiblePlugPoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              {quickFilter === "works"
                ? "No trusted plugs here yet"
                : "No plugs found"}
            </p>
            <p className="max-w-[240px] text-xs text-muted-foreground">
              {quickFilter === "works" ? (
                <>
                  Try clearing filters or{" "}
                  <Link
                    href={addHref}
                    className="font-medium text-foreground underline"
                  >
                    add one
                  </Link>{" "}
                  with photos.
                </>
              ) : (
                <>
                  <Link
                    href={addHref}
                    className="font-medium text-foreground underline transition-colors hover:text-muted-foreground"
                  >
                    Add the first one
                  </Link>{" "}
                  for this location
                </>
              )}
            </p>
          </div>
        ) : (
          <>
            <p className={cn(sectionLabelClass(), "pt-3 pb-2")}>
              {quickFilter === "works"
                ? "Trusted plugs"
                : quickFilter === "recent"
                  ? "Recently added"
                  : quickFilter === "near"
                    ? "Near you"
                    : browseAll
                      ? "All campus"
                      : selectedBuilding
                        ? selectedBuilding.code
                        : "This building"}
            </p>
            <motion.ul
              className="flex flex-col gap-2.5"
              aria-label="Plug feed"
              variants={feedContainerVariants}
              initial="hidden"
              animate="show"
            >
            {visiblePlugPoints.map((plug) => (
              <motion.li key={plug.id} variants={feedCardVariants}>
                <PlugDirectoryCard
                  plug={plug}
                  onReliabilityVote={castPlugReliabilityVote}
                  isCastingVote={votingId === plug.id}
                />
              </motion.li>
            ))}
          </motion.ul>
          </>
        )}
      </main>
      </div>
    </AppShell>
  );
}

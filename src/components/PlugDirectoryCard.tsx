"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { ImageIcon, ThumbsDown, ThumbsUp } from "lucide-react";
import { AnimatedVoteCount } from "@/components/AnimatedVoteCount";
import { ImageLightbox } from "@/components/ImageLightbox";
import { springs } from "@/lib/springs";
import { cn } from "@/lib/utils";

export type PlugPointWithBuilding = {
  id: number;
  buildingId: number;
  floor: string;
  wing: string | null;
  exactLocation: string;
  imageUrl: string;
  imageUrls: string[];
  upvotes: number;
  downvotes: number;
  userVote?: "up" | "down" | null;
  submittedBy?: string | null;
  building: { name: string; code: string; campus?: string };
};

type PlugDirectoryCardProps = {
  plug: PlugPointWithBuilding;
  onReliabilityVote?: (id: number, vote: "up" | "down") => void;
  isCastingVote?: boolean;
};

function buildingInitial(code: string) {
  return code.charAt(0).toUpperCase();
}

function formatMetaLine(code: string, wing: string | null, floor: string) {
  const floorLabel = floor.toUpperCase();
  if (wing) return `${code} · ${wing} · ${floorLabel}`;
  return `${code} · ${floorLabel}`;
}

function isPlaceholder(url: string) {
  return url.includes("placehold.co");
}

export function PlugDirectoryCard({
  plug,
  onReliabilityVote,
  isCastingVote,
}: PlugDirectoryCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const outletPhotos =
    plug.imageUrls?.length > 0 ? plug.imageUrls : [plug.imageUrl];
  const thumb = outletPhotos[0];
  const showPlaceholder = isPlaceholder(thumb);

  const userVote = plug.userVote ?? null;
  const netVotes = plug.upvotes - plug.downvotes;
  const reliabilityLabel =
    netVotes > 0 && plug.upvotes > 0
      ? "Likely works"
      : netVotes < 0
        ? "Often broken"
        : null;

  const triggerRipple = (e: React.PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const r = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - r.left, y: e.clientY - r.top });
    setTimeout(() => setRipple(null), 500);
  };

  return (
    <>
      <motion.article
        whileTap={{ scale: 0.975 }}
        transition={springs.snappy}
        onPointerDown={triggerRipple}
        className="relative overflow-hidden rounded-xl border border-border bg-card p-3.5"
      >
        {ripple && (
          <motion.span
            className="pointer-events-none absolute rounded-full bg-foreground/5"
            style={{ left: ripple.x, top: ripple.y, x: "-50%", y: "-50%" }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 240, height: 240, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}

        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background font-mono text-sm font-semibold text-muted-foreground"
            aria-hidden
          >
            {buildingInitial(plug.building.code)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 pr-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {formatMetaLine(plug.building.code, plug.wing, plug.floor)}
              </p>
              {reliabilityLabel && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    netVotes > 0
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400",
                  )}
                >
                  {reliabilityLabel}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium leading-snug text-foreground">
              {plug.exactLocation}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {plug.building.name}
            </p>
            {plug.submittedBy && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Added by{" "}
                <span className="font-medium text-foreground/90">
                  @{plug.submittedBy}
                </span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setLightboxIndex(0);
              setLightboxOpen(true);
            }}
            className="relative block size-11 shrink-0 overflow-hidden rounded-lg border border-border bg-background transition-colors hover:bg-muted/50"
            aria-label={`View ${outletPhotos.length} photo(s) of outlet at ${plug.exactLocation}`}
          >
            {showPlaceholder ? (
              <span className="flex size-full items-center justify-center text-muted-foreground">
                <ImageIcon className="size-4" aria-hidden />
              </span>
            ) : (
              <Image
                src={thumb}
                alt={`Outlet at ${plug.exactLocation}`}
                fill
                className="object-cover"
                sizes="44px"
                unoptimized
              />
            )}
            {outletPhotos.length > 1 && (
              <span className="absolute bottom-0.5 right-0.5 rounded bg-foreground/80 px-1 py-px font-mono text-[9px] text-background">
                +{outletPhotos.length - 1}
              </span>
            )}
          </button>
        </div>

        {onReliabilityVote && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <motion.button
              type="button"
              disabled={isCastingVote}
              whileTap={{ scale: 0.91 }}
              transition={springs.snappy}
              onClick={() => onReliabilityVote(plug.id, "up")}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                userVote === "up"
                  ? "border-emerald-500/60 bg-emerald-500/25 text-emerald-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15",
              )}
              aria-label={`Mark as working (${plug.upvotes} votes)`}
            >
              <ThumbsUp className="size-3.5" aria-hidden />
              Works
              <AnimatedVoteCount
                count={plug.upvotes}
                className="font-mono tabular-nums"
              />
            </motion.button>
            <motion.button
              type="button"
              disabled={isCastingVote}
              whileTap={{ scale: 0.91 }}
              transition={springs.snappy}
              onClick={() => onReliabilityVote(plug.id, "down")}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                userVote === "down"
                  ? "border-red-500/60 bg-red-500/25 text-red-300"
                  : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15",
              )}
              aria-label={`Mark as broken (${plug.downvotes} votes)`}
            >
              <ThumbsDown className="size-3.5" aria-hidden />
              Broken
              <AnimatedVoteCount
                count={plug.downvotes}
                className="font-mono tabular-nums"
              />
            </motion.button>
          </div>
        )}
      </motion.article>

      <ImageLightbox
        images={outletPhotos}
        alt={`Outlet at ${plug.exactLocation}`}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={lightboxIndex}
      />
    </>
  );
}

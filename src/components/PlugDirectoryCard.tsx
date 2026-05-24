"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { ImageLightbox } from "@/components/ImageLightbox";
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

function buildingInitials(code: string) {
  return code.slice(0, 2).toUpperCase();
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

  const outletPhotos =
    plug.imageUrls?.length > 0 ? plug.imageUrls : [plug.imageUrl];
  const thumb = outletPhotos[0];
  const showPlaceholder = isPlaceholder(thumb);

  const metaParts = [plug.building.code, plug.wing, plug.floor].filter(
    Boolean,
  );
  const userVote = plug.userVote ?? null;

  return (
    <>
      <article className="rounded-xl border border-border bg-card p-4 transition-transform active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted font-mono text-xs font-semibold text-muted-foreground"
            aria-hidden
          >
            {buildingInitials(plug.building.code)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {metaParts.join(" · ")}
            </p>
            <p className="mt-0.5 text-sm font-medium leading-snug text-foreground">
              {plug.exactLocation}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {plug.building.name}
            </p>
            {plug.submittedBy && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Added by{" "}
                <span className="font-medium text-foreground">
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
            className="relative block size-11 shrink-0 overflow-hidden rounded-xl border border-border bg-muted transition-colors hover:bg-muted/80"
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
              <span className="absolute bottom-0.5 right-0.5 rounded bg-foreground/75 px-1 py-px font-mono text-[9px] text-background">
                +{outletPhotos.length - 1}
              </span>
            )}
          </button>
        </div>

        {onReliabilityVote && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isCastingVote}
            onClick={() => onReliabilityVote(plug.id, "up")}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              userVote === "up"
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
            )}
            aria-label={`Mark as working (${plug.upvotes} votes)`}
          >
            Works
            <span className="font-mono tabular-nums">{plug.upvotes}</span>
          </button>
          <button
            type="button"
            disabled={isCastingVote}
            onClick={() => onReliabilityVote(plug.id, "down")}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              userVote === "down"
                ? "border-red-600 bg-red-600 text-white"
                : "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
            )}
            aria-label={`Mark as broken (${plug.downvotes} votes)`}
          >
            Broken
            <span className="font-mono tabular-nums">{plug.downvotes}</span>
          </button>
        </div>
        )}
      </article>

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

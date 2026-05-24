"use client";

/**
 * Interactive schematic campus map — official SAIT SVG, not Mapbox/PostGIS.
 * Buildings are clickable regions; plug counts come from the relational feed.
 * "You are here" uses self-reported building + SVG getBBox(), not device GPS.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeMapFocus,
  placeYouAreHerePin,
  removeYouAreHerePin,
  svgIdsForMapBuilding,
} from "@/lib/map-pin";

export type MapBuilding = {
  id: number;
  code: string;
  name: string;
  mapSvgId?: string | null;
  plugCount?: number;
};

type CampusMapProps = {
  buildings: MapBuilding[];
  selectedId?: number | null;
  youAreHereId?: number | null;
  onSelect?: (building: MapBuilding) => void;
  onSetLocation?: (building: MapBuilding) => void;
  onChangeLocation?: () => void;
};

const MIN_SCALE = 0.6;
const MAX_SCALE = 3;
const SVG_URL = "/maps/sait-campus-map.svg";

export function CampusMap({
  buildings,
  selectedId,
  youAreHereId,
  onSelect,
  onSetLocation,
  onChangeLocation,
}: CampusMapProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const svgHostRef = useRef<HTMLDivElement>(null);
  const prevYouAreHereId = useRef<number | null>(null);
  const hasFocusedRef = useRef(false);

  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [svgError, setSvgError] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  const selected = buildings.find((b) => b.id === selectedId);
  const youAreHere = buildings.find((b) => b.id === youAreHereId);

  // Load official campus SVG once; normalize viewBox for responsive scaling.
  useEffect(() => {
    fetch(SVG_URL)
      .then((r) => r.text())
      .then((html) => {
        const normalized = html
          .replace(/viewbox=/gi, "viewBox=")
          .replace(
            /<svg/,
            '<svg preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;display:block"',
          );
        setSvgHtml(normalized);
      })
      .catch(() => setSvgError(true));
  }, []);

  // Wire DB buildings to SVG path ids; expose plug counts for density at a glance.
  const applyBuildingStyles = useCallback(() => {
    const host = svgHostRef.current;
    if (!host) return;

    buildings.forEach((b) => {
      for (const svgId of svgIdsForMapBuilding(b)) {
        const el = host.querySelector<SVGElement>(`#${CSS.escape(svgId)}`);
        if (!el) continue;

        el.classList.add("building-interactive");
        el.classList.toggle("building-active", b.id === selectedId);
        el.classList.toggle("building-you-are-here", b.id === youAreHereId);

        el.setAttribute("data-plug-count", String(b.plugCount ?? 0));
        el.setAttribute("data-building-id", String(b.id));
        el.setAttribute("aria-label", `${b.name} (${b.code})`);
        break;
      }
    });
  }, [buildings, selectedId, youAreHereId]);

  useEffect(() => {
    if (!svgHtml || !svgHostRef.current) return;
    svgHostRef.current.innerHTML = svgHtml;
    hasFocusedRef.current = false;
  }, [svgHtml]);

  useEffect(() => {
    const host = svgHostRef.current;
    if (!host || !svgHtml) return;

    applyBuildingStyles();

    if (!youAreHere) {
      removeYouAreHerePin(host);
      prevYouAreHereId.current = null;
      hasFocusedRef.current = false;
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const placePinAndFocus = () => {
      if (cancelled) return;

      const center = placeYouAreHerePin(host, youAreHere);
      const locationChanged = prevYouAreHereId.current !== youAreHere.id;
      const shouldFocus =
        center &&
        viewportRef.current &&
        (!hasFocusedRef.current || locationChanged);

      if (shouldFocus && center && viewportRef.current) {
        const vp = viewportRef.current;
        const { width, height } = vp.getBoundingClientRect();
        if (width > 0 && height > 0) {
          const focus = computeMapFocus(vp, center);
          setScale(focus.scale);
          setOffset(focus.offset);
          hasFocusedRef.current = true;
        } else if (attempts < 8) {
          attempts += 1;
          requestAnimationFrame(placePinAndFocus);
          return;
        }
      } else if (!center && attempts < 8) {
        attempts += 1;
        requestAnimationFrame(placePinAndFocus);
        return;
      }

      prevYouAreHereId.current = youAreHere.id;
    };

    placePinAndFocus();

    return () => {
      cancelled = true;
    };
  }, [youAreHere, youAreHereId, svgHtml, applyBuildingStyles]);

  useEffect(() => {
    const host = svgHostRef.current;
    if (!host) return;

    const onBuildingPinClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest<SVGElement>(
        ".building-interactive",
      );
      if (!target?.id) return;

      const matches = buildings.filter((b) =>
        svgIdsForMapBuilding(b).includes(target.id),
      );
      const match =
        matches.find((b) => b.mapSvgId === target.id) ?? matches[0];
      if (match) onSelect?.(match);
    };

    host.addEventListener("click", onBuildingPinClick);
    return () => host.removeEventListener("click", onBuildingPinClick);
  }, [buildings, onSelect, svgHtml]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".building-interactive")) return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    viewportRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.x),
      y: dragRef.current.oy + (e.clientY - dragRef.current.y),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  if (svgError) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Could not load the campus map. Ensure{" "}
        <code className="text-xs">public/maps/sait-campus-map.svg</code> exists.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {youAreHere ? (
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
            aria-hidden
          />
          <p className="truncate text-sm text-foreground">
            <span className="font-medium">You:</span> {youAreHere.name} (
            {youAreHere.code})
          </p>
        </div>
      ) : (
        onChangeLocation && (
          <button
            type="button"
            onClick={onChangeLocation}
            className="min-h-10 w-full rounded-xl border border-dashed border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            Set your location
          </button>
        )
      )}

      <p className="text-xs text-muted-foreground">
        Pinch or scroll to zoom · Drag to pan · Tap a building
      </p>

      <div
        ref={viewportRef}
        className="relative touch-none overflow-hidden overscroll-contain rounded-xl border border-border bg-sky-500"
        style={{ height: "min(52vh, 420px)" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {!svgHtml && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/90">
            Loading official campus map…
          </div>
        )}
        <div
          className="absolute left-1/2 top-1/2 origin-center will-change-transform"
          style={{
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
          }}
        >
          <div
            ref={svgHostRef}
            className="campus-map-svg w-[1023px] max-w-none"
          />
        </div>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="Buildings"
      >
        {buildings.map((b) => {
          const active = b.id === selectedId;
          const isHere = b.id === youAreHereId;
          const count = b.plugCount ?? 0;
          return (
            <button
              key={b.id}
              type="button"
              role="listitem"
              onClick={() => onSelect?.(b)}
              className={`flex shrink-0 flex-col rounded-xl border px-4 py-2 text-left transition-colors active:scale-[0.99] ${
                isHere
                  ? "border-foreground bg-foreground text-background"
                  : active
                    ? "border-foreground bg-muted text-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted/80"
              }`}
            >
              <span className="flex items-center gap-1 text-xs font-bold">
                {b.code}
                {isHere && (
                  <span className="rounded bg-red-500/90 px-1 py-px text-[9px] font-semibold uppercase">
                    Here
                  </span>
                )}
              </span>
              <span className="max-w-[120px] truncate text-xs font-medium">
                {b.name}
              </span>
              {count > 0 && (
                <span
                  className={`mt-0.5 text-[10px] ${
                    isHere || active
                      ? "text-background/80"
                      : "text-emerald-800 dark:text-emerald-400"
                  }`}
                >
                  {count} plug{count === 1 ? "" : "s"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Building {selected.code}
            </p>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {selected.name}
            </h2>
            {(selected.plugCount ?? 0) > 0 ? (
              <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-400">
                {selected.plugCount} plug
                {selected.plugCount === 1 ? "" : "s"} reported here
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                No plugs reported yet — be the first!
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {onSetLocation && selected.id !== youAreHereId && (
              <button
                type="button"
                onClick={() => onSetLocation(selected)}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-border bg-muted px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
              >
                Set as my location
              </button>
            )}
            <Link
              href={`/?buildingId=${selected.id}`}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              View plugs in {selected.code}
            </Link>
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        Campus map ©{" "}
        <a
          href="https://www.sait.ca/about-sait/campus/campus-map"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          SAIT
        </a>
      </p>
    </div>
  );
}

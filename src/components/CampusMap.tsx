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
const PAN_THRESHOLD_PX = 6;

type MapTransform = {
  scale: number;
  offset: { x: number; y: number };
};

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function zoomAtFocal(
  current: MapTransform,
  newScale: number,
  focalX: number,
  focalY: number,
): MapTransform {
  const scale = clampScale(newScale);
  const worldX = (focalX - current.offset.x) / current.scale;
  const worldY = (focalY - current.offset.y) / current.scale;
  return {
    scale,
    offset: {
      x: focalX - worldX * scale,
      y: focalY - worldY * scale,
    },
  };
}

function focalFromClient(
  viewport: HTMLElement,
  clientX: number,
  clientY: number,
) {
  const rect = viewport.getBoundingClientRect();
  return {
    x: clientX - rect.left - rect.width / 2,
    y: clientY - rect.top - rect.height / 2,
  };
}

function pointerDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointerMidpoint(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

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
  const transformRef = useRef<MapTransform>({ scale: 1, offset: { x: 0, y: 0 } });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const panRef = useRef<{ lastX: number; lastY: number } | null>(null);
  const pinchRef = useRef<{
    distance: number;
    midpoint: { x: number; y: number };
  } | null>(null);
  const didGestureRef = useRef(false);

  useEffect(() => {
    transformRef.current = { scale, offset };
  }, [scale, offset]);

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
      if (didGestureRef.current) {
        didGestureRef.current = false;
        return;
      }

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
    const viewport = viewportRef.current;
    if (!viewport) return;

    const applyTransform = (next: MapTransform) => {
      transformRef.current = next;
      setScale(next.scale);
      setOffset(next.offset);
    };

    const activePointers = () => [...pointersRef.current.values()];

    const beginPinch = () => {
      const [a, b] = activePointers();
      if (!a || !b) return;
      const midpoint = pointerMidpoint(a, b);
      pinchRef.current = {
        distance: pointerDistance(a, b),
        midpoint,
      };
      panRef.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const focal = focalFromClient(viewport, e.clientX, e.clientY);
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      applyTransform(
        zoomAtFocal(
          transformRef.current,
          transformRef.current.scale + delta,
          focal.x,
          focal.y,
        ),
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      didGestureRef.current = false;
      const focal = focalFromClient(viewport, e.clientX, e.clientY);
      pointersRef.current.set(e.pointerId, focal);
      viewport.setPointerCapture(e.pointerId);

      if (pointersRef.current.size >= 2) {
        beginPinch();
      } else {
        panRef.current = { lastX: focal.x, lastY: focal.y };
        pinchRef.current = null;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointersRef.current.has(e.pointerId)) return;

      const focal = focalFromClient(viewport, e.clientX, e.clientY);
      pointersRef.current.set(e.pointerId, focal);

      const pointers = activePointers();
      if (pointers.length >= 2) {
        const [a, b] = pointers;
        const distance = pointerDistance(a, b);
        const midpoint = pointerMidpoint(a, b);

        if (!pinchRef.current || distance < 1) {
          beginPinch();
          return;
        }

        const pinch = pinchRef.current;
        const distRatio = distance / pinch.distance;
        const midDeltaX = midpoint.x - pinch.midpoint.x;
        const midDeltaY = midpoint.y - pinch.midpoint.y;
        const current = transformRef.current;

        let next: MapTransform = {
          scale: current.scale,
          offset: {
            x: current.offset.x + midDeltaX,
            y: current.offset.y + midDeltaY,
          },
        };
        if (Math.abs(distRatio - 1) > 0.0001) {
          next = zoomAtFocal(next, current.scale * distRatio, midpoint.x, midpoint.y);
        }

        if (
          Math.abs(distRatio - 1) > 0.004 ||
          Math.abs(midDeltaX) > PAN_THRESHOLD_PX ||
          Math.abs(midDeltaY) > PAN_THRESHOLD_PX
        ) {
          didGestureRef.current = true;
        }

        pinchRef.current = { distance, midpoint };
        applyTransform(next);
        return;
      }

      if (!panRef.current) return;

      const deltaX = focal.x - panRef.current.lastX;
      const deltaY = focal.y - panRef.current.lastY;
      if (
        Math.abs(deltaX) > PAN_THRESHOLD_PX ||
        Math.abs(deltaY) > PAN_THRESHOLD_PX
      ) {
        didGestureRef.current = true;
      }

      panRef.current = { lastX: focal.x, lastY: focal.y };
      const current = transformRef.current;
      applyTransform({
        scale: current.scale,
        offset: {
          x: current.offset.x + deltaX,
          y: current.offset.y + deltaY,
        },
      });
    };

    const onPointerEnd = (e: PointerEvent) => {
      pointersRef.current.delete(e.pointerId);
      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer may already be released.
      }

      const remaining = activePointers();
      if (remaining.length >= 2) {
        beginPinch();
      } else if (remaining.length === 1) {
        const point = remaining[0]!;
        panRef.current = { lastX: point.x, lastY: point.y };
        pinchRef.current = null;
      } else {
        panRef.current = null;
        pinchRef.current = null;
      }
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerEnd);
    viewport.addEventListener("pointercancel", onPointerEnd);

    return () => {
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerEnd);
      viewport.removeEventListener("pointercancel", onPointerEnd);
    };
  }, []);

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
        className="relative touch-none select-none overflow-hidden overscroll-contain rounded-xl border border-border bg-sky-500"
        style={{ height: "min(52vh, 420px)", touchAction: "none" }}
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

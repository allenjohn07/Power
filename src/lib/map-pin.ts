import { MAP_SVG_FALLBACK } from "@/data/sait-main-campus";

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_WIDTH = 1023;
const SVG_HEIGHT = 886;

/** Official SVG element id, with static fallbacks when DB mapSvgId is missing. */
export function svgIdsForMapBuilding(building: {
  code: string;
  mapSvgId?: string | null;
}): string[] {
  const ids = [building.mapSvgId, MAP_SVG_FALLBACK[building.code]].filter(
    (id): id is string => Boolean(id),
  );
  return [...new Set(ids)];
}

export type MapPoint = { x: number; y: number };

/**
 * Inject a "You are here" pin into the official SAIT SVG via getBBox().
 * Schematic map — pin tip anchors to building centroid, not GPS coordinates.
 */
export function placeYouAreHerePin(
  host: HTMLElement,
  building: { code: string; mapSvgId?: string | null; name: string },
): MapPoint | null {
  const svg = host.querySelector("svg");
  if (!svg) return null;

  host.querySelector("#you-are-here-pin")?.remove();

  for (const svgId of svgIdsForMapBuilding(building)) {
    const el = host.querySelector<SVGGraphicsElement>(`#${CSS.escape(svgId)}`);
    if (!el) continue;

    let bbox: DOMRect;
    try {
      bbox = el.getBBox();
    } catch {
      continue;
    }

    if (bbox.width === 0 && bbox.height === 0) continue;

    const cx = bbox.x + bbox.width / 2;
    const anchorY = bbox.y + bbox.height * 0.12;

    const pin = document.createElementNS(SVG_NS, "g");
    pin.setAttribute("id", "you-are-here-pin");
    // Tip of pin path sits at y=10 in local coords
    pin.setAttribute("transform", `translate(${cx}, ${anchorY - 10})`);
    pin.setAttribute("aria-label", `You are here: ${building.name}`);

    const shadow = document.createElementNS(SVG_NS, "ellipse");
    shadow.setAttribute("cx", "0");
    shadow.setAttribute("cy", "11");
    shadow.setAttribute("rx", "5");
    shadow.setAttribute("ry", "2");
    shadow.setAttribute("fill", "rgba(0,0,0,0.18)");

    const body = document.createElementNS(SVG_NS, "path");
    body.setAttribute(
      "d",
      "M0,-16 C-5,-16 -8.5,-11.5 -8.5,-6.5 C-8.5,1 0,10 0,10 C0,10 8.5,1 8.5,-6.5 C8.5,-11.5 5,-16 0,-16 Z",
    );
    body.setAttribute("fill", "#dc2626");
    body.setAttribute("stroke", "#ffffff");
    body.setAttribute("stroke-width", "1.5");

    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("cx", "0");
    dot.setAttribute("cy", "-7");
    dot.setAttribute("r", "3");
    dot.setAttribute("fill", "#ffffff");

    pin.appendChild(shadow);
    pin.appendChild(body);
    pin.appendChild(dot);

    const pinsLayer = getOrCreatePinsLayer(svg);
    pinsLayer.appendChild(pin);

    return { x: cx, y: anchorY };
  }

  return null;
}

function getOrCreatePinsLayer(svg: SVGSVGElement): SVGGElement {
  const existing = svg.querySelector("#map-pins-layer");
  if (existing) return existing as SVGGElement;

  const layer = document.createElementNS(SVG_NS, "g");
  layer.setAttribute("id", "map-pins-layer");
  const defs = svg.querySelector("defs");
  if (defs) {
    svg.insertBefore(layer, defs);
  } else {
    svg.appendChild(layer);
  }
  return layer;
}

export function removeYouAreHerePin(host: HTMLElement): void {
  host.querySelector("#you-are-here-pin")?.remove();
}

/** Pan/zoom the viewport so the user's building sits in the visible frame. */
export function computeMapFocus(
  viewport: HTMLElement,
  center: MapPoint,
  scale = 1.3,
): { scale: number; offset: { x: number; y: number } } {
  const vp = viewport.getBoundingClientRect();
  const focusScale = Math.min(scale, 3);
  return {
    scale: focusScale,
    offset: {
      x:
        (vp.width / 2) * (1 - 1 / focusScale) -
        (center.x - SVG_WIDTH / 2) * focusScale * 0.35,
      y:
        (vp.height / 2) * (1 - 1 / focusScale) -
        (center.y - SVG_HEIGHT / 2) * focusScale * 0.35,
    },
  };
}

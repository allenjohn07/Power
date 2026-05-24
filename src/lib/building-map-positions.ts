/**
 * Derive schematic mapX/mapY from the official SVG bbox (client-side).
 * Powers "Near me" when DB defaults aren't tuned — still not GPS.
 */
import { svgIdsForMapBuilding } from "@/lib/map-pin";
import type { MapPosition } from "@/lib/nearby-buildings";

const SVG_URL = "/maps/sait-campus-map.svg";

let cachedSvg: Document | null = null;

async function loadCampusSvg(): Promise<Document> {
  if (cachedSvg) return cachedSvg;
  const html = await fetch(SVG_URL).then((r) => r.text());
  cachedSvg = new DOMParser().parseFromString(html, "image/svg+xml");
  return cachedSvg;
}

/** Resolve building centers from the official campus SVG (client-side). */
export async function resolveBuildingPositions(
  buildings: { id: number; code: string; mapSvgId?: string | null }[],
): Promise<MapPosition[]> {
  const doc = await loadCampusSvg();

  return buildings.map((b) => {
    for (const svgId of svgIdsForMapBuilding(b)) {
      const el = doc.getElementById(svgId) as SVGGraphicsElement | null;
      if (el) {
        try {
          const box = el.getBBox();
          if (box.width > 0 || box.height > 0) {
            return {
              id: b.id,
              mapX: box.x + box.width / 2,
              mapY: box.y + box.height / 2,
            };
          }
        } catch {
          /* skip invalid bbox */
        }
      }
    }
    return { id: b.id, mapX: 512, mapY: 443 };
  });
}

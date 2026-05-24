import campusApi from "@/data/sait-campus-api.json";
import { floorsForBuilding, STANDARD_FLOORS } from "@/data/campus-buildings";

export type MainCampusBuilding = {
  code: string;
  name: string;
  mapSvgId: string;
  mapSvgIdFallback?: string;
  maxFloor: number;
  wings?: string[];
  description?: string;
  image?: string;
};

/** Wing codes from SAIT room-number system (Stan Grad, Senator Burns, Thomas Riley). */
const WINGS: Record<string, string[]> = {
  M: ["MB", "MC", "MD"],
  N: ["NH", "NK", "NN", "NR", "NJ", "NL"],
  T: ["TD", "TT", "TF", "TU"],
};

const MAX_FLOORS: Record<string, number> = {
  N: 11,
  H: 8,
  D: 6,
  M: 4,
  T: 4,
  C: 5,
  ZA: 1,
};

/** Eugene Coste shares footprint with Cenovus on the official SVG. */
const SVG_FALLBACK: Record<string, string> = {
  Q: "Cenovus_Centre",
};

export const MAIN_CAMPUS_BUILDINGS: MainCampusBuilding[] = campusApi.buildings
  .filter((b) => b.code !== "ZA")
  .map((b) => ({
    code: b.code,
    name: b.name,
    mapSvgId: b.mapSvgId,
    mapSvgIdFallback: SVG_FALLBACK[b.code],
    maxFloor: MAX_FLOORS[b.code] ?? 5,
    wings: WINGS[b.code],
    description: b.description?.replace(/&apos;/g, "'"),
    image: b.img,
  }));

export { STANDARD_FLOORS, floorsForBuilding };

export const MAIN_CAMPUS_AMENITIES = campusApi.amenities;

/** When a building shares an SVG region with another (e.g. Eugene Coste / Cenovus). */
export const MAP_SVG_FALLBACK: Record<string, string> = SVG_FALLBACK;

export function svgIdsForBuilding(building: {
  code: string;
  mapSvgId?: string | null;
}): string[] {
  const ids = [building.mapSvgId, SVG_FALLBACK[building.code]].filter(
    (id): id is string => Boolean(id),
  );
  return [...new Set(ids)];
}

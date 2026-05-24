export type MapPosition = {
  id: number;
  mapX: number;
  mapY: number;
};

/**
 * "Near me" without GPS: Euclidean distance on schematic map coordinates.
 * Buildings share mapX/mapY from DB or SVG bbox — good enough for adjacent
 * wings on the official campus map, not meter-accurate positioning.
 */
export function nearbyBuildingIds(
  buildings: MapPosition[],
  originId: number,
  options?: { limit?: number; maxDistance?: number },
): number[] {
  const limit = options?.limit ?? 6;
  const maxDistance = options?.maxDistance ?? 22;

  const origin = buildings.find((b) => b.id === originId);
  if (!origin) return [originId];

  return buildings
    .map((b) => ({
      id: b.id,
      dist: Math.hypot(b.mapX - origin.mapX, b.mapY - origin.mapY),
    }))
    .sort((a, b) => a.dist - b.dist)
    .filter((b) => b.dist <= maxDistance)
    .slice(0, limit)
    .map((b) => b.id);
}

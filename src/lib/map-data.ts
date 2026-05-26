import { parseBuilding } from "@/lib/buildings";
import { withDbRetry } from "@/lib/db-query";
import { prisma } from "@/lib/prisma";

/** Buildings + per-building plug counts for the campus map (no full plug rows). */
export async function getMapPageData(campus = "main") {
  const [buildings, countRows, totalPlugs] = await Promise.all([
    withDbRetry(() =>
      prisma.building.findMany({
        where: { campus },
        orderBy: [{ campus: "asc" }, { name: "asc" }],
      }),
    ),
    withDbRetry(() =>
      prisma.plug.groupBy({
        by: ["buildingId"],
        where: { building: { campus } },
        _count: { _all: true },
      }),
    ),
    withDbRetry(() =>
      prisma.plug.count({ where: { building: { campus } } }),
    ),
  ]);

  const plugCountByBuildingId: Record<number, number> = {};
  for (const row of countRows) {
    plugCountByBuildingId[row.buildingId] = row._count._all;
  }

  return {
    buildings: buildings.map(parseBuilding),
    plugCountByBuildingId,
    totalPlugs,
  };
}

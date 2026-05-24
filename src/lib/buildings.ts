/** API shape for building pickers: Prisma row + derived floor/wing option lists. */
import type { Building } from "@prisma/client";
import { floorsForBuilding, STANDARD_FLOORS } from "@/data/campus-buildings";

export type BuildingWithMeta = Building & {
  wingsList: string[];
  floorOptions: string[];
};

export function parseBuilding(building: Building): BuildingWithMeta {
  const wingsList = building.wings
    ? building.wings.split(",").map((w) => w.trim()).filter(Boolean)
    : [];

  return {
    ...building,
    wingsList,
    floorOptions: floorsForBuilding(building.maxFloor),
  };
}

export { STANDARD_FLOORS, floorsForBuilding };

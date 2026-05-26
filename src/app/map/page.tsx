import { MapPageClient } from "@/app/map/MapPageClient";
import { getMapPageData } from "@/lib/map-data";

export const revalidate = 60;

export default async function MapPage() {
  const { buildings, plugCountByBuildingId, totalPlugs } =
    await getMapPageData("main");

  return (
    <MapPageClient
      buildings={buildings}
      plugCountByBuildingId={plugCountByBuildingId}
      totalPlugs={totalPlugs}
    />
  );
}

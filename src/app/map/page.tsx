import { unstable_cache } from "next/cache";
import { MapPageClient } from "@/app/map/MapPageClient";
import { getMapPageData } from "@/lib/map-data";

/** Skip build-time prerender — CI has no DATABASE_URL; data loads at request time. */
export const dynamic = "force-dynamic";

const getCachedMapPageData = unstable_cache(
  () => getMapPageData("main"),
  ["map-page-data-main"],
  { revalidate: 60 },
);

export default async function MapPage() {
  const { buildings, plugCountByBuildingId, totalPlugs } =
    await getCachedMapPageData();

  return (
    <MapPageClient
      buildings={buildings}
      plugCountByBuildingId={plugCountByBuildingId}
      totalPlugs={totalPlugs}
    />
  );
}

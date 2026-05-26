"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CampusMap, type MapBuilding } from "@/components/CampusMap";
import { useCurrentBuilding } from "@/hooks/useCurrentBuilding";
import type { BuildingWithMeta } from "@/lib/buildings";

type BuildingFilterOption = {
  label: string;
  href: string;
};

type MapPageClientProps = {
  buildings: BuildingWithMeta[];
  plugCountByBuildingId: Record<number, number>;
  totalPlugs: number;
};

export function MapPageClient({
  buildings,
  plugCountByBuildingId,
  totalPlugs,
}: MapPageClientProps) {
  const {
    building: currentBuilding,
    ready: locationReady,
    save: saveLocation,
  } = useCurrentBuilding();

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const mapBuildings: MapBuilding[] = useMemo(
    () =>
      buildings.map((b) => ({
        id: b.id,
        code: b.code,
        name: b.name,
        mapSvgId: b.mapSvgId,
        plugCount: plugCountByBuildingId[b.id] ?? 0,
      })),
    [buildings, plugCountByBuildingId],
  );

  useEffect(() => {
    if (!locationReady) return;
    if (currentBuilding) {
      setSelectedId(currentBuilding.id);
    }
  }, [locationReady, currentBuilding]);

  const youAreHereBuilding = useMemo(() => {
    if (!currentBuilding || mapBuildings.length === 0) return null;
    return (
      mapBuildings.find((b) => b.id === currentBuilding.id) ??
      mapBuildings.find((b) => b.code === currentBuilding.code) ??
      null
    );
  }, [currentBuilding, mapBuildings]);

  useEffect(() => {
    if (!locationReady || !currentBuilding || !youAreHereBuilding) return;
    if (youAreHereBuilding.id === currentBuilding.id) return;
    saveLocation({
      id: youAreHereBuilding.id,
      code: youAreHereBuilding.code,
      name: youAreHereBuilding.name,
    });
  }, [locationReady, currentBuilding, youAreHereBuilding, saveLocation]);

  const setAsMyLocation = useCallback(
    (building: MapBuilding) => {
      saveLocation({
        id: building.id,
        code: building.code,
        name: building.name,
      });
      setSelectedId(building.id);
    },
    [saveLocation],
  );

  const selectedFilterOptions: BuildingFilterOption[] = useMemo(() => {
    if (!selectedId) return [];
    const selectedBuilding = buildings.find((b) => b.id === selectedId);
    if (!selectedBuilding) return [];

    const options: BuildingFilterOption[] = [];
    for (const floor of selectedBuilding.floorOptions) {
      const params = new URLSearchParams({
        buildingId: String(selectedId),
        floor,
      });
      options.push({
        label: `Floor ${floor}`,
        href: `/?${params.toString()}`,
      });
    }
    for (const wing of selectedBuilding.wingsList) {
      const params = new URLSearchParams({
        buildingId: String(selectedId),
        wing,
      });
      options.push({
        label: `Wing ${wing}`,
        href: `/?${params.toString()}`,
      });
    }
    return options.slice(0, 10);
  }, [selectedId, buildings]);

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="border-b border-border bg-background/95 px-4 pt-4 pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/90">
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:hidden">
            Campus map
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalPlugs} plug{totalPlugs === 1 ? "" : "s"} · tap a building to
            explore
          </p>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <CampusMap
            buildings={mapBuildings}
            selectedId={selectedId}
            youAreHereId={youAreHereBuilding?.id ?? null}
            onSelect={(b) => setSelectedId(b.id)}
            onSetLocation={setAsMyLocation}
            selectedFilterOptions={selectedFilterOptions}
          />
        </main>
      </div>
    </AppShell>
  );
}

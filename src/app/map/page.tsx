"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CampusMap, type MapBuilding } from "@/components/CampusMap";
import type { PlugPointWithBuilding } from "@/components/PlugDirectoryCard";
import { useCurrentBuilding } from "@/hooks/useCurrentBuilding";

type BuildingApi = {
  id: number;
  code: string;
  name: string;
  campus: string;
  mapSvgId?: string | null;
  wingsList?: string[];
  floorOptions?: string[];
};

type BuildingFilterOption = {
  label: string;
  href: string;
};

export default function MapPage() {
  const {
    building: currentBuilding,
    ready: locationReady,
    save: saveLocation,
  } = useCurrentBuilding();

  const [buildings, setBuildings] = useState<BuildingApi[]>([]);
  const [campusPlugPoints, setCampusPlugPoints] = useState<PlugPointWithBuilding[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/buildings?campus=main"),
      fetch("/api/plugs?campus=main"),
    ])
      .then(async ([bRes, pRes]) => {
        const campusBuildings = await bRes.json();
        const plugPoints = await pRes.json();
        if (Array.isArray(campusBuildings)) setBuildings(campusBuildings);
        if (Array.isArray(plugPoints)) setCampusPlugPoints(plugPoints);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!locationReady) return;
    if (currentBuilding) {
      setSelectedId(currentBuilding.id);
    }
  }, [locationReady, currentBuilding]);

  const mapBuildings: MapBuilding[] = useMemo(() => {
    const counts = campusPlugPoints.reduce<Record<number, number>>((acc, p) => {
      acc[p.buildingId] = (acc[p.buildingId] ?? 0) + 1;
      return acc;
    }, {});
    return buildings.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      mapSvgId: b.mapSvgId,
      plugCount: counts[b.id] ?? 0,
    }));
  }, [buildings, campusPlugPoints]);

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
    (building: MapBuilding | BuildingApi) => {
      saveLocation({
        id: building.id,
        code: building.code,
        name: building.name,
      });
      setSelectedId(building.id);
    },
    [saveLocation],
  );

  const totalPlugs = campusPlugPoints.length;
  const selectedFilterOptions: BuildingFilterOption[] = useMemo(() => {
    if (!selectedId) return [];
    const selectedBuilding = buildings.find((b) => b.id === selectedId);
    if (!selectedBuilding) return [];

    const options: BuildingFilterOption[] = [];
    const floorOptions = selectedBuilding.floorOptions ?? [];
    const wingOptions = selectedBuilding.wingsList ?? [];

    for (const floor of floorOptions) {
      const params = new URLSearchParams({
        buildingId: String(selectedId),
        floor,
      });
      options.push({
        label: `Floor ${floor}`,
        href: `/?${params.toString()}`,
      });
    }

    for (const wing of wingOptions) {
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
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
              <p className="text-sm text-muted-foreground">
                Loading campus map…
              </p>
            </div>
          ) : (
            <CampusMap
              buildings={mapBuildings}
              selectedId={selectedId}
              youAreHereId={youAreHereBuilding?.id ?? null}
              onSelect={(b) => {
                setSelectedId(b.id);
              }}
              onSetLocation={setAsMyLocation}
              selectedFilterOptions={selectedFilterOptions}
            />
          )}
        </main>
      </div>
    </AppShell>
  );
}

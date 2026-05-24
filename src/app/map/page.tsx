"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BuildingPicker } from "@/components/BuildingPicker";
import { CampusMap, type MapBuilding } from "@/components/CampusMap";
import type { PlugWithBuilding } from "@/components/PlugCard";
import { useCurrentBuilding } from "@/hooks/useCurrentBuilding";

type BuildingApi = {
  id: number;
  code: string;
  name: string;
  campus: string;
  mapSvgId?: string | null;
};

export default function MapPage() {
  const {
    building: currentBuilding,
    ready: locationReady,
    save: saveLocation,
  } = useCurrentBuilding();

  const [buildings, setBuildings] = useState<BuildingApi[]>([]);
  const [plugs, setPlugs] = useState<PlugWithBuilding[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/buildings?campus=main"),
      fetch("/api/plugs?campus=main"),
    ])
      .then(async ([bRes, pRes]) => {
        const bData = await bRes.json();
        const pData = await pRes.json();
        if (Array.isArray(bData)) setBuildings(bData);
        if (Array.isArray(pData)) setPlugs(pData);
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
    const counts = plugs.reduce<Record<number, number>>((acc, p) => {
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
  }, [buildings, plugs]);

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

  const totalPlugs = plugs.length;

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="border-b border-border px-4 pt-4 pb-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:hidden">
            Main Campus Map
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalPlugs} plug{totalPlugs === 1 ? "" : "s"} on campus
          </p>
          <BuildingPicker
            buildings={buildings}
            value={currentBuilding}
            onSelect={setAsMyLocation}
            className="mt-3"
          />
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
              onSelect={(b) => setSelectedId(b.id)}
              onSetLocation={setAsMyLocation}
            />
          )}
        </main>
      </div>
    </AppShell>
  );
}

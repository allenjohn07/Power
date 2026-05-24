"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearCurrentBuilding,
  getCurrentBuilding,
  setCurrentBuilding,
  type CurrentBuilding,
} from "@/lib/current-building";

export function useCurrentBuilding() {
  const [building, setBuilding] = useState<CurrentBuilding | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setBuilding(getCurrentBuilding());
    setReady(true);
  }, []);

  const save = useCallback((next: CurrentBuilding) => {
    setCurrentBuilding(next);
    setBuilding(next);
  }, []);

  const clear = useCallback(() => {
    clearCurrentBuilding();
    setBuilding(null);
  }, []);

  return { building, ready, save, clear };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearCurrentBuilding,
  getCurrentBuilding,
  setCurrentBuilding,
  type CurrentBuilding,
} from "@/lib/current-building";

/**
 * Hydrates saved building from localStorage after mount (avoids SSR mismatch).
 * Feed waits for `ready` before applying default building filters.
 */
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

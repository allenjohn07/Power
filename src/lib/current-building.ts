/**
 * Client-side "you are here" — no indoor GPS.
 * Students self-report which building they're in; the feed and map use this
 * for default filters and schematic "near me" proximity.
 */

export type CurrentBuilding = {
  id: number;
  code: string;
  name: string;
};

const STORAGE_KEY = "sait-outlets-current-building";

export function getCurrentBuilding(): CurrentBuilding | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CurrentBuilding;
    if (
      typeof parsed.id === "number" &&
      typeof parsed.code === "string" &&
      typeof parsed.name === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setCurrentBuilding(building: CurrentBuilding): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(building));
}

export function clearCurrentBuilding(): void {
  localStorage.removeItem(STORAGE_KEY);
}

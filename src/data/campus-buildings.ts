/** Standard floor labels used across SAIT main-campus buildings. */
export const STANDARD_FLOORS = [
  "Basement",
  "Ground Floor",
  "1st Floor",
  "2nd Floor",
  "3rd Floor",
  "4th Floor",
  "5th Floor",
  "6th Floor",
  "7th Floor",
  "8th Floor",
  "9th Floor",
  "10th Floor",
  "11th Floor",
] as const;

export function floorsForBuilding(maxFloor: number): string[] {
  return STANDARD_FLOORS.filter((_, index) => {
    if (index <= 1) return true;
    return index - 1 <= maxFloor;
  });
}

export const CAMPUS_LABELS: Record<string, string> = {
  main: "Main Campus",
};

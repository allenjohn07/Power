/**
 * SAIT room-number parsing (see sait.ca campus map help):
 * - Leading letters = building + wing (e.g. NL = Senator Burns, L wing)
 * - Following digits = floor + room (e.g. MB314 → 3rd floor, NN1106 → 11th floor)
 */

import { floorsForBuilding } from "@/data/campus-buildings";

export type ParsedRoomCode = {
  /** Raw token matched (e.g. CA416) */
  roomCode: string;
  buildingCode: string;
  wing: string | null;
  /** Floor label matching our dropdowns (e.g. "4th Floor") */
  floor: string | null;
  roomNumber: string | null;
  /** Office/room hint from SAIT directory when known */
  locationHint: string | null;
  confidence: "high" | "medium" | "low";
};

/** Two-letter wing / zone prefixes → parent building code */
const WING_PREFIXES: Record<string, string> = {
  // Heritage Hall (A)
  AA: "A",
  // Clayton Carroll (B)
  BA: "B",
  // Aldred Centre (C)
  CA: "C",
  CB: "C",
  // East Hall (D)
  DA: "D",
  // Begin Tower (H)
  HA: "H",
  // Cenovus / Johnson-Cobbe (J/K)
  JA: "J",
  KA: "K",
  // Stan Grad (M)
  MB: "M",
  MC: "M",
  MD: "M",
  // Senator Burns (N)
  NH: "N",
  NK: "N",
  NN: "N",
  NR: "N",
  NJ: "N",
  NL: "N",
  // Thomas Riley (T)
  TD: "T",
  TT: "T",
  TF: "T",
  TU: "T",
};

/** Single-letter main-campus building codes */
const BUILDING_CODES = new Set([
  "A",
  "B",
  "C",
  "D",
  "E",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "Q",
  "T",
]);

const MAX_FLOORS: Record<string, number> = {
  A: 4,
  B: 3,
  C: 5,
  D: 6,
  E: 4,
  G: 3,
  H: 8,
  J: 4,
  K: 4,
  L: 2,
  M: 4,
  N: 11,
  Q: 2,
  T: 4,
};

/** Known rooms from SAIT campus map API — improves location hints */
const KNOWN_ROOMS: Record<string, string> = {
  AA113: "Alumni and Development",
  AA211: "Office of the Registrar",
  AA205: "Student Development and Counselling",
  AA206: "International Centre",
  CA416: "Applied Research and Innovation Services",
  CB410: "School of Construction main office",
  G101: "Finance",
  G230: "School of Hospitality and Tourism main office",
  G112: "XDocs",
  E054: "The Butchery",
  E124: "Destinations Travel by SAIT",
  KA440: "MacPhail School of Energy main office",
  MB107: "Continuing Education and Professional Studies",
  MB305: "Interfaith Centre",
  MC221: "Lamb Learner Success Centre",
  MC111: "Reg Erhardt Library",
  MD302: "School for Advanced Digital Technology main office",
  NN104: "eCard / Commercial Services / Parking office",
  NN504: "Centre for Applied Education Innovation",
  NN610: "Corporate Training main office",
  NN1004: "Employee Services",
  NN1101: "Facilities Management",
  NN108: "Natoysopoyiis",
  NN701: "School of Business main office",
  NR213: "School of Health and Public Safety main office",
  NN322: "Student Services",
  Q100: "Campus Security",
  TF241: "Apprenticeship and Industry Training (AIT) Liaison office",
  TT470: "School of Manufacturing and Automation main office",
  TT468: "School of Transportation main office",
};

const ROOM_TOKEN =
  /\b([A-Z]{2}\d{2,4}|[A-Z]\d{2,4}|[A-Z]{2})(?:\b|$)/gi;

/** Sort wing keys longest-first so AA matches before A */
const WING_KEYS_DESC = Object.keys(WING_PREFIXES).sort(
  (a, b) => b.length - a.length,
);

export function floorNumberToLabel(
  floorNum: number,
  buildingCode: string,
): string | null {
  if (floorNum === 0) return "Basement";
  const options = floorsForBuilding(MAX_FLOORS[buildingCode] ?? 5);
  if (floorNum === 1 && options.includes("Ground Floor")) {
    // Some G### rooms are main floor; prefer 1st unless only ground fits
    return "1st Floor";
  }
  const label = `${floorNum}${ordinalSuffix(floorNum)} Floor`;
  return options.includes(label) ? label : null;
}

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function parseFloorDigits(
  digits: string,
  buildingCode: string,
): { floor: number | null; roomNumber: string | null } {
  if (!digits) return { floor: null, roomNumber: null };
  const max = MAX_FLOORS[buildingCode] ?? 5;

  // Basement-style (0xx)
  if (digits.startsWith("0") && digits.length >= 2) {
    return { floor: 0, roomNumber: digits };
  }

  // Try 2-digit floor (e.g. NN1106 → 11)
  if (digits.length >= 3) {
    const two = parseInt(digits.slice(0, 2), 10);
    if (!Number.isNaN(two) && two >= 1 && two <= max) {
      return { floor: two, roomNumber: digits.slice(2) || digits };
    }
  }

  const one = parseInt(digits.slice(0, 1), 10);
  if (!Number.isNaN(one) && one >= 1 && one <= max) {
    return { floor: one, roomNumber: digits.slice(1) || digits };
  }

  return { floor: null, roomNumber: digits };
}

function parseToken(token: string): ParsedRoomCode | null {
  const code = token.toUpperCase().replace(/\s/g, "");
  if (code.length < 1) return null;

  // Wing-only (e.g. "CA", "NL")
  if (/^[A-Z]{2}$/.test(code) && WING_PREFIXES[code]) {
    const buildingCode = WING_PREFIXES[code];
    return {
      roomCode: code,
      buildingCode,
      wing: code,
      floor: null,
      roomNumber: null,
      locationHint: null,
      confidence: "medium",
    };
  }

  // Two-letter wing + digits (CA416, NL1106, MB314)
  for (const wing of WING_KEYS_DESC) {
    if (code.startsWith(wing) && code.length > wing.length) {
      const digits = code.slice(wing.length);
      if (!/^\d+$/.test(digits)) continue;
      const buildingCode = WING_PREFIXES[wing];
      const { floor, roomNumber } = parseFloorDigits(digits, buildingCode);
      return {
        roomCode: code,
        buildingCode,
        wing,
        floor: floor !== null ? floorNumberToLabel(floor, buildingCode) : null,
        roomNumber,
        locationHint: KNOWN_ROOMS[code] ?? null,
        confidence: "high",
      };
    }
  }

  // Single building letter + digits (G101, E054, Q100)
  const single = code.match(/^([A-Z])(\d+)$/);
  if (single && BUILDING_CODES.has(single[1])) {
    const buildingCode = single[1];
    const digits = single[2];
    const { floor, roomNumber } = parseFloorDigits(digits, buildingCode);
    return {
      roomCode: code,
      buildingCode,
      wing: null,
      floor: floor !== null ? floorNumberToLabel(floor, buildingCode) : null,
      roomNumber,
      locationHint: KNOWN_ROOMS[code] ?? null,
      confidence: "high",
    };
  }

  return null;
}

/** Extract the best room token from free text or a dedicated field */
export function extractRoomToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Whole input looks like a room code
  if (/^[A-Za-z]{1,3}\d*$/i.test(trimmed.replace(/\s/g, ""))) {
    return trimmed.replace(/\s/g, "").toUpperCase();
  }

  const matches = [...trimmed.toUpperCase().matchAll(ROOM_TOKEN)];
  if (matches.length === 0) return null;

  // Prefer longest / most specific token
  const tokens = matches.map((m) => m[1]).sort((a, b) => b.length - a.length);
  return tokens[0] ?? null;
}

export function parseRoomInput(input: string): ParsedRoomCode | null {
  const token = extractRoomToken(input);
  if (!token) return null;
  return parseToken(token);
}

/** All wing prefixes for a building (for keyword-only search) */
export function wingPrefixesForBuilding(buildingCode: string): string[] {
  return Object.entries(WING_PREFIXES)
    .filter(([, b]) => b === buildingCode)
    .map(([w]) => w);
}

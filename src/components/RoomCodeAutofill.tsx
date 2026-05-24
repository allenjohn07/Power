"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { parseRoomInput, type ParsedRoomCode } from "@/lib/room-code";
import { cn } from "@/lib/utils";

type Building = {
  id: number;
  code: string;
  name: string;
  wingsList: string[];
  floorOptions: string[];
};

type RoomCodeAutofillProps = {
  buildings: Building[];
  buildingId: string;
  wing: string;
  floor: string;
  exactLocation: string;
  onBuildingIdChange: (id: string) => void;
  onWingChange: (wing: string) => void;
  onFloorChange: (floor: string) => void;
  onExactLocationChange: (value: string) => void;
};

export function RoomCodeAutofill({
  buildings,
  buildingId,
  wing,
  floor,
  exactLocation,
  onBuildingIdChange,
  onWingChange,
  onFloorChange,
  onExactLocationChange,
}: RoomCodeAutofillProps) {
  const [roomQuery, setRoomQuery] = useState("");
  const [parsed, setParsed] = useState<ParsedRoomCode | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const lastApplied = useRef<string | null>(null);

  useEffect(() => {
    const source = roomQuery.trim()
      ? roomQuery
      : exactLocation.trim()
        ? exactLocation
        : "";
    if (!source) {
      setParsed(null);
      return;
    }

    const timer = setTimeout(() => {
      const result = parseRoomInput(source);
      setParsed(result);
      if (result) setDismissed(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [roomQuery, exactLocation]);

  useEffect(() => {
    if (!parsed || dismissed) return;
    if (lastApplied.current === parsed.roomCode) return;

    const building = buildings.find((b) => b.code === parsed.buildingCode);
    if (!building) return;

    onBuildingIdChange(String(building.id));

    if (parsed.wing && building.wingsList.includes(parsed.wing)) {
      onWingChange(parsed.wing);
    }

    if (parsed.floor && building.floorOptions.includes(parsed.floor)) {
      onFloorChange(parsed.floor);
    }

    if (roomQuery.trim()) {
      let location = exactLocation;
      if (parsed.locationHint) {
        const hint = `Near ${parsed.locationHint} (${parsed.roomCode})`;
        if (!exactLocation.toUpperCase().includes(parsed.roomCode)) {
          location = exactLocation.trim() ? `${exactLocation.trim()} — ${hint}` : hint;
        }
      } else if (!exactLocation.toUpperCase().includes(parsed.roomCode)) {
        const near = `Near room ${parsed.roomCode}`;
        location = exactLocation.trim() ? `${exactLocation.trim()} — ${near}` : near;
      }
      if (location !== exactLocation) {
        onExactLocationChange(location);
      }
    }

    lastApplied.current = parsed.roomCode;
  }, [
    parsed,
    dismissed,
    buildings,
    roomQuery,
    exactLocation,
    onBuildingIdChange,
    onWingChange,
    onFloorChange,
    onExactLocationChange,
  ]);

  const building = parsed
    ? buildings.find((b) => b.code === parsed.buildingCode)
    : null;

  const matchesCurrent =
    parsed &&
    building &&
    String(building.id) === buildingId &&
    (!parsed.wing || wing === parsed.wing) &&
    (!parsed.floor || floor === parsed.floor);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          Room code or wing
        </span>
        <Input
          type="text"
          value={roomQuery}
          onChange={(e) => {
            setRoomQuery(e.target.value);
            lastApplied.current = null;
            setDismissed(false);
          }}
          placeholder="e.g. CA416, NL, MB314, G101"
          className="font-mono text-xs uppercase placeholder:normal-case"
          aria-describedby="room-code-hint"
          autoComplete="off"
          spellCheck={false}
        />
        <p id="room-code-hint" className="text-xs text-muted-foreground">
          Letters = building/wing (e.g. <strong>CA</strong> = Aldred Centre).
          Numbers = floor (<strong>CA416</strong> = 4th floor).
        </p>
      </label>

      {parsed && building && !dismissed && (
        <div
          role="status"
          className={cn(
            "rounded-lg border px-3 py-3 text-sm",
            matchesCurrent
              ? "border-emerald-500/30 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "border-border bg-muted text-foreground",
          )}
        >
          <p className="font-medium">
            {matchesCurrent ? "Applied" : "Detected"} &ldquo;{parsed.roomCode}
            &rdquo;
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs">
            <li>
              {building.name} ({parsed.buildingCode})
            </li>
            {parsed.wing && <li>Wing {parsed.wing}</li>}
            {parsed.floor && <li>{parsed.floor}</li>}
            {parsed.locationHint && <li>{parsed.locationHint}</li>}
          </ul>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="mt-2 text-xs font-medium text-muted-foreground underline transition-colors hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}

      {roomQuery.trim() && !parsed && (
        <p className="text-xs text-destructive">
          No match. Try a full room (CA416), wing only (NL, MB), or building +
          number (G101).
        </p>
      )}
    </div>
  );
}

"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type BuildingOption = {
  id: number;
  code: string;
  name: string;
};

type LocationPickerProps = {
  open: boolean;
  buildings: BuildingOption[];
  currentId?: number | null;
  onSelect: (building: BuildingOption) => void;
  onClose: () => void;
};

export function LocationPicker({
  open,
  buildings,
  currentId,
  onSelect,
  onClose,
}: LocationPickerProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Choose your building"
      onClick={onClose}
    >
      <div
        className="max-h-[70vh] w-full max-w-lg overflow-hidden rounded-t-2xl border-t border-border bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-border" />
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Where are you?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto p-2">
          {buildings.map((b) => {
            const isCurrent = b.id === currentId;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(b);
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors active:scale-[0.99]",
                    isCurrent ? "bg-muted" : "hover:bg-muted/80",
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted font-mono text-xs font-semibold text-muted-foreground">
                    {b.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {b.name}
                    </span>
                    {isCurrent && (
                      <span className="text-xs text-muted-foreground">
                        Current location
                      </span>
                    )}
                  </span>
                  {isCurrent && (
                    <Check className="h-4 w-4 shrink-0 text-foreground" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

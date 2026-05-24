"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { springs } from "@/lib/springs";
import { cn } from "@/lib/utils";

export type BuildingOption = {
  id: number;
  code: string;
  name: string;
};

type BuildingPickerProps = {
  buildings: BuildingOption[];
  value?: BuildingOption | null;
  onSelect: (building: BuildingOption) => void;
  placeholder?: string;
  className?: string;
};

export function BuildingPicker({
  buildings,
  value,
  onSelect,
  placeholder = "Select building",
  className,
}: BuildingPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return buildings;
    return buildings.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q),
    );
  }, [buildings, search]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-sm", className)}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        transition={springs.snappy}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
          open && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        )}
      >
        {value ? (
          <motion.span
            className="size-2 shrink-0 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        ) : (
          <span
            className="size-2 shrink-0 rounded-full bg-muted-foreground/40"
            aria-hidden
          />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {value?.name ?? placeholder}
        </span>
        {value && (
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {value.code}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </motion.button>

      {open && (
        <motion.div
          role="listbox"
          aria-label="Choose a building"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={springs.soft}
          className="absolute top-[calc(100%+0.5rem)] z-50 flex w-full min-w-[min(100vw-2rem,20rem)] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-lg sm:min-w-full"
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search buildings…"
                autoFocus
                className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <ul className="max-h-[min(50vh,320px)] overflow-y-auto p-1.5">
            {filtered.map((b) => {
              const selected = value?.id === b.id;
              return (
                <li key={b.id}>
                  <motion.button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    whileTap={{ scale: 0.98 }}
                    transition={springs.snappy}
                    onClick={() => {
                      onSelect(b);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-muted/80",
                      selected && "bg-muted",
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background font-mono text-xs font-semibold text-muted-foreground">
                      {b.code}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {b.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Main campus
                      </span>
                    </span>
                    {selected && (
                      <Check className="size-4 shrink-0 text-foreground" />
                    )}
                  </motion.button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No buildings match
              </li>
            )}
          </ul>
        </motion.div>
      )}
    </div>
  );
}

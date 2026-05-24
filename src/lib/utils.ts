import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shared pill style for filter / quick-filter chips. */
export function filterChipClass(active: boolean) {
  return cn(
    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
    active
      ? "border-foreground/25 bg-muted text-foreground"
      : "border-border bg-card text-muted-foreground hover:border-foreground/15 hover:text-foreground",
  );
}

/** Section labels — feed, account, forms. */
export function sectionLabelClass() {
  return "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";
}

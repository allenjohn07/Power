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
      ? "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary/90 hover:text-primary-foreground"
      : "border-border bg-background text-foreground hover:border-border hover:bg-muted hover:text-foreground",
  );
}

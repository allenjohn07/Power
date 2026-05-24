---
name: ui-polish
description: Use this skill to redesign the SAIT Outlets app (Next.js + Tailwind + shadcn/ui) into a clean, Vercel-style mobile UI. Collapses the filter panel into a bottom sheet, tightens card layouts, and applies a consistent design system across all pages.
---

# UI/UX Polish Workflow
You are an expert Frontend UX Engineer specialising in mobile-first Next.js apps. When applying this skill to a component, follow these exact rules:

## CRITICAL CONSTRAINTS
- DO NOT alter any backend logic, data fetching, Prisma calls, tRPC routes, or React hooks (`useState`, `useEffect`, etc.).
- DO NOT rename any existing props, variables, or function names.
- Only modify `className` attributes and JSX layout structure (adding/moving wrapper divs and spans).
- Keep all existing event handlers intact. Only add new ones for pure UI interactions (e.g. sheet open/close toggle).

## DESIGN SYSTEM TO APPLY

1. **Font:** Use Geist Sans (`font-sans` mapped to `--font-geist-sans` via `geist/font/sans` in `layout.tsx`). Apply `tracking-tight` to all headings and `font-mono text-xs` for room codes and short identifiers.

2. **Color:** Never hardcode hex values. Use only shadcn/ui CSS variables (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-muted`, `border-border`, `bg-card`). For status badges use semantic Tailwind: Works = `bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400`, Broken = `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`.

3. **Filter panel → Bottom Sheet:** Remove the full filter panel (room code input + building/floor/wing dropdowns) from the page body entirely. Replace it with a shadcn `<Sheet side="bottom">` triggered by a single pill button in a horizontally scrollable filter row. The sheet gets `rounded-t-2xl` and a drag handle `<div className="w-9 h-1 rounded-full bg-border mx-auto mb-3" />` at the top.

4. **Quick filter chips:** Add a scrollable row of pill buttons (`rounded-full px-3 py-1.5 text-xs font-medium border`) for one-tap filters: All, Works, Near me, Recently added. Active state: `bg-foreground text-background border-foreground`. Inactive: `bg-muted text-foreground border-border`.

5. **Cards:** Each outlet card uses `rounded-xl p-3.5 bg-card border border-border`. Include a building-initial avatar (`w-10 h-10 rounded-lg bg-muted border border-border text-[11px] font-semibold text-muted-foreground`), an all-caps meta breadcrumb (`text-[11px] uppercase tracking-wide font-semibold text-muted-foreground`), a title (`text-sm font-medium text-foreground leading-snug`), and status badges. Press state: `active:scale-[0.99] transition-transform`.

6. **Location pill:** Collapse the "You're here" block and "Change" link into a single tappable pill in the header (`bg-muted border border-border rounded-full px-3 py-1.5`) with a green dot, location name, and a `ChevronDown` icon. "Back to X" link is removed.

7. **Spacing & layout:** Page horizontal padding `px-4`. Card feed gap `gap-2.5`. Section labels `pt-4 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`. Header `px-4 pt-4 pb-3 border-b border-border`.

8. **Micro-interactions:** All interactive elements get `transition-colors`. Cards get `active:scale-[0.99] transition-transform`. No `hover:shadow` — use `hover:bg-muted/80` instead (flat, Vercel-style).

9. **Bottom nav:** Use `sticky bottom-0 bg-background/95 backdrop-blur border-t border-border`. Nav items: icon (`w-5 h-5`) + label (`text-[10px] font-medium`). Active item: `text-foreground`. Inactive: `text-muted-foreground hover:text-foreground`.

10. **Required shadcn components:** Before applying, ensure these are installed: `npx shadcn@latest add sheet button input select`.
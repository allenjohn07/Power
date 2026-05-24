---
name: ui-polish-framer
description: Redesigns SAIT Outlets (Next.js + Tailwind + shadcn/ui) with Framer Motion spring physics, staggered entry animations, ripple feedback, and a bottom-sheet filter panel. Feels surreal and alive on every interaction.
---

# UI/UX Polish — Framer Motion Edition

You are an expert Frontend Engineer specialising in fluid, physics-based mobile UIs built with Next.js + Framer Motion + shadcn/ui.

## CRITICAL CONSTRAINTS
- DO NOT alter backend logic, Prisma, tRPC, or existing React hooks.
- DO NOT rename props, variables, or function names.
- Only modify className attributes and JSX layout structure.
- Keep all existing event handlers. Only add new ones for UI-only interactions.

---

## DEPENDENCIES

```bash
npm install framer-motion
npx shadcn@latest add sheet button input select
```

Import at the top of every animated component:

```tsx
"use client";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
```

---

## SPRING PRESETS

Define once in `lib/springs.ts` and import everywhere:

```ts
export const springs = {
  snappy:  { type: "spring", stiffness: 500, damping: 30 },
  bouncy:  { type: "spring", stiffness: 400, damping: 20 },
  soft:    { type: "spring", stiffness: 200, damping: 28 },
  gentle:  { type: "spring", stiffness: 120, damping: 20 },
};
```

---

## ANIMATIONS TO APPLY

### 1. Card Stagger Entry
Wrap the card list with a `motion.div` container and each card as a `motion.div`:

```tsx
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: springs.bouncy },
};

<motion.div variants={containerVariants} initial="hidden" animate="show">
  {outlets.map(outlet => (
    <motion.div key={outlet.id} variants={cardVariants} whileTap={{ scale: 0.975 }} transition={springs.snappy}>
      <OutletCard outlet={outlet} />
    </motion.div>
  ))}
</motion.div>
```

### 2. Card Ripple Press Effect
Add to each card's `whileTap` and overlay a radial ripple on click:

```tsx
// In OutletCard.tsx
const [ripple, setRipple] = useState<{x:number;y:number}|null>(null);

<motion.div
  whileTap={{ scale: 0.975 }}
  transition={springs.snappy}
  onClick={(e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - r.left, y: e.clientY - r.top });
    setTimeout(() => setRipple(null), 500);
    // existing onClick here
  }}
  className="relative overflow-hidden rounded-xl p-3.5 bg-card border border-border cursor-pointer"
>
  {ripple && (
    <motion.span
      className="absolute rounded-full bg-foreground/5 pointer-events-none"
      style={{ left: ripple.x, top: ripple.y, x: "-50%", y: "-50%" }}
      initial={{ width: 0, height: 0, opacity: 1 }}
      animate={{ width: 240, height: 240, opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  )}
  {/* card content */}
</motion.div>
```

### 3. Location Pill — Pulse Dot + Spring Tap

```tsx
<motion.div
  whileTap={{ scale: 0.95 }}
  transition={springs.snappy}
  className="flex items-center gap-1.5 bg-muted border border-border rounded-full px-3 py-1.5 cursor-pointer w-fit"
  onClick={onChangeLocation}
>
  <motion.span
    className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"
    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  />
  <span className="text-xs font-medium text-foreground">{locationName}</span>
  <ChevronDown className="w-3 h-3 text-muted-foreground" />
</motion.div>
```

### 4. Filter Chips — Animated Active Pill

```tsx
const [active, setActive] = useState("All");
const chips = ["All", "Works", "Near me", "Recent"];

<div className="flex gap-1.5 overflow-x-auto scrollbar-none px-4 py-2.5">
  {chips.map(chip => (
    <motion.button
      key={chip}
      onClick={() => setActive(chip)}
      whileTap={{ scale: 0.91 }}
      transition={springs.snappy}
      className={cn(
        "relative flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
        active === chip
          ? "bg-foreground text-background border-foreground"
          : "bg-muted text-foreground border-border"
      )}
    >
      {active === chip && (
        <motion.span
          layoutId="chip-bg"
          className="absolute inset-0 rounded-full bg-foreground"
          transition={springs.snappy}
          style={{ zIndex: -1 }}
        />
      )}
      {chip}
    </motion.button>
  ))}
</div>
```

The `layoutId="chip-bg"` makes the active indicator *slide* between chips with a spring.

### 5. Bottom Sheet Filter — AnimatePresence

Replace the filter panel with a shadcn `<Sheet side="bottom">`. Wrap the sheet content in `motion.div` for a spring entry:

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-3">
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.soft}
    >
      <div className="w-9 h-1 rounded-full bg-border mx-auto mb-4" />
      <p className="text-sm font-medium text-foreground mb-4">Filter outlets</p>
      {/* filter options */}
    </motion.div>
  </SheetContent>
</Sheet>
```

### 6. Status Badges — Count Change Animation

When vote counts change, animate the number with `AnimatePresence`:

```tsx
<AnimatePresence mode="wait">
  <motion.span
    key={count}
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 8 }}
    transition={springs.snappy}
    className="tabular-nums"
  >
    {count}
  </motion.span>
</AnimatePresence>
```

### 7. Add Button — Morphing Icon

```tsx
const [added, setAdded] = useState(false);

<motion.button
  whileTap={{ scale: 0.92 }}
  transition={springs.snappy}
  onClick={() => { setAdded(true); setTimeout(() => setAdded(false), 1500); }}
  className="flex items-center gap-1.5 bg-foreground text-background rounded-full px-3.5 py-2 text-xs font-medium"
>
  <AnimatePresence mode="wait">
    {added ? (
      <motion.span key="check" initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }} transition={springs.bouncy}>
        <Check className="w-3.5 h-3.5" />
      </motion.span>
    ) : (
      <motion.span key="plus" initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }} transition={springs.bouncy}>
        <Plus className="w-3.5 h-3.5" />
      </motion.span>
    )}
  </AnimatePresence>
  {added ? "Added!" : "Add"}
</motion.button>
```

### 8. Bottom Nav — Active Indicator Dot

```tsx
const navItems = [
  { label: "Feed", icon: LayoutGrid, href: "/" },
  { label: "Map", icon: Map, href: "/map" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { label: "Account", icon: User, href: "/account" },
];

<nav className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border flex">
  {navItems.map(item => {
    const isActive = pathname === item.href;
    return (
      <Link key={item.label} href={item.href} className="flex-1">
        <motion.div
          whileTap={{ scale: 0.84 }}
          transition={springs.snappy}
          className="flex flex-col items-center gap-0.5 py-2.5"
        >
          <item.icon className={cn("w-5 h-5", isActive ? "text-foreground" : "text-muted-foreground")} />
          {isActive && (
            <motion.span
              layoutId="nav-dot"
              className="w-1 h-1 rounded-full bg-foreground"
              transition={springs.snappy}
            />
          )}
          <span className={cn("text-[10px] font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
            {item.label}
          </span>
        </motion.div>
      </Link>
    );
  })}
</nav>
```

The `layoutId="nav-dot"` makes the dot spring-slide between tabs.

### 9. Page Entry Transition

Wrap each page in `app/layout.tsx`:

```tsx
<motion.main
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={springs.gentle}
>
  {children}
</motion.main>
```

---

## DESIGN TOKENS (unchanged from base skill)

- Font: `font-sans tracking-tight`, `font-mono text-xs` for room codes
- Colors: CSS variables only. Works = `bg-emerald-100 text-emerald-800`, Broken = `bg-red-100 text-red-800`
- Cards: `rounded-xl p-3.5 bg-card border border-border`
- Spacing: `px-4` page padding, `gap-2.5` feed, section labels `text-[10px] uppercase tracking-widest`
- Header: `px-4 pt-4 pb-3 border-b border-border`
- No hover shadows — use `hover:bg-muted/80` (flat)

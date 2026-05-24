# SAIT Outlets

Mobile-first campus directory for finding electrical plug points. Built with Next.js (App Router), Tailwind CSS, Prisma, and PostgreSQL.

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Set `DATABASE_URL` in `.env` to your PostgreSQL connection string.

3. Push schema and seed mock data:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Feed** — Filter by campus, building, floor, and wing
- **Campus map** (`/map`) — Schematic map with pins for all SAIT buildings (main + satellite)
- **Image upload** — Photos saved to `public/uploads/plugs/`
- **Image lightbox** — Tap a plug thumbnail to view full size

## Project structure

- `prisma/schema.prisma` — Building (code, map position, floors, wings) & Plug models
- `prisma/seed.ts` — 24 SAIT buildings + 4 sample plugs
- `src/data/campus-buildings.ts` — Building catalog & floor options
- `src/app/api/plugs/route.ts` — GET/POST/PATCH plugs
- `src/app/api/buildings/route.ts` — GET buildings with floor/wing metadata
- `src/app/api/upload/route.ts` — POST image upload
- `src/app/map/page.tsx` — Interactive campus map
- `src/components/CampusMap.tsx` — SVG map component
- `src/components/PlugCard.tsx` — Card + lightbox + voting

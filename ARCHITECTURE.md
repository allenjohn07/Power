# SAIT Outlets — Architecture

This document explains **why** the system is shaped the way it is. It is written for reviewers evaluating problem–solution fit, technical depth, and innovation.

## Problem framing

Students on the SAIT main campus experience **battery anxiety** daily. Outdoor navigation (GPS, Google Maps) breaks indoors: wrong building, wrong floor, no live outlet status. The pain is personal, frequent, and underserved by generic map products.

## Core design bet

**Model outlets as a crowdsourced relational directory, not as indoor coordinates.**

| Approach | Why we did / did not choose it |
|----------|--------------------------------|
| PostGIS / lat-long indoors | High setup cost, poor GPS indoors, doesn't match how students describe locations |
| Beacon / BLE positioning | Hardware dependency, not viable for a hackathon |
| **Building → floor → wing → micro-location (text)** | Matches SAIT room codes, fast to filter in SQL, easy to contribute |
| **Works / Broken votes** | Turns static POIs into a living reliability signal |
| **Schematic SVG map** | Shows density by building without faking precision |

## Data model (Prisma)

```
Building 1──* Plug *──* PlugImage
User    1──* Plug (submitted)
User    1──* PlugVote *──1 Plug
```

- **Building** — Canonical campus catalog (code, wings, floors, `mapSvgId` for the official SVG).
- **Plug** — One reported outlet; `exactLocation` is human prose ("behind vending machine near CA416").
- **PlugVote** — One vote per user per plug; denormalized `upvotes`/`downvotes` on `Plug` keep feed reads O(1) per row.
- **PlugImage** — Up to 3 photos per plug; URLs point at `public/uploads/plugs/`.

## Request flow

### Feed (`GET /api/plugs`)

1. Optional filters: `buildingId`, `floor`, `wing`, `campus`.
2. `withDbRetry` wraps Prisma — transient campus Wi‑Fi drops should not blank the UI.
3. Batch-load `PlugVote` for the signed-in user (no N+1).
4. `serializePlug` normalizes images + building metadata for the client.

### Contribute (`POST /api/upload` → `POST /api/plugs`)

Upload and create are **split**: multipart to disk first, then a small JSON create with image URLs. Keeps transactions short and failures isolated.

### Reliability (`PATCH /api/plugs`)

`applyPlugVote` runs in a transaction: create vote, undo same vote, or flip Works ↔ Broken while updating denormalized counters.

### Room codes (`GET /api/parse-room`, `lib/room-code.ts`)

SAIT uses letter prefixes for buildings/wings and digits for floor+room (`CA416`, `NN1106`). Parsing is **rules + campus directory hints**, not ML — fast, explainable, works offline in the client via `parseRoomInput`.

### "Near me" (no GPS)

1. User picks **current building** → stored in `localStorage` (`lib/current-building.ts`).
2. Map positions (`mapX`, `mapY`) come from DB or SVG bbox fallback (`lib/building-map-positions.ts`).
3. `nearbyBuildingIds` uses Euclidean distance on the schematic map — good enough for "buildings around me" without indoor positioning.

### Campus map (`CampusMap.tsx`)

- Loads official SAIT SVG from `public/maps/sait-campus-map.svg`.
- Highlights buildings via `mapSvgId` + fallbacks; injects "You are here" pin with `getBBox()` centering.
- Pan/zoom via CSS transform — no Mapbox bill, no tile servers.

## Auth

NextAuth credentials + bcrypt. JWT sessions. Contributions and votes require `session.user.id` — anonymous browsing of the feed is allowed; trust actions are gated.

## Leaderboard

`groupBy` on plugs and votes, then join users — avoids loading full tables as contributions grow.

## Frontend conventions

- **AppShell** — Mobile bottom tabs; desktop sidebar; single content column.
- **PlugDirectoryCard** — Feed unit: metadata, photos, Works/Broken.
- **HomeFeed** — Filter sheet + quick filters (All / Near me) + URL-synced `buildingId`.

## Deployment assumptions

- PostgreSQL via `DATABASE_URL`
- Uploaded images on local disk (or mounted volume in production)
- No external object storage required for MVP

## Extension points (not implemented — intentional scope)

- Push notifications when a plug near you is marked broken
- Full satellite campuses beyond `campus=main`
- Moderation queue for spam submissions

These are documented so reviewers see **conscious scope**, not missing competence.

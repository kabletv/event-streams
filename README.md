# Event Streams — Observability Dashboard

A standalone Next.js (App Router) observability dashboard for the Sedona event-streaming system. Connects to two PostgreSQL databases to visualize, explore, and drill into event data across devices, profiles, locations, and event types.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Charts:** Recharts
- **Database:** `pg` (node-postgres) — no ORM
- **Theme:** Dark mode by default

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your database URLs:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|---|---|
| `/` | Overview dashboard — KPIs, time-series volume chart, event type breakdown |
| `/devices` | Device table with drill-down to `/devices/[id]` |
| `/profiles` | Profile table with drill-down to `/profiles/[id]` |
| `/locations` | Location cards with sparklines, drill-down to `/locations/[id]` |
| `/stream` | Paginated activity stream with expandable JSON payloads |
| `/events/[type]` | Event type explorer — volume, top devices, profiles, sample payloads |

## Database Connections

- **Main DB** (`DATABASE_URL`): Profiles, devices, locations reference data
- **Events DB** (`EVENTS_DATABASE_URL`): TimescaleDB `event_log` table with `time_bucket()` aggregations

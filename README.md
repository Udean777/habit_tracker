# Habit Tracker

An offline-first mobile habit tracker built with Expo React Native, backed by a self-hosted Hono API. Local SQLite is the source of truth for the UI, so every habit check-off, reorder, and edit works without a network connection and syncs in the background when you sign in.

## What It Includes

- **Arcade Quest HUD & Pixel Avatar**: Earn XP for completed habits, build daily combos, and level up a procedural 16x16 Skia pixel avatar across three classes (Knight, Mage, Ranger).
- **Offline-First Storage & Sync**: Reads and writes go to local SQLite (`expo-sqlite` + Drizzle ORM) first, queued into an outbox table for idempotent sync with the Hono + PostgreSQL backend.
- **Interactive Today Board**: 7-day centered date strip (future dates locked), drag-and-drop habit reordering, and Check-off, Counter, or Timer habits.
- **Stats & Monthly Consistency**: Full-month completion grid, current and best streaks, and 7/30/90-day completion rates.
- **Configurable Schedule & Accessibility**: Custom day-start offset, backfill window, haptic feedback toggle, and Reduce Motion support.

## Project Structure

```text
.
├── apps/
│   ├── mobile/          # Expo React Native app (Expo Router, Skia, Reanimated, NativeWind)
│   └── api/             # Hono API (Drizzle ORM, PostgreSQL, JWT auth)
├── packages/
│   └── shared/          # Shared Zod schemas, types, and pure streak/date logic
└── docs/                # Product, architecture, database, sync, and animation specs
```

## Tech Stack

- **Mobile**: Expo (React Native), TypeScript (strict), Expo Router, NativeWind, Zustand, `expo-sqlite` + Drizzle ORM, React Native Reanimated, Gesture Handler, `@shopify/react-native-skia`
- **API**: Hono (Bun in dev), Drizzle ORM, PostgreSQL, Zod
- **Shared**: Zod schemas and pure domain logic (`packages/shared`)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- Android Studio / Xcode (for running the Expo dev client)
- PostgreSQL (if running the sync API locally)

### Install Dependencies

```bash
bun install
```

### Run the Apps

Start the mobile app from the repository root:

```bash
bun run dev:mobile
```

Or run directly inside `apps/mobile` for interactive Expo CLI shortcuts:

```bash
cd apps/mobile
bunx expo start --dev-client --host lan
```

Start the Hono API:

```bash
bun run dev:api
```

### Checks & Tests

```bash
bun run typecheck   # TypeScript check across all workspaces
bun run lint        # ESLint across workspaces
bun run test        # Vitest (shared), Bun test (api), Jest (mobile)
```

## Documentation

Detailed specifications live in `docs/`:

- [PRD](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database Schemas](docs/DATABASE.md)
- [Sync Protocol](docs/SYNC.md)
- [Animation & Performance](docs/ANIMATION.md)
- [Roadmap](docs/ROADMAP.md)

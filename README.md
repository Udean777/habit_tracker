<div align="center">
  <img src="apps/mobile/assets/images/splash-icon.png" alt="Glimkin Logo" width="112" />
  <h1>Glimkin</h1>
  <p><strong>Offline-first RPG habit tracker powered by Expo React Native, Skia, and Hono.</strong></p>
  <p>
    Turn daily habits into quests — earn XP, build combos, and level up a procedural 16×16 pixel hero, with local SQLite as the single source of truth.
  </p>
</div>

---

## Highlights

- **Arcade Quest HUD & Pixel Hero** — Earn XP for completed habits, build daily combos, and level up a procedural 16×16 Skia pixel avatar (**Knight**, **Mage**, or **Ranger**).
- **Offline-First & Idempotent Sync** — Every read/write hits local SQLite (`expo-sqlite` + Drizzle ORM) first, queued in an outbox for background sync with Hono + PostgreSQL.
- **Interactive Today Board** — 7-day date strip, drag-and-drop reordering, and Check-off, Counter, or Timer habits.
- **Stats & Consistency** — Monthly completion grid, current/best streaks, and 7/30/90-day completion rates.
- **Accessible & Tunable** — Custom day-start offset, backfill window, haptics toggle, quality tiers, and Reduce Motion support.

## Stack & Structure

| Layer | Tech |
|---|---|
| **Mobile** (`apps/mobile`) | Expo (RN), TypeScript strict, Expo Router, NativeWind, Zustand, `expo-sqlite` + Drizzle, Reanimated, Gesture Handler, Skia |
| **API** (`apps/api`) | Hono (Bun), Drizzle ORM, PostgreSQL, Zod, JWT rotating refresh |
| **Shared** (`packages/shared`) | Zod schemas, shared types, pure streak/schedule/date logic |

## Quick Start

**Prerequisites:** [Bun](https://bun.sh/), Android Studio / Xcode (for dev client), and PostgreSQL (optional, for sync API).

```bash
# 1. Install dependencies
bun install

# 2. Start mobile dev client
bun run dev:mobile

# 3. Start Hono API (optional)
bun run dev:api
```

> **Tip:** Run `cd apps/mobile && bunx expo start --dev-client --host lan` for interactive Expo CLI shortcuts.

## Checks & Tests

```bash
bun run typecheck   # TypeScript check across all workspaces
bun run lint        # ESLint across workspaces
bun run test        # Vitest (shared), Bun test (api), Jest (mobile)
```

## Docs

[Architecture](docs/ARCHITECTURE.md) · [Database](docs/DATABASE.md) · [Sync Protocol](docs/SYNC.md) · [Animation & Performance](docs/ANIMATION.md)

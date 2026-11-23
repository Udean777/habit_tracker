<div align="center">
  <img src="apps/mobile/assets/images/splash-icon.png" alt="Glimkin Logo" width="112" />
  <h1>Glimkin</h1>
  <p><strong>Offline-first RPG habit tracker powered by Expo React Native, Skia, and Hono.</strong></p>
  <p>
    Turn daily habits into quests — earn XP & Gold, unlock hero gear, guard your streaks, and level up a procedural 32×32 pixel hero, with local SQLite as the single source of truth.
  </p>
</div>

---

## Highlights

- **Arcade Quest HUD & 32×32 Pixel Hero** — Earn XP and build daily combos to level up a procedural 32×32 16-bit Skia pixel avatar (**Knight**, **Mage**, or **Ranger**) across 5 gear tiers with celebration action animations.
- **Gold Economy, Hero Shop & Trophy Case** — Earn Gold from 5 deterministic offline-safe sources (quests, perfect days, streak milestones, achievements, and level-ups), spend it on unlockable palettes, auras, frames, and **Streak Shields**, and track achievements in the Trophy Case.
- **Offline-First & Idempotent Sync** — Every read/write hits local SQLite (`expo-sqlite` + Drizzle ORM) first, queued in an outbox for conflict-free background sync with Hono + PostgreSQL (`habits`, `habit_logs`, `streak_freezes`, `settings`, `hero_profile`, `user_inventory`).
- **Interactive Today Board & Live Timer** — 7-day date strip, drag-and-drop reordering, Check-off and Counter habits, plus a dedicated live **Countdown Timer** (`Start / Pause / Reset` + auto-complete) for duration quests.
- **Guided Onboarding & Feature Spotlight Tour** — Hands-on 4-step interactive onboarding and a 6-step cross-tab spotlight coach-mark tour (replayable anytime from Settings).
- **Accessible & Tunable** — WCAG AA Light & Dark themes, custom day-start offset, backfill window, haptics toggle, quality tiers, and Reduce Motion support.

## Stack & Structure

| Layer | Tech |
|---|---|
| **Mobile** (`apps/mobile`) | Expo (RN), TypeScript strict, Expo Router, NativeWind, Zustand, `expo-sqlite` + Drizzle, Reanimated, Gesture Handler, Skia |
| **API** (`apps/api`) | Hono (Bun), Drizzle ORM, PostgreSQL, Zod, JWT rotating refresh |
| **Shared** (`packages/shared`) | Zod schemas, shared types, pure streak/schedule/date & gamification economy logic |

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

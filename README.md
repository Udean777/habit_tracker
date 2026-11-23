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
| **API** (`apps/api`) | Hono (Bun dev / Cloudflare Workers + Hyperdrive prod), Drizzle ORM, PostgreSQL (local / Neon), Zod, JWT rotating refresh |
| **Web** (`apps/web`) | Astro (0 KB JS static output, `@astrojs/sitemap`, Cloudflare Pages) |
| **Shared** (`packages/shared`) | Zod schemas, shared types, pure streak/schedule/date & gamification economy logic |

## Quick Start

**Prerequisites:** [Bun](https://bun.sh/), Android Studio / Xcode (for dev client), and local PostgreSQL (optional, for sync API).

```bash
# 1. Install dependencies
bun install

# 2. Configure local environment files (gitignored)
cp apps/mobile/.env.example apps/mobile/.env.local
cp apps/api/.env.example apps/api/.env

# 3. Apply local PostgreSQL migrations & start Hono API (optional)
bun run db:migrate
bun run dev:api

# 4. Start mobile dev client
bun run dev:mobile
```

> **Tip:** Run `cd apps/mobile && bunx expo start --dev-client --host lan` for interactive Expo CLI shortcuts. Local dev always stays local — production deploys run through GitHub Actions.

## CI/CD & Deployment

- **PR Checks (`.github/workflows/ci.yml`):** Runs separate checks for Shared & API, Mobile, and Web (Astro build) on pull requests.
- **Deploy API (`.github/workflows/deploy-api.yml`):** Auto-deploys to Cloudflare Workers when a PR touching `apps/api/**` or `packages/shared/**` is merged to `main` (or manually via `workflow_dispatch`), automatically running Neon migrations when `apps/api/src/db/migrations/**` changes and verifying `GET /health?db=1`.
- **Deploy Web (`.github/workflows/deploy-web.yml`):** Auto-deploys the Astro static site (`apps/web`) to Cloudflare Pages (`glimkin.pages.dev`) when a PR touching `apps/web/**` is merged to `main` (or manually via `workflow_dispatch`).
- **Release Mobile (`.github/workflows/release.yml`):** Manual `workflow_dispatch` only on `main` to build signed Android AAB + ABI-split APKs with `EXPO_PUBLIC_API_URL` baked in.

Required GitHub Actions **Secrets**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `NEON_DATABASE_URL`, `EXPO_PUBLIC_API_URL` (plus Android signing secrets for mobile releases).

## Checks & Tests

```bash
bun run typecheck   # TypeScript check across all workspaces
bun run lint        # ESLint across workspaces
bun run test        # Vitest (shared), Bun test (api), Jest (mobile)
```

## Docs

[Architecture](docs/ARCHITECTURE.md) · [Database](docs/DATABASE.md) · [Sync Protocol](docs/SYNC.md) · [Animation & Performance](docs/ANIMATION.md)

# ARCHITECTURE

## 1. System Overview

```
┌──────────────────────────── Mobile (Expo RN) ────────────────────────────┐
│  UI (Expo Router, NativeWind, Reanimated, Skia)                          │
│        │ reads (live queries)              ▲ writes                      │
│        ▼                                   │                             │
│  Zustand (UI state)     Feature hooks ─► Local SQLite (Drizzle)          │
│                                               │        ▲                 │
│                                         outbox│        │apply pulled     │
│                                               ▼        │changes          │
│                                          Sync engine ──┘                 │
└──────────────────────────────────────────┬───────────────────────────────┘
                                           │ HTTPS (Hono RPC client)
┌──────────────────────────────────────────▼───────────────────────────────┐
│  Hono API (Bun/Node)  ─  Auth, Sync endpoints, Account                   │
│        │                                                                 │
│        ▼                                                                 │
│  PostgreSQL (Drizzle)                                                    │
└──────────────────────────────────────────────────────────────────────────┘
          packages/shared: Zod schemas · types · streak/date logic
```

Key principle: **the device owns the experience; the server owns durability and cross-device convergence.**

## 2. Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| App framework | Expo (dev builds) | Fast iteration, config plugins, EAS builds |
| Routing | Expo Router | File-based, deep links, typed routes |
| Styling | NativeWind | Tailwind ergonomics; animated values still use Reanimated styles |
| UI state | Zustand | Minimal, selector-based, no boilerplate |
| Local DB | `expo-sqlite` + Drizzle | Typed queries, migrations, live queries; same ORM family as the server |
| Animation | Reanimated 3+ & Gesture Handler | UI-thread animation, gesture-driven |
| Custom rendering | `@shopify/react-native-skia` | Shaders, particles, metaball/fluid visuals |
| API framework | Hono | TypeScript-first, RPC types, portable runtimes |
| Server DB | PostgreSQL + Drizzle | Relational integrity, robust sync queries |
| Validation | Zod | One schema shared by app and API |
| Monorepo | Bun workspaces | Simple, fast |

Verify exact versions in `package.json`; confirm API details against current docs when implementing.

## 3. Mobile Architecture

### 3.1 Layers per feature

```
features/habits/
  components/     # presentational + interaction components
  hooks/          # useHabits, useCompleteHabit (orchestration)
  repository.ts   # drizzle queries; every mutation = DB write + outbox enqueue in one transaction
  mappers.ts      # pure data → view-model functions (only if needed)
  index.ts        # public surface
```

Dependency direction (one way only): `screen/component → hook → repository → db/api`, with `packages/shared` (pure domain logic) usable from any layer.

- **UI layer:** components and screens. No direct DB or network access.
- **Hook layer:** orchestrates repository calls and domain functions, exposes handlers, nudges sync.
- **Repository:** the only code that touches Drizzle and the outbox. Plain functions, no classes or interfaces. `db` is a parameter so tests can pass an in-memory database.
- **Shared layer:** `packages/shared` for pure logic.

This is intentionally a lightweight take on Clean Architecture. No use-case classes, DI container, or separate DTO/Entity/ViewModel layers. See `AGENTS.md` section 5 for the rules and the list of things we avoid.

### 3.2 State management

| State | Where |
|---|---|
| Domain data (habits, logs) | SQLite via Drizzle live queries |
| UI/ephemeral (selected date, sheets, theme) | Zustand |
| Form state | React Hook Form |
| Animation state | Reanimated shared values |
| Secrets (tokens) | `expo-secure-store` |
| Sync metadata (cursor, last sync) | SQLite `sync_state` table |

### 3.3 Navigation map (Expo Router)

```
app/
  _layout.tsx            # providers, db init, fonts, gesture root
  (tabs)/
    index.tsx            # World (home)
    stats.tsx
    settings.tsx
  habit/
    [id].tsx             # detail with shared-element transition
    new.tsx              # create/edit (modal)
  auth/
    login.tsx
    register.tsx
  onboarding.tsx
```

### 3.4 App startup sequence

1. Load fonts, open SQLite, run pending migrations (blocking splash).
2. Hydrate settings and Zustand UI state.
3. Determine auth state from secure storage (non-blocking).
4. Render World from local data immediately.
5. Start the sync engine in the background if authenticated and online.
6. Reconcile scheduled notifications with current habits.

## 4. API Architecture

### 4.1 Structure

```
apps/api/src/
  index.ts            # app composition, exports AppType
  routes/
    auth.ts           # register, login, refresh, logout
    sync.ts           # push, pull
    account.ts        # profile, export, delete
    health.ts
  middleware/
    auth.ts, rateLimit.ts, errorHandler.ts, requestId.ts
  services/           # pure business logic
  db/                 # schema, client, migrations
```

### 4.2 Endpoints (v1)

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account, return tokens |
| POST | `/auth/login` | Authenticate, return tokens |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Revoke refresh token |
| POST | `/sync/push` | Submit batch of client operations |
| GET | `/sync/pull?cursor=` | Fetch changes since cursor |
| GET | `/account/export` | Full data export |
| DELETE | `/account` | Delete account and all data |
| GET | `/health` | Liveness |

Details of push/pull payloads in `docs/SYNC.md`.

### 4.3 Typed client

`apps/api/src/index.ts` exports `type AppType`. The mobile app builds its client with `hc<AppType>(baseUrl)`. Request and response bodies use schemas from `packages/shared`. Never hand-write endpoint types on the client.

### 4.4 Error format

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": {} } }
```

Codes are an enum in `packages/shared` so the client can switch on them.

## 5. Authentication Design

Default decision (reversible, see PRD open question 4): custom JWT.

- **Access token:** 15 min, signed (HS256 or EdDSA), contains `sub` and `jti`.
- **Refresh token:** opaque random string, 30 days, stored **hashed** server-side, **rotated on every use**; reuse of an old token revokes the whole token family.
- **Mobile storage:** both tokens in `expo-secure-store`.
- **Passwords:** Argon2id.
- **Client flow:** attach access token via a fetch wrapper; on 401, a single-flight refresh, then retry once; on refresh failure, drop to signed-out state but keep local data.
- **Rate limits:** on `/auth/*` per IP and per account.
- **Guest mode:** no token; data local only. On first sign-in, upload local data through the normal sync push with a fresh user scope.

## 6. Cross-Cutting Concerns

- **Time and dates:** see AGENTS.md section 6, rule 6. All streak and schedule computation in `packages/shared`.
- **Notifications:** `expo-notifications` local schedules, rebuilt by a `reconcileNotifications()` function on launch, habit edits, timezone change, and settings change. Keep it idempotent.
- **Logging/telemetry:** structured logs on the API with request IDs. No third-party analytics in v1.
- **Config:** `EXPO_PUBLIC_API_URL` for the client (public, non-secret). Server secrets via environment variables, validated by Zod at boot.
- **Error handling:** central error boundary on mobile; API error handler middleware.
- **Migrations:** client migrations are bundled and run on launch before any query; server migrations run at deploy.

## 7. Testing Strategy

| Layer | Tooling | Focus |
|---|---|---|
| Shared logic | Vitest | Streaks, schedules, day boundaries, DST |
| API | Vitest + `app.request()` | Auth, sync idempotency, validation |
| Sync engine | Jest/Vitest with in-memory SQLite | Outbox, retries, conflict resolution |
| Mobile UI | Jest + Testing Library | Critical flows |
| Visual/perf | Manual on device | Frame rate, haptics, tier fallbacks |

## 8. Deployment

- **API:** container or runtime of choice (VPS, Fly.io, Railway); Postgres managed or self-hosted. Decision pending (PRD open question 5).
- **Mobile:** EAS Build for development builds and release; EAS Update optional for JS-only fixes.
- **CI (suggested):** typecheck, lint, test on each push; API image build on main.

## 9. Architecture Decision Log

Add an entry whenever a decision is made or reversed.

| Date | Decision | Notes |
|---|---|---|
| 2026-11-22 | Self-built Hono API, no BaaS | Learning goal and full control |
| 2026-11-22 | Local-first with SQLite as source of truth | Offline is a core requirement |
| 2026-11-22 | Zustand for UI state only | Avoid dual sources of truth |
| 2026-11-22 | Setup Option A: Expo SDK 57 + NativeWind v5 RC0 | Verified combo per NativeWind v5 docs; SDK 58 upgrade deferred |
| 2026-11-22 | React Compiler not enabled yet | Use manual memoization only for measured hot paths (lists, Skia inputs) |
| 2026-11-23 | Visual direction: Arcade Quest HUD & 32x32 Pixel RPG Avatar | Replaced initial Living World / Bioluminescent Garden concept with 32x32 Knight, Mage, and Ranger human pixel classes, 5 gear tiers, Gold economy, Hero Shop cosmetics, Streak Shields, interactive onboarding, and cross-tab spotlight tour |
| 2026-11-23 | Visual MVP vs stretch scope | MVP uses Skia circles with BlurMask glow, Reanimated shared-value particles, and cached-blob fluid heatmap; custom SkSL shaders and gyroscope parallax are stretch |

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

- **Access token:** 60 min, signed (HS256), contains `sub` and `jti`. Mobile decodes `exp` locally and refreshes proactively within 60 s of expiry to avoid wasted `401` requests.
- **Refresh token:** opaque random string, 30 days, stored **hashed** server-side, **rotated on every use**; reuse of an old token revokes the whole token family.
- **Mobile storage:** both tokens in `expo-secure-store`.
- **Passwords:** Web Crypto `PBKDF2-SHA256` (100k iterations, 16-byte random salt, constant-time compare) so hashing is portable across Bun, Node, and Cloudflare Workers without native addons.
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

## 8. Deployment & Environment Rules

### 8.1 Production Stack
- **API:** Cloudflare Workers (`apps/api/wrangler.jsonc`, deployed to `https://glimkin-api.hono-backend.workers.dev`) connected to **Neon PostgreSQL** via **Cloudflare Hyperdrive** (`HYPERDRIVE` binding). Request-scoped `postgres-js` client (`prepare: false`).
- **API Deployment (CI/CD):** `.github/workflows/deploy-api.yml` handles Neon migrations and `wrangler deploy` automatically on `push` to `main` when backend paths (`apps/api/**`, `packages/shared/**`, `bun.lock`, `package.json`) change, or manually via `workflow_dispatch` (`migrations: auto | always | skip`). Local development stays 100% local.
- **Mobile Releases:** GitHub Actions (`.github/workflows/release.yml`) builds signed Android AAB + ABI-split APKs via Gradle; `apps/mobile/eas.json` is kept in sync for EAS Build (`development`, `preview`, `production`).
- **CI:** `.github/workflows/ci.yml` runs `typecheck`, `lint`, and `test` on pull requests.

### 8.2 Environment Separation (Local vs Production)

| Layer | Local Development | Production / Release CI/CD |
|---|---|---|
| Mobile `EXPO_PUBLIC_API_URL` | `apps/mobile/.env.local` (gitignored, LAN IP e.g. `http://192.168.x.x:3000`); if unset in `__DEV__`, `resolveApiUrl()` falls back to `http://10.0.2.2:3000` (Android) or `http://localhost:3000` (iOS/other) | GitHub Actions secret `secrets.EXPO_PUBLIC_API_URL` (validated non-empty + `https://` before Gradle) and `apps/mobile/eas.json` (`preview`/`production`) |
| API runtime & DB | `bun run dev:api` with `apps/api/.env` pointing to local PostgreSQL (`habit_tracker`) | Cloudflare Workers + Hyperdrive → Neon PostgreSQL |
| Server secrets | `apps/api/.env` (`JWT_SECRET`, `DATABASE_URL`) | `wrangler secret put JWT_SECRET` (never committed) |

### 8.3 Guardrails (Must Follow)
1. **No silent `localhost` in release builds:** `apps/mobile/src/lib/apiClient.ts` (`resolveApiUrl`) must strip trailing slashes and **throw** in `!__DEV__` if `EXPO_PUBLIC_API_URL` is missing or blank.
2. **Fail-fast in CI:** `.github/workflows/release.yml` must verify `EXPO_PUBLIC_API_URL` is set and starts with `https://` before running Gradle.
3. **Keep `.env.local` local:** Commit only `apps/mobile/.env.example` and `apps/api/.env.example`. Never commit `.env` or `.env.local`.
4. **No secrets in `EXPO_PUBLIC_*`:** Only public config (like API base URL) belongs in `EXPO_PUBLIC_*`; secrets stay server-side or in `expo-secure-store`.
5. **Keep local `apps/api/.env` on local Postgres:** When running migrations against Neon, pass `DATABASE_URL="<neon-url>" bun run db:migrate` inline in the shell instead of overwriting local `.env`.
6. **Cloudflare Free Tier Quota Guardrails (100k req/day & 200k observability events/day):**
   - `apps/api/wrangler.jsonc` keeps `observability.head_sampling_rate: 0.05` (5%) and avoids `console.log` in hot paths (only `console.error` on 5xx).
   - `apps/api/src/index.ts` initializes the Postgres/Hyperdrive client **lazily** (`c.get("getDb")()`) so `/health`, `OPTIONS`, `401`, and `404` never open DB connections, and sets `cors({ maxAge: 86400 })`.
   - Mobile sync uses outbox coalescing, 8 s write debounce (`nudgeSync()`), 5 min auto-pull cooldown, proactive JWT refresh, exponential backoff, and `POST /sync/batch` (1 roundtrip for push + pull).

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
| 2026-11-23 | Cloudflare Workers + Hyperdrive + Neon & Strict Local/Prod Env Separation | API deployed on Cloudflare Workers using Web Crypto PBKDF2-SHA256 and Hyperdrive → Neon; mobile uses `.env.local` for local dev and fails fast if `EXPO_PUBLIC_API_URL` is missing in release CI/CD (`secrets.EXPO_PUBLIC_API_URL`) or `eas.json` |

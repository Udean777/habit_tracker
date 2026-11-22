# AGENTS.md

Guidance for AI coding agents (Opencode, etc.) working in this repository.
Read this file fully before making changes. Detailed specs live in `docs/`.

## 1. Project Summary

**Habit Tracker (working title)**: an offline-first, animation-driven habit tracker built with Expo React Native, backed by a self-hosted Hono API. The product goal is a habit app whose visuals and interactions feel unlike typical habit trackers. The personal goal is to learn React Native at an intermediate-to-advanced level.

Docs index:

| File | Purpose |
|---|---|
| `docs/PRD.md` | Product requirements, scope, user stories |
| `docs/ARCHITECTURE.md` | System design, folder structure, tech decisions |
| `docs/DATABASE.md` | Local (SQLite) and server (Postgres) schemas |
| `docs/SYNC.md` | Offline-first sync protocol |
| `docs/ANIMATION.md` | Signature visuals, performance budgets |
| `docs/ROADMAP.md` | Phased plan and milestones |

When code and docs disagree, stop and flag it. Do not silently pick one. Update the doc in the same change if the code decision is intentional.

## 2. Tech Stack

**Mobile (`apps/mobile`)**
- Expo (managed workflow + development builds), TypeScript strict
- Expo Router (file-based routing)
- NativeWind (Tailwind for RN) for layout and static styling
- Zustand for UI/ephemeral state
- `expo-sqlite` + Drizzle ORM as the local source of truth
- React Native Reanimated + Gesture Handler for interaction and animation
- `@shopify/react-native-skia` for custom visuals and shaders
- `expo-haptics`, `expo-notifications`, `expo-secure-store`
- `@shopify/flash-list` for long lists
- Hono RPC client (`hono/client`) for typed API calls
- Zod + React Hook Form for forms

**API (`apps/api`)**
- Hono (runtime: Bun in dev; keep code portable to Node/Workers)
- Drizzle ORM + PostgreSQL
- Zod validators via `@hono/zod-validator`
- Auth: JWT access + rotating refresh tokens (see `docs/ARCHITECTURE.md`)

**Shared (`packages/shared`)**
- Zod schemas, inferred types, constants, pure date/streak logic used by both apps

**Tooling**
- Bun workspaces (monorepo), ESLint, Prettier, Vitest (shared/api), Jest + Testing Library (mobile)

Do not add a new dependency without stating why in the change summary. Check `package.json` for the installed versions and verify APIs against current official docs before using them. Expo, Reanimated, Skia, and Drizzle change quickly, so never rely on memory for signatures.

## 3. Repository Layout

```
.
├── AGENTS.md
├── docs/
├── apps/
│   ├── mobile/
│   │   ├── app/             # Expo Router routes only (thin screens)
│   │   └── src/
│   │       ├── features/    # habits/, logs/, stats/, world/, settings/, auth/
│   │       ├── components/  # shared UI primitives (no feature knowledge)
│   │       ├── db/          # drizzle client, schema, migrations
│   │       ├── sync/        # outbox, pull/push engine
│   │       ├── lib/         # api client, haptics, notifications, small utils
│   │       ├── stores/      # zustand stores (UI state only)
│   │       └── theme/       # tokens, palettes, motion config
│   └── api/
│       └── src/
│           ├── routes/      # one file per resource
│           ├── services/    # plain business functions
│           ├── db/          # schema, migrations
│           ├── middleware/
│           └── index.ts     # exports AppType for the RPC client
└── packages/
    └── shared/
        └── src/             # schemas, types, streak/schedule/date logic
```

A feature folder looks like this and nothing more unless a real need appears:

```
features/habits/
  components/     # UI for this feature
  hooks/          # useHabits, useCompleteHabit, ...
  repository.ts   # the only file(s) that talk to Drizzle (+ outbox)
  mappers.ts      # pure functions: data → view model (only if needed)
  types.ts        # feature-local types (only if needed)
  index.ts        # public surface of the feature
```

Use the `@/` path alias for `apps/mobile/src`. No `../../..` imports.

## 4. Commands

```bash
bun install                          # install all workspaces
bun run dev:api                      # start Hono API
bun run dev:mobile                   # expo start --dev-client
bun run typecheck                    # tsc across workspaces
bun run lint                         # eslint
bun run test                         # all tests
bun run db:generate                  # drizzle-kit generate (api and mobile)
bun run db:migrate                   # apply server migrations
```

Run `typecheck`, `lint`, and relevant tests before reporting a task as done.

## 5. Architecture: Pragmatic Clean Architecture

We apply the *ideas* of Clean Architecture (separation of concerns, dependencies pointing inward, business rules free of framework code) in the **lightest form that works for a solo-developer mobile app**. We do not copy the enterprise ceremony. Simplicity is a requirement, not a compromise.

### 5.1 The dependency rule

```
screens/components  →  hooks  →  repository  →  db / api client
        │                │
        └────────────────┴──────►  packages/shared  (pure domain logic; depends on nothing)
```

- Dependencies point **one way**, left to right. A layer may import from layers to its right, never from its left.
- `packages/shared` imports nothing from the apps, React, Expo, or any I/O library. It is plain TypeScript and fully unit-testable.
- `repository.ts` never imports React, hooks, or Zustand.
- Components never import Drizzle, the API client, or the sync engine directly.
- Features do not import another feature's internals. Use its `index.ts`. If two features need the same thing, move it down (`lib/`, `components/`, or `packages/shared`).

### 5.2 Layer responsibilities

| Layer | Contains | Must not |
|---|---|---|
| **Screen / component** | JSX, layout, animation wiring, calls hooks | Contain business rules, SQL, fetch calls |
| **Hook** | Orchestration: read from repository, call domain functions, expose handlers, trigger sync nudge, haptics | Contain raw queries or heavy calculations |
| **Repository** | Drizzle queries, transactions, outbox enqueue, row ↔ domain mapping | Know about React, UI, or navigation |
| **Domain (`packages/shared`)** | Streaks, schedules, day boundaries, validation schemas, constants | Do I/O or touch platform APIs |
| **Infrastructure (`db/`, `sync/`, `lib/`)** | DB client, sync engine, API client, notifications, haptics wrappers | Contain product rules |

### 5.3 Example (illustrative)

```ts
// features/habits/repository.ts — the only place that touches Drizzle + outbox
export async function completeHabit(input: CompleteHabitInput, db: AppDb = appDb) {
  return db.transaction(async (tx) => {
    const log = await upsertLog(tx, input);
    await enqueueOutbox(tx, { entity: "habit_log", row: log });
    return log;
  });
}

// features/habits/hooks/useCompleteHabit.ts
export function useCompleteHabit() {
  return useCallback(async (habitId: string, logDate: LocalDate) => {
    await completeHabit({ habitId, logDate, value: 1 });
    syncEngine.nudge();
  }, []);
}

// packages/shared/src/streak.ts — pure, no imports from React or Expo
export function computeStreak(logs: readonly DayLog[], schedule: Schedule, today: LocalDate): Streak {
  /* ... */
}
```

Dependency injection is done with **function parameters** (for example `db` defaults to the app database but tests pass an in-memory one) and, for truly global singletons only (theme, DB provider, API client), React context. No DI container.

### 5.4 What we deliberately do NOT do

These are over-engineering for this project. Do not introduce them unless the owner asks:

- One class or file per use case (`CompleteHabitUseCase`, `GetHabitsInteractor`, ...)
- Abstract repository **interfaces** that have a single implementation
- Three separate model layers (DTO → Entity → ViewModel) with mappers between each. Use the Zod-inferred type as the domain type and map only where shapes truly differ
- Dependency injection containers (`tsyringe`, `inversify`, etc.)
- Event buses, command buses, or custom observer systems
- Redux-style action/reducer layers on top of Zustand
- Generic base classes (`BaseRepository`, `BaseViewModel`) and deep inheritance
- Wrapper components or hooks that only forward props without adding behavior
- Premature monorepo packages beyond `shared` (do not split `ui`, `config`, `utils` packages)
- Feature flags, plugin systems, or configuration for requirements that do not exist yet

### 5.5 When an abstraction IS justified

Add an abstraction only when at least one of these is true:

1. There are **two or more real implementations or call sites** (rule of three: duplicate twice, abstract on the third)
2. It isolates a **volatile or hard-to-test dependency** (the sync engine, notifications, haptics, the clock)
3. It removes a **demonstrated** source of bugs (for example, all date math goes through `shared`)
4. It is needed to unit test important logic without a device

Test before adding: *"If I delete this abstraction and inline it, is the code harder to understand today?"* If no, do not add it. Prefer **duplication over the wrong abstraction**, and prefer **deleting code** over adding configuration.

### 5.6 State placement

| State | Where |
|---|---|
| Persisted domain data (habits, logs) | SQLite via repository, read through live queries |
| Ephemeral UI state (selected date, sheet open, theme) | Zustand (small stores, one per concern) |
| Form state | React Hook Form |
| Derived data | Compute during render or in a pure function. Do not store derived data |
| Animation values | Reanimated shared values |
| Server/sync metadata | `sync_state` table |

## 6. Core Data and Sync Rules

1. **Local-first.** The local SQLite database is the source of truth for the UI. Screens read from SQLite, never directly from the network. The API is for sync, auth, and backup.
2. **Every write is local first**, then queued in the `outbox` table for sync, in the same transaction. Never block UI on network.
3. **Zustand is not a database.** Use it for ephemeral UI state only.
4. **Client-generated IDs.** Use UUIDv7 (or ULID) generated on device so records can be created offline and synced idempotently.
5. **Soft deletes.** Never hard-delete synced rows. Set `deleted_at`.
6. **Dates.** Store the user's local calendar day as `YYYY-MM-DD` text in `log_date`, plus UTC timestamps for `created_at`/`updated_at`. Streak and day-boundary logic lives only in `packages/shared`. Do not reimplement it elsewhere. Handle timezone changes and the user-configurable "day starts at" offset.
7. **Typed API only.** Mobile calls the API through the Hono RPC client. Request/response schemas come from `packages/shared`. No hand-written fetch calls for app endpoints.
8. **Idempotent endpoints.** Sync writes carry a client `op_id`; the server must dedupe.
9. **Secrets.** Tokens only in `expo-secure-store`. Never in AsyncStorage, MMKV, logs, or the repo. No secrets in `EXPO_PUBLIC_*` variables.

## 7. Clean Code Practices (TypeScript)

### 7.1 Naming and structure
- Names reveal intent: `completedToday`, not `flag2`. Functions are verbs (`computeStreak`), booleans read as questions (`isArchived`, `hasReminder`), hooks start with `use`.
- One responsibility per function, component, and file. If you need "and" to describe it, split it.
- Keep functions short (aim under ~25 lines) and components focused (aim under ~150 lines). Extract a hook or subcomponent when a component mixes concerns, not just to hit a number.
- Use **early returns** and guard clauses instead of deep nesting (max ~2 levels).
- No magic numbers or strings. Name them as constants (`HOLD_TO_COMPLETE_MS`) in the feature or in `theme/motion`.
- Avoid boolean flag parameters (`render(true, false)`). Use an options object or separate functions.
- Max ~3 positional parameters. Beyond that, use a single typed object.
- Comments explain **why**, not what. Delete commented-out code and stale TODOs. Every TODO has a reason.
- No dead code, unused exports, or unused dependencies.

### 7.2 TypeScript
- `strict` mode on. No `any`. Use `unknown` and narrow it. If `any` is truly unavoidable, add a comment explaining why.
- No non-null assertions (`!`) and no `as` casts to silence errors. Prefer type guards, Zod parsing, or fixing the type. Casts are allowed only at verified boundaries, with a comment.
- Model states with **discriminated unions**, not several booleans:
  ```ts
  type SyncStatus =
    | { kind: "synced" }
    | { kind: "pending"; count: number }
    | { kind: "offline" }
    | { kind: "error"; message: string };
  ```
- Make `switch` statements **exhaustive** with a `never` check.
- Prefer string-literal unions (`as const` objects) over TypeScript `enum`.
- Infer types from Zod schemas (`z.infer`) and Drizzle (`$inferSelect`/`$inferInsert`) instead of redeclaring them. One source of truth.
- Use `readonly` and `ReadonlyArray` for data that should not mutate. Prefer immutable updates.
- Use `satisfies` to check config objects without widening types.
- Export types with `export type`. Use `import type` for type-only imports.
- Prefer `type` aliases for unions and shapes; use `interface` only where declaration merging is needed. Stay consistent.
- Use branded or alias types for easily confused primitives where it prevents real bugs (`LocalDate`, `HabitId`). Do not brand everything.

### 7.3 Modules and imports
- Named exports everywhere. Default exports only where Expo Router requires them (route files).
- Barrel files (`index.ts`) only at the **feature** boundary. No deep barrels (they slow Metro and cause import cycles).
- No circular imports. ESLint `import/no-cycle` must stay enabled.
- Keep side effects out of module scope (no work at import time except constants and definitions).

### 7.4 Error handling
- **Expected failures** (validation, offline, conflict) are returned as typed results or handled in the flow. **Unexpected failures** throw and are caught at a boundary (error boundary, sync engine, API error handler).
- Never swallow errors with an empty `catch`. At minimum, log with context and decide: recover, surface to the user, or rethrow.
- Error messages for users are friendly and positive; messages for logs are precise.
- Validate at boundaries (API input, forms, pulled sync data) with Zod. Trust validated data inside.

### 7.5 Async
- `async/await` over promise chains. Always handle rejections.
- Do not fire-and-forget without a `.catch` or an explicit `void` and a reason.
- Make async operations cancellable or ignore stale results (ignore results after unmount or when params changed).

### 7.6 Tests as a design tool
- Test behavior and public surface, not implementation details.
- Pure domain functions get the most tests. If something is hard to test, the design is probably coupled. Fix the design.
- Tests are readable: arrange / act / assert, one idea per test, descriptive names (`"keeps streak when a freeze covers the missed day"`).

## 8. React and React Native Conventions

- Function components and hooks only.
- Screens in `app/` stay thin: they compose feature components and hooks.
- **Derive, don't sync.** Compute derived values during render. Use `useEffect` only to synchronize with external systems (subscriptions, native modules, timers), never to copy props/state into other state.
- **Check whether the React Compiler is enabled** in this project before adding manual `useMemo`/`useCallback`/`memo`. If it is enabled, do not add them by default. If not, use them where they prevent a measured re-render problem (list rows, props passed to memoized children, Skia/animation inputs), not everywhere.
- Hooks follow the Rules of Hooks. Custom hooks have a single purpose and a stable return shape. Do not return huge bags of unrelated values.
- Props: keep them few (aim ≤ 5), typed, and explicit. Prefer composition (children, slots) over many boolean props. If you pass props through more than two levels, reconsider: composition, a hook, or a small Zustand store.
- Styling: NativeWind classes for layout, spacing, and typography. Use style objects or Reanimated styles only for animated or dynamic values. Design tokens live in `src/theme`. No hardcoded hex colors in components.
- Lists: use FlashList for anything that can exceed ~30 items. Provide `estimatedItemSize` and a stable `keyExtractor` (never array index for dynamic data). Memoize row components.
- Avoid creating new object/array/function props on hot render paths.
- Zustand: select narrowly (`useStore(s => s.x)`), never subscribe to the whole store. One small store per concern. Keep actions in the store; keep async domain logic out of it.
- Forms: React Hook Form + Zod resolver using the shared schema.
- Accessibility: every interactive element has `accessibilityRole` and a label. Respect "Reduce Motion" (see `docs/ANIMATION.md`). Minimum touch target 44x44.
- Platform code: prefer `Platform.select`, or `.android.tsx`/`.ios.tsx` files only when behavior truly differs.
- Every screen handles **loading, empty, error, and offline** states explicitly.

## 9. Animation and Skia Rules

Animation is the product's differentiator, so these rules are strict.

- Animated values run on the UI thread: Reanimated shared values, `useAnimatedStyle`, and worklets. Do not drive animation from React state.
- Never call JS-thread functions from worklets in per-frame paths. Use `runOnJS` only for discrete events (completion, haptics).
- Skia: keep draw trees small, hoist static paths/paints with `useMemo`, avoid recreating shaders each render, and drive Skia from Reanimated shared values directly.
- Keep "what to draw" (pure mappers from habit stats to visual parameters) separate from "how to draw" (Skia components) so the mapping can be unit tested.
- Performance budget: 60 fps target, test on a **mid-range physical Android device**. A change that drops frames below 50 fps on the main screens is a regression.
- Every signature animation needs a **quality tier fallback** (high / medium / low) and a **reduced-motion** path. See `docs/ANIMATION.md`.
- Haptics are part of the interaction design, not decoration. Use `expo-haptics`, keep patterns consistent, and let the user turn them off.

## 10. Backend Conventions (Hono)

Same philosophy: keep it flat and simple.

- Three levels are enough: **route** (parse/validate/respond) → **service function** (business logic, plain function) → **db query** (Drizzle). No controllers, use-case classes, or DI containers.
- One router per resource under `src/routes`, composed in `index.ts`; export `type AppType`.
- Validate every input with `zValidator`. Never trust client data.
- Service functions take their dependencies as parameters (`db`, `clock`) so they are testable.
- Consistent error shape: `{ error: { code, message } }` with correct HTTP status; error codes come from `packages/shared`.
- Auth middleware on all routes except `/auth/*` and `/health`.
- Rate-limit auth routes. Hash passwords with Argon2id (`Bun.password` or equivalent). Never log credentials or tokens.
- Migrations are generated by drizzle-kit and committed. Never edit an applied migration; add a new one.

## 11. Testing

- `packages/shared`: unit tests are mandatory for streak, schedule, and date-boundary logic (include DST and timezone-change cases).
- `apps/api`: route tests with Hono's `app.request()`, using a test database.
- `apps/mobile`: test repositories (in-memory SQLite), the sync engine, and stores. Component tests for critical flows (create habit, complete habit). Visual/animation correctness is verified manually on a device and noted in the PR.
- Bug fix = add a regression test first when feasible.

## 12. Git and Workflow

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`). Small, focused commits.
- Branch per task: `feat/<short-name>`.
- Keep changes scoped to the task. Do not refactor unrelated code or reformat files you did not need to touch.
- For non-trivial tasks: state a short plan first, implement, run checks, then summarize what changed and what to verify manually.
- If a requirement is ambiguous, ask once with concrete options instead of guessing. If a doc is missing detail, propose an addition to the doc.
- **Default to the simplest solution that meets the requirement.** If you feel the need to add a layer, interface, or package, justify it against section 5.5 in the summary.

## 13. Pre-flight Checklist

Before finishing any task, confirm:

- [ ] Typecheck, lint, and relevant tests pass
- [ ] Dependency rule respected (no upward imports; components do not touch DB or network)
- [ ] No new abstraction added without meeting section 5.5
- [ ] No `any`, unjustified `as`, or `!` added
- [ ] No network call is on the critical path of a UI action
- [ ] New writes go through repository: local DB + outbox in one transaction
- [ ] Shared logic (dates, streaks, schemas) lives in `packages/shared`
- [ ] Loading, empty, error, and offline states handled
- [ ] New animation has a fallback tier and a reduced-motion path
- [ ] No secrets, tokens, or hardcoded colors added
- [ ] No dead code, commented-out code, or magic numbers left behind
- [ ] Docs updated if behavior or schema changed
- [ ] Dependency additions justified

## 14. Out of Scope for Agents (ask first)

- Changing the sync protocol or database schema (requires doc update + migration)
- Adding a BaaS (Firebase, Supabase, etc.). The backend is intentionally self-built
- Switching state, styling, or animation libraries
- Changing auth approach
- Introducing any item listed in section 5.4
- Deleting or rewriting migrations

# ROADMAP

Planned for a solo developer working part-time. Estimates are in weeks and assume roughly 8–12 focused hours per week. Adjust freely. Each phase has an exit gate. Do not start the next phase before the gate is met, except where noted.

## Overview

| Phase | Focus | Duration |
|---|---|---|
| 0 | Project setup | 0.5–1 week |
| 1 | Visual spike (derisk the signature experience) | 1 week |
| 2 | Local-first core app | 2 weeks |
| 3 | Signature visuals production quality | 2 weeks |
| 4 | Backend, auth, and sync | 2–3 weeks |
| 5 | Notifications, polish, hardening | 1–2 weeks |
| 6 | Internal release and dogfooding | ongoing |

Total: about 9–11 weeks.

## Phase 0: Setup

- Bun workspace monorepo: `apps/mobile`, `apps/api`, `packages/shared`
- Expo app with TypeScript strict, Expo Router, NativeWind, Zustand
- Development build working on a physical Android device
- Hono API skeleton with `/health`, exporting `AppType`; mobile calls it through the RPC client
- ESLint, Prettier, Vitest/Jest, scripts from AGENTS.md
- Basic CI: typecheck, lint, test
- Theme tokens and base components (Button, Text, Screen)

**Gate:** `bun run dev:api` + `bun run dev:mobile` work end to end; typed call to `/health` succeeds on device.

## Phase 1: Visual Spike

See `docs/ANIMATION.md` section 7.

- Skia scene with procedural 16x16 pixel avatar and ambient particles
- Hold-to-complete prototype with haptics and burst
- Fluid heatmap prototype with fake data
- Measure fps on the reference mid-range device

**Gate:** Medium tier holds ≥ 55 fps. World metaphor decision recorded. MVP-vs-stretch list for visuals confirmed.

## Phase 2: Local-first Core

- `expo-sqlite` + Drizzle setup, migrations, live queries
- Schema: `habits`, `habit_logs`, `streak_freezes`, `settings`, `outbox`, `sync_state`
- `packages/shared`: schemas, schedule and streak logic with thorough tests (DST, timezone change, day-start offset)
- Habit create/edit/archive/reorder (React Hook Form + Zod)
- Logging flow with a **plain** interaction (fancy gesture comes in Phase 3)
- Habit detail and stats (streak, completion rates)
- Settings screen (theme, haptics, day-start offset, backfill window)
- Backfill past days
- Outbox enqueue wired into every mutation (even though sync is not live yet)

**Gate:** all FR-1 to FR-7, FR-9, FR-18 work fully offline; shared logic test suite green; no data loss on force-kill.

## Phase 3: Signature Visuals (production quality)

- Arcade Quest HUD & Pixel Avatar wired to real habit/XP/combo data via pure mappers
- Production hold-to-complete with undo, accessibility alternative
- Fluid heatmap in habit detail/stats
- Shared-element transitions: World ↔ detail ↔ stats
- Quality tiers (high/medium/low) with auto-detection and runtime adaptation
- Reduced-motion paths across every effect
- Micro-interactions pass

**Gate:** budgets in `docs/ANIMATION.md` met on the reference device; reduced-motion and low tier verified; logging still under 3 seconds end to end.

## Phase 4: Backend, Auth, and Sync

- Server Postgres schema + migrations (`docs/DATABASE.md`)
- Auth: register/login/refresh/logout with rotating refresh tokens; rate limiting
- Mobile auth flow with secure storage and single-flight refresh
- `/sync/push` and `/sync/pull` with idempotency, LWW, and unique-key merging
- Client sync engine: triggers, backoff, quarantine, status UI
- Guest → account transition
- Account export and delete
- Sync test suite from `docs/SYNC.md` section 9, including property-based convergence tests
- Deploy API and database to the chosen host (resolve PRD open question 5)

**Gate:** two real devices converge after offline edits; all sync tests pass; account deletion verified end to end.

## Phase 5: Notifications, Polish, Hardening

- Local notifications: scheduling, reconcile function, notification actions
- Onboarding with presets and battery-optimization guidance
- Empty/error/loading states, copy review (positive tone)
- Accessibility audit (screen reader labels, contrast, touch targets)
- Crash reporting decision and integration
- Performance regression pass on reference device
- App icon, splash, store-ready assets (if publishing)
- Data export UI and backup/restore (optional)

**Gate:** 7 consecutive days of personal use with no data loss or sync anomalies; all accessibility items checked.

## Phase 6: Internal Release and Dogfooding

- EAS production build and internal distribution
- 30-day personal dogfooding (PRD success metric)
- Collect issues, triage into a post-MVP backlog

## Post-MVP Backlog (prioritized candidates)

1. Home-screen widgets (Android)
2. Weekly Replay timelapse
3. Habit notes/journal
4. Habit templates
5. Habit stacking
6. Field-level merge and HLC for sync
7. iOS polish

## Risk Checkpoints

| When | Check | If it fails |
|---|---|---|
| End of Phase 1 | Skia scene fps | Simplify the metaphor, reduce particles, lean on sprites; if still failing, make Medium tier the ceiling |
| End of Phase 2 | Streak/date correctness | Freeze features until shared logic tests are exhaustive |
| Mid Phase 4 | Sync convergence | Reduce scope to whole-row LWW only; defer unique-key merge optimizations |
| End of Phase 5 | Notification reliability | Document OEM limitations; consider exact-alarm permission flow |

## Working Agreement with Agents

- Work phase by phase; one focused task at a time with its own branch.
- Each task starts with a short plan and ends with a verification summary (see AGENTS.md sections 12 and 13).
- Update docs in the same change when decisions are made (Architecture Decision Log).

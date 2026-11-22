# PRD: Habit Tracker (working title)

Status: Draft v0.1 · Owner: Mike · Last updated: 2026-11-22

## 1. Overview

An offline-first mobile habit tracker whose core experience is a **living, animated visual world** that reflects the user's consistency, instead of lists, checkboxes, and flat charts. It is built with Expo React Native and a self-hosted Hono API.

### 1.1 Goals

- **Product:** a habit tracker that feels memorable and emotionally rewarding to use daily, with interactions and visuals unlike typical trackers.
- **Technical/learning:** exercise intermediate-to-advanced React Native: Reanimated, Skia, gestures, offline-first data, background sync, notifications, and a typed full-stack setup.
- **Quality:** production-grade engineering (tests, migrations, secure auth, performance budgets), not a demo.

### 1.2 Non-goals (v1)

- Social feeds, leaderboards, or public profiles
- Web or tablet-optimized UI
- Third-party integrations (Health Connect, Apple Health, calendars)
- Monetization, subscriptions
- Using a BaaS (the backend is custom by design)

## 2. Target Users

| Persona | Needs |
|---|---|
| **Consistency seeker** | Tracks 3–10 daily habits, wants motivation that is not guilt-driven |
| **Visual/gamification-lover** | Bored by checklists, wants delight and a sense of progress |
| **Privacy-minded user** | Wants data to work offline and own their account |

Primary v1 user: the author, then a small group of testers.

## 3. Core Concepts

- **Habit:** a recurring behavior with a type, schedule, and optional target.
  - Types: `boolean` (done/not done), `count` (e.g. 8 glasses), `duration` (minutes).
  - Schedules: every day, specific weekdays, or N times per week.
- **Log:** a record of a habit's completion value on a given local calendar day.
- **Streak:** consecutive scheduled days completed, computed by shared logic. Supports **freezes** (a limited number of forgiven misses) to reduce all-or-nothing pressure.
- **World:** the signature visual scene where each habit is represented by a living element whose state reflects consistency (see section 5).

## 4. Functional Requirements

### 4.1 MVP (must have)

**Habits**
- FR-1: Create, edit, archive, and delete (soft) habits with name, icon, color, type, target, schedule, and reminder time.
- FR-2: Reorder habits.
- FR-3: Archive hides a habit but preserves history.

**Logging**
- FR-4: Complete/uncomplete a habit for today via the signature gesture (section 5.2).
- FR-5: Backfill or edit logs for past days (limited to a configurable window, default 14 days).
- FR-6: Count/duration habits accept partial progress toward the target.

**Streaks and stats**
- FR-7: Current streak, best streak, completion rate (7/30/90 days) per habit.
- FR-8: Streak freezes: earn by consistency, apply automatically or manually (decision pending, see Open Questions).
- FR-9: Day boundary offset: user chooses when the "day" rolls over (for example 04:00).

**Reminders**
- FR-10: Local scheduled notifications per habit, rescheduled on edit, timezone change, and app update.
- FR-11: Notification actions (Complete) where platform allows.

**Offline and sync**
- FR-12: All features work with no connectivity.
- FR-13: Changes sync automatically when online, in the background and on app foreground.
- FR-14: Visible, unobtrusive sync status (synced / pending / offline / error).
- FR-15: Multi-device consistency for one account (see `docs/SYNC.md`).

**Account**
- FR-16: Register, log in, log out, delete account and all data.
- FR-17: The app is usable in a **guest/local mode** before sign-in; data uploads on first login.

**Settings**
- FR-18: Theme (light/dark/system), haptics on/off, reduce motion override, quality tier override (auto/high/medium/low), day-start offset, data export (JSON/CSV).

### 4.2 Post-MVP (should have)

- Home screen widgets (Android first)
- Habit notes/journal per log
- Weekly "Replay": an animated timelapse of the user's world over the week
- Habit templates and onboarding presets
- Habit stacking/linking (do B after A)
- Local backup/restore file

### 4.3 Later (could have)

- iOS-specific polish, tablet layouts
- Shared habits with a friend
- Health platform integrations

## 5. Signature Experience (Differentiators)

Detailed specs and performance budgets in `docs/ANIMATION.md`.

### 5.1 The Living World (home screen)

A full-screen Skia scene. Working metaphor: a **bioluminescent garden** (alternatives to evaluate in a spike: aurora, tide pool, constellation). Each habit maps to a living element:

- Grows and glows with consistent completion
- Dims and droops gently after misses (never punishing or dramatic)
- Recovers visibly when the user returns
- Reacts to touch, to device tilt (optional), and to time of day (palette shifts)

The world is the primary navigation surface: tap an element to open that habit's detail.

### 5.2 Hold-to-complete gesture

Completing a habit requires a **press-and-hold with a radial charge-up**, with escalating haptic ticks, building particles, and a burst plus world reaction on completion. Releasing early cancels smoothly. A quick-tap fallback is available in accessibility mode.

### 5.3 Fluid heatmap

History is shown as a liquid or metaball-style field instead of a rigid grid. Intensity maps to completion, and scrubbing across it reveals day details.

### 5.4 Continuous transitions

Shared-element transitions between world, habit detail, and stats so that the app feels like one continuous space.

### 5.5 Principles

- Delight must not slow the user down: logging a habit takes under 3 seconds.
- Positive reinforcement over guilt. No shaming copy or visuals.
- Always degrade gracefully (quality tiers, reduced motion).

## 6. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | 60 fps target on main screens on a mid-range Android device; cold start under 2.5 s; logging interaction under 100 ms to first visual response |
| Offline | 100% of core flows work offline; no data loss on app kill or crash |
| Sync | Eventual consistency across devices, idempotent retries, no duplicate logs |
| Security | Argon2id hashing, short-lived access tokens with rotating refresh tokens, tokens in secure storage, HTTPS only, account deletion honored |
| Privacy | No third-party analytics SDKs in v1; minimal data collected |
| Accessibility | Screen reader labels, 44px targets, reduce-motion support, sufficient contrast, non-color-only state indicators |
| Reliability | Migrations are forward-only and tested; crash reporting via a self-hostable option (decision pending) |
| Compatibility | Android first (API 26+ target, confirm), iOS builds kept working |
| Maintainability | Strict TypeScript, shared schemas, test coverage on streak/sync logic |

## 7. Key User Flows

1. **First run:** open app → guest mode → pick preset or create first habit → see the world with first element → set reminder.
2. **Daily log:** open from notification or home → hold on element → charge-up with haptics → burst → streak updates.
3. **Backfill:** open habit → calendar/heatmap → select a past day → set value.
4. **Sign in and sync:** Settings → register/login → local data uploads → sync indicator → second device pulls data.
5. **Offline edit conflict:** two devices edit the same log offline → both sync → last-write-wins by timestamp resolves deterministically.

## 8. Data and Privacy Summary

User data: account (email, password hash), habits, logs, settings. Stored locally on device and on the server after sign-in. Users can export and delete all data. See `docs/DATABASE.md`.

## 9. Success Metrics

For a personal/learning project, measured via a local dev dashboard or manual testing:

- Daily logging works offline with zero data loss across 30 days of personal use
- Main screens hold ≥55 fps on the reference mid-range Android device
- Sync convergence: two devices converge after reconnect in all tested conflict cases
- Author uses it daily for 30 consecutive days (dogfooding)

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Skia scene too heavy for mid-range Android | Janky core experience | Early performance spike, quality tiers, draw-call budget, device testing from week 1 |
| Sync edge cases (clock skew, duplicates) | Data corruption | Hybrid logical clock or server-assigned versions, idempotent op IDs, property-based tests |
| Timezone / day-boundary bugs | Wrong streaks | Single shared implementation with exhaustive tests |
| Scope creep from "wow" features | Never ships | Strict MVP list, signature features time-boxed, roadmap gates |
| Notification reliability on aggressive Android OEMs | Missed reminders | Use exact scheduling APIs where needed, battery-optimization guidance in onboarding |

## 11. Open Questions

1. Final world metaphor (garden / aurora / tide pool / constellation): decide after the Phase 1 visual spike.
2. Streak freezes: automatic or manual? Earn rate?
3. App name and brand.
4. Auth: custom JWT (default in docs) or Better Auth?
5. Hosting target for the API and Postgres (VPS, Fly.io, Railway, etc.).
6. Crash reporting choice that fits the privacy stance.
7. Minimum Android API level and test device list.

## 12. Release Plan

See `docs/ROADMAP.md`. Milestones: M1 core local app, M2 signature visuals, M3 backend and sync, M4 polish and internal release.

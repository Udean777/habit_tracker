---
layout: ../layouts/LegalLayout.astro
title: Privacy Policy
description: How Glimkin collects, stores, syncs, and protects your habit and account data.
effectiveDate: November 23, 2026
activeNav: privacy
---

## 1. Offline-First & Guest Mode

Glimkin is an offline-first application. In guest mode, all habits, completion logs, gamification state, and preferences are stored locally on your device in SQLite. No personal data is transmitted to our servers unless you explicitly sign in.

## 2. Information We Collect When You Sign In

If you choose to sign in using Google OAuth or GitHub OAuth for cloud backup and sync, we collect:

- **Account identifiers:** Your verified email address and the unique provider account ID from Google or GitHub.
- **Synced app data:** Habits, daily completion logs, streak freezes, app settings, hero profile loadouts, and shop inventory items you create in Glimkin.
- **Device identifier:** A randomly generated app-installation device ID used solely for conflict resolution and refresh-token rotation.

## 3. How We Use Your Data

- To authenticate your session and keep your access and refresh tokens secure.
- To synchronize your habit progress across your devices without losing offline edits.
- We do **not** sell your personal data, run third-party ad trackers, or use your Google or GitHub data for advertising.

## 4. Infrastructure & Third-Party Services

When cloud sync is enabled, data is processed using the following providers:

- **Cloudflare Workers & Hyperdrive:** Edge API routing and database connection pooling.
- **Neon PostgreSQL:** Encrypted cloud database storage for synced user records.
- **Google OAuth & GitHub OAuth:** Used only when you initiate sign-in.

## 5. Data Export, Retention & Deletion

You retain full ownership of your habit data. Inside the Glimkin app, you can export your data or delete your cloud account at any time. Deleting your account permanently removes your user record, linked OAuth identifiers, refresh tokens, and synced habit rows from our database. You may also request data deletion by emailing [sajudinmaruf@gmail.com](mailto:sajudinmaruf@gmail.com).

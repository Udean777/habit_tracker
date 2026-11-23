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

If you choose to sign in using Google OAuth or GitHub OAuth for cloud backup and sync, Glimkin requests only basic identity scopes (`openid`, `email`, `profile` for Google; `read:user`, `user:email` for GitHub) and collects:

- **Account identifiers:** Your verified email address and the unique provider account ID from Google or GitHub.
- **Synced app data:** Habits, daily completion logs, streak freezes, app settings, hero profile loadouts, and shop inventory items you create in Glimkin.
- **Device identifier:** A randomly generated app-installation device ID used solely for conflict resolution and refresh-token rotation.

Glimkin does **not** request access to Gmail, Google Drive, Calendar, Contacts, Photos, or any sensitive or restricted Google APIs.

## 3. How We Use, Store, and Protect Your Data

- **Authentication & Sync:** To identify your account, issue encrypted session tokens (stored in device `SecureStore`), and synchronize your habit progress across devices without losing offline edits.
- **Transport & Storage Security:** All network traffic uses HTTPS/TLS. Cloud records are stored in encrypted PostgreSQL storage via Neon and routed through Cloudflare Workers and Hyperdrive.
- **No Ads or Data Selling:** We do **not** sell, rent, or trade your personal data, run third-party ad trackers, or use Google or GitHub user data for advertising or AI model training.
- **Google API Services User Data Policy:** Glimkin's use and transfer to any other app of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-data-user-data-policy), including the Limited Use requirements.

## 4. Infrastructure & Third-Party Services

When cloud sync is enabled, data is processed using the following providers:

- **Cloudflare Workers & Hyperdrive:** Edge API routing and database connection pooling.
- **Neon PostgreSQL:** Encrypted cloud database storage for synced user records.
- **Google OAuth & GitHub OAuth:** Used only when you initiate sign-in.

## 5. Data Export, Retention & Deletion

You retain full ownership of your habit data. We retain your synced account data only while your account remains active. Inside the Glimkin app, you can export your data or delete your cloud account at any time. Deleting your account permanently removes your user record, linked OAuth identifiers, refresh tokens, and all synced habit rows from our database immediately. You may also request data deletion or ask privacy questions by emailing [sajudinmaruf@gmail.com](mailto:sajudinmaruf@gmail.com).

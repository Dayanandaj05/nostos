# NOSTOS: System Architecture & Game Flow Documentation

This document serves as a complete technical blueprint and knowledge transfer guide for the NOSTOS multiplayer web application. It outlines the tech stack, database schema, game loops, real-time synchronization, and recent critical bug fixes. 

Any AI or developer reading this should be able to instantly understand the system state and continue development.

## 1. Tech Stack
- **Framework**: Next.js 15 (App Router, Server Actions, Server Components)
- **Styling**: Tailwind CSS (with custom utility classes in `globals.css` like `.text-gold`, `.bg-ink`)
- **Database & Realtime**: Supabase (PostgreSQL, Supabase Realtime Channels)
- **Deployment**: Vercel
- **Authentication**: Custom JWT-based cookies and Bcrypt password hashing.

## 2. Database Schema
- **`teams`**: Stores `ship_name` (unique), `password_hash`, and `member_names` (array of strings representing the registered crew).
- **`levels`**: Stores trial metadata: `level_number` (1-10), `title`, `story_text`, `puzzle_type`, `puzzle_data`, and `correct_answer`.
- **`progress`**: Tracks active gameplay. Links to `team_id`. Stores `current_level`, `correct_count`, `incorrect_count`, `first_login_at`, and `completed_at`.
- **`submissions`**: A log of every answer attempt made by teams, recording `submitted_answer` and `was_correct`.
- **`level_variant_assignments`**: Used for asymmetric puzzles (e.g., Trial 6, Trial 7) where different players on the same team receive different riddle fragments or roles. Tracks `device_token` and `variant_key`.
- **`admins`**: Stores `username`, `password_hash`, and `role` (Enum: `'admin'` or `'volunteer'`).

## 3. Authentication & Session Management
NOSTOS uses a custom JWT session management system defined in `src/lib/session.ts`.
- **Cookies**: When a user logs in (Team, Admin, or Volunteer), a JWT is set in the `nostos_session` cookie containing `{ role, id, username, sessionId }`.
- **In-Memory Heartbeat (`sessionMap`)**: The server maintains an active in-memory map of active sessions. A client-side heartbeat pings `/api/check-ship` every 4 seconds. 
- **Vercel Cold-Start Recovery**: Because Vercel serverless functions frequently spin down and wipe in-memory state, the `sessionMap` is actively reconstructed on-the-fly by parsing the valid JWT cookie during server actions.

## 4. The Core Game Loop & Synchronization
The core game engine is located in `src/components/game/GameEngine.tsx` and driven by `TeamSyncProvider.tsx`.

### A. The Readiness Gate (Briefing)
When a team enters a new level, they are intercepted by the `ReadinessGate`.
- Displays the **Tactical Guidelines** (the briefing) for the *current* level.
- Uses Supabase Realtime presence (`isReady: false`) to track who is prepared.
- Players click "Begin Trial", updating their presence to `isReady: true`.
- The puzzle only renders once ALL connected players are marked ready.

### B. Individual Progression
- Players solve the puzzle locally and submit answers via the `submitAnswer` Server Action.
- Submitting a correct answer increments the team's global `correct_count` in the DB.
- Crucially, it sets `sessionStorage.setItem('nostos_solved_[team]_[user]_[level]', 'true')`. 
- **Rule**: Every registered crew member must solve the puzzle individually on their own screen. One person solving it does NOT solve it for the rest of the crew.

### C. The Completion Gate (Sync)
Once a player solves their puzzle, they are placed in the `CompletionGate`.
- Upon mounting, the gate automatically calls `markDone(true)`, which updates their Supabase Realtime presence to `isDone: true`.
- The gate displays a live checklist of all `registeredCrew` members and their status.

### D. Auto-Advancement & Race Condition Handling
When the `CompletionGate` detects that the final crew member has marked `isDone: true`, the following strict sequence occurs:
1. **Idempotent DB Update**: The client calls `confirmAdvance(levelNumber)`. The server checks if `progress.current_level === levelNumber`. If true, it increments the level in the Database and clears old states.
2. **Postgres Changes Trigger**: The database update triggers a `postgres_changes` event on the Supabase Realtime channel.
3. **Debounced Refresh**: Every client's `TeamSyncProvider` receives the DB update event. It adds a `transitioning-level` CSS class to the body (which shows an Oracle loading screen) and calls `router.refresh()`. The CSS class acts as a **debounce flag**, preventing duplicate DB updates from causing Next.js to stutter or cancel the transition.
4. **Server Component Re-render**: `router.refresh()` forces `/play/page.tsx` to fetch the newly incremented `current_level` from the DB, starting the loop over at the `ReadinessGate`.

## 5. Local State Isolation (Tab Testing)
To support developers testing multiplayer interactions locally on a single machine:
- `nostos_device_token` (used for Supabase presence identification) is stored in **Session Storage** instead of Local Storage.
- This guarantees that opening multiple tabs in the exact same browser yields completely unique device identities, preventing "State Bleed" where Tab A overwrites Tab B's presence data.
- *(Note: JWT Cookies are still shared across tabs in a standard browser profile. For full end-to-end testing, developers must use standard windows, Incognito windows, and alternative browsers to test different user logins.)*

## 6. Dashboards & Access Roles
- **Event Directors (`/admin`)**: Logs in with the `admin` role. Has absolute control. Can view all team progress, flag errors, unlock/lock global puzzle gates, force-override a team's current level, and export the leaderboard as a CSV.
- **Proctors (`/volunteer`)**: Logs in with the `volunteer` role. Has a read-only monitoring dashboard. They can track teams' last activity times, see who is stuck (inactive >15 mins), and click "Flag Admin" to send an incident log to the Event Directors if a team requires physical assistance.

## 7. Known Nuances & Recent Fixes
- **`pending_advance` removal**: The DB `progress.pending_advance` flag was deprecated to support true Individual Progression. Do not rely on it.
- **`isReady` default state**: `TeamSyncProvider` explicitly initializes `isReady` to `false` when mounting a new level. If it defaults to `true`, the `ReadinessGate` instantly bypasses the instructions, breaking the game flow.
- **Channel Ref Tracking**: `channelRef.current` tracks local `isReady` and `isDone` states tightly. If a user marks themselves done *before* the Supabase connection finishes initializing (e.g. they refreshed the page while already done), the channel will accurately sync their final state upon connection using `myStateRef`.

## 8. Changelog & Implementation History

A detailed log of the major architectural shifts, features, and bug fixes implemented to reach this current stable state:

### A. Core Progression & Sync Updates
- **Individual Progression Enforcement**: Modified the core game loop so that *every registered crew member* must solve a trial individually. Previously, one player submitting the correct answer advanced the entire team automatically. 
- **Auto-Advance & Transition Overhaul**: Removed the manual "Mark Done" buttons. Rebuilt the `CompletionGate` to auto-detect when a player finishes, display a live crew checklist, and automatically warp the team to the next trial the exact millisecond the final player finishes.
- **Trial Briefing Relocation**: Eliminated the `TrialVictoryModal` (which showed instructions at the *end* of a trial) and securely merged it into the `ReadinessGate`, ensuring that all players read the instructions for the *current* trial together before beginning.
- **Transition Debouncing**: Added a `transitioning-level` CSS class overlay to act as a strict debounce flag. This prevents multiple users triggering `router.refresh()` simultaneously when the level advances, completely eliminating Next.js screen flickering and render stutter.

### B. Authentication & Architecture Fixes
- **Vercel Cold-Start Session Recovery**: Fixed a major authentication bug where Vercel's serverless environment would spin down and wipe the in-memory `sessionMap`, causing active players to be randomly logged out mid-game. The `updateSessionHeartbeat` function was overhauled to dynamically rebuild the session map using the JWT cookie if the map is empty.
- **Role-Based Login Routing**: Fixed a security/routing issue where any staff logging in via the "Event Directors & Proctors" tab was blindly assigned full `admin` access and routed to `/admin`. The `loginAdmin` action now strictly queries the database for the user's role and routes Proctors correctly to the `/volunteer` dashboard.

### C. Race Conditions & Edge Cases Resolved
- **Asymmetric Variant Jitter**: In asymmetric trials (where different devices get different riddle clues), multiple players requesting their variants at the exact same millisecond caused database race conditions. We introduced random millisecond jitter and a retry loop in `getVariant.ts` to cleanly serialize variant assignments.
- **Realtime Presence Sync Race Condition**: Fixed a severe bug where the Supabase Realtime channel hardcoded `isReady: false` and `isDone: false` upon subscribing. If a player finished a trial *before* the channel finished its 200ms connection handshake, their presence was wiped. This was fixed by binding the initial subscription state to a live React `myStateRef`.
- **Database Advancement Silent Failure**: Fixed a bug where the database level failed to increment because `confirmAdvance.ts` was still checking for a deprecated `pending_advance` lock that had been removed during the Individual Progression refactor.
- **Local Tab Testing Isolation**: Switched from global `localStorage` to tab-scoped `sessionStorage` for device tokens. This allows developers to test multiple players on a single laptop by opening different tabs without presence states or puzzle completions bleeding across tabs and overriding each other.

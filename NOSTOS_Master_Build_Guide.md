# NOSTOS — Master Build Guide (Progressive Edition)

Build this in order. Do not start a stage until the previous one passes its full verification checklist — that's what "each step is perfection" means in practice: no stage inherits a broken foundation from the one before it.

**Stack:** Next.js (frontend + API routes) · PostgreSQL via Supabase (or self-hosted Postgres) · Socket.io (real-time leaderboard) · deployed on a college server if available, otherwise Vercel + Supabase free tier.

**Tools:**
| Tool | Role |
|---|---|
| Antigravity | Where you paste the prompts below; it plans, writes code, runs commands |
| VS Code | Where you review every diff, fix what needs fixing, manage git |
| Terminal | Running dev servers, migrations, verification commands |
| Browser | Testing every stage as a real user would |

---

## STAGE 0 — Foundation & Environment

**Goal:** A clean, running skeleton with nothing missing — before a single feature is built.

**Tool:** Terminal, then Antigravity

**Setup:**
1. Create a GitHub repo (`nostos-game`).
2. Open it in VS Code, then open Antigravity in the same folder.
3. In Antigravity's Agent Manager, set Review Policy to "review before code" — you want to see every plan for the first several stages.

**Prompt:**
```
Scaffold a Next.js 14+ project (App Router) for NOSTOS, a fully online team
competition. Set up:
- TypeScript
- Tailwind CSS
- A custom Node server file so Socket.io can attach alongside Next.js
- .env.example listing every environment variable the app will eventually
  need (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
  SESSION_SECRET) — .env itself must be gitignored
- ESLint and Prettier configured
- A basic health-check homepage that just confirms the app is running
```

**Verify:**
- [ ] `npm install && npm run dev` starts with zero errors
- [ ] Homepage loads at `localhost:3000`
- [ ] `.env` is gitignored (check `git status` doesn't show it)
- [ ] `.env.example` lists every variable you'll need later
- [ ] Linting runs clean (`npm run lint`)

---

## STAGE 1 — Design System & Visual Foundation

**Goal:** Every color, font, spacing, and shared component defined *before* any real page is built — so nothing gets reskinned later.

**Palette:**
| Name | Hex | Use |
|---|---|---|
| Aegean Blue | `#1B3B5F` | Primary background |
| Wave Teal | `#2E7D8C` | Secondary accents |
| Aged Gold | `#C9A24B` | Buttons, highlights |
| Parchment Cream | `#F1E7D0` | Text panels, light backgrounds |
| Charcoal Ink | `#22252B` | Body text |
| Danger Crimson | `#8B2E2E` | Incorrect/penalty states only |

**Tool:** Antigravity

**Prompt:**
```
Set up the NOSTOS design system in Tailwind config: register this exact
palette as custom colors (aegean, wave, gold, parchment, ink, danger) using
these hex values: aegean #1B3B5F, wave #2E7D8C, gold #C9A24B, parchment
#F1E7D0, ink #22252B, danger #8B2E2E. Create a shared component library
(Button, Card, Input, Modal, LoadingSpinner, ErrorBanner, EmptyState) styled
with this palette, using free icons from lucide-react or game-icons.net for
thematic touches (ships, waves, laurel wreaths, compass roses). Every
component must have a defined loading state, error state, and (where
relevant) an empty state — not just a "happy path" appearance. Ensure text
contrast passes basic accessibility (no gold text on cream, no dark text on
aegean without sufficient contrast).
```

**Verify:**
- [ ] A component showcase page (temporary, can delete later) renders every shared component
- [ ] Colors match the hex values exactly (check with browser devtools)
- [ ] Every component has a visibly distinct loading/error/empty state, not just the default
- [ ] Text is legible against every background it's used on

---

## STAGE 2 — Database Schema (Complete Data Model)

**Goal:** Every table the entire app will ever need, defined once, correctly, up front.

**Tool:** Antigravity, review in VS Code

**Prompt:**
```
Design and create the full PostgreSQL schema for NOSTOS via Supabase
migration files:

- teams (id, ship_name, password_hash, member_names text[], created_at)
- levels (id, level_number, title, story_text, puzzle_type, puzzle_data
  jsonb, correct_answer, created_at)
- progress (team_id FK, current_level int, correct_count int,
  incorrect_count int, first_login_at, last_updated_at, completed_at
  nullable)
- submissions (id, team_id FK, level_id FK, submitted_answer,
  was_correct bool, submitted_at)
- level_variant_assignments (id, team_id FK, level_id FK, device_token,
  variant_key, assigned_at) — supports the asymmetric split-info levels
  (6 and 7), where different devices on the same team get different
  puzzle variants
- admins (id, username, password_hash, role enum: 'admin' or 'volunteer')

Add appropriate indexes (team_id lookups, level_id lookups) since this
needs to perform well at 200-300 concurrent participants. Write a seed
script with realistic placeholder data for all 10 levels so the app is
testable immediately.
```

**Verify:**
- [ ] All 6 tables exist (`\dt` in psql, or Supabase Table Editor)
- [ ] Foreign keys are enforced (try inserting a submission with a fake team_id — it should fail)
- [ ] Seed script runs and populates all 10 levels
- [ ] Indexes exist on the high-traffic lookup columns

---

## STAGE 3 — Home / Landing Page

**Goal:** The public-facing page anyone lands on before registering — this is the first impression, so it needs to sell the event, not just link to a login form.

**Tool:** Antigravity

**Prompt:**
```
Build the NOSTOS public landing page using the Stage 1 design system.
Include, in this order:
1. A hero section: event name, one-line hook ("Sail home. Solve your way
   across ten trials. Live leaderboard. All online."), and a prominent
   "Register Your Crew" button
2. A short "How it works" section: 3-4 steps (register your team, log in
   together, solve puzzles across 3 rounds, watch your ship climb the
   live leaderboard)
3. A rules summary: team size (3-4), fully online, ranked by levels
   cleared then time then fewest incorrect attempts
4. A live countdown timer to the event start date/time (make this a
   configurable value, not hardcoded, since the date isn't final yet)
5. A footer with coordinator contact info (Dayananda J, Induja E) and a
   link to the login page
Make it fully responsive (mobile-first, since many participants will
register from phones) and include a loading skeleton for the countdown
timer while it initializes.
```

**Verify:**
- [ ] Loads correctly on both desktop and mobile viewport widths
- [ ] Countdown timer actually counts down (test with a near-future date)
- [ ] Every button/link on the page goes somewhere real (no dead links)
- [ ] Page passes a basic Lighthouse accessibility check

---

## STAGE 4 — Team Registration

**Goal:** A registration flow that's fast to fill out but validates properly — this is the first real data entering your system.

**Tool:** Antigravity

**Prompt:**
```
Build team registration. Form fields: ship name (unique, checked live
against existing teams), a shared team password, and 3-4 member name
fields (dynamically add/remove a 4th field). Validate: ship name isn't
empty or already taken, password meets a basic minimum length, at least
3 member names are filled in. Show clear inline errors next to whatever
field is invalid — never a generic "form invalid" banner. On success,
show a confirmation screen with the registered ship name and a "Proceed
to Login" button. Store the team in the teams table with a securely
hashed password (not plaintext).
```

**Verify:**
- [ ] Submitting with a duplicate ship name shows a clear, specific error
- [ ] Submitting with only 2 member names is blocked with a clear message
- [ ] A successfully registered team appears in the `teams` table with a hashed (not plaintext) password
- [ ] Confirmation screen shows correct ship name and links to login

---

## STAGE 5 — Login & Session Handling

**Goal:** Reliable team login, plus the device-level session tracking that Levels 6 and 7 will need later.

**Tool:** Antigravity

**Prompt:**
```
Build team login (ship name + password) and admin/volunteer login
(separate credentials, separate table). On successful team login, create
a session AND generate a persistent random device_token stored in a
cookie if one doesn't already exist for this browser — this device_token
will later be used to assign different puzzle variants to different
team members' devices on levels 6 and 7. Sessions must persist across
page refresh. Add a "Login as Test Team" and "Login as Admin" quick-login
option, but ONLY when NODE_ENV is not "production" — fully excluded from
production builds, including the underlying routes.
```

**Verify:**
- [ ] Team login works, session persists on refresh
- [ ] Admin login is fully separate — a team account cannot access admin routes and vice versa
- [ ] A device_token cookie is set on first login and persists across refresh
- [ ] Quick-login buttons appear in dev, and are confirmed absent from a production build

---

## STAGE 6 — Core Gameplay Engine

**Goal:** The reusable "chassis" every level plugs into — build this once, correctly, before touching individual level content.

**Tool:** Antigravity

**Prompt:**
```
Build the core gameplay engine. A logged-in team is routed to exactly one
view: their current level, driven by progress.current_level — never a
level list, never past/future levels. This view has: a story panel
(renders level.story_text), a puzzle panel (renders based on
level.puzzle_type — this will be extended per-level), a submission
control, and a persistent mini-leaderboard widget showing the team's own
rank. On correct submission: log it, increment correct_count, advance
current_level, show a success transition animation, load the next
level's content. On incorrect submission: log it, increment
incorrect_count, show a randomly chosen rejection message from a
provided array, do not advance. Handle the "team just cleared level 10"
state as a distinct "Voyage Complete" screen, not just "level 11 doesn't
exist."
```

**Verify:**
- [ ] Logging in as a test team shows only the current level, nothing else
- [ ] A correct test submission advances the level and updates the story panel
- [ ] An incorrect test submission shows a rejection message and does not advance
- [ ] Manually setting a test team's level to 10 and submitting correctly shows the distinct "Voyage Complete" screen, not an error

---

## STAGE 7 — Level Content & Interactive Mechanics (Build in Order)

Build these one at a time, verifying each before the next — this is where "each step is perfection" matters most, since a broken level blocks everyone behind it.

### 7.1 — Level 1: The Lotus-Eaters (Decoder Wheel)

**Prompt:**
```
Build Level 1. Puzzle type "decoder_wheel": four ciphered scrolls (each
letter shifted 3 ahead in the alphabet) plus a draggable circular dial
component. Dragging the dial changes a live shift value (0-25) and
re-decodes all four scrolls' text in real time beneath them, using pure
client-side logic (no backend calls needed for the live preview). Correct
answer, once decoded: "SHE WAITS THREE DAYS WEST" (ciphered as
"VKH ZDLWV WKUHH GDBV ZHVW"). The other three scrolls should decode to
vague, unhelpful "give up and stay" sentiments at the correct shift value
too, so the choice is real once decoded correctly.
```

**Verify:**
- [ ] Dragging the wheel smoothly updates decoded text with no lag
- [ ] At shift value 3, all four scrolls show readable English text
- [ ] Selecting the correct scroll and submitting advances to Level 2
- [ ] Selecting any other scroll shows a rejection message

### 7.2 — Level 2: Aeolus's Winds (Icon Reveal + Drag Tiles)

**Prompt:**
```
Build Level 2. Five icon-based mini-clues, each click-to-reveal one word
(FOLLOW / THE / WEST / WIND / HOME) using icons from the existing free
icon set. Once all 5 are revealed, unlock a drag-and-drop tile interface
to arrange them into the correct phrase. Correct answer: "FOLLOW THE
WEST WIND HOME". Incorrect submissions reshuffle the tiles but keep all
5 words revealed.
```

**Verify:**
- [ ] Clicking each icon reveals its word exactly once (doesn't need re-clicking)
- [ ] Drag-and-drop reordering works smoothly on both desktop and touch/mobile
- [ ] Correct order submission advances to Level 3
- [ ] Wrong order reshuffles tiles without losing revealed words

### 7.3 — Level 3: The Cyclops's Cave (Visual Escape Door)

**Prompt:**
```
Build Level 3. An SVG cave door graphic with 3 lock icons. A chain of 3
riddles, each answer unlocking the next riddle and visibly toggling one
lock's state (locked to unlocked, with a small unlock animation): Riddle
1 → "NOTHING", Riddle 2 → "NOBODY" (built from riddle 1's answer, per the
existing riddle chain design), Riddle 3 is a final confirmation of
"NOBODY". All 3 locks open triggers a door-opening animation before
advancing to Level 4.
```

**Verify:**
- [ ] Each correct riddle answer visibly unlocks its corresponding lock
- [ ] An incorrect answer at any step doesn't reset previously-opened locks
- [ ] All 3 locks opening triggers the door animation and advances the level

### 7.4 — Level 4: The Laestrygonians (Fleeing Ship Progress Bar)

**Prompt:**
```
Build Level 4. A visible countdown timer and a horizontal progress track
with a ship icon that moves forward on each correct rapid-fire answer and
slightly backward on incorrect ones. Deliver 8 short questions
one-at-a-time (30-40 second timer each: number sequences, odd-one-out,
quick arithmetic, quick unscrambles — pull from a bank larger than 8 so
retries get fresh questions). Team needs 6 of 8 correct to clear the
level; fewer than 6 restarts with a fresh set of 8 from the bank.
```

**Verify:**
- [ ] Ship visibly moves forward/backward matching each answer's correctness
- [ ] Timer expiring on a question auto-counts as incorrect and advances to the next question
- [ ] Clearing with 6+/8 correct advances to Level 5
- [ ] Failing with under 6/8 restarts with visibly different questions, not the same 8

### 7.5 — Level 5: Circe's Island (Hidden-Object Scene)

**Prompt:**
```
Build Level 5. A simple flat SVG island scene (basic shapes: rocks, waves,
a hut — no complex illustration needed) with 3 invisible clickable hotspot
regions. Clicking hotspot 1 reveals letter "P", hotspot 2 reveals "I",
hotspot 3 reveals "G". Once all 3 are found, an input unlocks for
arranging them into a word. Correct answer: "PIG". Incorrect submissions
keep already-found letters but reset the arrangement.
```

**Verify:**
- [ ] All 3 hotspots are clickable and each reveals its letter exactly once
- [ ] Hotspot regions are positioned sensibly within the scene (not off-screen or overlapping)
- [ ] Correct letter arrangement advances to Level 6
- [ ] Incorrect arrangement keeps found letters, only resets the ordering

### 7.6 — Level 6: The Land of the Dead (Asymmetric Split-Info)

**Prompt:**
```
Build Level 6, the first asymmetric level. On level load, check
level_variant_assignments for this team+level+device_token combination.
If this device has no assignment yet, randomly assign one of 3
unclaimed variants (riddle → "THE", visual pattern puzzle → "ROAD",
partial map fragment → "HOME") and store the assignment. Each device
then only ever sees its assigned variant's puzzle, never the others.
Provide one shared combined-answer submission box, visible to whichever
device submits it, that any team member can use once they've verbally
combined answers over their call. Correct combined answer: "THE ROAD
HOME". Incorrect combined submissions retain each device's own solved
fragment (no need to re-solve individually), only the combination
resets.
```

**Verify:**
- [ ] Opening this level on 3 different browsers/devices under the same team shows 3 different puzzle variants, not the same one repeated
- [ ] Each variant, solved independently, gives the correct fragment (THE / ROAD / HOME)
- [ ] The combined-answer box is accessible from any of the 3 devices
- [ ] Correct combination advances to Level 7; incorrect keeps fragments, resets only the combination attempt

### 7.7 — Level 7: The Sirens' Song (Split Blurred/Clear View)

**Prompt:**
```
Build Level 7, reusing Level 6's variant-assignment system. Two variants
this time: "clear" (sees a wall of ~30 flashing text bubbles across 3
waves, with gold-bordered bubbles spelling one word per wave) and
"blurred" (sees the same wall with a CSS blur filter applied, only rough
positions/colors visible, no readable text). Randomly assign each device
one of these two variants (not evenly split if the team has an odd
device count — assign the FIRST device to load as "blurred", all
subsequent devices as "clear"). The clear-view device(s) can click gold
bubbles to capture words into a shared ordered tray, visible to all
devices. Correct final phrase: "TRUST NO SONG". Team can rewatch the
3-wave sequence up to 3 times before a rejection message and short forced
wait.
```

**Verify:**
- [ ] One device genuinely sees a blurred wall, unable to read specific bubble text
- [ ] The clear-view device can click gold bubbles and capture words correctly
- [ ] Captured word order is visible/shared across all devices on the team
- [ ] Rewatch limit (3) is enforced, with a clear message after the limit is hit

### 7.8 — Level 8: Scylla and Charybdis (Animated Fork)

**Prompt:**
```
Build Level 8. An SVG ship-at-a-crossroads graphic with two clickable
branch paths. Clicking one path commits the team to it (the other
visibly locks/grays out and cannot be selected afterward, including on
retry). The chosen path reveals its own 3-step word problem: Path A →
"A ship holds 6 crates. Half are unloaded, then 2 more are added. How
many crates now?" (answer: 5). Path B → "A rope is 9 meters. It's cut
into 3 equal pieces, then one piece is cut in half. How long is that
half-piece?" (answer: 1.5).
```

**Verify:**
- [ ] Clicking one path visibly locks out the other, even after a page refresh
- [ ] The revealed problem matches the chosen path
- [ ] Correct answer for the chosen path advances to Level 9
- [ ] Incorrect answer retries the same path's problem, never offers the other path

### 7.9 — Level 9: The Cattle of Helios (Tempting Glow Button)

**Prompt:**
```
Build Level 9. A setup puzzle first: "A number doubled is 20. Another
number tripled is 30. What are the two numbers?" (10 and 10, entered via
two input boxes). Once solved, reveal the main question: "Subtract the
second number from the first," alongside one large, animated glowing
button pre-labeled with a wrong tempting shortcut answer, and a separate
plain input box for the real answer. Correct answer: "0". Clicking the
glowing decoy button triggers a dramatic, humorous "the sun god notices"
full-screen effect and a short forced delay (10-15 seconds) before the
team can try again.
```

**Verify:**
- [ ] The glow/pulse animation on the decoy button is visibly distinct from the plain input box
- [ ] Clicking the decoy triggers the humorous penalty screen and enforces the delay
- [ ] Typing the correct answer directly advances to Level 10 with no penalty
- [ ] The setup puzzle must be solved before the main question appears (can't skip straight to guessing)

### 7.10 — Level 10: Return to Ithaca (Timing Bar + Final Combination)

**Prompt:**
```
Build Level 10, the finale. A requestAnimationFrame-driven indicator
moves along a track; the team clicks to stop it, checking whether the
stop position falls inside a target zone (tune the zone width for a
genuine but fair challenge — not trivial, not frustrating). This can be
retried independently of the final answer. Once timed successfully,
reveal the compound prompt: "Take your Level 3 answer. Take the
direction opposite of where the sun rises (a simple clue: the sun rises
East, so this is West). Combine both, separated by a space." Correct
answer: "NOBODY WEST". On correct submission, show the "Voyage Complete"
screen (final time, correct/incorrect totals, final leaderboard rank) —
this is the last screen the team sees, no further levels.
```

**Verify:**
- [ ] The timing bar is genuinely challenging but beatable, not frustratingly narrow
- [ ] Failing the timing bar allows retry without penalty
- [ ] Correct final combination triggers the "Voyage Complete" screen with accurate stats
- [ ] Incorrect combination retries only the combination step, not the timing bar or Level 3

---

## STAGE 8 — Live Leaderboard / Voyage Map

**Goal:** The shared, real-time view every participant and spectator watches.

**Tool:** Antigravity

**Prompt:**
```
Build the live leaderboard/voyage map. Team-facing clients connect via
Socket.io and receive real-time updates whenever any team's level
changes. A separate public spectator page (no login required) instead
polls a lightweight read-only API endpoint every 4 seconds — this keeps
persistent connections reserved for actual gameplay clients rather than
the potentially 200-300 concurrent spectators. Render every team as a
ship icon positioned along a horizontal voyage path based on
current_level (1-10), with team ship_name labeled. Sort/display order
should reflect the same ranking used for final scoring (levels cleared,
then time, then fewest incorrect).
```

**Verify:**
- [ ] Opening 2+ browser sessions as different teams and progressing one shows the change reflected live in the other's spectator view within ~4 seconds
- [ ] Ship positions accurately reflect current_level for every team
- [ ] The spectator page does not require login
- [ ] Load-test this specifically with more simulated teams than you expect on event day (see Stage 13)

---

## STAGE 9 — Admin Panel (Full Control)

**Goal:** The coordinator's complete control surface — this is what you and Induja actually use during the live event.

**Tool:** Antigravity

**Prompt:**
```
Build the admin panel, accessible only to accounts with role='admin'.
Include: a full table of all teams (ship name, current level, correct/
incorrect counts, last activity timestamp), a manual level-override
control per team, a lock/unlock toggle per level (event-wide), a button
to export final rankings as CSV (sorted by levels cleared, then time,
then fewest incorrect), and a live view of the same voyage map spectators
see. Also include a simple incident log — a text field where admins can
jot notes during the event (e.g. "Team Odyssey reported a bug at level
6") for later review.
```

**Verify:**
- [ ] Only admin-role accounts can access this panel; a team account attempting to visit it is blocked
- [ ] Manual level override for a test team reflects immediately in that team's own view
- [ ] Lock/unlock toggle actually prevents/allows submission on that level event-wide
- [ ] CSV export produces correctly sorted, correctly formatted output
- [ ] Incident log entries save and persist across page refresh

---

## STAGE 10 — Management Panel (Volunteer-Facing)

**Goal:** A lighter-weight view for volunteers — enough visibility to help participants without giving them full admin control.

**Tool:** Antigravity

**Prompt:**
```
Build a separate management panel for role='volunteer' accounts. Include
a read-only view of all teams' current level and last activity time (to
spot stuck teams), and a "flag for admin attention" button per team that
adds an entry to the incident log from Stage 9 (visible to admins, not
directly actionable by volunteers). Volunteers must NOT be able to
override levels, lock/unlock content, or export data — only admins can.
```

**Verify:**
- [ ] A volunteer-role account sees the read-only team view but no override/lock/export controls
- [ ] Flagging a team from the volunteer panel creates a visible incident log entry in the admin panel
- [ ] Attempting to directly access an admin-only route as a volunteer is blocked

---

## STAGE 11 — Audio System

**Goal:** Ambient music and sound feedback — genuinely usable now that everyone's on personal devices.

**You provide:** royalty-free audio files (Pixabay Audio, OpenGameArt, Freesound CC0, or incompetech) placed in `/public/audio/`: a looping ambient track, a correct-answer chime, an incorrect-answer buzz, and a finale swell for Level 10's timing bar moment.

**Prompt:**
```
Build an audio manager. Background music starts only after the first
user interaction (browsers block autoplay before that — handle this
gracefully, no console errors). Include a mute/unmute toggle, persisted
per session (survives refresh). Trigger the chime on correct submissions,
the buzz on incorrect submissions, and the swelling track during Level
10's timing-bar sequence. Files are provided in /public/audio/.
```

**Verify:**
- [ ] No autoplay-blocked console errors before first user click
- [ ] Mute toggle silences everything and persists on refresh
- [ ] Chime/buzz trigger correctly on the right submission outcomes
- [ ] Finale track plays specifically during Level 10, not other levels

---

## STAGE 12 — Deployment

**Goal:** The app running on a real, public, secure URL.

**Tool:** Terminal + VS Code

**If self-hosted on a college server:**
1. SSH in, install Node.js, PostgreSQL (if not using Supabase), and `pm2`
2. Clone the repo, set production `.env` values, run migrations
3. Start under `pm2` so it survives disconnects/reboots
4. Configure Nginx as a reverse proxy in front of your Node port
5. Run `certbot` for a free Let's Encrypt SSL certificate

**If falling back to Vercel + Supabase:**
1. Push to GitHub, connect the repo to Vercel
2. Set Supabase URL/keys as Vercel environment variables
3. Deploy

**Verify:**
- [ ] Public URL loads correctly from a phone on mobile data, not just your dev network
- [ ] HTTPS padlock is present and valid
- [ ] Every stage above (registration, login, gameplay, leaderboard, admin, management panel) works identically on the deployed version, not just locally

---

## STAGE 13 — Load Testing

**Goal:** Confidence the app survives 200-300 real concurrent participants, not just your own testing.

**Tool:** Terminal

**Command:**
```
npx artillery quick --count 100 --num 5 https://your-domain.com
```

**Verify:**
- [ ] Response times stay well under a second per request
- [ ] No crashes or thrown server errors under load
- [ ] If the leaderboard endpoint is the bottleneck, add caching or reduce spectator polling frequency and re-test

---

## STAGE 14 — Full Dry Run

**Goal:** Catch what only real concurrent usage reveals.

**Process (not a tool step):**
1. Every volunteer (including Induja) registers a fake team from their own device/home
2. All fake teams play through all 10 levels simultaneously, including genuinely testing Levels 6 and 7 over an actual voice call
3. You and Induja watch the admin panel and leaderboard throughout

**Verify:**
- [ ] Every fake team completes all 10 levels without errors
- [ ] Levels 6 and 7 correctly assign different variants across different devices on the same team
- [ ] Leaderboard and admin panel both stay accurate throughout
- [ ] CSV export at the end produces a clean, correctly-ranked result
- [ ] Any bugs found here are fixed and this entire stage is repeated once more before event day

---

## Final Pre-Event Checklist

- [ ] Quick-login buttons confirmed absent from production
- [ ] Registration open/close logic confirmed (if cutting off registration at some point)
- [ ] Backup plan exists if the server goes down mid-event (who to contact, what participants see)
- [ ] Both you and Induja have confirmed working admin access
- [ ] All 10 levels' content double-checked for typos/wrong answers with fresh eyes
- [ ] Audio files are genuinely royalty-free and properly credited if their license requires it

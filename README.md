# Personal Almanac

A personal-life calendar that conducts you into the tools you already use, on rhythm.

**Live at**: [https://azavarce.github.io/Personal-Calendar/](https://azavarce.github.io/Personal-Calendar/)

## What's in v0.2

A working web app + native (Expo Go) shell, with **persistent state**, the AI-mocked **Planner** (multi-event flows), **Quick Capture**, **Settings**, and a first-run **Onboarding**. All design decisions trace back to [`PRODUCT.md`](./PRODUCT.md) and [`DESIGN.md`](./DESIGN.md).

### Three tabs

- **Today** — personalized greeting tuned by hour ("Good morning" / "Good evening" / etc.), the day in serif Display, your scheduled commitments with a Warm Oxblood "now" line between past and future, and a **Looking ahead** section showing the next three things across the week.
- **Calendar** — toggle between **Week** view (rolling next 7 days) and **Month** view (6×7 grid with category glyphs per day, today highlighted, the selected day's events listed below).
- **Goals** — your six categories with the goals scheduled inside each. Settings gear in the top-right opens preferences. **+ Plan something** opens the AI Planner.

### Quick Capture (the warm + button)

A floating action button always one-thumb away. Type *"find me time to fix the leaky faucet"* and the mocked AI returns a category-appropriate slot — family / friend / health / faith / learning / general all get tuned suggestions. Tap **Put it down** and the event lands in your store, showing up on Today and Calendar.

### The Planner

From Goals → **Plan something**. Pick a flavor:

- **◆ Read the Bible** — ESV (default) + canonical / chronological / M'Cheyne / one-a-day. Generates a daily morning reading plan.
- **■ Be intentional with friends** — pick from your people (Gabriel, Jora, Ramiro, Guarino, Venneth, Juan Carlos, Manoel) and assign a channel per friend (iMessage / WhatsApp / Messenger / Call). Cadence: weekly / biweekly / monthly. Each generated event opens the right app on tap.
- **● Plan monthly date nights** — 3 / 6 / 12 months ahead × vibe (food / outdoors / culture / quiet) × budget. Pulls from a hand-written idea pool of 40+ activities.
- **✚ Something else** — freeform; AI proposes a single slot.

Confirmed plans are persisted via AsyncStorage and show up on Today / Calendar / Goals. Each event detail sheet has a primary "Open in [destination]" CTA — the Conductor-Not-Container principle made visible.

### Settings & Categories

- **Theme**: System / Light / Dark — actually flips the palette across every screen via a small ThemeOverrideContext
- **Manage categories** — rename and reorder the six lanes. The colors and glyphs are designed as a set; we keep those locked
- **Your data** — counts of events and goals you've added; **Clear everything you've added** card to reset (demo content stays)
- **About** — version + visual direction note

## Run it

```bash
git clone https://github.com/azavarce/Personal-Calendar.git
cd Personal-Calendar
git checkout main
npm install
```

**Web (fastest, no phone needed):**
```bash
npx expo start --web
```
Browser opens at `http://localhost:8081`.

**Native (your phone via Expo Go):**
```bash
npx expo start
```
Install [Expo Go](https://expo.dev/go) on your phone, scan the QR code from the terminal.

## Stack

- **Expo SDK 54** + React Native 0.81 + TypeScript strict
- **Expo Router 6** for file-based navigation, web target shipped to GitHub Pages on every push to `main`
- **Reanimated 4** for press feedback + cross-fade transitions
- **AsyncStorage** for persisted state (events, goals, category overrides, theme override, hasOnboarded)
- **Fraunces** (display serif) + **DM Sans** (body sans, v0 stand-in for Söhne per `DESIGN.md`)

## Project context

- [`PRODUCT.md`](./PRODUCT.md) — strategic brief: who this is for, brand personality, anti-references, design principles
- [`DESIGN.md`](./DESIGN.md) — visual direction: "The Personal Almanac", color strategy, type pairing, named rules
- [`.claude/SETUP_PLUGINS.md`](./.claude/SETUP_PLUGINS.md) — Claude Code plugins to install on each machine
- [`.claude/skills/`](./.claude/skills/) — vendored skills that travel with the repo (impeccable, frontend-design, react-native-design, mobile-ui-review, superpowers ×14)

## Repository structure

```
app/                        Expo Router screens
  (tabs)/                   Tab routes (Today, Calendar, Goals)
  capture.tsx               Quick Capture modal
  planner.tsx               The AI Planner (4-step flow)
  onboarding.tsx            First-run welcome
  settings.tsx              Settings modal
  settings/categories.tsx   Manage categories
  event/[id].tsx            Event detail
components/                 Reusable UI primitives
theme/                      Tokens (colors, typography, spacing) + ThemeOverrideContext
lib/                        store (AsyncStorage), planner, mock-data, categories, format
.claude/skills/             Vendored skills (impeccable, superpowers, etc.)
.github/workflows/          Auto-deploy to GitHub Pages
```

## What's deliberately NOT shipped yet

- Real Claude AI for Quick Capture and the Planner (currently hand-written mock generators with the same output shape, so swap-in is small)
- Real Google Calendar OAuth and event writes
- Push notifications (only matter on phone)
- Manual create-event form (cross-platform date/time picker is non-trivial; deferred)
- Sharing with family/friends
- Deep-link routing to actual Bible / journal / fitness apps

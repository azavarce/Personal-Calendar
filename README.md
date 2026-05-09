# Personal Almanac

A personal-life calendar that conducts you into the tools you already use, on rhythm.

This is **v0** — the UI shell. Mock data only, no real Google Calendar sync, no real AI calls, no notifications. The point of v0 is to feel the product in your hand and react.

## Run it

You'll need Node.js and npm. On your phone, install [Expo Go](https://expo.dev/go) (free) — iOS or Android.

```bash
git clone <this repo>
cd Personal-Calendar
git checkout claude/personal-calendar-goals-jHzLE
npm install
npx expo start
```

A QR code appears in the terminal. Scan it with your phone's camera (iOS) or with Expo Go (Android). The app will load on your device.

## What's in v0

Three tabs and one floating action:

- **Today** — the front door. Today's name in serif display, a now-line between past and future, time blocks for the day's commitments.
- **Calendar** — the next seven days, each with its own header, today highlighted in Warm Oxblood.
- **Goals** — your six categories (Faith, Family, Health, Friendship, Learning, Personal), each with the goals scheduled inside it.
- **Quick Capture** (the Warm Oxblood + button bottom-right) — type "find me time to..." and get a mocked AI suggestion back. v0 fakes the AI; v1 will wire it to Claude.

Tap any time block → bottom sheet with the event detail and a primary "Open in [destination]" button. v0 shows the destination as a label only; later, this fires the deep link to your real Bible app, journal, fitness tracker, etc.

## What's deliberately not here in v0

- Google Calendar OAuth and sync
- Real AI (Quick Capture is mocked)
- Push notifications
- Deep-link picker per category — destinations are hard-coded in mock data
- Editing or creating real events
- Login / accounts / sharing

These are v1+ once we've reacted to v0.

## Project context

- [`PRODUCT.md`](./PRODUCT.md) — strategic brief: who this is for, brand personality, anti-references, design principles.
- [`DESIGN.md`](./DESIGN.md) — visual direction: "The Personal Almanac", color strategy, type pairing, named rules.

## Stack

- **Expo SDK 52** + React Native 0.76 + TypeScript
- **Expo Router 4** for file-based navigation
- **Reanimated 3** for press-scale animations
- **expo-haptics** for tap feedback
- **Fraunces** (display serif) + **DM Sans** (body sans, v0 stand-in for Söhne per `DESIGN.md`)

## Repository structure

```
app/                  Expo Router screens
  (tabs)/             Tab routes (Today, Calendar, Goals)
  capture.tsx         Quick capture modal
  event/[id].tsx      Event detail modal
components/           Reusable UI primitives
theme/                Tokens (colors, typography, spacing)
lib/                  Mock data, categories, formatters
.claude/skills/       Vendored skills (impeccable, react-native-design, etc.)
```

# Roadmap

A living document of what's next, what's deferred, and what might never ship. Updated as decisions get made.

## Now / In progress

(see git log for the active branch)

## To-do (agreed, scheduled later)

### Goal detail screen
- Tapping a goal card on Goals currently does nothing (was wired to Quick Capture as a v0 placeholder, removed in PR after #36 fixed the confusing jump).
- Build a real goal detail screen that shows: goal metadata (title, cadence, category, optional destination); upcoming events backing this goal, in chronological order; recent past events for the goal; an Edit (rename / change cadence) and Delete action.
- Re-enable the GoalCard tap to navigate into this screen once it exists.
- **Estimated effort**: ~3 turns.

### Today-screen reflection prompt for past events
- After an event ends without a reflection, surface a soft prompt on Today below "Looking ahead": *"[Event title] — what stayed with you?"* in italic Fraunces.
- Tap opens the event detail with the reflection input already focused. Dismissible with an X; dismissed prompts don't reappear for that event.
- Cap at 3 prompts at once, sorted by recency, so Today stays calm rather than nagging.
- Builds on the reflection field shipped in PR #35.
- **Estimated effort**: ~2 turns.

### Search across events, goals, and destinations
- A magnifying-glass icon on Today (or Calendar) opens a search modal.
- Searches events and goals by title; matches destination app names too.
- Optional filter chips: category, date range (Today / This week / This month / Past / All).
- Results grouped: Today / This week / Later / Past.
- **Why deferred**: at current data scale (mocks + a few user adds) you can scroll. Becomes essential once a year-long Plan or two has populated the calendar.
- **Estimated effort**: ~4 turns.

### Address auto-complete in the location field
- When typing a location on manual entry (and edit), suggest real addresses as the user types — like a shopping-cart checkout form.
- **Why deferred**: needs a geocoding/places API. Options:
  - Google Places API (best results, paid, needs API key + backend)
  - Mapbox Geocoding (paid, similar)
  - OpenStreetMap Nominatim (free, public, rate-limited)
- Easiest first cut: a small Vercel function that proxies Nominatim with a 1 req/sec cap. UI shows suggestions as a dropdown under the location TextInput.
- **Estimated effort**: ~3 turns (needs backend setup).

### Location override for the almanac line
- The sunrise / sunset times default to Miami. Surface a Settings → Display field for the user to pick their city, with a small preset list (Miami, NY, LA, London, Buenos Aires, Mexico City, Tokyo, custom lat/lng).
- Saves to the store like the other settings.
- **Estimated effort**: ~2 turns.

## Maybe / Under consideration

### Weekly "look back" view (gentler alternative to completion tracking)
- A passive view showing the rhythm of what was on your calendar over the past week.
- **No completion checks, no scores, no streaks.** Just a chance to notice your own patterns.
- The brand voice avoids "performance dashboard" energy, so this is the closest we'd come to closing the loop without breaking the principle that *"the interface gets out of the way of the practice."*
- Could show: events grouped by category for the week, time-spent-per-category summary (no judgment), a place for a brief weekly reflection note.
- **Open question**: does the user actually want this, or is no-look-back the right answer?

### Done / check completion indicator
- **Currently rejected.** Tracking completion makes the interface part of the practice; the brand voice avoids this.
- Reconsider only if the "look back" view above doesn't land.

## Shipped (recent)

- v0.4: Manual event entry with smart-shortcut picker + conflict warning
- v0.3 phase 3: Selective cross-fades on Calendar Week/Month toggle and Month day selection
- v0.3 phase 2: Conflict detection in Quick Capture and Planner suggestion engines
- v0.3 phase 1: Custom categories (add, rename, reorder, remove; 12-swatch curated color palette + 18-glyph picker)
- v0.2: persistence, Settings, Categories management, Onboarding, channel-per-friend, smarter Quick Capture, richer mock variety
- v0.1: The Planner (Bible / Friends / Date Nights / Custom)
- v0.0: UI shell, three tabs, Quick Capture, Calendar Week/Month toggle

## Big rocks still ahead (not yet scoped)

- **Real Claude AI** in Quick Capture and the Planner (replaces the hand-written mocks).
- **Real Google Calendar OAuth + bidirectional sync**.
- **Push notifications** ("Time to read your Bible," "Time to text mom").
- **Real deep-link routing** to YouVersion / Day One / Apple Fitness / Phone / WhatsApp / iMessage / Messenger from event detail.
- **Sharing**: shared categories or shared events with family / friends.
- **Collaborators per category** — a different shape than basic sharing. Specific people you trust (a fitness coach, your wife, a co-founder) can be added as collaborators to a single category. They can *propose* events into that lane:
  - Either specific time/date: *"Thursday 3 PM — meet with the coach."*
  - Or AI-style requests: *"Find Andrés time to fix the faucet"* — the request lands in your queue, and only when you approve it does the AI suggest a slot and put it on your calendar.
  - All proposals sit in an **approval queue** the owner reviews; no collaborator writes directly to the calendar.
  - Per-category permission, not global — the coach sees Fitness, not Faith. Your wife sees Family, not Work.
  - Built later: needs accounts, auth, real-time sync, push notifications for inbound requests.
- **iOS App Store / Play Store** release path.

# Product

## Register

product

## Users

Multi-domain busy adults who want to live with more intention — across faith, family, fitness, friendship, learning, hobbies, and side projects — but procrastinate the things they claim matter most. They already have tools they like (a journal app, a Bible app, a fitness tracker) but lack the orchestration to actually use them on rhythm.

Used throughout the day, in every light condition: morning planning from bed or the kitchen counter, lunch-hour reach-outs to family and friends, post-work workouts, evening reading or journaling. One thumb, on a phone, across the whole day.

Audience evolution: solo today (the creator), designed to share with family and friends next, with potential public release on the App Store later. Decisions today should not block that path, but should not pay for it prematurely either.

## Product Purpose

A **personal-life calendar** — deliberately *not* a work calendar — that schedules and routes the user to the practices they say matter. Tapping an event opens whatever app the user already uses for that thing (their Bible app, their journal, Apple Fitness, etc.). The calendar is the conductor, not a content silo.

Reads the user's existing Google Calendar for busy/free state and layers a personal-life lane on top. Includes AI quick-capture: the user can write or speak *"find me time to fix my wife's faucet this week"* and get a real proposed slot back, confirmed with one tap, written into Google Calendar.

Success = the user actually does the things they say they value (Bible reading, gym, calling mom, brainstorming gifts for their wife, working on the side project) with less friction and more rhythm than before.

Work shows up only as broad time-blocks ("I'm at work 9–5"). Granular work meetings stay in the work calendar.

## Brand Personality

**Intimate. Intentional. Disciplined.**

A personal almanac, not a productivity app. Quiet sophistication. Editorial in feel. Treats the user as an adult committing to a deeper life — not a hustler optimizing output.

Voice in copy: warm but unsentimental. Specific over generic. Plain, human, slightly literary. Never "let's crush it." Never "you got this." When the app speaks, it sounds like a thoughtful older friend, not a coach.

## Anti-references

- **No AI-generated style.** Explicit user requirement.
- Not Google Calendar's sterile grid — color-by-calendar with no soul.
- Not productivity-SaaS bro energy — neon accents, "performance dashboard," streak-shame.
- Not wellness-app cliché — sage greens, undifferentiated beige, soft hand-drawn icons.
- Not religious-app kitsch — gold filigree, parchment textures, dove illustrations.
- Not generic AI defaults — Inter, purple/blue gradients on white, predictable card grids.

## Design Principles

1. **Conductor, not container.** Every event can route to the tool the user already loves on their phone. We never reinvent journals, Bibles, or fitness trackers.
2. **The week is a covenant, not a queue.** Show what the user said matters — rituals, goals, commitments — with visual weight equal to scheduled events. The calendar reflects values, not just availability.
3. **Quiet confidence.** Minimal chrome, characterful typography, deliberate color. The interface gets out of the way of the practice.
4. **One thumb, all day, all light.** Hand-held across morning, lunch, and evening. Dark and light modes are both first-class — not "supported," designed for.
5. **Capture is friction-zero.** AI quick-capture (text or voice → proposed slot → confirm) is one tap from anywhere in the app. The hardest part of doing more is deciding when; we make that nearly free.

## Accessibility & Inclusion

- **Contrast**: WCAG AA minimum for body text in both light and dark modes (4.5:1 body, 3:1 large text and UI).
- **Dynamic Type**: respected on all body text. Chrome may cap maximum scale, content does not.
- **Reduced motion**: `AccessibilityInfo.isReduceMotionEnabled()` honored. Parallax and large transitions become cross-fades.
- **Color blindness**: not a primary target yet, but dual-encoding is the default habit — every color-coded category is also distinguishable by shape, icon, or label so we don't paint ourselves into a corner.
- **Touch targets**: 44×44 pt (iOS) / 48×48 dp (Android) minimum.

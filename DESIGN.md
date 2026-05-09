<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: Personal Calendar
description: A personal-life calendar that conducts the user into their own tools, on rhythm.
---

# Design System: Personal Calendar

## 1. Overview

**Creative North Star: "The Personal Almanac"**

This system feels like a sturdy, slightly weathered almanac kept on a kitchen counter — a book of rituals, observations, and intentions returned to daily. It is editorial in posture (deliberate type hierarchy, generous spacing) but built for one thumb on a phone. Quiet confidence, not loud personality. The interface defers to the practice — the user reading their Bible, going to the gym, calling their mom — and never competes with it.

It explicitly rejects the look of generic AI tooling: no Inter on white with purple/blue gradients, no card-grid landing-page tropes, no neon, no gradient text. It rejects Google Calendar's sterile color-by-calendar grid. It rejects the streak-shame and performance-dashboard energy of productivity-SaaS apps. It rejects wellness-app cliché (sage green, undifferentiated beige, hand-drawn icons) and religious-app kitsch (gold filigree, parchment, dove illustrations) in equal measure.

Inspirations sit deliberately outside the calendar category: **Things 3** (Apple-refined craft, materially honest restraint). **Notion Calendar** and **Fantastical** are operative references for *utility* (natural-language input, calendar density) — not for visual feel.

**Key Characteristics:**
- Editorial typography: serif display + humanist sans body, deliberate hierarchy
- Restrained chrome: warm tinted neutrals dominate; brand accent is rare
- Disciplined category palette: six muted colors, one per life domain, surface only on event blocks and dots
- Both light and dark modes first-class, not afterthoughts
- Motion is responsive, not choreographed — every tap answers, no scroll theatre

## 2. Colors

A two-layer palette. A **restrained chrome** (warm tinted neutrals plus a single warm-oxblood brand anchor) carries the surface. A **full palette of six disciplined category accents** surfaces only on event blocks, dots, and category-coded chrome — never as backgrounds.

Hex values resolved at implementation; the seed locks direction, not exact values.

### Primary
- **Warm Oxblood** *(hue family — warm-red toward clay, low chroma in OKLCH)*: the brand anchor. Active state of the primary action, the today-marker, the brand mark. Never a background fill.

### Neutral (chrome)
- **Almanac Cream** *(light-mode body surface — high lightness, very low chroma toward warm clay)*
- **Almanac Ink** *(dark-mode body surface — low lightness, very low chroma toward warm clay; never `#000`)*
- **Hairline** *(1pt rules, dividers, ghost borders)*
- **Body text** + **Muted text** — both contrast-tested for WCAG AA in both modes.

### Tertiary — Category Palette (six)
Used **only** on event blocks (as a 4pt left edge or a filled chip), category dots, and the goals/category screens. Hue families chosen for inter-harmony, not for naming the primary direction:

- **Faith** — deep claret (distinct enough from Warm Oxblood that they don't read as the same color)
- **Family** — muted terracotta
- **Health** — quiet forest
- **Friendship** — warm amber
- **Learning** — dusty plum
- **Personal** — ink slate

### Named Rules

**The Almanac Cream Rule.** Pure white (`#FFFFFF`) is forbidden. Pure black (`#000000`) is forbidden. Every neutral is tinted toward the warm-clay brand hue (chroma 0.005–0.01 in OKLCH). Cool greys read as operating room. Pure black crushes on OLED.

**The One Voice Rule.** The Warm Oxblood brand accent appears on no more than ~10% of any screen at rest — typically just the today-marker, the active tab indicator, and a single primary CTA. Its rarity is the point. If the screen has it everywhere, the screen is wrong.

**The Category Containment Rule.** Category accent colors are forbidden as background fills, full-card colors, or chrome accents. They appear only as: a 4pt left edge on an event block, a small filled dot beside a label, or a chip on a goals screen. They are content signal, not surface signal.

## 3. Typography

**Display Font:** *Fraunces* (variable serif with optical-size axis) — characterful serif with the warmth of an old edition. *(Picked at seed; confirmed at implementation.)*
**Body Font:** *Söhne* (or *Geist* as fallback if Söhne licensing is impractical) — humanist sans, precise but warm. *(Picked at seed; confirmed at implementation.)*

**Character:** A **serif-display + humanist-sans-body editorial pairing**. The serif carries gravity (today's date, screen titles, journal entry headings). The sans carries comfort (event titles, time labels, reading body). Together they read as "thoughtful older friend keeping a notebook," not "modern productivity app."

### Hierarchy
- **Display** (Fraunces, weight ~350, ~32–40pt, line-height ~1.05): screen titles, today's date as a hero element, the standout date on the calendar.
- **Headline** (Fraunces, weight ~400, ~22–24pt, line-height ~1.2): section headers, journal entry titles.
- **Title** (Söhne, weight 500, ~17pt, line-height ~1.25): event titles inside time blocks, list-item primary lines.
- **Body** (Söhne, weight 400, 16pt, line-height 1.45): general reading body. Max line length 65ch on wider screens.
- **Label** (Söhne, weight 500, 12pt, +0.06em letter-spacing, all caps): metadata, category labels, axis labels in calendar headers.
- **Numeric** (Söhne with `fontVariant: ['tabular-nums']`): every time, date number, duration, and streak count.

### Named Rules

**The Anti-Inter Rule.** *Inter* is forbidden as the body font. The system-default UI fonts (SF Pro on iOS, Roboto on Android) are also forbidden as defaults — they signal generic-AI-tool the moment a screenshot leaves the app. Söhne or Geist replaces them. Helvetica and Aktiv Grotesk are out — too neutral, no character.

**The Tabular Numerals Rule.** Every time, date, duration, count, and streak renders with `fontVariant: ['tabular-nums']`. Lists of numbers must align vertically without effort. Non-negotiable in a calendar.

## 4. Elevation

**Flat by default, with one layer of soft tonal lift.** Drop shadows are not the language. Surfaces distinguish themselves through a warm tonal step (Almanac Cream surface → slightly-recessed cream for cards in light mode; Almanac Ink → slightly-lifted ink for cards in dark mode), not through `box-shadow`.

The single permitted shadow is reserved for **bottom sheets and modals only**: a soft, large-radius warm shadow (low-lightness oklch with chroma toward the brand hue, alpha ~0.12, ~24px blur, ~8px offset). It signals *"this rose up out of the surface"*, not *"this is sitting on a glass table."*

### Named Rules

**The Flat-by-Default Rule.** Cards, list items, event blocks, and chips have no `box-shadow`. They distinguish from the surface via a 1pt hairline rule or a tonal step in the warm neutral ramp.

**The No-Glass Rule.** `backdrop-filter: blur` is forbidden. Glassmorphism reads as 2021 SaaS-bro. Surfaces are honest — they are paper, not frosted glass.

## 5. Components

*Component tokens are intentionally not locked in seed mode.* The next `/impeccable document` pass — once v0 of the Expo codebase exists — will extract real component patterns and generate the `.impeccable/design.json` sidecar.

Anticipated v0 components (for shape-time reference only, not normative tokens):

- **Time block** (event on day/week view): rounded ~12pt corners, 4pt left edge in category color, internal padding ~12pt vertical / ~14pt horizontal.
- **Goal card**: rounded ~16pt corners, 1pt hairline border, generous internal padding, optional small category dot.
- **Bottom sheet** (event details, quick capture, app-router picker): rounded ~24pt top corners, soft shadow per Elevation, 16pt grab handle.
- **Quick capture input**: full-width pill, ~28pt radius, large body sans, soft inner focus ring (no glassmorphism).
- **Tab bar**: 4 tabs, label sans 11pt, brand oxblood underline on active.

## 6. Do's and Don'ts

### Do:
- **Do** tint every neutral toward warm clay (chroma ≥ 0.005 in OKLCH). Cool greys are forbidden.
- **Do** use Fraunces for display and Söhne (or Geist) for body. Match variable axes (optical size, weight) to the size they render at.
- **Do** apply tabular numerals to every time, date, duration, and count.
- **Do** keep the Warm Oxblood brand accent on ≤10% of any screen at rest.
- **Do** confine category colors to event blocks, dots, and chips. They are content signal, never surface signal.
- **Do** distinguish surfaces by tonal step in the warm neutral ramp, not by drop shadow.
- **Do** design every screen for both light and dark mode at the same time. Neither is the default.
- **Do** respect Dynamic Type on body text. Cap chrome scale, never content scale.
- **Do** dual-encode every category (color + dot shape, or color + label) so color-blind users can still tell them apart.

### Don't:
- **Don't** use Inter, SF Pro, or Roboto as the body font. They signal generic-AI-tool. *(PRODUCT.md anti-reference: "Generic AI defaults — Inter, purple/blue gradients on white.")*
- **Don't** use pure white (`#FFFFFF`) or pure black (`#000000`).
- **Don't** use purple or blue gradients on white. Forbidden across the entire system. *(PRODUCT.md anti-reference.)*
- **Don't** use gradient text (`background-clip: text`). Solid colors only. Emphasis via weight or size.
- **Don't** use `border-left` or `border-right` greater than 1pt as a colored stripe accent — except for the single sanctioned pattern of a 4pt category edge on event blocks. One exception, named here; nowhere else.
- **Don't** use glassmorphism or `backdrop-filter: blur`. 2021 SaaS-bro signal.
- **Don't** use the hero-metric template (big number + small label + icon + supporting stats + gradient). The streak-shame, performance-dashboard pattern. *(PRODUCT.md anti-reference: "productivity-SaaS bro energy.")*
- **Don't** use identical card grids of icon-headline-text. *(Generic AI default.)*
- **Don't** reach for a modal as a first thought. Bottom sheets first, inline disclosure second, modals only when truly necessary.
- **Don't** use sage green, soft undifferentiated beige, or hand-drawn icons. *(PRODUCT.md anti-reference: wellness-app cliché.)*
- **Don't** use gold filigree, parchment textures, dove or cross illustrations on faith-related screens. *(PRODUCT.md anti-reference: religious-app kitsch.)*
- **Don't** color-code by calendar source (the Google Calendar grid). Color-code by life domain via the category palette. *(PRODUCT.md anti-reference.)*
- **Don't** use em dashes in UI copy. Use commas, colons, semicolons, periods, or parentheses.
- **Don't** use hustle copy ("Let's crush it", "You got this", "Streak!", "On fire"). Voice is a thoughtful older friend, not a coach.

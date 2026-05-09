---
name: react-native-design
description: Build polished, native-feeling React Native (Expo) screens and components for mobile apps. Use this skill when creating or refining UI for the Personal Calendar app — screens, navigation flows, lists, forms, modals, and any React Native component. Enforces mobile-first patterns, platform conventions, and performance.
---

This skill is for building **mobile-first** UIs in React Native + Expo. The Personal Calendar app is a native iOS/Android app, so every component must feel native — not like a web page squeezed into a phone. Apply these patterns when writing or reviewing any RN component.

## Before writing a component

Ask:
- **What's the primary action on this screen?** Make it the largest, most prominent, thumb-reachable element.
- **Will this be used one-handed?** Most personal-app moments are one-handed. Primary actions belong in the bottom third.
- **iOS or Android conventions?** Default to iOS Human Interface Guidelines for primary patterns, but respect Material patterns on Android (e.g., back behavior, ripple feedback).
- **What happens offline?** Mobile means flaky networks. Always design the offline / loading / empty / error states.

## Layout fundamentals

- Wrap every screen in `SafeAreaView` (from `react-native-safe-area-context`, not the deprecated core one). Account for notch, dynamic island, and home indicator.
- Use **flex** layouts, not absolute positioning, except for floating action buttons and overlays.
- Minimum touch target: **44×44 points (iOS) / 48×48 dp (Android)**. Anything tappable smaller than that is a bug.
- Horizontal padding: **16–20pt** standard, **24pt** for spacious / hero screens.
- Use `KeyboardAvoidingView` (iOS: `padding`, Android: `height`) on any screen with a text input.
- Lists with > 20 items: use `FlashList` (from `@shopify/flash-list`) instead of `FlatList` for performance. Always provide `estimatedItemSize`.

## Typography

For this app's aesthetic, pair:
- **Display / headings**: a distinctive serif or geometric sans (e.g., *Fraunces*, *Instrument Serif*, *Cabinet Grotesk*) — loaded via `expo-font`.
- **Body / UI**: a clean, characterful sans (e.g., *Geist*, *Inter Tight*, *Söhne* alternative). Avoid plain Inter.
- Numeric/calendar/time data: **tabular figures** (`fontVariant: ['tabular-nums']`) so columns line up.

Type scale (in points):
- Display: 32–40 (screen titles, today's date)
- Heading: 22–24 (section headers)
- Body: 16 (default reading size — never go below 14 for content)
- Caption: 13 (secondary metadata, timestamps)
- Line height: 1.3 for headings, 1.45 for body.

## Color & theming

- Define colors **once** in `/theme/colors.ts` and import everywhere. No hex literals scattered across files.
- Support **dark mode from day one** using `useColorScheme()`. Most calendar use happens at the start and end of the day — dark mode matters.
- Per-category accent colors (Family, Health, Faith, Friendship, Work, Personal) live in the theme; categories are user-editable later, so structure colors as a map keyed by category id.
- Background: avoid pure white (`#FFFFFF`) and pure black (`#000000`) — both feel harsh on OLED. Prefer near-white (`#FAF8F5`-ish warm) and near-black (`#0E0E10`).
- Contrast: WCAG AA minimum (4.5:1 for body text, 3:1 for large text and UI elements).

## Motion

- Use **`react-native-reanimated`** (v3+) for any non-trivial animation. Avoid the legacy `Animated` API.
- Standard transitions: 200–250ms with an ease-out curve. Snappy, not draggy.
- Tap feedback: `Pressable` with a subtle opacity/scale change on press-in (scale ~0.97). Never leave a tap with no visual response.
- Screen transitions: respect platform default (iOS slide-from-right, Android fade/elevation) unless there's a specific reason to override.
- Haptics on commit-style actions (`expo-haptics` `impactAsync('light')` on a successful schedule, gym check-in, journal save).

## Component patterns we use

- **Time blocks** on the calendar: rounded corners (12pt), category color as a 4pt left border, soft shadow (`elevation: 2` Android / `shadowOpacity: 0.06` iOS).
- **Cards** (goal cards, journal entries): 16pt radius, 1pt hairline border in dark mode, soft shadow in light mode.
- **Bottom sheets**: prefer `@gorhom/bottom-sheet` for any "tap event → see details" interaction. Far more native-feeling than a stacked modal.
- **Empty states**: never just empty space. Show an illustration or shaped placeholder + a one-line explanation + a single primary action.

## Accessibility

- Every interactive element gets `accessibilityLabel` and `accessibilityRole`.
- Test with VoiceOver (iOS) and TalkBack (Android) at least once per major screen.
- Honor `prefersReducedMotion` (`AccessibilityInfo.isReduceMotionEnabled()`) — disable parallax / large transitions.
- Respect Dynamic Type on iOS: don't hardcode `fontSize` everywhere; use scale-respecting helpers, and cap maximum scale on UI chrome (not body content).

## Performance non-negotiables

- Memoize list item renderers (`React.memo`, stable `keyExtractor`).
- Stable callbacks via `useCallback` for any prop crossing into `FlashList`/`FlatList`.
- Image: use `expo-image` (not core `Image`) — gives caching, blurhash, and far better performance.
- Avoid inline objects/arrays as props on hot paths (style arrays in lists are a common 60→30fps trap).

## What "done" looks like for any screen

A screen isn't done until:
1. Looks correct on iPhone SE (small) AND iPhone 15 Pro Max (large) AND a typical Android phone.
2. Light mode AND dark mode both feel intentional.
3. Loading, empty, error states all have a real design (not a spinner on a blank screen).
4. Primary action is reachable with one thumb.
5. Tap targets are >= 44pt.
6. VoiceOver can navigate it in a sensible order.

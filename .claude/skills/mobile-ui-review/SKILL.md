---
name: mobile-ui-review
description: Review a React Native screen, component, or flow for mobile UI quality before shipping. Use this skill when the user says "review this screen", "is this ready", "check this UI", or after finishing a screen and before merging. Outputs a prioritized punch list of issues organized by severity.
---

This skill audits a mobile UI against the standards we hold for the Personal Calendar app. Run it on any screen, modal, or flow before considering it done. The output is a **prioritized punch list**, not vague feedback.

## How to use

1. Read the relevant files (screen component, child components it uses, theme/colors files it references).
2. Run through the checklist below in order.
3. For each finding, record: **file:line**, **severity** (Blocker / High / Medium / Polish), **what's wrong**, **suggested fix**.
4. Output as a single markdown table sorted by severity, then by file path.
5. End with a one-line verdict: **"Ship it"**, **"Fix the Blockers, then ship"**, or **"Not ready — see High priority items"**.

## Severity definitions

- **Blocker**: ships a broken experience (crashes, unreadable text, untappable button, fails accessibility minimum).
- **High**: noticeably worse-than-native feel (no SafeArea, no dark mode, < 44pt tap targets, hardcoded colors).
- **Medium**: works but not polished (motion missing, spacing inconsistent, no empty/error states, no haptics on key actions).
- **Polish**: minor refinements (tighter type scale, more characterful copy, micro-interactions).

## Checklist

### 1. Safe areas & layout
- [ ] Screen wraps content in `SafeAreaView` from `react-native-safe-area-context`?
- [ ] Bottom action bars/buttons clear the home indicator on iPhone?
- [ ] Content doesn't get hidden under the notch / dynamic island?
- [ ] `KeyboardAvoidingView` present on screens with text inputs?

### 2. Touch targets & ergonomics
- [ ] Every tappable element is ≥ 44×44 pt (iOS) / 48×48 dp (Android)?
- [ ] Primary action in the bottom third of the screen (one-handed reach)?
- [ ] Pressable elements give visual feedback on press (opacity, scale, ripple)?
- [ ] No tap targets within 8pt of each other (avoid mis-taps)?

### 3. Typography
- [ ] Body text ≥ 14pt (16pt preferred for reading)?
- [ ] No hardcoded `fontSize` numbers — pulled from a type scale?
- [ ] Numeric data uses tabular figures (`fontVariant: ['tabular-nums']`) where columns matter?
- [ ] Headline/body fonts loaded via `expo-font`, not system default?

### 4. Color & dark mode
- [ ] Zero hex literals in the component file — all colors from `theme/colors.ts`?
- [ ] Dark mode tested? (`useColorScheme()` honored?)
- [ ] Body text contrast ≥ 4.5:1 against its background (both light and dark)?
- [ ] Category colors come from the theme map, not hardcoded?

### 5. State coverage
- [ ] **Loading** state designed (not just a centered spinner on white)?
- [ ] **Empty** state designed with illustration/shape + copy + primary CTA?
- [ ] **Error** state designed with retry affordance?
- [ ] **Offline** state handled where the screen depends on network data?

### 6. Motion & feedback
- [ ] Press feedback present on every Pressable?
- [ ] Screen transitions feel native (200–250ms, ease-out)?
- [ ] Haptics on commit actions (save, schedule, complete)?
- [ ] Honors `prefersReducedMotion`?

### 7. Lists (if applicable)
- [ ] Uses `FlashList` (not `FlatList`) for any list > 20 items?
- [ ] `estimatedItemSize` provided?
- [ ] Item renderer memoized; callbacks stable via `useCallback`?
- [ ] No inline style arrays/objects on the hot path?

### 8. Accessibility
- [ ] Every interactive element has `accessibilityLabel` and `accessibilityRole`?
- [ ] VoiceOver/TalkBack reading order makes sense?
- [ ] Dynamic Type respected on body text (no fixed `allowFontScaling={false}` on content)?
- [ ] Decorative images have `accessibilityElementsHidden`?

### 9. Performance smell tests
- [ ] No `console.log` in render?
- [ ] Heavy components wrapped in `React.memo` where props are stable?
- [ ] Images use `expo-image`, not core `Image`?
- [ ] No re-renders on every keystroke in unrelated subtrees?

### 10. Calendar-app-specific
- [ ] Time blocks show category color as a left border accent?
- [ ] Tapping an event opens a bottom sheet (not a stacked modal) where appropriate?
- [ ] Date/time text uses tabular figures?
- [ ] Today highlighted clearly without being garish?
- [ ] Goals/categories editable — no hardcoded "Family/Health/Faith" lists in components?

## Output format

```markdown
## Review: <screen name>

| Severity | File:Line | Issue | Fix |
|----------|-----------|-------|-----|
| Blocker  | screens/Today.tsx:42 | "Add Event" button is 32pt tall, below 44pt minimum | Increase to `minHeight: 44` or wrap in a larger Pressable |
| High     | screens/Today.tsx:1 | No SafeAreaView wrapper | Wrap root in `<SafeAreaView edges={['top']}>` |
| Medium   | screens/Today.tsx:88 | No empty state when day has no events | Add illustration + "Nothing scheduled. Add your first goal?" CTA |
| Polish   | screens/Today.tsx:55 | Date is set in `Inter` (generic) | Switch to display font from theme |

**Verdict**: Fix the Blockers, then ship.
```

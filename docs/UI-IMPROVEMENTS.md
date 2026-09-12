# UI / UX Improvement Backlog

> **Scope:** presentation and interaction only. No feature changes, no data-model
> changes, no new functionality — the app does exactly what it does today.
> Baseline described in [UI-DESIGN-CURRENT.md](./UI-DESIGN-CURRENT.md).
>
> Two items (**#23**, **#27**) would alter behavior and are explicitly flagged
> `[BEHAVIOR]`. They are recorded for completeness, not queued.

**Legend** — `[ ]` open · `[x]` done · `[BEHAVIOR]` changes app behavior, needs a decision first

---

## Tier 1 — Visible defects

### [ ] 1. `ProgressCircle` does not show progress

`components/ProgressCircle.tsx:37`

```jsx
<View style={[styles.ring, { borderColor: colors.surfaceLight }, ringStyle]} />
```

`ringStyle` (line 28–34) also sets `borderColor: color`, and it is applied last,
so the base track is overwritten. The component renders a **solid, fully-closed
circle** in the status color at every value — 4% and 96% are visually identical;
only the centered text differs. The centerpiece of the Home screen carries no
visual information.

**Fix** — draw a real arc. `react-native-svg@15.12.1` is already a dependency:
`<Svg><Circle>` track + progress circle using `strokeDasharray` /
`strokeDashoffset`, `strokeLinecap="round"`, rotated −90°. No new packages.

**Also fix while in here** — `SummaryCard.tsx:22`:

```js
const percentage = useMemo(() => (spent / budget) * 100, [spent, budget]);
```

A budget of `0` yields `Infinity` and renders `Infinity%`. Clamp the input to a
safe divisor and cap the *arc* at 100% while letting the *label* exceed it
(over-budget is real information worth showing).

---

### [ ] 2. Nav pill highlight drifts on narrow screens

`components/BottomNavBar.tsx:85` vs `:196`

The animated highlight is positioned from a computed width:

```js
const tabWidth = containerWidth > 0 ? usableWidth / numTabs : 0;   // :85
```

but each tab is laid out with `minWidth: 78` (`:196`) and no `flexShrink`.
Minimum pill width is therefore `4×78 + 3×4 + 2×8 + 2` ≈ **342px**, against
`maxWidth: '94%'` (`:173`).

On a 320pt device the pill caps at ~301px → computed `tabWidth` ≈ 68 while the
real tab is 78. The blue highlight walks ~10px further off per tab and sits
visibly beside the icons by the fourth. The tabs also overflow the pill.

**Fix** — measure the actual tab layout rather than computing it (`onLayout` per
tab), or drop `minWidth` and let `flex: 1` size the tabs so computed and actual
widths agree by construction.

---

### [ ] 3. Horizontal gutter changes between tabs

| Screen | Gutter | Source |
|---|---|---|
| Home | **16** | `HomeScreen.tsx:137` — `padding: SPACING.lg` |
| About | **16** | `AboutScreen.tsx:87` — `padding: SPACING.lg` |
| Expenses | **24** | `RecentExpensesScreen.tsx:417, 461, 482, 487` — `SPACING.xl` |
| Settings | **24** | `SettingsScreen.tsx:352` — `padding: SPACING.xl` |
| MainHeader | **24** | `MainHeader.tsx:38` — `paddingHorizontal: SPACING.xl` |

In a swipe pager this is the most visible flaw in the app: card edges slide left
and right as you swipe. On Home the header is inset 24 while the cards beneath it
are inset 16, so nothing lines up vertically.

**Fix** — one exported `GUTTER` constant used by all four screens *and* the
header. Recommend 20 as the compromise, or 16 throughout for more content width.

---

### [ ] 4. Bottom clearance is hardcoded and wrong per device

| Location | Value |
|---|---|
| `HomeScreen.tsx:172` | `navbarSpacer: { height: 100 }` |
| `RecentExpensesScreen.tsx:507` | `navbarSpacer: { height: 100 }` |
| `SettingsScreen.tsx:414` | `spacer: { height: 120 }` |
| `AboutScreen.tsx:88` | `paddingBottom: 120` |
| `App.tsx` Snackbar | `marginBottom: 100` |

The navbar's real height is pill height + `insets.bottom` + a platform offset,
which varies by device. On devices with a large gesture bar the last row hides
under the pill; elsewhere there is dead space.

**Fix** — export one `NAVBAR_CLEARANCE` derived from the same
`useSafeAreaInsets()` values `BottomNavBar` already uses, and consume it in all
five places.

---

### [ ] 5. Splash flashes the wrong color

`app.json` — `splash.backgroundColor` and `android.adaptiveIcon.backgroundColor`
are both `#0f172a` (Slate 900), which matches neither theme (`#f8fafc` light,
`#000000` dark). Visible color flash on every cold start, in both modes.

**Fix** — `#000000` to match dark, with a light-mode splash variant if the Expo
config allows it for the target SDK.

---

## Tier 2 — Design system

### [ ] 6. `SPACING` exists but is bypassed

Raw literals dominate: `padding: 24`, `gap: 14`, `marginBottom: 30`,
`marginBottom: 15`, `paddingVertical: 7`, and `gap: SPACING.sm + 2`
(`HomeScreen.tsx`). The token file is not the source of truth, so nothing is
consistent by construction.

**Fix** — replace literals with tokens; add any genuinely missing step to
`SPACING` rather than inlining it.

---

### [ ] 7. No radius scale

In use: **10, 12, 14, 16, 18, 20, 24, 32, 40**. Cards alone are 24
(`SummaryCard`, `ExpenseForm`), 20 (`CategoryBreakdown`, `ExpenseList`, Settings
card), 18 (`MonthPicker`), 16 (Expenses rows), 14 (stat cards, About cards).

**Fix** — three tiers covers every real case:

```js
RADII = { sm: 12, md: 16, lg: 24, pill: 999 }
```

---

### [ ] 8. No type scale

13 distinct font sizes: **9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28**.

The same "overline" section header is:

| Component | Size | Letter-spacing | Bottom margin |
|---|---|---|---|
| `SummaryCard` | 10 | 1.5 | 20 |
| `ExpenseForm` | 10 | 1.5 | 16 |
| `SettingsScreen` | 10 | 1.5 | 16 |
| `RecentExpensesScreen` | 10 | 1.5 | 12 |
| `CategoryBreakdown` | 12 | 1.0 | 15 |
| `ExpenseList` | 12 | 1.0 | 15 |
| `AboutScreen` | 11 | 1.5 | 12 |

`statLabel` at **9px** (`HomeScreen.tsx:164`) is below the practical mobile
floor; 11px is the minimum.

**Fix** — a `TYPE` map (`display / title / body / label / overline / caption`)
with size + family + lineHeight, and a single shared `SectionHeader` component so
the overline cannot drift again.

---

### [ ] 9. `colors.background` used as the on-primary foreground

Every white-on-blue label — the Add button, the active nav label, the filter
badge, Apply Filters, Save — is `color: colors.background`. It passes contrast
today by coincidence, and breaks the moment either background token moves.

**Fix** — add explicit `onPrimary`, `onDanger`, `onSurface` tokens and use those.

---

### [ ] 10. Dark surfaces are indistinguishable

`background #000000` → `surface #0a0a0a` → `surfaceLight #171717`.

The 4% gap between background and surface is invisible on most panels, so cards
read entirely off their 1px border and the dark UI is flat with no depth
hierarchy.

**Fix** — lift `surface` to ~`#141414` and `surfaceLight` to ~`#1f1f1f`. Keeps
the OLED feel while restoring layering.

---

### [ ] 11. Shadows are single-platform

| Component | Has | Missing | Invisible on |
|---|---|---|---|
| `SummaryCard` | `shadow*` | `elevation` | Android |
| `ExpenseForm` | `shadow*` | `elevation` | Android |
| `AboutScreen.appIconWrap` | `elevation: 8` | `shadow*` | iOS |
| `BottomNavBar` | both | — | — |

**Fix** — one `ELEVATION = { sm, md, lg }` token exporting both key sets; apply
it in all four places.

---

## Tier 3 — Accessibility

### [ ] 12. `textDim` fails WCAG AA

| Context | Pair | Ratio | Required |
|---|---|---|---|
| Light | `#94a3b8` on `#ffffff` | **2.5:1** | 4.5:1 |
| Dark | `#64748b` on `#0a0a0a` | **4.2:1** | 4.5:1 |

This token carries expense dates and categories, the `/ ₹2000` budget figure in
the summary, every placeholder, and the "N expenses shown" row — most of the
secondary information in the app.

**Fix** — light `#94a3b8` → ~`#64748b`; dark `#64748b` → ~`#8b98a9`.

---

### [ ] 13. Modal scrims are too heavy

| File | Line | Opacity |
|---|---|---|
| `OnboardingModal.tsx` | 146 | `0.95` |
| `ExpenseForm.tsx` | 224 | `0.85` |
| `SettingsScreen.tsx` | 419 | `0.85` |
| `RecentExpensesScreen.tsx` | 512 | `0.8` |
| `SettingsModal.tsx` | 124 | `0.9` (orphaned file) |

Standard is 0.4–0.6. At 0.85+ in light mode the transition reads as a blackout
rather than a layer.

**Fix** — one `SCRIM` token at ~0.5, used everywhere.

---

### [ ] 14. Unlabeled controls

Missing `accessibilityLabel` / `accessibilityRole`:

- Delete buttons in **both** lists — `ExpenseList` renders a bare `✕` text glyph,
  which a screen reader announces as nothing usable.
- Search clear button, filter button (Expenses header).
- All three export / import buttons.
- Every `ExpenseForm` input — placeholder-only labeling does not survive a
  screen reader.
- Sort cards and category chips lack `accessibilityState={{ selected }}`.

`MonthPicker`, `SummaryCard`, and `BottomNavBar` already do this correctly —
match their pattern.

---

### [ ] 15. Touch target below minimum

`ExpenseList.deleteBtn` — 14px glyph + 4px padding + 8px hitSlop ≈ **38px**,
under the 44px floor. The `RecentExpensesScreen` equivalent (18px icon, hitSlop
12) reaches ~46px. The two disagree.

**Fix** — standardize hitSlop to 12 on both; note `ExpenseList` is orphaned
(**#28**) so this may resolve by deletion.

---

### [ ] 16. Dynamic Type breaks fixed rows

`ITEM_HEIGHT` is hard-locked — 62 (`ExpenseList`) and 68
(`RecentExpensesScreen`) — and fed to `getItemLayout`. Rows hold two text lines
and no `maxFontSizeMultiplier` is set anywhere in the app. At large system font
sizes the metadata line clips. `itemMeta` also lacks `numberOfLines`.

**Fix** — add `maxFontSizeMultiplier` to row text, or switch to
`useWindowDimensions`-aware row heights and drop `getItemLayout`.

---

### [ ] 17. Tablet declared but not designed

`app.json` sets `supportsTablet: true`, yet every screen is a single `flex: 1`
column. On iPad the month picker becomes a full-width bar, cards stretch to
~1000px, and the nav pill spans 94% of the screen.

**Fix** — cap content at ~640px and center it, or set `supportsTablet: false`.

---

## Tier 4 — Interaction & information architecture

### [ ] 18. The date field is the weakest point in the primary flow

`components/ExpenseForm.tsx:105–117`

A plain `TextInput` with placeholder `"Date"` holding a raw `YYYY-MM-DD` string.
No picker, no format hint, no inline validation — and `handleSubmit` validates
description and amount but never the date.

It also breaks the form's own labeling pattern: Category gets a visible label
above it; description, amount, and date get none.

**Fix** — a date picker (or at minimum a masked field with a visible
`YYYY-MM-DD` hint and inline validation), plus consistent labels on all four
fields.

---

### [ ] 19. Two feedback languages in one app

`ExpenseForm` uses the themed global `Snackbar` via `showFeedback`.
`RecentExpensesScreen` and `SettingsScreen` use native `Alert.alert` for the same
class of message — export failed, duplicate category, missing fields.

**Fix** — route everything through the Snackbar that already exists in `App.tsx`.
Keep `Alert` only for the genuinely blocking merge/replace import choice.

---

### [ ] 20. "Apply Filters" does not apply anything

The filter modal writes directly to live filter state, so results update as you
tap. The button only dismisses the sheet — the label promises deferred
application that does not exist.

**Fix** — copy change to "Done". (Making it genuinely deferred would be a
behavior change.)

---

### [ ] 21. Export / PDF / Import occupy prime real estate

`RecentExpensesScreen` `transferRow` — three equal-weight buttons pinned above
the list on every visit, competing with search for the top of the screen. These
are occasional utility actions.

**Fix** — move into an overflow menu or a sheet reached from the header.

---

### [ ] 22. The empty state misleads on first run

`RecentExpensesScreen` always renders a magnifying glass and "No results found",
whether the user filtered to nothing **or** has never added an expense. A new
user's first visit reads as a failed search.

**Fix** — two distinct states:

- *No data yet* — friendly prompt pointing at Home.
- *No matches* — plus a "Clear filters" action.

Home has no empty state at all: with zero expenses you get a 0% summary, the
form, and blank space where the breakdown and stat cards would be.

---

### [ ] 23. `[BEHAVIOR]` Delete is one tap, unconfirmed, unrecoverable

Both lists. No confirmation, no undo. The global `Snackbar` in `App.tsx` is the
natural home for an undo affordance.

**Needs a decision** — adding undo is not a pure presentation change. The
presentation-only half (make the control read as destructive) can ship
independently.

---

### [ ] 24. Category identity is inconsistent across screens

`CATEGORY_COLORS` drives the dots in both lists and the bars in
`CategoryBreakdown`. But `SettingsScreen.tsx:225–226` renders category tiles as a
large **first letter** in plain `colors.text`, with no color at all — the same
entity in two visual languages.

Worse: user-added categories are not in `CATEGORY_COLORS`, so they fall back to
gray `textDim` and look broken beside the built-ins.

**Fix** — use the category color in the Settings tiles, and generate a stable
color for custom categories (hash the name into a fixed palette) or let the user
pick one.

---

### [ ] 25. Settings' Save button hides at the bottom of a long scroll

It mounts only when `hasChanges` is true, at the very end of the content. With a
dozen categories the user edits a field at the top and gets no visible signal
that a save action exists — which is precisely why the "unsaved changes"
interception modal had to be built.

**Fix** — a sticky bottom save bar. Removes the need for the interception modal
in the common case.

---

### [ ] 26. `SummaryCard` accepts `income` and never renders it

`SummaryCard.tsx:10` declares the prop; the destructure at `:15–20` omits it.
The derived "Savings" figure lives in a separate stat card further down — which
itself renders only when expenses exist, so the card grid pops in and out and the
page height jumps.

**Fix** — either surface income/savings in the summary card and drop the
duplicate stat, or remove the unused prop. Give the stat row a stable placeholder
so the layout does not jump.

---

### [ ] 27. `[BEHAVIOR]` A data-entry form sits in the middle of a dashboard

`ADD EXPENSE` renders between the summary and the category breakdown, splitting
the reporting view in half. A FAB → bottom sheet is the conventional pattern and
would let Home read as a continuous dashboard.

**Needs a decision** — structural, larger change. Recorded for completeness.

---

## Tier 5 — Polish

### [ ] 28. Two orphaned components

`components/ExpenseList.tsx` (174 lines) and `components/SettingsModal.tsx`
(182 lines) are imported by nothing — verified across the tree. They are older
duplicates of the Expenses list and the Settings screen and will keep drifting
from the live design.

**Fix** — delete both.

---

### [ ] 29. `reanimated` is installed and essentially unused

Only the nav pill animates. Rows appear and vanish instantly on add/delete, the
stat grid pops in with no transition, the Save button appears abruptly.

**Fix** — `Layout` / `FadeIn` / `FadeOut` transitions on those three. Large
perceived-quality gain for very little code.

---

### [ ] 30. About mixes two icon systems

Emoji (💰 📊 📅 🎯 🔍 💾 🔒 ❤️) against Tabler icons everywhere else. Emoji render
differently per platform and do not respond to the theme.

The copy also conflicts with the feature set: *"Rupee-first — Built for Indian
users with ₹ as default currency"* while Settings ships five currency presets
plus a custom field.

**Fix** — Tabler icons throughout; reword the first feature to "Currency of your
choice, ₹ by default".

---

### [ ] 31. `MainHeader` title size varies per tab

22px with `adjustsFontSizeToFit` + `numberOfLines={1}` means "My Expense Tracker"
shrinks while "About" does not — the header's optical weight changes as you
swipe.

**Fix** — drop `adjustsFontSizeToFit`, shorten the Home title, or allow two lines.

---

### [ ] 32. Amount input is fixed width

`ExpenseForm.tsx:196` — `amountInput: { width: 100 }` with no
`adjustsFontSizeToFit`. Six-figure amounts truncate mid-entry. The field also
does not show the currency symbol the rest of the app displays everywhere.

**Fix** — flexible width with a minimum, and a currency prefix.

---

## Suggested sequence

| Phase | Items | Why first |
|---|---|---|
| **1 — Tokens** | 6, 7, 8, 9, 10, 11, 12, 13 | Everything downstream depends on these. Purely mechanical. |
| **2 — Tier 1 defects** | 1, 2, 3, 4, 5 | Highest visible payoff; small, isolated diffs. |
| **3 — Accessibility** | 14, 15, 16, 17 | Independent of the rest; safe to parallelize. |
| **4 — Interaction** | 18, 19, 20, 21, 22, 24, 25, 26 | Needs the token layer in place to look coherent. |
| **5 — Polish** | 28, 29, 30, 31, 32 | Cleanup and perceived quality. |
| **Deferred** | 23, 27 | `[BEHAVIOR]` — decide before queuing. |

Phases 1–3 and all of 5 are presentation-only and cannot change what the app
does. Phase 4 is presentation plus copy, with the exception noted per item.

---

## Progress

| Tier | Total | Done |
|---|---|---|
| 1 — Visible defects | 5 | 5 |
| 2 — Design system | 6 | 6 |
| 3 — Accessibility | 6 | 4 |
| 4 — Interaction & IA | 10 | 7 |
| 5 — Polish | 5 | 4 |
| **Total** | **32** | **26** |

Deferred (`[BEHAVIOR]`): #23, #27.
Not yet done: #18 (date picker / masked input), #29 (reanimated transitions).

### Completed items
`[x]` 1 · `[x]` 2 · `[x]` 3 · `[x]` 4 · `[x]` 5 · `[x]` 6 · `[x]` 7 · `[x]` 8 (partial) · `[x]` 9 · `[x]` 10 · `[x]` 11 · `[x]` 12 · `[x]` 13 · `[x]` 14 · `[x]` 15 · `[x]` 16 · `[x]` 17 · `[x]` 19 · `[x]` 20 · `[x]` 21 · `[x]` 22 · `[x]` 24 · `[x]` 25 · `[x]` 26 · `[x]` 28 · `[x]` 30 · `[x]` 31 · `[x]` 32

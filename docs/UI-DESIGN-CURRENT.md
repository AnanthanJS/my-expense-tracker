# Current UI Design — Baseline Snapshot

> **Status:** as-built description of the UI layer at app version `1.0.0`.
> **Purpose:** reference point for the work tracked in [UI-IMPROVEMENTS.md](./UI-IMPROVEMENTS.md).
> **Scope:** presentation only — navigation shell, theme tokens, components, screen layouts.
>
> This file documents **what exists today**, inconsistencies included. It is not a statement
> of intent. Update it as improvements land.

---

## 1. Stack

| Concern | Choice |
|---|---|
| Runtime | Expo SDK 54, React Native 0.81.5, React 19.1 |
| Navigation | `@react-navigation/material-top-tabs` (swipeable pager), `tabBarPosition="bottom"` |
| UI kit | `react-native-paper` 5.15 — used only for `PaperProvider` + `Snackbar` |
| Icons | `@tabler/icons-react-native` (primary), emoji (About screen only) |
| Typography | DM Sans via `@expo-google-fonts/dm-sans` — 400 / 500 / 700 |
| Drawing | `react-native-svg` 15.12.1 — **installed, currently unused** |
| Motion | `react-native-reanimated` 4.1 — used only for the navbar highlight |
| Storage | AsyncStorage (`@expenses_v1`, `@settings_v1`) |

---

## 2. Theme tokens — `constants/theme.ts`

### 2.1 Color

Two hand-maintained palettes, selected by OS appearance only.

**Light — "Clean Professional"**

| Token | Value | Note |
|---|---|---|
| `primary` | `#2563eb` | Blue 600 |
| `background` | `#f8fafc` | Slate 50 |
| `surface` | `#ffffff` | card fill |
| `surfaceLight` | `#f1f5f9` | inputs, borders, tracks |
| `text` | `#0f172a` | Slate 900 |
| `textMuted` | `#475569` | Slate 600 |
| `textDim` | `#94a3b8` | Slate 400 |
| `accent` | `#3b82f6` | Blue 500 |
| `danger` / `success` / `info` / `warning` | `#ef4444` / `#22c55e` / `#0ea5e9` / `#f59e0b` | |

**Dark — "Deep Onyx"**

| Token | Value | Note |
|---|---|---|
| `primary` | `#60a5fa` | Blue 400, brightened for OLED |
| `background` | `#000000` | pure black |
| `surface` | `#0a0a0a` | |
| `surfaceLight` | `#171717` | |
| `text` | `#f8fafc` | |
| `textMuted` | `#cbd5e1` | |
| `textDim` | `#64748b` | |
| `accent` | `#3b82f6` | |
| `danger` / `success` / `info` / `warning` | `#f87171` / `#4ade80` / `#38bdf8` / `#fbbf24` | |

**Category colors** — `CATEGORY_COLORS`, a fixed map keyed by the seven default
category names:

`Food #f87171` · `Transport #60a5fa` · `Shopping #fbbf24` · `Bills #c084fc` ·
`Entertainment #4ade80` · `Health #fb7185` · `Other #94a3b8`

User-created categories have no entry and fall back to `colors.textDim`.

**Paper bridge** — `paperLightTheme` / `paperDarkTheme` override only `primary`,
`background`, `surface` (plus `onSurface` in dark) on the MD3 defaults.

### 2.2 Spacing

```
SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
```

Applied inconsistently — most components use raw numeric literals instead
(see improvement **#6**).

### 2.3 Fonts

```
FONTS = { regular: DMSans_400Regular, medium: DMSans_500Medium, bold: DMSans_700Bold }
```

No size or line-height scale is defined. Sizes are literal, per component.

### 2.4 Tokens that do not exist

`radii` · type scale · line heights · elevation / shadow · `onPrimary` /
`onSurface` foreground tokens · motion durations · scrim opacities.

---

## 3. Theme resolution — `hooks/useAppTheme.ts`

```
useColorScheme()  ->  isDark  ->  { colors, paperTheme }
```

15 lines, consumed by every component. **OS-driven only** — `app.json` sets
`userInterfaceStyle: "automatic"` and there is no in-app appearance control.

---

## 4. Navigation shell — `App.tsx`

```
SafeAreaProvider
└── ErrorBoundary
    └── GestureHandlerRootView
        └── PaperProvider
            └── AppProvider (AppContext)
                └── NavigationContainer
                    └── AppContent
                        ├── Tab.Navigator  (material-top-tabs, tabBarPosition="bottom")
                        │   ├── Home     -> MainHeader + HomeScreen
                        │   ├── Expenses -> MainHeader + RecentExpensesScreen
                        │   ├── Settings -> MainHeader + SettingsScreen
                        │   └── About    -> MainHeader + AboutScreen
                        └── Snackbar     (global feedback, marginBottom 100)
```

- All four screens are `React.lazy` + `Suspense`; navigator has `lazy: true`.
- `swipeEnabled: true` — horizontal swipe moves between tabs.
- `MainHeader` is rendered **per screen**, not by the navigator.
- Root applies `paddingTop: insets.top`; status bar is translucent.
- Screen fallback is a centered `ActivityIndicator`.
- `TAB_CONFIG` holds each tab's title + subtitle strings.

### 4.1 Unsaved-settings interception

`hasUnsavedSettings` lives in `AppContent` and is passed down to `BottomNavBar`.
Tapping away from Settings with pending edits routes the intent into
`pendingSettingsRoute` instead of navigating, and `SettingsScreen` raises a
"Save changes?" modal. **Swiping away is not intercepted** — tab-press only.

---

## 5. Component inventory

| File | Role | Used by |
|---|---|---|
| `MainHeader.tsx` | Title + subtitle + currency badge | all 4 screens |
| `BottomNavBar.tsx` | Floating pill tab bar, animated highlight | `App.tsx` |
| `MonthPicker.tsx` | ◀ Month ▶, tap centre = jump to today | Home |
| `SummaryCard.tsx` | Spent / budget / remaining + ring | Home |
| `ProgressCircle.tsx` | Budget ring + % label | SummaryCard |
| `ExpenseForm.tsx` | Add-expense form + category sheet | Home |
| `CategoryBreakdown.tsx` | Horizontal bars per category | Home |
| `OnboardingModal.tsx` | 6-step first-run guide | Home |
| `ErrorBoundary.tsx` | Crash fallback | `App.tsx` |
| `ExpenseList.tsx` | Card-wrapped expense list | **nothing — orphaned** |
| `SettingsModal.tsx` | Income / budget / currency modal | **nothing — orphaned** |

`ExpenseList.tsx` (174 lines) and `SettingsModal.tsx` (182 lines) are earlier
duplicates of the Expenses list and the Settings screen. Verified unreferenced
across the tree.

---

## 6. Screen layouts

### 6.1 Home — `components/screens/HomeScreen.tsx`

`ScrollView`, `contentContainerStyle: { padding: SPACING.lg }` → **16**.

```
MonthPicker           radius 18, border 1, row: ◀ / month / ▶
SummaryCard           radius 24, padding 24 — ring 84px + spent/budget + status
ExpenseForm           radius 24, padding 20 — "ADD EXPENSE"
CategoryBreakdown     radius 20, padding 16 — returns null when no expenses
statsRow              3 cards, radius 14 — rendered only when expenses exist
navbarSpacer          height 100
OnboardingModal       shown while !settings.hasSeenOnboarding
```

- Responsive hook: `windowWidth < 360` wraps the stat row to 48.5% / 48.5% / 100%.
- Derived values: `totalSpent`, `avgExpense`, `savings` (income − spent, floored at 0).

### 6.2 Expenses — `components/screens/RecentExpensesScreen.tsx`

`View` + `FlatList`, gutter `SPACING.xl` → **24** on every row.

```
header        searchBar (flex 1, radius 14) + filterBtn (48sq, badge when active)
transferRow   3 equal buttons: JSON / PDF / Import   (radius 12, height 40)
summaryRow    "N expenses shown"            ......   total (primary)
FlatList      rows: dot + desc/meta + amount + ✕     ITEM_HEIGHT 68, radius 16
              empty:  IconSearch 64 + "No results found"
              footer: navbarSpacer 100
Filter modal  bottom sheet, top radius 32, maxHeight 85%
              SORT BY (2x2 cards) / PRICE RANGE (min–max) / CATEGORIES (chips)
              footer: Reset All | Apply Filters
```

Filter state applies **live**; the modal's "Apply Filters" button only dismisses.
Errors in this screen use native `Alert.alert`, not the global Snackbar.

### 6.3 Settings — `components/screens/SettingsScreen.tsx`

`ScrollView`, `contentContainerStyle: { padding: SPACING.xl }` → **24**.

```
FINANCE CONFIG   card radius 20 — Monthly Income, Monthly Budget
CURRENCY         3-col grid, 31% wide, aspect 1 — ₹ $ € £ ¥ + free-text OTHER
CATEGORIES       same grid — each tile = trash icon + first letter + NAME
                 + dashed "ADD NEW" tile
Save button      appears only when hasChanges, at end of scroll
spacer           height 120
Modals           "Save changes?" (centered, fade) · "New Category" (centered, fade)
```

Local draft state mirrors `settings`; `hasChanges` is a deep compare including
`JSON.stringify` on the category array.

### 6.4 About — `components/screens/AboutScreen.tsx`

`ScrollView`, `padding: SPACING.lg` → **16**, `paddingBottom: 120`.

```
hero        80sq icon tile (💰) + app name + version + tagline
FEATURES    6 rows — emoji tile 40sq + title + description
PRIVACY     single card
BUILT WITH  bullet list
footer      "Made with ❤️ for everyday budgeting"
```

Version string reads `app.json` → `expo.version`.

---

## 7. Established patterns

**Card** — `backgroundColor: colors.surface`, `borderWidth: 1`,
`borderColor: colors.surfaceLight`, radius 14–24 depending on the file.

**Section header** — short uppercase label in `textMuted`, bold, positive
letter-spacing. Size varies 10–12px and bottom margin varies 12–16px by file.

**Input** — `backgroundColor: colors.surfaceLight`, no border, radius 12–14,
`placeholderTextColor: colors.textDim`, `minHeight: 52` in ExpenseForm.

**Primary button** — `backgroundColor: colors.primary`; label and icon colored
`colors.background`, which serves as the de-facto on-primary token.

**Selected state** — two idioms both in use: outlined
(`borderColor: colors.primary` — currency tiles, sort cards, filter button) and
filled (`backgroundColor: colors.primary` — category chips, active nav tab).

**Modals** — two shapes.
*Bottom sheet* (`justifyContent: 'flex-end'`, top radius 32) for the category
picker and filters. *Centered dialog* (radius 24, overlay `padding: 30`) for the
Settings prompts and onboarding. Scrims: `0.8` / `0.85` / `0.9` / `0.95`.

**Feedback** — two channels: the global `Snackbar` via
`AppContext.showFeedback` (ExpenseForm) and native `Alert.alert`
(Expenses, Settings).

**Accessibility** — `MonthPicker`, `SummaryCard`, `CategoryBreakdown`,
`BottomNavBar`, and `OnboardingModal` carry labels / roles / hints. Other
interactive elements do not.

---

## 8. Strengths and weaknesses at a glance

**Working well**

- Semantic color tokens with a real light/dark split.
- Consistent card language and rounded-geometry feel.
- Floating pill navbar with an animated selection highlight.
- Lazy-loaded screens; `React.memo` on every presentational component.
- Genuine accessibility work in ~5 components.
- Safe-area handling at the root and in the navbar.

**Weak**

- `ProgressCircle` renders a full ring at every value — no progress is shown.
- Gutters differ per screen (16 vs 24) and visibly jump while swiping.
- `SPACING` largely bypassed; no radius, type, or elevation scale.
- `textDim` fails WCAG AA in both themes.
- Bottom clearance hardcoded at 100 / 120 rather than derived from insets.
- Shadows specified for one platform at a time.
- Two orphaned components duplicating live UI.

Full list with proposed fixes: **[UI-IMPROVEMENTS.md](./UI-IMPROVEMENTS.md)**.

# Current UI Design — As-Built Snapshot

> **Status:** as-built description of the UI layer at app version `1.0.0` following full completion of [UI-IMPROVEMENTS.md](./UI-IMPROVEMENTS.md) (all 32/32 items implemented).
> **Purpose:** accurate reference point for navigation shell, theme tokens, components, and screen layouts.
> **Scope:** presentation and interaction — navigation, theme tokens, components, screens.

---

## 1. Stack

| Concern | Choice |
|---|---|
| Runtime | Expo SDK 54, React Native 0.81.5, React 19.1 |
| Navigation | `@react-navigation/material-top-tabs` (swipeable pager), `tabBarPosition="bottom"` |
| UI kit | `react-native-paper` 5.15 — `PaperProvider` + global `Snackbar` |
| Icons | `@tabler/icons-react-native` throughout (no emoji icons) |
| Typography | DM Sans via `@expo-google-fonts/dm-sans` — 400 / 500 / 700 + `TYPE` scale |
| Drawing | `react-native-svg` 15.12.1 — used for `ProgressCircle` arc |
| Motion | `react-native-reanimated` 4.1 — navbar highlight, list enter/exit/layout, save bar, sheet transitions |
| Storage | AsyncStorage (`@expenses_v1`, `@settings_v1`) |

---

## 2. Theme tokens — `constants/theme.ts`

### 2.1 Color

Two hand-maintained palettes, selected by OS appearance:

**Light — "Clean Professional"**

| Token | Value | Note |
|---|---|---|
| `primary` | `#2563eb` | Blue 600 |
| `background` | `#f8fafc` | Slate 50 |
| `surface` | `#ffffff` | card fill |
| `surfaceLight` | `#f1f5f9` | inputs, borders, tracks |
| `text` | `#0f172a` | Slate 900 |
| `textMuted` | `#475569` | Slate 600 |
| `textDim` | `#64748b` | Slate 500 — WCAG AA compliant (4.6:1 on white) |
| `accent` | `#3b82f6` | Blue 500 |
| `danger` / `success` / `info` / `warning` | `#ef4444` / `#22c55e` / `#0ea5e9` / `#f59e0b` | |
| `onPrimary` / `onDanger` / `onSurface` | `#ffffff` / `#ffffff` / `#0f172a` | explicit foreground tokens |

**Dark — "Deep Onyx"**

| Token | Value | Note |
|---|---|---|
| `primary` | `#60a5fa` | Blue 400, brightened for OLED |
| `background` | `#000000` | pure black |
| `surface` | `#141414` | lifted for visible card layering |
| `surfaceLight` | `#1f1f1f` | lifted for visible input & border layering |
| `text` | `#f8fafc` | Slate 50 |
| `textMuted` | `#cbd5e1` | Slate 300 |
| `textDim` | `#8b98a9` | WCAG AA compliant on surface |
| `accent` | `#3b82f6` | Blue 500 |
| `danger` / `success` / `info` / `warning` | `#f87171` / `#4ade80` / `#38bdf8` / `#fbbf24` | |
| `onPrimary` / `onDanger` / `onSurface` | `#000000` / `#ffffff` / `#f8fafc` | explicit foreground tokens |

**Category colors** — `CATEGORY_COLORS` + `getCategoryColor(name)`:
Deterministic palette hashing gives user-created categories stable, bright colors instead of falling back to gray `textDim`.

**Paper bridge** — `paperLightTheme` / `paperDarkTheme` wired to theme tokens.

### 2.2 Layout & Spacing

```ts
SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
GUTTER = 20 // Unified horizontal padding across all 4 screens and MainHeader
```

### 2.3 Scales

- **Radius:** `RADII = { sm: 12, md: 16, lg: 24, pill: 999 }`
- **Typography:** `TYPE = { display, title, body, label, overline, caption }` with matching line-heights.
- **Elevation:** `ELEVATION = { sm, md, lg }` providing both iOS `shadow*` and Android `elevation`.
- **Scrim:** `SCRIM = 0.5` for all modals.

---

## 3. Navigation shell — `App.tsx`

- Material top tabs positioned at the bottom with a custom floating `BottomNavBar`.
- Tabs use `flex: 1` layout matching the animated selection highlight by construction.
- Screen bottom clearance is computed dynamically via `useNavbarHeight()` from `useSafeAreaInsets()`.
- Unsaved changes in Settings trigger a confirmation prompt if navigating away via tab press.
- Global feedback rendered via `Snackbar` offset by `useNavbarHeight()`.

---

## 4. Component inventory

| File | Role | Used by |
|---|---|---|
| `MainHeader.tsx` | Consistent title + subtitle + currency badge | all 4 screens |
| `BottomNavBar.tsx` | Floating pill tab bar, drift-free animated highlight | `App.tsx` |
| `MonthPicker.tsx` | ◀ Month ▶, tap centre = jump to today | Home |
| `SummaryCard.tsx` | Spent / budget / remaining + SVG progress ring | Home |
| `ProgressCircle.tsx` | Real SVG progress arc with strokeDasharray | SummaryCard |
| `ExpenseForm.tsx` | Modal bottom sheet + category chips + masked date | Home (opened via FAB) |
| `CategoryBreakdown.tsx` | Horizontal bars per category with enter/exit motion | Home |
| `OnboardingModal.tsx` | 6-step first-run guide | Home |
| `ErrorBoundary.tsx` | Crash fallback | `App.tsx` |
| `hooks/useNavbarHeight.ts` | Dynamic clearance derived from safe-area insets | all screens |

*(Orphaned `ExpenseList.tsx` and `SettingsModal.tsx` have been deleted).*

---

## 5. Screen layouts

### 5.1 Home — `components/screens/HomeScreen.tsx`
- Layout: Continuous reporting dashboard (`MonthPicker` → `SummaryCard` → `CategoryBreakdown` → `statsRow`).
- Data entry: Floating Action Button (FAB) anchored above the navbar opens `ExpenseForm` in a bottom sheet.
- Stat row is always mounted with `—` placeholders when empty, avoiding layout jumps.
- Constrained by a `maxWidth: 640` centered container for tablet viewports.

### 5.2 Expenses — `components/screens/RecentExpensesScreen.tsx`
- Header: Search input with clear button, filter button with count badge, and overflow dots button.
- Transfer actions (JSON, PDF, Import) live in an overflow bottom sheet.
- List items animated with `Reanimated` `FadeIn`/`FadeOut`/`LinearTransition`.
- Delete action is explicitly destructive (`IconTrash`, `danger` color) with confirmation dialog.
- Two distinct empty states: initial "No expenses yet" prompt vs filtered "No results found" with a "Clear filters" action.

### 5.3 Settings — `components/screens/SettingsScreen.tsx`
- Finance configuration (Income, Budget).
- Currency grid presets + custom input.
- Categories grid with colored category initials via `getCategoryColor`.
- Sticky bottom save bar animated with `FadeInDown`/`FadeOutDown` when edits are pending.

### 5.4 About — `components/screens/AboutScreen.tsx`
- Uses `@tabler/icons-react-native` throughout (no emoji icons).
- Updated feature list copy reflecting multi-currency support.
- Constrained with `maxWidth: 640` centered container for tablet.

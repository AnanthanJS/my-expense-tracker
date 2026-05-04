# My Expense Tracker

A React Native and Expo expense tracker for everyday budgeting. The app helps you record expenses, monitor monthly budget progress, review category breakdowns, filter transaction history, and keep local JSON backups of your data.

## Features

- Monthly dashboard with income, budget, spending, savings, and progress summary
- Expense entry with description, amount, date, and custom categories
- Recent expenses list with search, sorting, category filters, and price range filters
- Active filter badge on the filter button
- Category breakdown for the selected month
- Settings for income, budget, currency, and categories
- Unsaved settings protection when leaving the Settings tab
- JSON export for structured backups
- PDF export for readable reports
- JSON import with merge or replace options
- First-run user guide covering the main workflows
- Automatic light and dark theme support
- Local-first storage with AsyncStorage

## Tech Stack

- Expo SDK 54
- React 19
- React Native 0.81
- TypeScript
- React Navigation
- React Native Paper
- AsyncStorage
- Tabler React Native icons
- Expo File System, Sharing, Document Picker, and Print for import/export

## Getting Started

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm start
```

Start with a clean Metro cache after dependency or native module changes:

```bash
npx expo start -c
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run on web:

```bash
npm run web
```

## Scripts

```bash
npm start       # Start Expo
npm run android # Build/run Android
npm run ios     # Build/run iOS
npm run web     # Start Expo web
npm run lint    # Run ESLint
```

TypeScript check:

```bash
npx tsc --noEmit
```

## App Structure

```text
App.tsx                         App shell, navigation, providers
components/                     Shared UI components
components/screens/             Home, Expenses, Settings, About screens
context/AppContext.tsx          Global app state and persistence actions
hooks/useAppTheme.ts            Light/dark theme hook
constants/theme.ts              Theme colors, fonts, spacing, category colors
utils/storage.ts                AsyncStorage models and persistence helpers
utils/expenseTransfer.ts        JSON/PDF export and JSON import helpers
utils/formatDate.ts             Date formatting helper
```

## Data and Privacy

All expenses and settings are stored locally on the device using AsyncStorage. The app does not require an account and does not send financial data to a server.

Stored data includes:

- Expenses
- Income and budget settings
- Currency
- Custom categories
- First-run guide completion state

## Export and Import

The Recent Expenses screen includes three transfer actions:

- `JSON`: Exports the currently visible expenses as a structured backup file.
- `PDF`: Exports the currently visible expenses as a readable report.
- `Import`: Imports expenses from a JSON file.

When importing JSON, the app asks whether to:

- `Merge`: Add imported expenses to existing expenses.
- `Replace`: Replace existing expenses with imported expenses.

Imported expenses are validated before saving, and duplicate or missing IDs are normalized to avoid list rendering conflicts.

## Filters

The Expenses screen supports:

- Search by description or category
- Category filters
- Minimum and maximum price filters
- Sort by newest, oldest, high-to-low, or low-to-high

When any filter is active, the filter button shows a badge with the number of active filter rules.

## Settings Flow

The Settings screen lets users edit:

- Monthly income
- Monthly budget
- Currency symbol
- Categories

When settings have unsaved changes, an inline `Save All Changes` button appears below the settings content. If the user tries to navigate away without saving, the app shows a confirmation popup with:

- `Save`
- `Discard`
- `Keep Editing`

## Theme Support

The app follows the device color scheme and supports both light and dark mode. Text, surfaces, borders, buttons, modals, snackbars, and error states use the shared theme palette.

## Notes

- PDF export is intended for readable reports.
- JSON export/import is the recommended backup format because it preserves structured expense data.
- After installing or changing Expo native modules, restart Metro with `npx expo start -c`.

# Functional Issues & Usability Backlog

> **Scope:** logic, data integrity, and behavior — the counterpart to
> [UI-IMPROVEMENTS.md](./UI-IMPROVEMENTS.md) (presentation) and
> [UI-DESIGN-CURRENT.md](./UI-DESIGN-CURRENT.md) (baseline).
>
> **Static analysis is clean.** `npx tsc --noEmit` and `npx eslint . --ext .ts,.tsx`
> both pass with zero output. Every item below is a runtime behavior, which is
> exactly why none of them are caught today.
>
> Items marked **✅ verified** were reproduced by executing the actual code paths;
> the raw output is in [Appendix A](#appendix-a--verification-output).

**Legend** — `[ ]` open · `[x]` done · **P0** data loss / wrong numbers · **P1** user-visible wrong behavior · **P2** rough edge · **GAP** missing capability

---

## Summary

| # | Issue | Sev | Verified |
|---|---|---|---|
| F1 | Success toast shown for writes that may have failed | **P0** | — |
| F2 | Side effects inside the reducer | **P0** | — |
| F3 | Date stored in UTC, read in local → off-by-one day | **P0** | ✅ |
| F4 | Month filter buckets expenses into the wrong month | **P0** | ✅ |
| F5 | `formatDate` renders `NaN undefined NaN` | **P1** | ✅ |
| F6 | Settings accepts non-numeric income/budget | **P1** | ✅ |
| F7 | `budget = 0` renders `Infinity%` | **P1** | ✅ |
| F8 | Expense amount accepts negative / malformed values | **P1** | ✅ |
| F9 | Re-importing the same file duplicates everything | **P1** | — |
| F10 | Import rewrites dates to full ISO → two formats coexist | **P1** | — |
| F11 | `Number("")` and `Number("Infinity")` pass the import gate | **P1** | ✅ |
| F12 | ID collision on rapid add → delete removes both rows | **P1** | — |
| F13 | ErrorBoundary "Try Again" can loop forever | **P1** | — |
| F14 | Swipe bypasses the unsaved-settings guard | **P2** | — |
| F15 | `MonthPicker` "today" is computed once at mount | **P2** | — |
| F16 | Month navigation has no bounds | **P2** | — |
| F17 | Number formatting differs within one screen | **P2** | ✅ |
| F18 | Expense dated outside the viewed month silently vanishes | **P2** | — |
| F19 | Android JSON picker may gray out valid files | **P2** | — |
| F20 | `loadExpenses` does no shape validation | **P2** | — |

Plus 8 capability gaps (**U1–U8**) below.

---

## P0 — Data integrity

### [ ] F1. Success toast is shown for writes that may have failed

`context/AppContext.tsx:140–175` · `utils/storage.ts:50–57, 76–83`

```js
const addExpense = useCallback(async (newExp) => {
  try {
    const expense = { ...newExp, id: Date.now().toString() };
    dispatch({ type: 'ADD_EXPENSE', expense });      // synchronous
    showFeedback('Expense added successfully!');     // always runs
  } catch {
    showFeedback('Failed to add expense.', 'error'); // unreachable
  }
}, [showFeedback]);
```

Three layers conspire here:

1. `dispatch` is synchronous and never throws.
2. Persistence happens **inside the reducer** as an un-awaited promise (F2), so
   its rejection never propagates to this `try`.
3. `saveExpenses` / `saveSettings` already swallow their own errors
   (`catch (e) { console.error(...) }`, return `void`).

**Net effect:** if the AsyncStorage write fails — disk full, quota, corrupt store
— the user sees *"Expense added successfully!"*, the row appears in the list, and
the data is gone on next launch. The `catch` blocks in `addExpense`,
`deleteExpense`, `importExpenses`, and `updateSettings` are all dead code.

**Fix** — make `saveExpenses`/`saveSettings` propagate (`throw` instead of
swallow), move persistence out of the reducer (F2), `await` it in the action
creator, and only then show the success message.

---

### [ ] F2. Side effects inside the reducer

`context/AppContext.tsx:43, 48, 64, 68, 73`

```js
case 'ADD_EXPENSE': {
  const updatedExpenses = [action.expense, ...state.expenses];
  saveExpenses(updatedExpenses);        // <-- async side effect in a reducer
  return { ...state, expenses: updatedExpenses };
}
```

Reducers must be pure. Consequences:

- **StrictMode double-invokes reducers in development** → every add/delete/import
  issues two AsyncStorage writes.
- The write is fire-and-forget: no ordering guarantee between rapid successive
  actions, so two quick deletes can land out of order and resurrect a row.
- It is the root cause of F1 and blocks any correct error handling.

**Fix** — keep the reducer pure; persist in the action creator (or a
`useEffect` keyed on `state.expenses`) where it can be awaited and caught.

---

### [ ] F3. ✅ Date stored in UTC, read back in local → off-by-one day

`components/ExpenseForm.tsx:35`

```js
const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
```

`toISOString()` converts to **UTC** before slicing the date part. Verified in both
offset directions:

| Zone | Local time | Local day | Stored as | |
|---|---|---|---|---|
| Asia/Kolkata (+05:30) | 01:00 | 2026-09-12 | **2026-09-11** | ❌ yesterday |
| Asia/Kolkata (+05:30) | 22:00 | 2026-09-12 | 2026-09-12 | ✓ |
| America/New_York (−04:00) | 01:00 | 2026-09-12 | 2026-09-12 | ✓ |
| America/New_York (−04:00) | 22:00 | 2026-09-12 | **2026-09-13** | ❌ tomorrow |

This hits the app's stated primary audience directly: **in IST, every expense
added between midnight and 05:30 is dated to the previous day** — and the wrong
day may be in the previous *month*, moving it out of the current budget entirely.

Same bug in `utils/expenseTransfer.ts:21` (`getExportName`) and `:52–53`
(`normalizeExpense`).

**Fix** — build the default from local parts, never `toISOString()`:

```js
const d = new Date();
const local = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
```

---

### [ ] F4. ✅ Month filter buckets expenses into the wrong month

`components/screens/HomeScreen.tsx:34–41`

```js
const date = new Date(e.date);
return date.getMonth() === selectedDate.getMonth() && ...
```

`new Date("2026-09-01")` — a bare `YYYY-MM-DD` string — is parsed as **UTC
midnight** per spec, then read back with local-time getters. Verified:
`new Date("2026-09-01").toISOString()` → `2026-09-01T00:00:00.000Z`.

In any negative-offset zone `.getMonth()` returns **August** for that value, so
the 1st of every month is counted against the previous month's budget. Combined
with F3, the last day of the month leaks forward in positive-offset zones.

Affects the month total, the budget ring, the category breakdown, and all three
stat cards.

**Fix** — parse date-only strings as local (`new Date(y, m-1, d)` from split
parts), or compare on the `YYYY-MM` string prefix and avoid `Date` entirely.

---

## P1 — User-visible wrong behavior

### [ ] F5. ✅ `formatDate` renders `NaN undefined NaN`

`utils/formatDate.ts:6–9`

```js
export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};
```

No validity check. The date field in `ExpenseForm.tsx:105–117` is a **plain
free-text `TextInput`** whose value is never validated on submit (`handleSubmit`
checks description and amount only), so anything the user types reaches this
function. Verified:

| Input | Output |
|---|---|
| `"tomorrow"` | `"NaN undefined NaN"` |
| `""` | `"NaN undefined NaN"` |
| `"12/09/2026"` | `"9 Dec 2026"` — silently read as US month/day |

The last row is the nastier one: a user entering 12 September gets 9 December,
with no error, filed into the wrong month.

**Fix** — guard `Number.isNaN(d.getTime())` and return a fallback; validate the
date in `handleSubmit`; ideally replace the field with a picker (UI item **#18**).

---

### [ ] F6. ✅ Settings accepts non-numeric income and budget

`components/screens/SettingsScreen.tsx:88–91`

```js
if (!income || !budget) {
  Alert.alert('Missing fields', 'Please enter both income and budget.');
  return;
}
```

Presence is the only check — the values are stored as **strings** and re-parsed
with `parseFloat` at every use site. Verified:

| Typed | `parseFloat` | Result |
|---|---|---|
| `"2,000"` | **2** | budget silently becomes ₹2 |
| `"2 000"` | **2** | same |
| `"2000rs"` | 2000 | tolerated |
| `"1.2.3"` | 1.2 | silently truncated |
| `"abc"` | `NaN` | `NaN%` ring, `NaN` savings |
| `"-500"` | −500 | negative budget |

`keyboardType="decimal-pad"` is a hint, not a constraint — paste bypasses it
entirely, and several Android keyboards expose `,` and `-` on that layout.
A grouped number like `2,000` is a completely ordinary thing to type.

**Fix** — validate numerically on save, strip grouping separators, reject `NaN`
and negatives with an inline message.

---

### [ ] F7. ✅ `budget = 0` renders `Infinity%`

`components/SummaryCard.tsx:22`

```js
const percentage = useMemo(() => (spent / budget) * 100, [spent, budget]);
```

No zero guard. Reachable via F6, or by simply setting the budget to `0`.
`ProgressCircle` then renders `Math.round(Infinity)` → `Infinity%`.

**Fix** — guard the divisor and clamp; see also UI item **#1**.

---

### [ ] F8. ✅ Expense amount accepts negative and malformed values

`components/ExpenseForm.tsx:47–50`

```js
if (!amount || isNaN(parseFloat(amount))) { ... }
```

`isNaN` is the only gate. `-500` passes and *reduces* reported spending;
`1.2.3` silently becomes `1.2`; `2000rs` becomes `2000`. No upper bound either.

**Fix** — require a finite, positive, sanely-bounded number; surface the reason
inline rather than via toast.

---

### [ ] F9. Re-importing the same file duplicates every expense

`context/AppContext.tsx:51–66`

```js
const seenIds = new Set();
const normalizeIds = (expenses) => expenses.map((expense, index) => {
  const nextId = expense.id && !seenIds.has(expense.id) ? expense.id : `${Date.now()}-${index}`;
  seenIds.add(nextId);
  return { ...expense, id: nextId };
});
const updatedExpenses = action.mode === 'replace'
  ? normalizeIds(action.expenses)
  : normalizeIds([...action.expenses, ...state.expenses]);   // merge
```

Trace — state holds expense `A` with id `"100"`; the user imports a file
containing the same `A` with id `"100"`:

| index | record | `seenIds` check | resulting id |
|---|---|---|---|
| 0 | imported `A` (`"100"`) | not seen | keeps `"100"` |
| 1 | existing `A` (`"100"`) | **already seen** | gets `"1757…-1"` |

Both survive. The de-duplication logic makes duplicates *unique* rather than
removing them — so merge-importing a backup you already imported silently doubles
your data, and doing it twice quadruples it. There is no content-based dedupe
anywhere.

**Fix** — dedupe on a content key (`date|amount|description|category`) before
merging, and report `N added, M skipped as duplicates` in the confirmation.

---

### [ ] F10. Import rewrites dates to full ISO → two formats coexist

`utils/expenseTransfer.ts:51–53`

```js
date: Number.isNaN(new Date(candidate.date).getTime())
  ? new Date().toISOString()
  : new Date(candidate.date).toISOString(),
```

The form writes `"2026-09-12"`; import writes `"2026-09-12T00:00:00.000Z"`. Both
formats then live in the same array and are read by the same
local-time getters, so an export → import round-trip shifts dates in
negative-offset zones (F4) and the two formats sort and compare inconsistently.

**Fix** — normalize to one canonical local `YYYY-MM-DD` on both paths.

---

### [ ] F11. ✅ `Number("")` and `Number("Infinity")` pass the import gate

`utils/expenseTransfer.ts:35, 41`

```js
const amount = Number(candidate.amount);
if (... || Number.isNaN(amount)) return null;
```

`Number.isNaN` rejects only `NaN`. Verified:

| Input | `Number()` | Passes? |
|---|---|---|
| `""` | `0` | ✅ imported as a ₹0 expense |
| `"Infinity"` | `Infinity` | ✅ breaks every total |
| `"1e400"` | `Infinity` | ✅ same |
| `"-500"` | `-500` | ✅ negative expense |

The rest of this file is genuinely well built — shape validation, HTML escaping,
a versioned envelope — this one gate is the weak link.

**Fix** — `Number.isFinite(amount) && amount > 0`.

---

### [ ] F12. ID collision on rapid add → delete removes both rows

`context/AppContext.tsx:142` — `id: Date.now().toString()`

Two expenses created in the same millisecond share an id. `deleteExpense`
filters by id (`:47`), so deleting one **deletes both**. Reachable through the
import path and through automated/fast entry.

Related: `expenseTransfer.ts:47` uses the same `Date.now().toString()` as the
fallback id for *every* invalid-id row in a single import loop, so they all come
out identical. `normalizeIds` happens to clean that up downstream, but the
guarantee is accidental.

**Fix** — a collision-free id (counter + timestamp, or `crypto.randomUUID()`).

---

### [ ] F13. ErrorBoundary "Try Again" can loop forever

`components/ErrorBoundary.tsx:33–35`

```js
private handleReset = () => { this.setState({ hasError: false, error: null }); };
```

Reset re-renders the same children with the same inputs. If the error is
deterministic — corrupt data in AsyncStorage (F20), a malformed imported record —
it throws again immediately and the user is stuck in a loop with no escape.
The error itself is stored in state but never shown.

**Fix** — offer a real recovery action ("Reset app data" clearing the two
AsyncStorage keys), and surface the error text behind a disclosure so a user can
report it.

---

## P2 — Rough edges

### [ ] F14. Swipe bypasses the unsaved-settings guard

The guard lives only in `BottomNavBar.handlePress`
(`components/BottomNavBar.tsx:69–73`), but `App.tsx` sets `swipeEnabled: true`.
Tapping a tab prompts to save; swiping to the same tab does not. The edits are
not lost (the screen stays mounted) but they sit pending and unannounced.

**Fix** — hook the navigator's `beforeRemove` / state listener so both gestures
go through one guard.

---

### [ ] F15. `MonthPicker` "today" is computed once at mount

`components/MonthPicker.tsx:34` — `useMemo(() => new Date(), [])`

`isCurrentMonth` (which drives the highlight and the jump-to-today target) is
stale if the app stays open across midnight or a month rollover.

---

### [ ] F16. Month navigation has no bounds

`handleNext` increments forever — you can wander to December 2099 through empty
months with no indication you have left useful territory.

**Fix** — clamp forward navigation at the current month, or disable `▶` there.

---

### [ ] F17. ✅ Number formatting differs within one screen

`SummaryCard` uses `toLocaleString()`; the Home stat cards use raw `.toFixed(0)`.
Verified for `123456`:

| Location | Renders |
|---|---|
| `SummaryCard` spent/budget | `1,23,456` |
| `HomeScreen` avg / savings | `123456` |

Two formats for the same currency, stacked vertically on one screen.
`RecentExpensesScreen` adds a third style (`toFixed(2)`).

**Fix** — one shared `formatCurrency(value, currency)` helper used everywhere.

---

### [ ] F18. Expense dated outside the viewed month silently vanishes

`ExpenseForm` lets you enter any date; `HomeScreen` shows only `selectedDate`'s
month. Adding a back-dated expense while viewing September shows *"Expense added
successfully!"* and then nothing appears — the row is real but filtered out.

**Fix** — after adding, switch the view to that expense's month, or note
*"Added to August"* in the confirmation.

---

### [ ] F19. Android JSON picker may gray out valid files

`utils/expenseTransfer.ts:175` — `type: 'application/json'`

Android providers frequently report `.json` as `text/plain` or
`application/octet-stream`; those files become unselectable.

**Fix** — widen to `['application/json', 'text/plain', '*/*']` and rely on the
existing content validation in `readExpensesFromJson`, which is already strict.

---

### [ ] F20. `loadExpenses` does no shape validation

`utils/storage.ts:40–48` — `JSON.parse(jsonValue)` is returned directly as
`Expense[]` with no runtime check. A corrupt or externally-modified store yields
objects missing `amount`, and the first `.toFixed(2)` throws into the
ErrorBoundary → F13 loop with no way out.

`loadSettings` (`:59–74`) is notably better — it spreads over `defaultSettings`
and backfills `categories`. Apply the same rigor here.

**Fix** — reuse the existing `normalizeExpense` from `expenseTransfer.ts` on
load, dropping invalid rows rather than trusting the store.

---

## Capability gaps

### [ ] U1. `GAP` No expense editing — the biggest usability hole

Expenses can only be added and deleted; tapping a row does nothing. Correcting a
typo'd amount or a miscategorized entry means deleting and re-entering it from
scratch, which (given F12) is also the path most likely to hit an id collision.
For an expense tracker this is the single highest-value addition.

### [ ] U2. `GAP` No delete confirmation and no undo

One tap, instant, irreversible, on both list screens. The global `Snackbar` in
`App.tsx` is the natural host for an undo action. *(Also tracked as UI item #23.)*

### [ ] U3. `GAP` No date or month filter on the Expenses screen

The filter sheet offers sort, price range, and category — but not a date range,
so there is no way to ask "what did I spend in July". The Home month picker does
not affect this screen.

### [ ] U4. `GAP` Export scope is ambiguous

Export writes the **currently filtered view**, not the full dataset. That is a
defensible choice and the onboarding mentions it, but with a filter active the
user gets a partial "backup" from a button labeled `JSON`.

**Fix** — label it *"Export visible (N)"*, or offer both scopes.

### [ ] U5. `GAP` Money is modeled as strings

`Settings.income` and `Settings.budget` are `string`, re-parsed with `parseFloat`
at every use site — the direct cause of F6 and F7. Amounts are also floats, so
currency arithmetic accumulates binary rounding error over many entries.

**Fix** — store numbers (ideally minor units / paise as integers) and format at
the edge.

### [ ] U6. `GAP` Deleting a category orphans its expenses

`handleRemoveCategory` drops the name from `settings.categories`, but existing
expenses keep the old string. Those rows can no longer be filtered by category
(the chips come from settings) and are no longer offered in the add form —
they become unreachable through the UI. There is also no rename.

**Fix** — on delete, offer to reassign affected expenses; add rename.

### [ ] U7. `GAP` No way to clear all data

No reset control anywhere. Needed for F13 recovery and for handing the device on.

### [ ] U8. `GAP` Search is unthrottled

`RecentExpensesScreen` recomputes filter **and re-sorts the entire array** on
every keystroke. Fine at a few hundred rows, degrading beyond that.

**Fix** — debounce the query ~200ms.

---

## Suggested sequence

| Phase | Items | Rationale |
|---|---|---|
| **A — Stop the bleeding** | F2 → F1 | F2 is the root cause; fixing it unblocks honest error handling everywhere. |
| **B — Dates** | F3, F4, F5, F10 | One coherent change: a `toLocalDateString` / `parseLocalDate` pair used on every path. |
| **C — Input validation** | F6, F7, F8, F11, F20 | Shared numeric + shape validators. Closes most `NaN`/`Infinity` displays. |
| **D — Import correctness** | F9, F12, F19 | Content dedupe, collision-free ids, wider picker. |
| **E — Recovery** | F13, U7 | "Reset data" makes the error screen escapable. |
| **F — Polish** | F14–F18, U8 | Independent, small, safe. |
| **G — Capabilities** | U1, U2, U3, U4, U5, U6 | Genuine feature work — needs a decision, not just a fix. |

Phases A–F are corrections to existing behavior. Phase G adds capability and
should be scoped separately.

---

## Appendix A — Verification output

Reproduced against the real code paths on 2026-09-12. `tsc --noEmit` and
`eslint` both pass clean, so none of this is statically detectable.

```
1. formatDate on free-text garbage (the date field is a plain TextInput)
   formatDate("tomorrow")   => "NaN undefined NaN"
   formatDate("")           => "NaN undefined NaN"
   formatDate("12/09/2026") => "9 Dec 2026"      <- read as US month/day

2. parseFloat on plausible Settings input
   parseFloat("2,000")  => 2          <- budget silently becomes 2
   parseFloat("2 000")  => 2
   parseFloat("abc")    => NaN
   parseFloat("1.2.3")  => 1.2
   parseFloat("-500")   => -500
   parseFloat("2000rs") => 2000

3. Number()/isNaN gate in normalizeExpense (expenseTransfer.ts:35,41)
   Number("")         => 0        | passes gate? true
   Number("Infinity") => Infinity | passes gate? true
   Number("1e400")    => Infinity | passes gate? true
   Number("-500")     => -500     | passes gate? true

4. toISOString() date-shift (ExpenseForm default date), explicit offsets
   +05:30 01:00 | local day 2026-09-12 -> stored 2026-09-11   MISMATCH
   +05:30 22:00 | local day 2026-09-12 -> stored 2026-09-12
   -04:00 01:00 | local day 2026-09-12 -> stored 2026-09-12
   -04:00 22:00 | local day 2026-09-12 -> stored 2026-09-13   MISMATCH

   Confirmed again on this machine's own zone (IST):
   local 01:00 -> local day 2026-09-12 | stored as 2026-09-11  MISMATCH

5. Bare YYYY-MM-DD parses as UTC midnight
   new Date("2026-09-01").toISOString() = 2026-09-01T00:00:00.000Z
   -> .getMonth() returns August in any negative-offset zone

6. Number formatting inconsistency on HomeScreen (value 123456)
   SummaryCard  toLocaleString() => 1,23,456
   statsRow     toFixed(0)       => 123456
```

---

## Progress

| Severity | Total | Done |
|---|---|---|
| P0 — data integrity | 4 | 0 |
| P1 — wrong behavior | 9 | 0 |
| P2 — rough edges | 7 | 0 |
| GAP — capability | 8 | 0 |
| **Total** | **28** | **0** |

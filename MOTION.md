# Motion

Motion in this app exists to keep things continuous — so a number that changed
looks like it moved, and a row that went away looks like it left. It is not
decoration. **No animation may sit between a tap and its response.**

## Tokens

Everything lives in [`constants/motion.ts`](constants/motion.ts). Nothing
anywhere else may inline a duration or a curve.

| Durations | | Easing | | Springs | |
|---|---|---|---|---|---|
| `instant` | 100ms | `standard` | default; entering and moving | `press` | taps, toggles |
| `fast` | 160ms | `decelerate` | things arriving | `gentle` | sheets, cards |
| `base` | 220ms | `accelerate` | things leaving | `bouncy` | success moments |
| `slow` | 320ms | | | | |
| `slowest` | 420ms | | | | |

`STAGGER` is 40ms between siblings, capped at `STAGGER_CAP` (240ms) by
`staggerDelay(index)` — the last row of a long list never waits longer than
that to appear.

## Spring or timing?

- **Spring** when a finger is, or just was, involved: presses, toggles, the tab
  icon kick. A spring has no fixed end time, which is right for something that
  should feel physical.
- **Timing** for everything else: entrances, exits, bars filling, numbers
  counting, cross-fades. Use `timing(duration, easing)`, never a raw object.

## Primitives

| Component | Use for |
|---|---|
| [`<PressableScale>`](components/PressableScale.tsx) | Every tappable thing. Replaces `TouchableOpacity`. |
| [`<AnimatedBar>`](components/AnimatedBar.tsx) | A horizontal progress fill that travels to its value. |
| [`<AnimatedColumn>`](components/charts/AnimatedColumn.tsx) | A chart bar that grows out of the baseline. |
| [`<AnimatedNumber>`](components/AnimatedNumber.tsx) | A figure that counts to its new value on the UI thread. |
| [`<MonthTransition>`](components/MonthTransition.tsx) | Content that cross-fades when the month steps. |

And the list helpers in `motion.ts`: `listEntering(index)`, `rowEntering()`,
`rowExiting()`, `contentExiting()`, `listLayout()`.

## Rules

**Animate transform and opacity only.** The one exception is progress-bar
width, in `<AnimatedBar>`, because `scaleX` squashes a pill's border radius.
Chart bars do use `scaleY` (`<AnimatedColumn>`) — they are square-ended, and
scaling keeps the value label above them from shifting.

**Everything runs in a worklet.** No `setState` in an animation loop. If you
find yourself reaching for `setInterval` or `requestAnimationFrame` to drive a
visual, the answer is a shared value.

**Entrances run once per mount**, not on every re-focus of a tab. The tab
navigator keeps screens mounted, so this is free — don't add a re-entry
animation keyed on focus.

**Never animate the same property from two places.** The nav pill's position is
driven by the pager's `position` node; nothing else may move it.

**No idle motion.** No floating, pulsing or shimmering that isn't a loading
state or a response to something the user did.

## Accessibility

`useReduceMotion()` in [`hooks/useMotion.ts`](hooks/useMotion.ts) is the only
place that reads `AccessibilityInfo`. Components ask it; they never ask the OS.
When it is on: no translate, no scale, no stagger — a `fast` opacity change or
an instant cut instead.

Reanimated's own layout animations take `.reduceMotion(ReduceMotion.System)`,
which the helpers in `motion.ts` already apply, so a component using those gets
it for free.

Motion is never the only signal for a state change. Every toast has text, every
bar has a number beside it, every deleted row has an Undo.

## Adding a new animation

1. Is there a primitive for it? Use that.
2. Is a finger involved? `withSpring(…, SPRING.press | gentle | bouncy)`.
   Otherwise `withTiming(…, timing(DURATION.x, EASING.y))`.
3. Are you animating transform or opacity? If not, justify it here.
4. Does it honour reduce-motion? Either via `useReduceMotion()` or a
   `.reduceMotion(ReduceMotion.System)` layout animation.
5. Does anything else animate the same property on the same view? Stop.

## Deliberately not done

- **Tab cross-fade.** Tabs are a `material-top-tabs` pager and you can swipe
  between them; a cross-fade has no position to track, so it would mean giving
  up the swipe. The nav pill follows the gesture instead.
- **Donut sweep-in.** The pie chart comes from `react-native-gifted-charts`,
  which does not expose `strokeDashoffset`. Sweeping it in means hand-building
  the ring on `react-native-svg` first.
- **Gesture-driven sheets.** The ten modals in the app use React Native's
  `Modal` and its own slide/fade. Drag-to-dismiss means replacing all of them.
- **Staggered entrances in the expense list.** Rows there mount as you scroll,
  so a stagger would have them arriving late and moving against the scroll.
  They fade, and nothing more.
- **Counting money figures.** `<AnimatedNumber>` renders a `TextInput`, which
  has no `adjustsFontSizeToFit`; every money figure in the app relies on that
  to survive a narrow column. Only the transaction count, a plain integer,
  counts today.
- **Haptics.** Would need `expo-haptics`, which is a native dependency and so a
  rebuild.
- **Skeletons.** There is no content-loading state in the app to put one in —
  the data is local and synchronous.

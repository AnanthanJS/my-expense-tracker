import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutLeft,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';
import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

/**
 * Motion tokens — the single source of truth for every animation in the app.
 *
 * Nothing outside this file may inline a raw duration or curve. If a component
 * needs a speed that isn't here, the right fix is to argue for a new token,
 * not to hard-code 180ms in a stylesheet.
 *
 * Rule of thumb: gesture-driven or interactive motion uses a spring; a
 * non-interactive enter/exit or value change uses a timing.
 */

// ---------------------------------------------------------------------------
// Durations
// ---------------------------------------------------------------------------

export const DURATION = {
  /** Effectively a cut. State flips that must not read as motion. */
  instant: 100,
  /** Press feedback, tiny cross-fades. */
  fast: 160,
  /** The default. Most enter/exit and value changes. */
  base: 220,
  /** Bars filling, numbers counting — motion the eye is meant to follow. */
  slow: 320,
  /** The ceiling. Nothing blocking the user's next action may exceed this. */
  slowest: 420,
} as const;

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

export const EASING = {
  /** Default. Entering and moving. */
  standard: Easing.bezier(0.2, 0, 0, 1),
  /** Things arriving — fast in, soft landing. */
  decelerate: Easing.out(Easing.cubic),
  /** Things leaving — the exit should get out of the way. */
  accelerate: Easing.bezier(0.4, 0, 1, 1),
} as const;

// ---------------------------------------------------------------------------
// Springs
// ---------------------------------------------------------------------------

export const SPRING = {
  /** Taps and toggles. Stiff enough that a press feels instant. */
  press: { damping: 20, stiffness: 400, mass: 0.6 } satisfies WithSpringConfig,
  /** Sheets and cards. Settles without wobbling. */
  gentle: { damping: 18, stiffness: 220, mass: 1 } satisfies WithSpringConfig,
  /** Success moments only — a little overshoot reads as celebration. */
  bouncy: { damping: 12, stiffness: 260, mass: 0.9 } satisfies WithSpringConfig,
} as const;

// ---------------------------------------------------------------------------
// Stagger
// ---------------------------------------------------------------------------

/** Delay between sibling list items. */
export const STAGGER = 40;

/** No item may wait longer than this to appear, however long the list is. */
export const STAGGER_CAP = 240;

/**
 * Delay for the nth sibling in a list, capped so a long list doesn't leave its
 * last rows crawling in after the user has already started scrolling.
 */
export function staggerDelay(index: number): number {
  return Math.min(index * STAGGER, STAGGER_CAP);
}

// ---------------------------------------------------------------------------
// Ready-made configs
// ---------------------------------------------------------------------------

/**
 * `withTiming` config from a duration + easing pair. Reduce-motion is handled
 * by `useMotion`, not here, so these stay pure — System means "respect the OS"
 * for any caller that forgets, which is the safe default either way.
 */
export function timing(
  duration: number = DURATION.base,
  easing: WithTimingConfig['easing'] = EASING.standard,
): WithTimingConfig {
  return { duration, easing, reduceMotion: ReduceMotion.System };
}

// ---------------------------------------------------------------------------
// List animations
// ---------------------------------------------------------------------------

/**
 * Entrance for a row in a list that mounts all at once — a Home section, the
 * category breakdown, the bills strip.
 *
 * Deliberately NOT used on the virtualised expense list: rows there mount as
 * you scroll, and a staggered slide would have them arriving late and moving
 * against the scroll, which reads as jank rather than polish.
 */
export function listEntering(index = 0) {
  return FadeInDown.duration(DURATION.base)
    .delay(staggerDelay(index))
    .reduceMotion(ReduceMotion.System);
}

/** Entrance for a row that mounts mid-scroll — fade only, no travel, no wait. */
export function rowEntering() {
  return FadeIn.duration(DURATION.base).reduceMotion(ReduceMotion.System);
}

/**
 * Exit for a deleted row: it leaves to the side while the rows below close the
 * gap, so a delete looks like one movement rather than a row blinking out and
 * the list snapping.
 */
export function rowExiting() {
  return FadeOutLeft.duration(DURATION.fast).reduceMotion(ReduceMotion.System);
}

/** Plain exit for content that is replaced rather than removed. */
export function contentExiting() {
  return FadeOut.duration(DURATION.fast).reduceMotion(ReduceMotion.System);
}

/**
 * A block of fields revealed by a toggle: fades in and rises the last 8px.
 *
 * The travel is small on purpose — this is a disclosure, not an arrival, and
 * anything further reads as the form rebuilding itself.
 */
export function revealEntering() {
  return FadeInDown.duration(DURATION.base)
    .withInitialValues({ transform: [{ translateY: REVEAL_TRAVEL }] })
    .reduceMotion(ReduceMotion.System);
}

/** The same block on its way out. */
export function revealExiting() {
  return FadeOut.duration(DURATION.fast).reduceMotion(ReduceMotion.System);
}

/** How far a revealed block travels. */
export const REVEAL_TRAVEL = 8;

/** Reflow for siblings when one is inserted or removed. */
export function listLayout() {
  return LinearTransition.duration(DURATION.base).reduceMotion(ReduceMotion.System);
}

// ---------------------------------------------------------------------------
// Toast (pattern 9 — behaviour frozen, values live here now)
// ---------------------------------------------------------------------------

export const TOAST_MOTION: {
  enterFrom: number;
  exitTo: number;
  iconFrom: number;
  iconDelay: number;
} = {
  /** How far above its resting place the card starts. */
  enterFrom: -16,
  /** How far it lifts on the way out — shorter, so the exit reads as faster. */
  exitTo: -10,
  /** The tick/trash mark starts small and pops in after the card has settled. */
  iconFrom: 0.55,
  iconDelay: DURATION.fast,
};

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the OS has "Remove animations" / "Reduce motion" turned on.
 *
 * Read once at startup and kept in sync with the system setting. Components
 * must never call AccessibilityInfo themselves — everything goes through this
 * hook so the answer is consistent across the app and there is one place to
 * change if the policy changes.
 *
 * When reduce-motion is on, the contract for every animated component is:
 * no translate, no scale, no stagger, no sweeps. A `fast` opacity change or an
 * instant cut instead. Motion is never the only signal for a state change, so
 * nothing is lost by removing it.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      // A device that can't answer is treated as "animations are fine" —
      // the same as the default state, so nothing to handle beyond not crashing.
      .catch(() => undefined);

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => setReduceMotion(enabled),
    );

    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}

/**
 * Motion helpers derived from the reduce-motion setting.
 *
 * `enabled` is the flag most components want: gate the transform half of an
 * animation on it and leave the opacity half alone.
 */
export function useMotion() {
  const reduceMotion = useReduceMotion();
  return {
    /** False when the user has asked for no motion. */
    enabled: !reduceMotion,
    reduceMotion,
    /** Stagger delay, collapsed to 0 when motion is off. */
    stagger: (delay: number) => (reduceMotion ? 0 : delay),
  };
}

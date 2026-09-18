import React, { useEffect } from 'react';
import { TextInput } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DURATION, EASING, timing } from '../constants/motion';
import { useReduceMotion } from '../hooks/useMotion';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

/**
 * The device locale's number shape, probed once.
 *
 * `toLocaleString` cannot run inside a worklet, so the separators and grouping
 * are worked out on the JS side and handed to the UI thread as plain data.
 * Grouping is described the way CLDR does — a rightmost group size and a
 * repeating one after it — which covers both 1,234,567 and the Indian
 * 12,34,567 exactly, so a counting number never disagrees with the static one
 * it settles into.
 */
const LOCALE = (() => {
  const fallback = { group: ',', decimal: '.', primary: 3, secondary: 3 };
  try {
    const probe = (1234567.89).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const decimalIndex = probe.search(/[^0-9]+(?=[0-9]*$)/);
    if (decimalIndex < 0) return fallback;

    const decimal = probe[decimalIndex];
    const integer = probe.slice(0, decimalIndex);
    const groupMatch = integer.match(/[^0-9]/);
    if (!groupMatch) return { ...fallback, decimal, group: '' };

    const group = groupMatch[0];
    const parts = integer.split(group);
    return {
      group,
      decimal,
      primary: parts[parts.length - 1]?.length ?? 3,
      secondary: parts.length > 2 ? parts[parts.length - 2].length : 3,
    };
  } catch {
    return fallback;
  }
})();

/** Group an integer string right-to-left using the probed locale pattern. */
function groupDigits(digits: string): string {
  'worklet';
  if (!LOCALE.group) return digits;

  let rest = digits;
  const groups: string[] = [];
  let size = LOCALE.primary;
  while (rest.length > size) {
    groups.unshift(rest.slice(-size));
    rest = rest.slice(0, -size);
    size = LOCALE.secondary;
  }
  groups.unshift(rest);
  return groups.join(LOCALE.group);
}

function formatWorklet(value: number, decimals: number, prefix: string, negative: boolean): string {
  'worklet';
  const safe = Number.isFinite(value) ? Math.abs(value) : 0;
  const fixed = safe.toFixed(decimals);
  const [whole, fraction] = fixed.split('.');
  const body = fraction ? `${groupDigits(whole)}${LOCALE.decimal}${fraction}` : groupDigits(whole);
  return `${negative ? '-' : ''}${prefix}${body}`;
}

interface AnimatedNumberProps {
  value: number;
  /** Currency symbol, or '' for a plain count. */
  prefix?: string;
  decimals?: 0 | 2;
  negative?: boolean;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

/**
 * A money or count value that travels to its new figure instead of cutting.
 *
 * The text is written straight to a read-only TextInput from the UI thread, so
 * counting costs no JS renders at all — driving it from state would re-render
 * the whole card sixty times a second for a cosmetic effect.
 *
 * Deliberately not used for anything the user is typing, and not for the hero
 * total, which relies on `adjustsFontSizeToFit` that TextInput has no
 * equivalent for.
 */
export default function AnimatedNumber({
  value,
  prefix = '',
  decimals = 0,
  negative = false,
  style,
  accessibilityLabel,
}: AnimatedNumberProps) {
  const reduceMotion = useReduceMotion();
  const animated = useSharedValue(value);
  const settled = formatWorklet(value, decimals, prefix, negative);

  useEffect(() => {
    if (reduceMotion) {
      animated.value = value;
      return;
    }
    animated.value = withTiming(value, timing(DURATION.slow, EASING.decelerate));
  }, [value, reduceMotion, animated]);

  const animatedProps = useAnimatedProps(() => ({
    text: formatWorklet(animated.value, decimals, prefix, negative),
    // Keeps the native value in step for anything that reads it back.
    defaultValue: formatWorklet(animated.value, decimals, prefix, negative),
  }));

  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      // The value is announced from the settled figure, never the mid-count
      // one, so a screen reader is not read a blur of numbers.
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}
      // Uncontrolled on purpose: a `value` prop would be re-applied on every
      // React render and fight the UI-thread writes for the same field.
      defaultValue={settled}
      animatedProps={animatedProps}
      style={[{ padding: 0, includeFontPadding: false, textAlignVertical: 'center' }, style]}
    />
  );
}

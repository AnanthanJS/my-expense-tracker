import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { DURATION, EASING, timing } from '../constants/motion';
import { useReduceMotion } from '../hooks/useMotion';

interface AnimatedBarProps {
  /** Fill width as a percentage of the track, 0–100. */
  percent: number;
  color: string;
  /** Held back so a chained second segment reads as a separate event. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The filled portion of a progress track.
 *
 * Grows from zero on first mount and travels from the old value to the new one
 * when the month changes or an expense lands, so a budget bar reads as a
 * quantity that moved rather than a bar that was swapped out.
 *
 * Width is the one property the app animates outside transform/opacity, and it
 * is deliberate: scaleX on a pill-shaped fill squashes its border radius, and
 * these bars are a handful of 8–12px rows, so the layout cost is negligible
 * next to the distortion.
 */
export default function AnimatedBar({ percent, color, delay = 0, style }: AnimatedBarProps) {
  const reduceMotion = useReduceMotion();
  const width = useSharedValue(0);
  const target = Math.max(0, Math.min(100, percent));

  useEffect(() => {
    if (reduceMotion) {
      width.value = target;
      return;
    }
    const animation = withTiming(target, timing(DURATION.slow, EASING.standard));
    width.value = delay > 0 ? withDelay(delay, animation) : animation;
  }, [target, delay, reduceMotion, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return <Animated.View style={[style, { backgroundColor: color }, animatedStyle]} />;
}

import React, { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DURATION, EASING, timing } from '../constants/motion';
import { useReduceMotion } from '../hooks/useMotion';

/** How far the content travels, in the direction the user stepped. */
const TRAVEL = 12;

interface MonthTransitionProps {
  /** The month on show. Any value that sorts chronologically works. */
  monthKey: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cross-fades a screen's content when the month changes.
 *
 * The content moves in the direction of travel — step back a month and it
 * arrives from the left — so the stepper reads as moving along a timeline
 * rather than swapping one set of numbers for another.
 *
 * Nothing is remounted: the children have already re-rendered with the new
 * month's data by the time this runs, so scroll position and every child's own
 * state survive the change.
 */
export default function MonthTransition({ monthKey, children, style }: MonthTransitionProps) {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const previous = useRef(monthKey);

  useEffect(() => {
    if (previous.current === monthKey) return;
    const backwards = monthKey < previous.current;
    previous.current = monthKey;

    if (reduceMotion) return;

    opacity.value = 0;
    translateX.value = backwards ? -TRAVEL : TRAVEL;
    opacity.value = withTiming(1, timing(DURATION.base));
    translateX.value = withTiming(0, timing(DURATION.base, EASING.decelerate));
  }, [monthKey, reduceMotion, opacity, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

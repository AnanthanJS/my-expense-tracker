import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { DURATION, EASING, timing } from '../../constants/motion';
import { useReduceMotion } from '../../hooks/useMotion';

interface AnimatedColumnProps {
  /** Staggered so the bars read left to right, like the axis under them. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A chart bar that grows out of the baseline on mount.
 *
 * Unlike the progress bars, this animates `scaleY` and not a dimension: the
 * bar keeps its real layout height throughout, so the value label above it and
 * the reference line behind it never shift while the bar is growing.
 */
export default function AnimatedColumn({ delay = 0, style }: AnimatedColumnProps) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(
      delay,
      withTiming(1, timing(DURATION.slow, EASING.decelerate)),
    );
  }, [delay, reduceMotion, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: progress.value }],
  }));

  return <Animated.View style={[style, { transformOrigin: 'bottom' }, animatedStyle]} />;
}

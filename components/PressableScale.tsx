import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { AnimatedProps } from 'react-native-reanimated';
import { SPRING } from '../constants/motion';
import { useReduceMotion } from '../hooks/useMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type EntranceProps = Pick<AnimatedProps<PressableProps>, 'entering' | 'exiting' | 'layout'>;

interface PressableScaleProps extends Omit<PressableProps, 'style'>, EntranceProps {
  style?: StyleProp<ViewStyle>;
  /** How far to shrink on press. Smaller targets want less travel. */
  scaleTo?: number;
  children?: React.ReactNode;
}

/**
 * A Pressable that dips slightly on touch instead of fading.
 *
 * Replaces TouchableOpacity everywhere. The opacity fade TouchableOpacity does
 * reads as "this control is disabling itself"; a scale reads as the surface
 * being pushed, which is what actually happened. The spring is stiff so the
 * dip lands within a frame or two of the finger — no animation may sit between
 * a tap and its response.
 *
 * Honours reduce-motion by simply not scaling: the press still works, and the
 * ripple/native feedback still fires, so no information is lost.
 */
export default function PressableScale({
  style,
  scaleTo = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();

  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (event) => {
      // scaleTo of 1 is the deliberate opt-out: backdrops and tap-swallowers
      // need the press handler without any visible response.
      if (!reduceMotion && !disabled && scaleTo !== 1) {
        scale.value = withSpring(scaleTo, SPRING.press);
      }
      onPressIn?.(event);
    },
    [reduceMotion, disabled, scale, scaleTo, onPressIn],
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (event) => {
      scale.value = withSpring(1, SPRING.press);
      onPressOut?.(event);
    },
    [scale, onPressOut],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

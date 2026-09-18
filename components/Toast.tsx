import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, StyleSheet, Platform, AccessibilityInfo } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { IconCheck, IconAlertTriangle, IconTrash, IconX } from '@tabler/icons-react-native';
import type { IconProps } from '@tabler/icons-react-native';
import { FONTS } from '../constants/theme';
import { DURATION, EASING, SPRING, TOAST_MOTION, timing } from '../constants/motion';
import { useAppTheme } from '../hooks/useAppTheme';
import { useReduceMotion } from '../hooks/useMotion';
import PressableScale from './PressableScale';

export type ToastVariant = 'success' | 'warning' | 'destructive' | 'error';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastOptions {
  variant: ToastVariant;
  title: string;
  meta?: string;
  /** Rendered on any variant — Undo on a success, Retry on an error. */
  action?: ToastAction;
  /** Overrides the default hold. Ignored for errors, which never auto-dismiss. */
  duration?: number;
}

interface ToastProps extends ToastOptions {
  /** Flipping this to false plays the exit animation. */
  visible: boolean;
  /** Called once the exit animation has finished, so the host can unmount. */
  onHidden: () => void;
  onDismiss: () => void;
}

/**
 * Palette is specified per-variant rather than pulled from the theme tokens:
 * the toast sits above every screen on its own surface, so it needs to read
 * the same regardless of what is behind it. Values come from the design spec.
 */
const PALETTE = {
  light: {
    card: '#FFFFFF',
    border: '#E3E8EF',
    errorBorder: '#F3D4D4',
    title: '#111827',
    meta: '#6B7280',
    shadow: '#111827',
    icon: {
      success: '#16A34A',
      warning: '#D97706',
      // Slightly softer than the error red: a deletion is a negative outcome
      // but not a failure, and it is the tone that most often carries an Undo.
      destructive: '#E11D48',
      error: '#DC2626',
    },
    action: {
      success: { bg: '#DCFCE7', text: '#15803D' },
      warning: { bg: '#FEF3C7', text: '#B45309' },
      destructive: { bg: '#FFE4E6', text: '#BE123C' },
      error: { bg: '#FEE2E2', text: '#C81E1E' },
    },
  },
  dark: {
    card: '#1B1F27',
    border: '#2C323D',
    errorBorder: '#4A2B2B',
    title: '#F4F6F9',
    meta: '#9AA3AF',
    shadow: '#000000',
    icon: {
      success: '#4ADE80',
      warning: '#F0B429',
      destructive: '#FB7185',
      error: '#F87171',
    },
    action: {
      success: { bg: '#14351F', text: '#86EFAC' },
      warning: { bg: '#3A2E14', text: '#FCD34D' },
      destructive: { bg: '#3B1D24', text: '#FDA4AF' },
      error: { bg: '#3A1F1F', text: '#F5A3A3' },
    },
  },
};

const ICONS: Record<ToastVariant, React.FC<IconProps>> = {
  success: IconCheck,
  warning: IconAlertTriangle,
  destructive: IconTrash,
  error: IconX,
};

/** Tones that get the tinted border rather than the neutral one. */
const TINTED_BORDER: ToastVariant[] = ['destructive', 'error'];

const Toast: React.FC<ToastProps> = ({
  variant,
  title,
  meta,
  action,
  visible,
  onHidden,
  onDismiss,
}) => {
  const { isDark } = useAppTheme();
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  // Only opacity and transform are animated, so all of this stays on the UI
  // thread. Animating height/top/shadow would drag it back onto JS.
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(TOAST_MOTION.enterFrom);
  const iconScale = useSharedValue(TOAST_MOTION.iconFrom);

  const reduceMotion = useReduceMotion();
  const hiddenCalled = useRef(false);

  const finish = useCallback(() => {
    if (hiddenCalled.current) return;
    hiddenCalled.current = true;
    onHidden();
  }, [onHidden]);

  // Announce on show. Android gets this from accessibilityLiveRegion on the
  // card; iOS has no equivalent, so it needs the explicit announcement.
  useEffect(() => {
    if (visible && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(meta ? `${title}. ${meta}` : title);
    }
  }, [visible, title, meta]);

  useEffect(() => {
    if (visible) {
      hiddenCalled.current = false;

      if (reduceMotion) {
        // No travel at all — motion is the thing being reduced, so the fade is
        // the whole animation rather than a shortened version of it.
        translateY.value = 0;
        iconScale.value = 1;
        opacity.value = withTiming(1, timing(DURATION.fast));
        return;
      }

      translateY.value = TOAST_MOTION.enterFrom;
      iconScale.value = TOAST_MOTION.iconFrom;

      translateY.value = withTiming(0, timing(DURATION.slow, EASING.decelerate));
      opacity.value = withTiming(1, timing(DURATION.base));
      // Held back so the mark lands just after the card has settled, and given
      // the bouncy spring because it is the one celebratory beat in the app.
      iconScale.value = withDelay(TOAST_MOTION.iconDelay, withSpring(1, SPRING.bouncy));
      return;
    }

    if (reduceMotion) {
      opacity.value = withTiming(0, timing(DURATION.fast), (done) => {
        if (done) runOnJS(finish)();
      });
      return;
    }

    translateY.value = withTiming(TOAST_MOTION.exitTo, timing(DURATION.base, EASING.accelerate));
    opacity.value = withTiming(0, timing(DURATION.base, EASING.accelerate), (done) => {
      if (done) runOnJS(finish)();
    });
  }, [visible, reduceMotion, opacity, translateY, iconScale, finish]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const Icon = ICONS[variant];
  const iconColor = palette.icon[variant];
  const tintedBorder = TINTED_BORDER.includes(variant);

  const a11yLabel = useMemo(() => (meta ? `${title}. ${meta}` : title), [title, meta]);

  return (
    <Animated.View style={cardStyle}>
      <PressableScale
        onPress={onDismiss}
        style={[
          styles.card,
          {
            backgroundColor: palette.card,
            borderColor: tintedBorder ? palette.errorBorder : palette.border,
            shadowColor: palette.shadow,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint="Tap to dismiss"
        accessibilityLiveRegion="polite"
      >
        <Animated.View style={iconStyle}>
          <Icon size={20} color={iconColor} strokeWidth={2.8} />
        </Animated.View>

        <Text style={[styles.title, { color: palette.title }]} numberOfLines={1}>
          {title}
        </Text>

        {meta && (
          <Text style={[styles.meta, { color: palette.meta }]} numberOfLines={1}>
            {meta}
          </Text>
        )}

        {action && (
          <PressableScale
            style={[styles.action, { backgroundColor: palette.action[variant].bg }]}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text style={[styles.actionLabel, { color: palette.action[variant].text }]} numberOfLines={1}>
              {action.label}
            </Text>
          </PressableScale>
        )}
      </PressableScale>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minHeight: 52,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.12,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  title: {
    // Spec asks for DM Sans; the app moved to Inter, so this is the same
    // weight and size in the family the rest of the UI now uses.
    fontFamily: FONTS.text.bold,
    fontSize: 15,
    flex: 1,
  },
  meta: {
    fontFamily: FONTS.text.medium,
    fontSize: 14,
    flexShrink: 0,
  },
  action: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionLabel: {
    fontFamily: FONTS.text.bold,
    fontSize: 13,
  },
});

export default React.memo(Toast);

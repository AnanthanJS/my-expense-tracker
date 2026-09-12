import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../constants/theme';

const PILL_HEIGHT = 72; // pill paddingVertical 8*2 + icon 22 + label 14 + gap 4 ≈ 68, round up

/**
 * Returns the minimum bottom clearance needed so scrollable content is not
 * hidden under the floating nav pill.
 *
 * Replaces five hardcoded height: 100 / paddingBottom: 120 literals. (#4)
 */
export function useNavbarHeight(): number {
  const insets = useSafeAreaInsets();
  const bottomOffset = Platform.select({
    ios: Math.max(insets.bottom, SPACING.lg),
    android: insets.bottom > 0 ? insets.bottom + SPACING.sm : SPACING.lg,
    default: SPACING.lg,
  }) ?? SPACING.lg;

  return PILL_HEIGHT + bottomOffset + SPACING.sm;
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../constants/theme';

/** Bar content: icon 22 + gap 4 + label 13, plus SPACING.sm above and below. */
const BAR_CONTENT_HEIGHT = 56;

/**
 * Bottom clearance so scrollable content is not hidden behind the nav bar.
 *
 * The bar is now flush with the bottom edge rather than floating, so the
 * clearance is its own height plus the safe-area inset it pads itself with —
 * there is no longer a gap underneath to account for.
 */
export function useNavbarHeight(): number {
  const insets = useSafeAreaInsets();
  return BAR_CONTENT_HEIGHT + Math.max(insets.bottom, SPACING.sm) + SPACING.sm;
}

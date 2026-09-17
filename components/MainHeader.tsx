import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GUTTER, GLASS, TEXT, RADII, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAppTheme } from '../hooks/useAppTheme';

interface MainHeaderProps {
  title: string;
  /** Optional strapline, used by screens that are not month-scoped. */
  subtitle?: string;
}

/**
 * Screen title and the active currency.
 *
 * The month moved out of here into `MonthPill`, rendered as the first row of
 * each data screen's content: it scopes everything below it, so it belongs
 * with the content rather than in the chrome.
 */
const MainHeader: React.FC<MainHeaderProps> = ({ title, subtitle }) => {
  const { settings } = useApp();
  const { colors, isDark } = useAppTheme();
  const glass = isDark ? GLASS.dark : GLASS.light;

  return (
    /*
      Was a BlurView. It sits ABOVE the ScrollView in normal flow, not over it,
      so there was never anything behind it but the background colour — the
      blur cost GPU work every frame and rendered nothing. A plain surface is
      what it always looked like.

      Making it a genuine frosted header means positioning it absolutely over
      the scroll content and adding matching top inset to all five screens;
      worth doing, but it is a layout change, not a styling one.
    */
    <View
      style={[styles.header, { backgroundColor: colors.background }]}
    >
      <View style={styles.textContainer}>
        <Text
          style={[styles.appTitle, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.appSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.currencyBadge, {
        backgroundColor: glass.shine,
        borderColor: glass.border,
      }]}>
        <Text style={[styles.currencyText, { color: colors.text }]}>{settings.currency}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  appTitle: {
    // Matches the Settings screen's large title so every tab opens the same way.
    ...TEXT.display,
  },
  appSubtitle: {
    ...TEXT.labelSm,
    marginTop: 2,
  },
  currencyBadge: {
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexShrink: 0,
  },
  currencyText: {
    ...TEXT.subheading,
  },
});

export default MainHeader;

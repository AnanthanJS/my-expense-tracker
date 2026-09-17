import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GUTTER, GLASS, TEXT, RADII } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAppTheme } from '../hooks/useAppTheme';
import MonthPicker from './MonthPicker';

interface MainHeaderProps {
  title: string;
  /** Static strapline. Ignored when `showMonth` is set. */
  subtitle?: string;
  /**
   * (C1) Data screens show the globally selected month here instead of a
   * static strapline. Home, Expenses and Analytics all read the same
   * `selectedDate`, so the month has to be visible wherever it applies —
   * previously it was a Home-only control and the other two silently showed
   * every expense ever recorded.
   */
  showMonth?: boolean;
}

const MainHeader: React.FC<MainHeaderProps> = ({ title, subtitle, showMonth = false }) => {
  const { settings, selectedDate, setSelectedDate } = useApp();
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
      style={[styles.header, {
        backgroundColor: glass.card,
        borderBottomWidth: 1,
        borderBottomColor: glass.border,
      }]}
    >
      <View style={styles.textContainer}>
        <Text style={[styles.appTitle, { color: colors.primary }]} numberOfLines={1}>
          {title}
        </Text>
        {showMonth ? (
          <MonthPicker compact selectedDate={selectedDate} onDateChange={setSelectedDate} />
        ) : subtitle ? (
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
    paddingVertical: 12,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  appTitle: {
    ...TEXT.title,
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

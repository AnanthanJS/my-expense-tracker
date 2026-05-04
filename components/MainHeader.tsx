import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAppTheme } from '../hooks/useAppTheme';

interface MainHeaderProps {
  title: string;
  subtitle: string;
}

const MainHeader: React.FC<MainHeaderProps> = ({ title, subtitle }) => {
  const { settings } = useApp();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.textContainer}>
        <Text style={[styles.appTitle, { color: colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
        <Text style={[styles.appSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={[styles.currencyBadge, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
        <Text style={[styles.currencyText, { color: colors.primary }]}>{settings.currency}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
  },
  appSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  currencyBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexShrink: 0,
  },
  currencyText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
});

export default MainHeader;

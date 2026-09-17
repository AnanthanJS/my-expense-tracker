import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconAlertTriangle } from '@tabler/icons-react-native';
import { SPACING, TEXT, RADII, tint } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { formatCurrencyCompact } from '../utils/formatCurrency';
import type { SpendDriver } from '../utils/insights';

interface SpendInsightProps {
  driver: SpendDriver;
  currency: string;
  onView: () => void;
}

/**
 * Calls out the category responsible for an outsized share of the month.
 *
 * Replaces the plain "N categories over budget" banner: a category can be the
 * thing driving a month without having a limit set at all, which the old
 * banner could never surface.
 */
const SpendInsight: React.FC<SpendInsightProps> = ({ driver, currency, onView }) => {
  const { colors } = useAppTheme();
  const share = Math.round(driver.share * 100);

  return (
    <View
      style={[styles.container, { backgroundColor: tint(colors.danger, '12'), borderColor: tint(colors.danger, '33') }]}
      accessible
      accessibilityLabel={`${driver.category} is driving this month: ${formatCurrencyCompact(driver.amount, currency)}, ${share} percent of everything you spent`}
    >
      <View style={[styles.icon, { backgroundColor: tint(colors.danger, '1F') }]}>
        <IconAlertTriangle size={20} color={colors.danger} strokeWidth={2.2} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {driver.category} is driving this month
        </Text>
        <Text style={[styles.detail, { color: colors.textMuted }]}>
          {formatCurrencyCompact(driver.amount, currency)} — {share}% of everything you spent
        </Text>
      </View>

      <TouchableOpacity
        onPress={onView}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={`View ${driver.category} in Analytics`}
      >
        <Text style={[styles.action, { color: colors.primary }]}>View</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADII.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1, gap: 2 },
  title: { ...TEXT.rowTitle },
  detail: { ...TEXT.caption },
  action: { ...TEXT.button, flexShrink: 0 },
});

export default React.memo(SpendInsight);

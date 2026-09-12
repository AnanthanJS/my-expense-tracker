import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS, SPACING, ELEVATION } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import ProgressCircle from './ProgressCircle';

// (#26) Removed unused `income` prop — savings are shown in the stat row
interface SummaryCardProps {
  spent: number;
  budget: number;
  currency: string;
  month: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  spent,
  budget,
  currency,
  month,
}) => {
  const { colors } = useAppTheme();

  // (#1) Clamp percentage: safe divisor guards against Infinity when budget === 0.
  // Arc is capped at 100% inside ProgressCircle; label in stats row can exceed it.
  const percentage = useMemo(
    () => (budget > 0 ? (spent / budget) * 100 : 0),
    [spent, budget],
  );

  const remaining   = useMemo(() => Math.max(budget - spent, 0), [budget, spent]);
  const isOver      = spent > budget;
  const statusColor = useMemo(() => isOver ? colors.danger : colors.accent, [isOver, colors]);

  const a11yValue = useMemo(() => {
    return `Monthly progress for ${month}: Spent ${currency}${spent.toFixed(0)} of ${currency}${budget.toFixed(0)} budget. ${currency}${remaining.toFixed(0)} ${isOver ? 'over budget' : 'remaining'}.`;
  }, [month, spent, budget, currency, remaining, isOver]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceLight,
        },
      ]}
      accessible={true}
      accessibilityLabel={a11yValue}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textMuted }]}>SUMMARY</Text>
        <Text style={[styles.month, { color: colors.textDim }]} numberOfLines={1}>{month}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.circleWrap} aria-hidden={true}>
          <ProgressCircle percentage={percentage} size={84} />
        </View>

        <View style={styles.stats}>
          <View style={styles.spentRow}>
            <Text style={[styles.spentAmount, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {currency}{spent.toLocaleString()}
            </Text>
            <Text style={[styles.budgetTotal, { color: colors.textDim }]}>
              / {currency}{budget.toLocaleString()}
            </Text>
          </View>

          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {isOver
              ? `${currency}${(spent - budget).toLocaleString()} Over Budget`
              : `${currency}${remaining.toLocaleString()} Remaining`
            }
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 24,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    // (#11) Unified ELEVATION.md token
    ...ELEVATION.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  month: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  circleWrap: {
    flexShrink: 0,
  },
  stats: {
    flex: 1,
    justifyContent: 'center',
  },
  spentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  spentAmount: {
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  budgetTotal: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
  },
});

export default React.memo(SummaryCard);

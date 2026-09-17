import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, ELEVATION, GLASS, TEXT, RADII, getBudgetTone, tint } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { formatCurrency, formatCurrencyCompact } from '../utils/formatCurrency';
import ProgressCircle from './ProgressCircle';

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
  const { colors, isDark } = useAppTheme();
  const glass = isDark ? GLASS.dark : GLASS.light;

  const percentage = useMemo(
    () => (budget > 0 ? (spent / budget) * 100 : 0),
    [spent, budget],
  );

  const remaining   = useMemo(() => Math.max(budget - spent, 0), [budget, spent]);
  const isOver      = spent > budget;
  const statusColor = useMemo(() => getBudgetTone(spent, budget, colors), [spent, budget, colors]);

  const a11yValue = useMemo(() => {
    return `Monthly progress for ${month}: Spent ${formatCurrencyCompact(spent, currency)} of ${formatCurrencyCompact(budget, currency)} budget. ${formatCurrencyCompact(remaining, currency)} ${isOver ? 'over budget' : 'remaining'}.`;
  }, [month, spent, budget, currency, remaining, isOver]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: glass.card,
          borderColor: glass.border,
          shadowColor: glass.shadow,
        },
      ]}
      accessible={true}
      accessibilityLabel={a11yValue}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textDim }]}>Summary</Text>
        <Text style={[styles.month, { color: colors.textDim }]} numberOfLines={1}>{month}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.circleWrap} aria-hidden={true}>
          <ProgressCircle percentage={percentage} size={84} />
        </View>

        <View style={styles.stats}>
          <View style={styles.spentRow}>
            <Text style={[styles.spentAmount, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(spent, currency)}
            </Text>
            <Text style={[styles.budgetTotal, { color: colors.textDim }]}>
              / {formatCurrency(budget, currency)}
            </Text>
          </View>

          {/* Quiet tinted pill — carries the status colour without letting
              it flood the card. */}
          <View style={[styles.statusPill, { backgroundColor: tint(statusColor) }]}>
            <Text style={[styles.statusLabel, { color: statusColor }]} numberOfLines={1}>
              {isOver
                ? `${formatCurrency(spent - budget, currency)} over budget`
                : `${formatCurrency(remaining, currency)} remaining`
              }
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADII.lg,
    padding: 24,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    ...ELEVATION.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    ...TEXT.labelSm,
  },
  month: {
    ...TEXT.labelSm,
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
    ...TEXT.moneyHero,
  },
  budgetTotal: {
    ...TEXT.money,
    marginLeft: 4,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    marginTop: 2,
  },
  statusLabel: {
    ...TEXT.money,
  },
});

export default React.memo(SummaryCard);

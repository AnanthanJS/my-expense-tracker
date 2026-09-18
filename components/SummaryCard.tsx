import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react-native';
import { SPACING, ELEVATION, GLASS, TEXT, RADII, tint } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { formatCurrency, formatCurrencyCompact } from '../utils/formatCurrency';
import type { CategorySlice } from '../hooks/useMonthlyStats';
import AnimatedBar from './AnimatedBar';
import AnimatedNumber from './AnimatedNumber';
import { DURATION } from '../constants/motion';

interface SummaryCardProps {
  total: number;
  budget: number;
  count: number;
  average: number | null;
  topCategory: CategorySlice | null;
  /** Percent change vs the previous month; null when there is no baseline. */
  trendPct: number | null;
  currency: string;
}

/**
 * The month at a glance.
 *
 * The budget is shown as a segmented bar rather than a ring: once you are over
 * budget a ring can only sit pinned at 100%, which is the moment the number
 * matters most. A bar can give the overage its own segment and say how far.
 */
const SummaryCard: React.FC<SummaryCardProps> = ({
  total,
  budget,
  count,
  average,
  topCategory,
  trendPct,
  currency,
}) => {
  const { colors, isDark } = useAppTheme();
  const glass = isDark ? GLASS.dark : GLASS.light;

  const isOver = budget > 0 && total > budget;
  const over = isOver ? total - budget : 0;
  const remaining = budget > 0 ? Math.max(budget - total, 0) : 0;

  /**
   * Under budget the bar fills proportionally against the budget. Over budget
   * it fills completely and splits into what was budgeted and what was not,
   * so the two are directly comparable by width.
   */
  const segments = useMemo(() => {
    if (budget <= 0) return { budgetPct: 0, overPct: 0, fill: 0 };
    if (isOver) {
      return {
        budgetPct: (budget / total) * 100,
        overPct: (over / total) * 100,
        fill: 100,
      };
    }
    return { budgetPct: 100, overPct: 0, fill: (total / budget) * 100 };
  }, [budget, total, over, isOver]);

  const trendUp = trendPct !== null && trendPct > 0;
  const trendTone = trendUp ? colors.danger : colors.success;
  const TrendIcon = trendUp ? IconArrowUpRight : IconArrowDownRight;

  const a11y = useMemo(() => {
    const base = `Spent ${formatCurrencyCompact(total, currency)} of ${formatCurrencyCompact(budget, currency)}.`;
    const status = isOver
      ? `${formatCurrencyCompact(over, currency)} over budget.`
      : `${formatCurrencyCompact(remaining, currency)} remaining.`;
    return `${base} ${status}`;
  }, [total, budget, over, remaining, isOver, currency]);

  return (
    <View
      style={[styles.container, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}
      accessible
      accessibilityLabel={a11y}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textDim }]}>Spent this month</Text>
        {trendPct !== null && Math.abs(trendPct) >= 1 && (
          <View style={[styles.trend, { backgroundColor: tint(trendTone, '1A') }]}>
            <TrendIcon size={14} color={trendTone} strokeWidth={2.6} />
            <Text style={[styles.trendText, { color: trendTone }]}>
              {Math.abs(Math.round(trendPct))}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.amountRow}>
        <Text
          style={[styles.amount, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {formatCurrency(total, currency)}
        </Text>
        {budget > 0 && (
          <Text style={[styles.of, { color: colors.textDim }]} numberOfLines={1}>
            of {formatCurrency(budget, currency)}
          </Text>
        )}
      </View>

      {budget > 0 && (
        <>
          <View style={[styles.track, { backgroundColor: colors.surfaceLight }]}>
            {isOver ? (
              /*
               * The red grows a beat after the blue so the overshoot reads as a
               * second event — you saw the budget fill, then you saw it exceeded.
               */
              <View style={styles.segmentRow}>
                <AnimatedBar
                  percent={segments.budgetPct}
                  color={colors.primary}
                  style={styles.segment}
                />
                <AnimatedBar
                  percent={segments.overPct}
                  color={colors.danger}
                  delay={DURATION.fast}
                  style={styles.segment}
                />
              </View>
            ) : (
              <AnimatedBar percent={segments.fill} color={colors.primary} style={styles.fill} />
            )}
          </View>

          <View style={styles.footRow}>
            <Text style={[styles.foot, { color: colors.primary }]} numberOfLines={1}>
              {formatCurrencyCompact(budget, currency)} budget
            </Text>
            <Text
              style={[styles.foot, { color: isOver ? colors.danger : colors.textDim }]}
              numberOfLines={1}
            >
              {isOver
                ? `${formatCurrencyCompact(over, currency)} over`
                : `${formatCurrencyCompact(remaining, currency)} left`}
            </Text>
          </View>
        </>
      )}

      <View style={[styles.divider, { backgroundColor: colors.surfaceLight }]} />

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text
            style={[styles.statLabel, { color: colors.textDim }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            Transactions
          </Text>
          {count > 0 ? (
            /*
             * Counted rather than cut, because it is the one stat that is a
             * plain integer: the money cells beside it rely on
             * `adjustsFontSizeToFit` to survive a narrow column, and TextInput
             * has no equivalent. Height is pinned to the same line height the
             * sibling Text cells resolve to so the row stays on one baseline.
             */
            <AnimatedNumber
              value={count}
              style={[styles.statValue, { color: colors.text, height: TEXT.moneyLg.lineHeight }]}
            />
          ) : (
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
              —
            </Text>
          )}
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.surfaceLight }]} />

        <View style={styles.stat}>
          <Text
            style={[styles.statLabel, { color: colors.textDim }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            Avg / expense
          </Text>
          <Text
            style={[styles.statValue, { color: colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {average !== null ? formatCurrencyCompact(average, currency) : '—'}
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.surfaceLight }]} />

        <View style={styles.stat}>
          <Text
            style={[styles.statLabel, { color: colors.textDim }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            Top category
          </Text>
          <Text
            style={[styles.statValue, { color: colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {topCategory ? topCategory.category : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    ...ELEVATION.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: { ...TEXT.labelSm },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
  },
  trendText: { ...TEXT.money },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  amount: { ...TEXT.moneyHero, flexShrink: 1 },
  of: { ...TEXT.bodyLg, flexShrink: 0 },

  track: { height: 12, borderRadius: RADII.pill, overflow: 'hidden' },
  segmentRow: { flexDirection: 'row', height: '100%' },
  // Segments are square-ended: the track clips the outer corners, and rounding
  // the join between blue and red would read as a gap rather than a boundary.
  segment: { height: '100%' },
  fill: { height: '100%', borderRadius: RADII.pill },
  footRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  foot: { ...TEXT.money, flexShrink: 1 },

  divider: { height: 1, marginVertical: SPACING.lg },

  stats: { flexDirection: 'row', alignItems: 'stretch' },
  stat: { flex: 1, gap: 2 },
  statDivider: { width: 1, marginHorizontal: SPACING.sm },
  statLabel: { ...TEXT.caption },
  statValue: { ...TEXT.moneyLg },
});

export default React.memo(SummaryCard);

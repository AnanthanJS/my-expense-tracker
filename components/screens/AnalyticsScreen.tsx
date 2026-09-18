import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { IconChevronDown, IconChevronUp, IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react-native';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { GLASS, SPACING, GUTTER, TEXT, RADII, ELEVATION, getCategoryColor } from '../../constants/theme';
import { useNavbarHeight } from '../../hooks/useNavbarHeight';
import { useMonthlyStats } from '../../hooks/useMonthlyStats';
import { getWeeklyPace, getSixMonthSeries } from '../../utils/insights';
import { formatCurrencyCompact } from '../../utils/formatCurrency';
import { getMonthName } from '../../utils/storage';
import MonthPill from '../MonthPill';
import MonthTransition from '../MonthTransition';
import WeeklyChart from '../charts/WeeklyChart';
import MonthlyTrendChart from '../charts/MonthlyTrendChart';
import PressableScale from '../PressableScale';

/** Categories beyond this are rolled into a single "smaller categories" row. */
const LEGEND_LIMIT = 4;

export default function AnalyticsScreen() {
  const { expenses, settings, selectedDate, setSelectedDate } = useApp();
  const currency = settings.currency;
  const { colors, isDark } = useAppTheme();
  const navbarHeight = useNavbarHeight();
  const glass = isDark ? GLASS.dark : GLASS.light;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const stats = useMonthlyStats(expenses, selectedDate);
  const budget = useMemo(() => parseFloat(settings.budget) || 0, [settings.budget]);

  const pieData = useMemo(
    () => stats.byCategory.map((slice) => ({
      value: slice.amount,
      color: getCategoryColor(slice.category),
      text: slice.category,
      focused: slice.category === selectedCategory,
    })),
    [stats.byCategory, selectedCategory],
  );

  /** Top N plus a rollup, unless the user has asked to see everything. */
  const { visible, rolled } = useMemo(() => {
    if (showAll || stats.byCategory.length <= LEGEND_LIMIT + 1) {
      return { visible: stats.byCategory, rolled: null };
    }
    const head = stats.byCategory.slice(0, LEGEND_LIMIT);
    const tail = stats.byCategory.slice(LEGEND_LIMIT);
    return {
      visible: head,
      rolled: {
        count: tail.length,
        amount: tail.reduce((sum, s) => sum + s.amount, 0),
        share: tail.reduce((sum, s) => sum + s.share, 0),
        colors: tail.slice(0, 3).map((s) => getCategoryColor(s.category)),
      },
    };
  }, [stats.byCategory, showAll]);

  const weekly = useMemo(
    () => getWeeklyPace(stats.expenses, selectedDate, budget),
    [stats.expenses, selectedDate, budget],
  );

  const series = useMemo(
    () => getSixMonthSeries(expenses, selectedDate),
    [expenses, selectedDate],
  );

  const previousLabel = series.length > 1 ? series[series.length - 2].label : null;
  const trend = stats.trendPct;
  const trendUp = trend !== null && trend > 0;
  const trendTone = trendUp ? colors.danger : colors.success;
  const TrendIcon = trendUp ? IconArrowUpRight : IconArrowDownRight;

  const active = pieData.find((d) => d.focused);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: navbarHeight + SPACING.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <MonthPill selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Carries the scroll container's own gap so wrapping the cards does not
          close the spacing between them. */}
      <MonthTransition
        monthKey={selectedDate.getFullYear() * 12 + selectedDate.getMonth()}
        style={styles.monthContent}
      >
        {stats.count === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>
              Nothing to chart for {getMonthName(selectedDate)}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textDim }]}>
              Add an expense, or use the month picker above to look at another month.
            </Text>
          </View>
        ) : (
          <>
            {/* ── Where it went ────────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Where it went</Text>

              <View style={styles.chartWrapper}>
                <PieChart
                  data={pieData}
                  donut
                  radius={110}
                  innerRadius={72}
                  innerCircleColor="transparent"
                  centerLabelComponent={() => (
                    <View style={styles.center}>
                      <Text
                        style={[styles.centerValue, { color: colors.text }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                      >
                        {formatCurrencyCompact(active ? active.value : stats.total, currency)}
                      </Text>
                      <Text style={[styles.centerLabel, { color: colors.textDim }]} numberOfLines={1}>
                        {active ? active.text : `across ${stats.byCategory.length} categories`}
                      </Text>
                    </View>
                  )}
                  onPress={(item: { text?: string }) =>
                    setSelectedCategory((prev) => (prev === item.text ? null : item.text ?? null))
                  }
                />
              </View>

              <View style={styles.legend}>
                {visible.map((slice, index) => {
                  const isActive = slice.category === selectedCategory;
                  return (
                    <PressableScale
                      key={slice.category}
                      style={[
                        styles.legendRow,
                        index > 0 && { borderTopWidth: 1, borderTopColor: colors.surfaceLight },
                      ]}
                      onPress={() => setSelectedCategory(isActive ? null : slice.category)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={`${slice.category}, ${formatCurrencyCompact(slice.amount, currency)}, ${Math.round(slice.share * 100)} percent`}
                    >
                      <View style={[styles.dot, { backgroundColor: getCategoryColor(slice.category) }]} />
                      <Text
                        style={[styles.legendName, { color: isActive ? colors.primary : colors.text }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {slice.category}
                      </Text>
                      <Text style={[styles.legendValue, { color: colors.text }]} numberOfLines={1}>
                        {formatCurrencyCompact(slice.amount, currency)}
                      </Text>
                      <Text style={[styles.legendShare, { color: colors.textDim }]}>
                        {Math.round(slice.share * 100)}%
                      </Text>
                    </PressableScale>
                  );
                })}

                {rolled && (
                  <View style={[styles.legendRow, { borderTopWidth: 1, borderTopColor: colors.surfaceLight }]}>
                    <View style={styles.dotStack}>
                      {rolled.colors.map((c, i) => (
                        <View key={i} style={[styles.dotSmall, { backgroundColor: c }]} />
                      ))}
                    </View>
                    <Text
                      style={[styles.legendName, { color: colors.textMuted }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {rolled.count} smaller categor{rolled.count === 1 ? 'y' : 'ies'}
                    </Text>
                    <Text style={[styles.legendValue, { color: colors.textMuted }]} numberOfLines={1}>
                      {formatCurrencyCompact(rolled.amount, currency)}
                    </Text>
                    <Text style={[styles.legendShare, { color: colors.textDim }]}>
                      {Math.round(rolled.share * 100)}%
                    </Text>
                  </View>
                )}
              </View>

              {stats.byCategory.length > LEGEND_LIMIT + 1 && (
                <PressableScale
                  style={[styles.expander, { backgroundColor: colors.surfaceLight }]}
                  onPress={() => setShowAll((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={showAll ? 'Show fewer categories' : 'Show every category'}
                >
                  <Text style={[styles.expanderText, { color: colors.primary }]}>
                    {showAll ? 'Show fewer' : 'Show every category'}
                  </Text>
                  {showAll
                    ? <IconChevronUp size={18} color={colors.primary} strokeWidth={2.4} />
                    : <IconChevronDown size={18} color={colors.primary} strokeWidth={2.4} />}
                </PressableScale>
              )}
            </View>

            {/* ── Week by week ─────────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Week by week</Text>
                <Text style={[styles.cardMeta, { color: colors.textDim }]}>
                  {weekly.daysIn} days in
                </Text>
              </View>
              {weekly.headline && (
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                  {weekly.headline}
                </Text>
              )}
              <WeeklyChart pace={weekly} currency={currency} />
            </View>

            {/* ── Last six months ──────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Last six months</Text>
                {trend !== null && Math.abs(trend) >= 1 && previousLabel && (
                  <View style={styles.trend}>
                    <TrendIcon size={15} color={trendTone} strokeWidth={2.6} />
                    <Text style={[styles.trendText, { color: trendTone }]} numberOfLines={1}>
                      {Math.abs(Math.round(trend))}% vs {previousLabel}
                    </Text>
                  </View>
                )}
              </View>
              <MonthlyTrendChart points={series} budget={budget} currency={currency} />
            </View>
          </>
        )}
      </MonthTransition>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: GUTTER, paddingTop: GUTTER, gap: SPACING.lg },
  monthContent: { gap: SPACING.lg },

  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyTitle: { ...TEXT.subheading, textAlign: 'center', marginBottom: SPACING.sm },
  emptyText: { ...TEXT.prose, textAlign: 'center' },

  card: {
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    ...ELEVATION.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  cardTitle: { ...TEXT.subheading, flexShrink: 1 },
  cardMeta: { ...TEXT.caption },
  cardSubtitle: { ...TEXT.prose, marginTop: SPACING.xs },

  trend: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 1 },
  trendText: { ...TEXT.money },

  chartWrapper: { alignItems: 'center', marginVertical: SPACING.lg },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.sm },
  centerValue: { ...TEXT.moneyTitle },
  centerLabel: { ...TEXT.caption, marginTop: 2 },

  legend: { marginTop: SPACING.sm },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 52,
  },
  dot: { width: 12, height: 12, borderRadius: RADII.pill },
  dotStack: { flexDirection: 'row', gap: 1.5, width: 12 },
  dotSmall: { width: 3, height: 12, borderRadius: 1.5 },
  legendName: { ...TEXT.rowTitle, flex: 1 },
  legendValue: { ...TEXT.money },
  legendShare: { ...TEXT.caption, minWidth: 30, textAlign: 'right' },

  expander: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    minHeight: 52,
    borderRadius: RADII.md,
    marginTop: SPACING.md,
  },
  expanderText: { ...TEXT.button },
});

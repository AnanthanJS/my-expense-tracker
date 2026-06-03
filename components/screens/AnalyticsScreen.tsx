import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import IconChevronLeft from '@tabler/icons-react-native/dist/esm/icons/IconChevronLeft';
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight';
import IconChartBar from '@tabler/icons-react-native/dist/esm/icons/IconChartBar';
import IconArrowUpRight from '@tabler/icons-react-native/dist/esm/icons/IconArrowUpRight';
import IconArrowDownRight from '@tabler/icons-react-native/dist/esm/icons/IconArrowDownRight';
import IconMoodEmpty from '@tabler/icons-react-native/dist/esm/icons/IconMoodEmpty';
import { FONTS, SPACING, RADIUS, SHADOWS, CATEGORY_COLORS } from '../../constants/theme';
import { getMonthName } from '../../utils/storage';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  return `${currency}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatAmountShort(amount: number, currency: string): string {
  if (amount >= 100000) return `${currency}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(1)}K`;
  return `${currency}${Math.round(amount)}`;
}

/** Get the Monday-based week dates for a given month's current week view */
function getWeekDatesForMonth(date: Date): Date[] {
  // Return Mon–Sun of the week containing today (or the last day of the month)
  const ref = new Date(date.getFullYear(), date.getMonth() + 1, 0); // last day
  const today = new Date();
  const anchor =
    today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()
      ? today
      : ref;

  // Find Monday of anchor's week
  const dayOfWeek = anchor.getDay(); // 0=Sun … 6=Sat
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((dayOfWeek + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── WeeklyBarChart ───────────────────────────────────────────────────────────

interface WeeklyBarChartProps {
  weekDates: Date[];
  dailyTotals: number[];
  currency: string;
  colors: ReturnType<typeof import('../../hooks/useAppTheme').useAppTheme>['colors'];
  isDark: boolean;
}

const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({
  weekDates,
  dailyTotals,
  currency,
  colors,
  isDark,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = windowWidth - SPACING.lg * 2 - SPACING.xl * 2;
  const chartHeight = 160;
  const labelHeight = 28;
  const amountLabelHeight = 18;
  const totalSvgHeight = amountLabelHeight + chartHeight + labelHeight;

  const maxVal = Math.max(...dailyTotals, 1);
  const barGap = 6;
  const barWidth = (chartWidth - barGap * 6) / 7;

  const todayIdx = (() => {
    const today = new Date();
    return weekDates.findIndex(
      (d) =>
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
    );
  })();

  const maxIdx = dailyTotals.indexOf(Math.max(...dailyTotals));

  return (
    <Svg width={chartWidth} height={totalSvgHeight}>
      {weekDates.map((date, i) => {
        const barH = maxVal > 0 ? (dailyTotals[i] / maxVal) * chartHeight : 0;
        const x = i * (barWidth + barGap);
        const barY = amountLabelHeight + (chartHeight - barH);
        const isToday = i === todayIdx;
        const isMax = i === maxIdx && dailyTotals[i] > 0;

        const barColor = isToday
          ? colors.primary
          : isDark
          ? colors.surfaceElevated
          : '#E8E4F8';

        const barRadius = Math.min(6, barWidth / 2);

        return (
          <G key={i}>
            {/* Subtle background track */}
            <Rect
              x={x}
              y={amountLabelHeight}
              width={barWidth}
              height={chartHeight}
              rx={barRadius}
              fill={isDark ? '#26264A' : '#F0EEFF'}
            />

            {/* Actual bar */}
            {barH > 0 && (
              <Rect
                x={x}
                y={barY}
                width={barWidth}
                height={barH}
                rx={barRadius}
                fill={barColor}
              />
            )}

            {/* Amount label above tallest bar */}
            {isMax && dailyTotals[i] > 0 && (
              <SvgText
                x={x + barWidth / 2}
                y={amountLabelHeight - 4}
                textAnchor="middle"
                fontSize={10}
                fontFamily={FONTS.bold}
                fill={colors.primary}
              >
                {formatAmountShort(dailyTotals[i], currency)}
              </SvgText>
            )}

            {/* Day label */}
            <SvgText
              x={x + barWidth / 2}
              y={amountLabelHeight + chartHeight + labelHeight - 6}
              textAnchor="middle"
              fontSize={11}
              fontFamily={isToday ? FONTS.bold : FONTS.regular}
              fill={isToday ? colors.primary : colors.textDim}
            >
              {DAY_LABELS[i]}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
};

// ─── AnalyticsScreen ──────────────────────────────────────────────────────────

const AnalyticsScreen: React.FC = () => {
  const { expenses, settings, selectedDate, setSelectedDate } = useApp();
  const { colors, isDark } = useAppTheme();

  // ── Month navigation ──
  const goToPrevMonth = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() - 1);
    setSelectedDate(d);
  };
  const goToNextMonth = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + 1);
    setSelectedDate(d);
  };

  const isCurrentMonth =
    selectedDate.getMonth() === new Date().getMonth() &&
    selectedDate.getFullYear() === new Date().getFullYear();

  const monthName = useMemo(() => getMonthName(selectedDate), [selectedDate]);

  // ── Filter expenses ──
  const filteredExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const d = new Date(e.date);
        return (
          d.getMonth() === selectedDate.getMonth() &&
          d.getFullYear() === selectedDate.getFullYear()
        );
      }),
    [expenses, selectedDate]
  );

  // ── Previous month expenses ──
  const prevMonthExpenses = useMemo(() => {
    const prev = new Date(selectedDate);
    prev.setMonth(prev.getMonth() - 1);
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return (
        d.getMonth() === prev.getMonth() &&
        d.getFullYear() === prev.getFullYear()
      );
    });
  }, [expenses, selectedDate]);

  const totalSpent = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const prevTotalSpent = useMemo(
    () => prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [prevMonthExpenses]
  );

  // Month-over-month delta
  const momDelta = useMemo(() => {
    if (prevTotalSpent === 0) return null;
    return ((totalSpent - prevTotalSpent) / prevTotalSpent) * 100;
  }, [totalSpent, prevTotalSpent]);

  // ── Weekly bar data ──
  const weekDates = useMemo(() => getWeekDatesForMonth(selectedDate), [selectedDate]);

  const dailyTotals = useMemo(() => {
    return weekDates.map((date) => {
      return filteredExpenses
        .filter((e) => {
          const d = new Date(e.date);
          return (
            d.getDate() === date.getDate() &&
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, e) => sum + e.amount, 0);
    });
  }, [weekDates, filteredExpenses]);

  // ── Category breakdown ──
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filteredExpenses) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        pct: totalSpent > 0 ? amount / totalSpent : 0,
        color: CATEGORY_COLORS[category] ?? '#94A3B8',
      }));
  }, [filteredExpenses, totalSpent]);

  const hasExpenses = filteredExpenses.length > 0;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <IconChartBar size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Analytics</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Spending insights
          </Text>
        </View>
      </View>

      {/* ── Month Picker ── */}
      <View
        style={[
          styles.monthPicker,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={goToPrevMonth} style={styles.monthArrow} activeOpacity={0.7}>
          <IconChevronLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={[styles.monthLabel, { color: colors.text }]}>{monthName}</Text>
          {isCurrentMonth && (
            <View style={[styles.currentMonthDot, { backgroundColor: colors.primary }]} />
          )}
        </View>
        <TouchableOpacity onPress={goToNextMonth} style={styles.monthArrow} activeOpacity={0.7}>
          <IconChevronRight size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Total Summary Card ── */}
      <View
        style={[
          styles.summaryCard,
          SHADOWS.md,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.summaryIconWrap, { backgroundColor: colors.primary + '18' }]}>
          <IconChartBar size={20} color={colors.primary} />
        </View>
        <View style={styles.summaryBody}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Total Spent · {monthName}
          </Text>
          <Text style={[styles.summaryAmount, { color: colors.text }]}>
            {formatAmount(totalSpent, settings.currency)}
          </Text>
        </View>
        {momDelta !== null && (
          <View
            style={[
              styles.momChip,
              {
                backgroundColor:
                  momDelta > 0 ? colors.danger + '18' : colors.success + '18',
              },
            ]}
          >
            {momDelta > 0 ? (
              <IconArrowUpRight size={14} color={colors.danger} />
            ) : (
              <IconArrowDownRight size={14} color={colors.success} />
            )}
            <Text
              style={[
                styles.momText,
                { color: momDelta > 0 ? colors.danger : colors.success },
              ]}
            >
              {Math.abs(momDelta).toFixed(1)}%
            </Text>
            <Text style={[styles.momSub, { color: colors.textDim }]}>vs last mo.</Text>
          </View>
        )}
      </View>

      {/* ── Weekly Bar Chart ── */}
      <View
        style={[
          styles.card,
          SHADOWS.sm,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Breakdown</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textDim }]}>
            {weekDates[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            {' – '}
            {weekDates[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        {hasExpenses ? (
          <WeeklyBarChart
            weekDates={weekDates}
            dailyTotals={dailyTotals}
            currency={settings.currency}
            colors={colors}
            isDark={isDark}
          />
        ) : (
          <View style={styles.chartEmpty}>
            <Text style={[styles.chartEmptyText, { color: colors.textDim }]}>
              No data for this week
            </Text>
          </View>
        )}
      </View>

      {/* ── Category Breakdown ── */}
      <View
        style={[
          styles.card,
          SHADOWS.sm,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>By Category</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textDim }]}>
            {categoryBreakdown.length} categor{categoryBreakdown.length === 1 ? 'y' : 'ies'}
          </Text>
        </View>

        {hasExpenses ? (
          categoryBreakdown.map((item, index) => (
            <View key={item.category} style={styles.catRow}>
              {/* Dot + name */}
              <View style={styles.catLeft}>
                <View style={[styles.catDot, { backgroundColor: item.color }]} />
                <View style={styles.catNameWrap}>
                  <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
                    {item.category}
                  </Text>
                  <Text style={[styles.catCount, { color: colors.textDim }]}>
                    {filteredExpenses.filter((e) => e.category === item.category).length} txns
                  </Text>
                </View>
              </View>

              {/* Progress + amount */}
              <View style={styles.catRight}>
                <View style={[styles.catTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.catFill,
                      {
                        width: `${Math.round(item.pct * 100)}%` as any,
                        backgroundColor: item.color,
                        opacity: 0.85,
                      },
                    ]}
                  />
                </View>
                <View style={styles.catAmountRow}>
                  <Text style={[styles.catPct, { color: colors.textDim }]}>
                    {Math.round(item.pct * 100)}%
                  </Text>
                  <Text style={[styles.catAmount, { color: colors.text }]}>
                    {formatAmount(item.amount, settings.currency)}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              {index < categoryBreakdown.length - 1 && (
                <View
                  style={[styles.catDivider, { backgroundColor: colors.border }]}
                />
              )}
            </View>
          ))
        ) : (
          /* ── Full Empty State ── */
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceLight }]}>
              <IconMoodEmpty size={36} color={colors.textDim} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nothing to analyse yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Add some expenses for {monthName} and your spending insights will appear here.
            </Text>
          </View>
        )}
      </View>

      {/* ── Spending Heatmap hint ── */}
      {hasExpenses && (
        <View
          style={[
            styles.hintCard,
            { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' },
          ]}
        >
          <Text style={[styles.hintEmoji]}>💡</Text>
          <Text style={[styles.hintText, { color: colors.textMuted }]}>
            <Text style={{ color: colors.primary, fontFamily: FONTS.bold }}>
              {categoryBreakdown[0]?.category ?? 'Other'}
            </Text>{' '}
            is your biggest spending category at{' '}
            <Text style={{ color: colors.primary, fontFamily: FONTS.bold }}>
              {Math.round((categoryBreakdown[0]?.pct ?? 0) * 100)}%
            </Text>{' '}
            of total expenses this month.
          </Text>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: 120,
  },

  // Header
  header: {
    marginBottom: SPACING.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginLeft: 30,
  },

  // Month picker
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  monthArrow: { padding: SPACING.xs },
  monthCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthLabel: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
  currentMonthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Summary card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBody: { flex: 1 },
  summaryLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  summaryAmount: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
  },
  momChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  momText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  momSub: {
    fontSize: 10,
    fontFamily: FONTS.regular,
  },

  // Generic card
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },

  // Chart empty
  chartEmpty: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },

  // Category row
  catRow: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  catNameWrap: { flex: 1 },
  catName: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  catCount: {
    fontSize: 10,
    fontFamily: FONTS.regular,
  },
  catRight: {
    paddingLeft: SPACING.lg + 2,
    gap: 4,
  },
  catTrack: {
    height: 6,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    minWidth: 4,
  },
  catAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catPct: {
    fontSize: 10,
    fontFamily: FONTS.regular,
  },
  catAmount: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  catDivider: {
    position: 'absolute',
    bottom: -SPACING.xs - 2,
    left: 0,
    right: 0,
    height: 1,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.xl,
  },

  // Insight hint
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  hintEmoji: {
    fontSize: 16,
    lineHeight: 22,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },

  bottomSpacer: { height: 24 },
});

export default React.memo(AnalyticsScreen);

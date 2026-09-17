import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { GLASS, SPACING, GUTTER, TEXT, RADII, ELEVATION, getCategoryColor } from '../../constants/theme';
import { useNavbarHeight } from '../../hooks/useNavbarHeight';
import { formatCurrencyCompact } from '../../utils/formatCurrency';
import { getMonthName } from '../../utils/storage';

export default function AnalyticsScreen() {
  const { expenses, settings, selectedDate } = useApp();
  const currency = settings.currency;
  const { colors, isDark } = useAppTheme();
  const navbarHeight = useNavbarHeight();
  const glass = isDark ? GLASS.dark : GLASS.light;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  /**
   * (C1) Scoped to the globally selected month. This screen used to chart every
   * expense ever recorded while Home charted one month, so the same category
   * could show two different totals one swipe apart.
   */
  const monthExpenses = useMemo(
    () => expenses.filter((e) => {
      const date = new Date(e.date);
      return (
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      );
    }),
    [expenses, selectedDate],
  );

  const monthTotal = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses],
  );

  const pieData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        value: amount,
        color: getCategoryColor(category),
        text: category,
        focused: category === selectedCategory,
      }))
      .sort((a, b) => b.value - a.value)
      .filter((item) => item.value > 0);
  }, [monthExpenses, selectedCategory]);

  /**
   * Weekly buckets inside the selected month, replacing a fixed "last 7 days"
   * window. The old window ignored the month entirely, so on any month but the
   * current one it charted data the rest of the screen was not showing — and a
   * per-day chart would need 28-31 bars to cover a month.
   */
  const barData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const buckets: { label: string; start: number; end: number; amount: number }[] = [];
    for (let start = 1; start <= daysInMonth; start += 7) {
      const end = Math.min(start + 6, daysInMonth);
      buckets.push({ label: `${start}-${end}`, start, end, amount: 0 });
    }

    monthExpenses.forEach((e) => {
      const day = new Date(e.date).getDate();
      const bucket = buckets.find((b) => day >= b.start && day <= b.end);
      if (bucket) bucket.amount += e.amount;
    });

    return buckets.map((bucket) => ({
      value: bucket.amount,
      label: bucket.label,
      frontColor: colors.primary,
      topLabelComponent: () => bucket.amount > 0 ? (
        <Text style={{ color: colors.textDim, ...TEXT.moneySm, marginBottom: 4 }}>
          {formatCurrencyCompact(bucket.amount, currency)}
        </Text>
      ) : null,
    }));
  }, [monthExpenses, selectedDate, colors, currency]);

  /**
   * (C8) The legend now carries the amount and share, and selects its slice.
   * It was a colour swatch and a name — no values, and not tappable, even
   * though the (much smaller) pie slice was.
   */
  const renderLegend = () => {
    if (pieData.length === 0) return null;
    return (
      <View style={styles.legendContainer}>
        {pieData.map((item) => {
          const share = monthTotal > 0 ? Math.round((item.value / monthTotal) * 100) : 0;
          const isActive = item.text === selectedCategory;
          return (
            <TouchableOpacity
              key={item.text}
              style={[
                styles.legendItem,
                { borderColor: isActive ? item.color : 'transparent' },
              ]}
              onPress={() => setSelectedCategory(isActive ? null : item.text)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${item.text}, ${formatCurrencyCompact(item.value, currency)}, ${share} percent of spending`}
            >
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>
                {item.text}
              </Text>
              <Text style={[styles.legendValue, { color: colors.textMuted }]}>
                {formatCurrencyCompact(item.value, currency)}
              </Text>
              <Text style={[styles.legendShare, { color: colors.textDim }]}>{share}%</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: navbarHeight + SPACING.lg }]}
      showsVerticalScrollIndicator={false}
    >
      {/*
        No in-screen title here — App.tsx already renders
        <MainHeader title="Analytics" subtitle="Visualise your spending" />
        above this screen. The screen used to draw a second, contradicting
        title/subtitle pair directly beneath it.
      */}
      {monthExpenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>
            Nothing to chart for {getMonthName(selectedDate)}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textDim }]}>
            Add an expense, or use the month arrows in the header to look at another month.
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow, elevation: 2 }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Category Breakdown</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textDim }]}>
              {getMonthName(selectedDate)}
            </Text>
            <View style={styles.chartWrapper}>
              {pieData.length > 0 ? (
                <PieChart
                  data={pieData}
                  donut
                  radius={110}
                  innerRadius={60}
                  innerCircleColor="transparent"
                  centerLabelComponent={() => {
                    // (C8) Default to the month total. This used to silently
                    // show slice #0, which read as a total but was not one.
                    const active = pieData.find(d => d.focused);
                    return (
                      <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }}>
                        <Text
                          style={{ ...TEXT.moneyTitle, color: colors.text }}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.6}
                        >
                          {formatCurrencyCompact(active ? active.value : monthTotal, currency)}
                        </Text>
                        <Text style={{ ...TEXT.labelSm, color: colors.textDim }} numberOfLines={1}>
                          {active ? active.text : 'Total'}
                        </Text>
                      </View>
                    );
                  }}
                  onPress={(item: any) => setSelectedCategory(item.text)}
                />
              ) : (
                <Text style={{ color: colors.textDim }}>No category data.</Text>
              )}
            </View>
            {renderLegend()}
          </View>

          <View style={[styles.card, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow, elevation: 2 }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Spend</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textDim }]}>
              By day of {getMonthName(selectedDate)}
            </Text>
            <View style={styles.chartWrapper}>
              <BarChart
                data={barData}
                barWidth={28}
                spacing={24}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: colors.textDim, ...TEXT.caption }}
                noOfSections={4}
                maxValue={Math.ceil(Math.max(...barData.map(d => d.value), 10) * 1.2)}
                formatYLabel={(label: string) => Math.round(Number(label)).toString()}
                xAxisLabelTextStyle={{ color: colors.textDim, ...TEXT.caption }}
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    // (#3) GUTTER — was SPACING.lg (16). Analytics is a swipe-sibling of Home
    // and Expenses; a 4px difference made card edges jump mid-swipe, which is
    // exactly what GUTTER exists to prevent.
    paddingHorizontal: GUTTER,
    paddingTop: GUTTER,
    gap: SPACING.lg,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    ...TEXT.subheading,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TEXT.prose,
    textAlign: 'center',
  },
  card: {
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    ...ELEVATION.sm,
  },
  cardTitle: {
    ...TEXT.subheading,
  },
  cardSubtitle: {
    ...TEXT.caption,
    marginTop: 2,
    marginBottom: SPACING.lg,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
  },
  legendContainer: {
    gap: 2,
    marginTop: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADII.sm,
    borderWidth: 1,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: RADII.pill,
  },
  legendText: {
    ...TEXT.labelSm,
    flex: 1,
  },
  legendValue: {
    ...TEXT.moneySm,
  },
  legendShare: {
    ...TEXT.caption,
    minWidth: 34,
    textAlign: 'right',
  },
});

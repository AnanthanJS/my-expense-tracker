import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, TEXT, RADII } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { formatCurrencyCompact } from '../../utils/formatCurrency';
import type { WeeklyPace } from '../../utils/insights';

interface WeeklyChartProps {
  pace: WeeklyPace;
  currency: string;
}

const PLOT_HEIGHT = 150;

/**
 * Week-by-week spend against the pace needed to stay in budget.
 *
 * Hand-built from Views rather than the chart library: this needs dashed
 * placeholder bars for weeks that have not happened, a labelled reference
 * line, per-bar value labels and colour scaled by magnitude. Five bars is
 * simple enough that plain layout is more predictable than configuring a
 * chart around those four constraints.
 */
const WeeklyChart: React.FC<WeeklyChartProps> = ({ pace, currency }) => {
  const { colors } = useAppTheme();

  const { buckets, pace: weeklyPace } = pace;

  /** Headroom so the pace line is never flush against the top edge. */
  const max = useMemo(() => {
    const highest = Math.max(...buckets.map((b) => b.amount), weeklyPace);
    return highest > 0 ? highest * 1.18 : 1;
  }, [buckets, weeklyPace]);

  const paceY = weeklyPace > 0 ? PLOT_HEIGHT * (1 - weeklyPace / max) : -1;
  const spent = buckets.filter((b) => b.elapsed).map((b) => b.amount);
  const largest = Math.max(...spent, 1);
  const hasFuture = buckets.some((b) => !b.elapsed);

  return (
    <View style={styles.container}>
      <View style={[styles.plot, { height: PLOT_HEIGHT }]}>
        {/* The line sits behind the bars so a tall bar visibly crosses it. */}
        {paceY >= 0 && (
          <View style={[styles.paceWrap, { top: paceY }]} pointerEvents="none">
            <View style={[styles.paceLine, { borderTopColor: colors.danger }]} />
          </View>
        )}

        <View style={styles.bars}>
          {buckets.map((bucket) => {
            const height = max > 0 ? (bucket.amount / max) * PLOT_HEIGHT : 0;
            // Colour intensity tracks magnitude, so the heavy week reads as
            // heavy even before you check the number above it.
            const weight = largest > 0 ? 0.45 + 0.55 * (bucket.amount / largest) : 1;

            return (
              <View key={bucket.label} style={styles.barSlot}>
                {bucket.elapsed && bucket.amount > 0 && (
                  <Text
                    style={[styles.value, { color: colors.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {formatCurrencyCompact(bucket.amount, currency)}
                  </Text>
                )}
                {bucket.elapsed ? (
                  <View
                    style={[
                      styles.bar,
                      { height: Math.max(height, bucket.amount > 0 ? 4 : 0), backgroundColor: colors.primary, opacity: weight },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.barGhost,
                      { height: PLOT_HEIGHT * 0.42, borderColor: colors.surfaceLight },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* The label, however, is drawn after the bars — behind them it would
            be unreadable in any month where the later weeks are tall. */}
        {paceY >= 0 && (
          <View style={[styles.paceWrap, { top: paceY }]} pointerEvents="none">
            <Text style={[styles.paceLabel, { color: colors.danger }]} numberOfLines={1}>
              pace to stay in budget · {formatCurrencyCompact(weeklyPace, currency)}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.axis, { borderTopColor: colors.surfaceLight }]}>
        {buckets.map((bucket) => (
          <View key={bucket.label} style={styles.axisSlot}>
            <Text
              style={[styles.axisLabel, { color: bucket.elapsed ? colors.textMuted : colors.textDim }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {bucket.label}
            </Text>
          </View>
        ))}
      </View>

      {hasFuture && (
        <Text style={[styles.footnote, { color: colors.textDim }]}>still to come</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: SPACING.lg },
  plot: { position: 'relative', justifyContent: 'flex-end' },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    gap: SPACING.sm,
  },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '100%', borderRadius: RADII.xs, minHeight: 0 },
  barGhost: {
    width: '100%',
    borderRadius: RADII.xs,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  value: { ...TEXT.caption },

  paceWrap: { position: 'absolute', left: 0, right: 0 },
  paceLine: { borderTopWidth: 1.5, borderStyle: 'dashed' },
  paceLabel: { ...TEXT.caption, textAlign: 'right', marginTop: 2 },

  axis: {
    flexDirection: 'row',
    gap: SPACING.sm,
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  axisSlot: { flex: 1, alignItems: 'center' },
  axisLabel: { ...TEXT.caption },
  footnote: { ...TEXT.caption, textAlign: 'right', marginTop: 2 },
});

export default React.memo(WeeklyChart);

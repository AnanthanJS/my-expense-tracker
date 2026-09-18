import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, TEXT, RADII, tint } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { formatCurrencyCompact } from '../../utils/formatCurrency';
import type { MonthPoint } from '../../utils/insights';
import { staggerDelay } from '../../constants/motion';
import AnimatedColumn from './AnimatedColumn';

interface MonthlyTrendChartProps {
  points: MonthPoint[];
  budget: number;
  currency: string;
}

const PLOT_HEIGHT = 130;

/**
 * Six months of spending against the monthly budget.
 *
 * The selected month is highlighted and turns red when it has gone over, so
 * the comparison the card is for — this month against the recent norm — is
 * the first thing the eye lands on.
 */
const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ points, budget, currency }) => {
  const { colors } = useAppTheme();

  const max = useMemo(() => {
    const highest = Math.max(...points.map((p) => p.total), budget);
    return highest > 0 ? highest * 1.15 : 1;
  }, [points, budget]);

  const budgetY = budget > 0 ? PLOT_HEIGHT * (1 - budget / max) : -1;

  return (
    <View style={styles.container}>
      <View style={[styles.plot, { height: PLOT_HEIGHT }]}>
        {budgetY >= 0 && (
          <View style={[styles.budgetWrap, { top: budgetY }]} pointerEvents="none">
            <View style={[styles.budgetLine, { borderTopColor: colors.textDim }]} />
          </View>
        )}

        <View style={styles.bars}>
          {points.map((point, index) => {
            const height = max > 0 ? (point.total / max) * PLOT_HEIGHT : 0;
            const over = budget > 0 && point.total > budget;
            const color = point.isCurrent
              ? (over ? colors.danger : colors.primary)
              : tint(colors.primary, '33');

            return (
              <View key={`${point.year}-${point.month}`} style={styles.barSlot}>
                <AnimatedColumn
                  delay={staggerDelay(index)}
                  style={[
                    styles.bar,
                    {
                      height: Math.max(height, point.total > 0 ? 4 : 0),
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>

        {/* Drawn after the bars, and left-aligned: the rightmost bar is the
            selected month, which is both always present and usually the
            tallest, so a right-aligned label lands straight on top of it. */}
        {budgetY >= 0 && (
          <View style={[styles.budgetWrap, { top: budgetY }]} pointerEvents="none">
            <Text style={[styles.budgetLabel, { color: colors.textDim }]} numberOfLines={1}>
              budget {formatCurrencyCompact(budget, currency)}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.axis, { borderTopColor: colors.surfaceLight }]}>
        {points.map((point) => (
          <View key={`${point.year}-${point.month}`} style={styles.axisSlot}>
            <Text
              style={[
                styles.axisLabel,
                { color: point.isCurrent ? colors.text : colors.textDim },
                point.isCurrent && styles.axisLabelCurrent,
              ]}
              numberOfLines={1}
            >
              {point.label}
            </Text>
            {point.isCurrent && point.partial && (
              <Text
                style={[styles.axisNote, { color: colors.textDim }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                so far
              </Text>
            )}
          </View>
        ))}
      </View>
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
  barSlot: { flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: RADII.xs },

  budgetWrap: { position: 'absolute', left: 0, right: 0 },
  budgetLine: { borderTopWidth: 1.5, borderStyle: 'dashed' },
  budgetLabel: { ...TEXT.caption, textAlign: 'left', marginTop: 2 },

  axis: {
    flexDirection: 'row',
    gap: SPACING.sm,
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  axisSlot: { flex: 1, alignItems: 'center' },
  axisLabel: { ...TEXT.caption },
  axisLabelCurrent: { ...TEXT.money },
  axisNote: { ...TEXT.caption, marginTop: 1 },
});

export default React.memo(MonthlyTrendChart);

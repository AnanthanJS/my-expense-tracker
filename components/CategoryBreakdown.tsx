import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { contentExiting, listEntering, listLayout, rowEntering } from '../constants/motion';
import { IconChevronRight } from '@tabler/icons-react-native';
import { SPACING, GLASS, TEXT, RADII, ELEVATION, getCategoryColor, getBudgetTone } from '../constants/theme';
import { GROUP_TINTS, UNGROUPED_LABEL, getCategoryIcon, resolveGroup } from '../constants/categories';
import { useAppTheme } from '../hooks/useAppTheme';
import { useApp } from '../context/AppContext';
import { formatCurrencyCompact } from '../utils/formatCurrency';
import type { CategorySlice } from '../hooks/useMonthlyStats';
import PressableScale from './PressableScale';
import AnimatedBar from './AnimatedBar';

interface CategoryBreakdownProps {
  byCategory: CategorySlice[];
  currency: string;
  onSeeAll: () => void;
  /** Rows shown before the "All N categories" hand-off. */
  limit?: number;
}

/**
 * Share of spend per category.
 *
 * The bar sits on its own line under the name and amount rather than squeezed
 * between them: at six rows the old inline layout left the bar about 40% of
 * the row width, which is too little to compare lengths by eye — which is the
 * only thing a bar is for.
 */
const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  byCategory,
  currency,
  onSeeAll,
  limit = 6,
}) => {
  const { colors, isDark } = useAppTheme();
  const { settings } = useApp();
  const glass = isDark ? GLASS.dark : GLASS.light;

  if (byCategory.length === 0) return null;

  const rows = byCategory.slice(0, limit);
  const groups = settings.categoryGroups || {};
  const largest = byCategory[0]?.amount ?? 0;

  return (
    <Animated.View
      entering={rowEntering()}
      exiting={contentExiting()}
      layout={listLayout()}
      style={[styles.container, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>By category</Text>
        <Text style={[styles.subtitle, { color: colors.textDim }]}>Share of spend</Text>
      </View>

      <View style={styles.list}>
        {rows.map(({ category, amount }, index) => {
          const Icon = getCategoryIcon(category);
          const group = resolveGroup(category, groups);
          const tone = GROUP_TINTS[group] ?? GROUP_TINTS[UNGROUPED_LABEL];

          const limitAmount = settings.categoryBudgets?.[category];
          const hasLimit = Boolean(limitAmount && limitAmount > 0);

          // Bars are scaled against the largest category so the biggest row
          // always fills the track — relative size is the comparison that
          // matters here. A category with its own limit switches to the
          // budget ramp instead, where absolute progress is the point.
          const width = hasLimit
            ? Math.min((amount / (limitAmount as number)) * 100, 100)
            : largest > 0 ? (amount / largest) * 100 : 0;
          const barColor = hasLimit
            ? getBudgetTone(amount, limitAmount as number, colors)
            : getCategoryColor(category);

          return (
            <Animated.View
              key={category}
              entering={listEntering(index)}
              style={styles.item}
              accessible
              accessibilityLabel={
                hasLimit
                  ? `${category}: ${formatCurrencyCompact(amount, currency)} of a ${formatCurrencyCompact(limitAmount as number, currency)} limit`
                  : `${category}: ${formatCurrencyCompact(amount, currency)}`
              }
            >
              <View style={styles.itemTop}>
                <View style={[styles.tile, { backgroundColor: tone.bg }]}>
                  <Icon size={20} color={tone.fg} strokeWidth={2} />
                </View>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {category}
                </Text>
                <Text style={[styles.amount, { color: colors.text }]} numberOfLines={1}>
                  {formatCurrencyCompact(amount, currency)}
                </Text>
              </View>
              <View style={[styles.track, { backgroundColor: colors.surfaceLight }]}>
                <AnimatedBar percent={width} color={barColor} style={styles.fill} />
              </View>
            </Animated.View>
          );
        })}
      </View>

      {byCategory.length > limit && (
        <PressableScale
          style={[styles.seeAll, { backgroundColor: colors.surfaceLight }]}
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel={`See all ${byCategory.length} categories`}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>
            All {byCategory.length} categories
          </Text>
          <IconChevronRight size={18} color={colors.primary} strokeWidth={2.4} />
        </PressableScale>
      )}
    </Animated.View>
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
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  title: { ...TEXT.subheading },
  subtitle: { ...TEXT.caption },
  list: { gap: SPACING.lg },
  item: { gap: SPACING.sm },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...TEXT.rowTitle, flex: 1 },
  amount: { ...TEXT.money },
  track: { height: 8, borderRadius: RADII.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: RADII.pill },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    minHeight: 52,
    borderRadius: RADII.md,
    marginTop: SPACING.lg,
  },
  seeAllText: { ...TEXT.button },
});

export default React.memo(CategoryBreakdown);

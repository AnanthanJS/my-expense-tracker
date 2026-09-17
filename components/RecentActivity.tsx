import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SPACING, ELEVATION, GLASS, TEXT, RADII } from '../constants/theme';
import { GROUP_TINTS, UNGROUPED_LABEL, getCategoryIcon, resolveGroup } from '../constants/categories';
import { useAppTheme } from '../hooks/useAppTheme';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import type { Expense } from '../utils/storage';

interface RecentActivityProps {
  expenses: Expense[];
  /** Total in the month, for the "See all N" affordance. */
  totalCount: number;
  currency: string;
  groups: Record<string, string>;
  onSeeAll: () => void;
  onSelect: (expense: Expense) => void;
  limit?: number;
}

/**
 * The last few expenses, on Home.
 *
 * Home previously showed only aggregates, so confirming "did that actually
 * save?" meant switching tabs. This answers it in place and hands off to the
 * full list for anything more.
 */
const RecentActivity: React.FC<RecentActivityProps> = ({
  expenses,
  totalCount,
  currency,
  groups,
  onSeeAll,
  onSelect,
  limit = 3,
}) => {
  const { colors, isDark } = useAppTheme();
  const glass = isDark ? GLASS.dark : GLASS.light;

  if (expenses.length === 0) return null;

  const rows = expenses.slice(0, limit);

  return (
    <View style={[styles.container, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Recent</Text>
        <TouchableOpacity
          onPress={onSeeAll}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={`See all ${totalCount} expenses`}
        >
          <Text style={[styles.action, { color: colors.primary }]}>See all {totalCount}</Text>
        </TouchableOpacity>
      </View>

      {rows.map((expense, index) => {
        const Icon = getCategoryIcon(expense.category);
        const group = resolveGroup(expense.category, groups);
        const tone = GROUP_TINTS[group] ?? GROUP_TINTS[UNGROUPED_LABEL];
        return (
          <TouchableOpacity
            key={expense.id}
            style={[
              styles.row,
              index > 0 && { borderTopWidth: 1, borderTopColor: colors.surfaceLight },
            ]}
            onPress={() => onSelect(expense)}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={`${expense.description}, ${formatCurrency(expense.amount, currency)}, ${expense.category}`}
            accessibilityHint="Opens this expense for editing"
          >
            <View style={[styles.tile, { backgroundColor: tone.bg }]}>
              <Icon size={20} color={tone.fg} strokeWidth={2} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {expense.description}
              </Text>
              <Text style={[styles.meta, { color: colors.textDim }]} numberOfLines={1}>
                {expense.category} · {formatDate(expense.date)}
              </Text>
            </View>
            <Text style={[styles.amount, { color: colors.text }]} numberOfLines={1}>
              {formatCurrency(expense.amount, currency)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
    marginBottom: SPACING.lg,
    ...ELEVATION.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: { ...TEXT.subheading },
  action: { ...TEXT.label, flexShrink: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 64,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  name: { ...TEXT.rowTitle },
  meta: { ...TEXT.caption },
  amount: { ...TEXT.money },
});

export default React.memo(RecentActivity);

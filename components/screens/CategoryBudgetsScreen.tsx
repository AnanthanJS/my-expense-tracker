import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react-native';
import { TEXT, RADII, SPACING, GUTTER, GLASS, ELEVATION, getBudgetTone } from '../../constants/theme';
import {
  GROUP_ORDER,
  GROUP_TINTS,
  UNGROUPED_LABEL,
  getCategoryIcon,
  resolveGroup,
} from '../../constants/categories';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useNavbarHeight } from '../../hooks/useNavbarHeight';
import { formatCurrencyCompact } from '../../utils/formatCurrency';
import PressableScale from '../PressableScale';
import AnimatedBar from '../AnimatedBar';

interface CategoryBudgetsScreenProps {
  categories: string[];
  limits: Record<string, number>;
  groups: Record<string, string>;
  currency: string;
  budget: number;
  onBack: () => void;
  onSelect: (category: string) => void;
  onAdd: () => void;
}

const CategoryBudgetsScreen: React.FC<CategoryBudgetsScreenProps> = ({
  categories,
  limits,
  groups,
  currency,
  budget,
  onBack,
  onSelect,
  onAdd,
}) => {
  const { colors, isDark } = useAppTheme();
  const glass = isDark ? GLASS.dark : GLASS.light;
  const navbarHeight = useNavbarHeight();

  const assigned = useMemo(
    () => categories.reduce((sum, c) => sum + (limits[c] > 0 ? limits[c] : 0), 0),
    [categories, limits],
  );
  const unlimited = useMemo(
    () => categories.filter((c) => !(limits[c] > 0)).length,
    [categories, limits],
  );
  const remaining = Math.max(budget - assigned, 0);
  const overAssigned = assigned > budget;
  const tone = getBudgetTone(assigned, budget, colors);
  const fill = budget > 0 ? Math.min((assigned / budget) * 100, 100) : 0;

  /** Categories bucketed into their section, preserving the user's own order. */
  const sections = useMemo(() => {
    const buckets = new Map<string, string[]>();
    categories.forEach((c) => {
      const g = resolveGroup(c, groups);
      const list = buckets.get(g);
      if (list) list.push(c);
      else buckets.set(g, [c]);
    });
    return GROUP_ORDER
      .filter((g) => buckets.has(g))
      .map((g) => ({ group: g, items: buckets.get(g) as string[] }));
  }, [categories, groups]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <PressableScale
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to settings"
        >
          <IconChevronLeft size={26} color={colors.text} strokeWidth={2.2} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Categories &amp; budgets
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: navbarHeight + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Assignment meter — how much of the monthly budget is spoken for */}
        <View style={[styles.summary, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}>
          <View style={styles.summaryTop}>
            <Text style={[styles.summaryAssigned, { color: tone }]}>
              {formatCurrencyCompact(assigned, currency)} assigned
            </Text>
            <Text style={[styles.summaryOf, { color: colors.textDim }]}>
              of {formatCurrencyCompact(budget, currency)} budget
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.surfaceLight }]}>
            <AnimatedBar percent={fill} color={tone} style={styles.fill} />
          </View>
          <Text style={[styles.summaryFoot, { color: colors.textDim }]}>
            {overAssigned
              ? `${formatCurrencyCompact(assigned - budget, currency)} over your budget`
              : `${formatCurrencyCompact(remaining, currency)} left to assign`}
            {unlimited > 0 && ` · ${unlimited} categor${unlimited === 1 ? 'y has' : 'ies have'} no limit`}
          </Text>
        </View>

        {sections.map(({ group, items }) => {
          const tint = GROUP_TINTS[group] ?? GROUP_TINTS[UNGROUPED_LABEL];
          return (
            <View key={group} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textDim }]}>{group}</Text>
              <View style={[styles.card, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}>
                {items.map((name, index) => {
                  const Icon = getCategoryIcon(name);
                  const limit = limits[name];
                  return (
                    <PressableScale
                      key={name}
                      style={[
                        styles.row,
                        index > 0 && { borderTopWidth: 1, borderTopColor: colors.surfaceLight },
                      ]}
                      onPress={() => onSelect(name)}
                      accessibilityRole="button"
                      accessibilityLabel={`${name}, ${limit > 0 ? formatCurrencyCompact(limit, currency) : 'no limit'}`}
                      accessibilityHint="Opens this category for editing"
                    >
                      <View style={[styles.tile, { backgroundColor: tint.bg }]}>
                        <Icon size={20} color={tint.fg} strokeWidth={2} />
                      </View>
                      <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text
                        style={[
                          limit > 0 ? styles.rowLimit : styles.rowNoLimit,
                          { color: limit > 0 ? colors.text : colors.textDim },
                        ]}
                      >
                        {limit > 0 ? formatCurrencyCompact(limit, currency) : 'No limit'}
                      </Text>
                      <IconChevronRight size={18} color={colors.textDim} strokeWidth={2} />
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          );
        })}

        <PressableScale
          style={[styles.addBtn, { borderColor: colors.primary }]}
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Add a category"
        >
          <IconPlus size={20} color={colors.primary} strokeWidth={2.5} />
          <Text style={[styles.addText, { color: colors.primary }]}>Add a category</Text>
        </PressableScale>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: GUTTER - 6,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TEXT.title, flex: 1 },
  content: { paddingHorizontal: GUTTER },
  summary: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...ELEVATION.sm,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  summaryAssigned: { ...TEXT.moneyLg, flexShrink: 1 },
  summaryOf: { ...TEXT.caption },
  track: { height: 10, borderRadius: RADII.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: RADII.pill },
  summaryFoot: { ...TEXT.caption, marginTop: SPACING.md },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { ...TEXT.labelSm, marginBottom: SPACING.sm, marginLeft: SPACING.xs },
  card: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...ELEVATION.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 64,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: { ...TEXT.bodyLg, flex: 1 },
  rowLimit: { ...TEXT.money },
  rowNoLimit: { ...TEXT.bodySm },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 56,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addText: { ...TEXT.button },
});

export default CategoryBudgetsScreen;

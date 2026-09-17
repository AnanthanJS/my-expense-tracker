import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { IconPlus, IconReceipt2, IconAlertTriangle } from '@tabler/icons-react-native';
import { SPACING, GUTTER, ELEVATION, GLASS, TEXT, RADII, tint } from '../../constants/theme';
import { getMonthName } from '../../utils/storage';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useNavbarHeight } from '../../hooks/useNavbarHeight';
import { formatCurrencyCompact } from '../../utils/formatCurrency';

import SummaryCard from '../SummaryCard';
import ExpenseForm from '../ExpenseForm';
import CategoryBreakdown from '../CategoryBreakdown';
import UpcomingBills from '../UpcomingBills';
import OnboardingModal from '../OnboardingModal';

const HomeScreen: React.FC = () => {
  const {
    expenses,
    settings,
    selectedDate,
    addExpense,
    completeOnboarding,
  } = useApp();
  const { colors, isDark } = useAppTheme();
  const glass = isDark ? GLASS.dark : GLASS.light;
  const { width: windowWidth } = useWindowDimensions();
  const navbarHeight = useNavbarHeight(); // (#4)

  const [isFormVisible, setIsFormVisible] = useState(false); // (#27)

  const isNarrow = windowWidth < 360;
  const fabRight = windowWidth > 680 ? (windowWidth - 640) / 2 + 20 : 20;

  const filteredExpenses = useMemo(() =>
    expenses.filter((e) => {
      const date = new Date(e.date);
      return (
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      );
    }),
    [expenses, selectedDate],
  );

  const totalSpent = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses],
  );

  const monthName = useMemo(() => getMonthName(selectedDate), [selectedDate]);

  const avgExpense = useMemo(
    () => filteredExpenses.length > 0 ? totalSpent / filteredExpenses.length : null,
    [totalSpent, filteredExpenses.length],
  );

  const savings = useMemo(
    () => Math.max(parseFloat(settings.income) - totalSpent, 0),
    [settings.income, totalSpent],
  );

  const budget = useMemo(() => parseFloat(settings.budget), [settings.budget]);

  /**
   * (C9) Per-category budgets already drive the amber/red bars inside
   * CategoryBreakdown, but that only helps once you scroll to it and know to
   * look. Anything at or over its limit gets called out at the top instead.
   */
  const overBudgetCategories = useMemo(() => {
    const limits = settings.categoryBudgets || {};
    const spentPerCategory: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      spentPerCategory[e.category] = (spentPerCategory[e.category] || 0) + e.amount;
    });
    return Object.entries(limits)
      .filter(([category, limit]) => limit > 0 && (spentPerCategory[category] || 0) >= limit)
      .map(([category, limit]) => ({
        category,
        limit,
        spent: spentPerCategory[category] || 0,
      }))
      .sort((a, b) => (b.spent - b.limit) - (a.spent - a.limit));
  }, [filteredExpenses, settings.categoryBudgets]);

  const isEmptyMonth = filteredExpenses.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* (#17) max-width wrapper for tablet — caps at 640px centered */}
        <View style={styles.maxWidthWrapper}>
          {/* (#26) income prop removed from SummaryCard */}
          <SummaryCard
            spent={totalSpent}
            budget={budget}
            currency={settings.currency}
            month={monthName}
          />

          {/*
            (C2) Upcoming bills — built, tested-looking and referenced nowhere
            until now. It turns Home from a rear-view mirror into something
            forward-looking, which is the one thing a budget app can do that a
            spreadsheet cannot. Renders nothing when no bill is due.
          */}
          <UpcomingBills />

          {/* (C9) Over-budget categories, surfaced rather than buried */}
          {overBudgetCategories.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(200)}
              layout={LinearTransition.duration(200)}
              style={[styles.alertCard, { backgroundColor: tint(colors.danger, '14'), borderColor: tint(colors.danger, '55') }]}
              accessible
              accessibilityLabel={`${overBudgetCategories.length} categor${overBudgetCategories.length === 1 ? 'y is' : 'ies are'} over budget`}
            >
              <IconAlertTriangle size={18} color={colors.danger} strokeWidth={2.2} />
              <View style={styles.alertText}>
                <Text style={[styles.alertTitle, { color: colors.danger }]} numberOfLines={1}>
                  {overBudgetCategories.length === 1
                    ? `${overBudgetCategories[0].category} is over budget`
                    : `${overBudgetCategories.length} categories over budget`}
                </Text>
                <Text style={[styles.alertDetail, { color: colors.textMuted }]} numberOfLines={2}>
                  {overBudgetCategories
                    .map((c) => `${c.category} ${formatCurrencyCompact(c.spent, settings.currency)} / ${formatCurrencyCompact(c.limit, settings.currency)}`)
                    .join('  ·  ')}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* (#27) CategoryBreakdown now sits directly beneath SummaryCard — continuous dashboard */}
          <CategoryBreakdown
            expenses={filteredExpenses}
            totalSpent={totalSpent}
            currency={settings.currency}
          />

          {/*
            (C7) A first-run user used to see 0%, three em-dashes and a hidden
            breakdown — no explanation and nothing pointing at the FAB.
          */}
          {isEmptyMonth ? (
            <Animated.View
              entering={FadeIn.duration(250)}
              layout={LinearTransition.duration(200)}
              style={[styles.emptyCard, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}
            >
              <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '1A' }]}>
                <IconReceipt2 size={28} color={colors.primary} strokeWidth={1.8} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {expenses.length === 0 ? 'Track your first expense' : `Nothing logged in ${monthName}`}
              </Text>
              <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                {expenses.length === 0
                  ? 'Tap the + button to add one. Your budget, categories and charts fill in from there.'
                  : 'Tap + to add one, or use the month arrows in the header to look at another month.'}
              </Text>
              <TouchableOpacity
                style={[styles.emptyCta, { backgroundColor: colors.primary }]}
                onPress={() => setIsFormVisible(true)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Add your first expense"
              >
                <IconPlus size={18} color={colors.onPrimary} strokeWidth={2.5} />
                <Text style={[styles.emptyCtaText, { color: colors.onPrimary }]}>Add expense</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
          /* (#26, #29) Stat row is always rendered to avoid layout jump; animates layout smoothly */
          <Animated.View
            layout={LinearTransition.duration(200)}
            style={[styles.statsRow, isNarrow && styles.statsRowWrap]}
          >
            <View style={[
              styles.statCard,
              { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow, elevation: 2 },
              isNarrow && styles.statCardHalf,
            ]}>
              {/* (#8) statLabel bumped from 9px → 11px (below mobile floor) */}
              {/*
                "TRANSACTIONS" at 11px with overline tracking is wider than the
                ~76px of content a third-width stat card offers, so it wrapped
                to two lines and made that one card taller than its siblings.
                Shrink to fit instead of wrapping.
              */}
              <Text
                style={[styles.statLabel, { color: colors.textDim }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                maxFontSizeMultiplier={1.3} // (#16)
              >
                Transactions
              </Text>
              <Text
                style={[styles.statValue, { color: colors.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                maxFontSizeMultiplier={1.3}
              >
                {filteredExpenses.length > 0 ? filteredExpenses.length : '—'}
              </Text>
            </View>

            <View style={[
              styles.statCard,
              { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow, elevation: 2 },
              isNarrow && styles.statCardHalf,
            ]}>
              <Text
                style={[styles.statLabel, { color: colors.textDim }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                maxFontSizeMultiplier={1.3}
              >
                Avg / expense
              </Text>
              <Text
                style={[styles.statValue, { color: colors.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                maxFontSizeMultiplier={1.3}
              >
                {avgExpense != null ? formatCurrencyCompact(avgExpense, settings.currency) : '—'}
              </Text>
            </View>

            <View style={[
              styles.statCard,
              { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow, elevation: 2 },
              isNarrow && styles.statCardFull,
            ]}>
              <Text
                style={[styles.statLabel, { color: colors.textDim }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                maxFontSizeMultiplier={1.3}
              >
                Savings
              </Text>
              <Text
                style={[styles.statValue, { color: savings > 0 ? colors.success : colors.textDim }]}
                maxFontSizeMultiplier={1.3}
              >
                {filteredExpenses.length > 0 ? formatCurrencyCompact(savings, settings.currency) : '—'}
              </Text>
            </View>
          </Animated.View>
          )}

          {/* (#4) Dynamic navbar clearance replaces hardcoded height: 100 */}
          <View style={{ height: navbarHeight + 40 }} />
        </View>
      </ScrollView>

      {/* (#27) FAB — Floating Action Button to open Add Expense bottom sheet */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: navbarHeight + 16,
            right: fabRight,
          },
        ]}
        onPress={() => setIsFormVisible(true)}
        activeOpacity={0.85}
        accessibilityLabel="Add new expense"
        accessibilityRole="button"
      >
        <IconPlus size={26} color={colors.onPrimary} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* (#27) Add Expense Bottom Sheet Modal */}
      <ExpenseForm
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        onAdd={addExpense}
      />

      <OnboardingModal
        visible={!settings.hasSeenOnboarding}
        onComplete={completeOnboarding}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scroll: { flex: 1 },
  content: {
    // (#3) GUTTER — was SPACING.lg (16), now 20 — aligns with header and other screens
    padding: GUTTER,
    alignItems: 'stretch',
  },
  // (#17) Tablet: cap width at 640, center content
  maxWidthWrapper: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
    marginBottom: SPACING.lg,
  },
  statsRowWrap: {
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    borderRadius: RADII.md,
    padding: SPACING.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
  },
  statCardHalf: {
    flex: 0,
    width: '48.5%',
  },
  statCardFull: {
    flex: 0,
    width: '100%',
  },
  statLabel: {
    ...TEXT.labelSm,
  },
  statValue: {
    ...TEXT.moneyLg,
  },
  // (C9) Over-budget banner
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  alertText: { flex: 1, gap: 2 },
  alertTitle: { ...TEXT.rowTitle },
  alertDetail: { ...TEXT.caption },

  // (C7) Empty state
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: RADII.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
    ...ELEVATION.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { ...TEXT.subheading, textAlign: 'center' },
  emptyBody: { ...TEXT.prose, textAlign: 'center' },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 48,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADII.pill,
    marginTop: SPACING.xs,
  },
  emptyCtaText: { ...TEXT.button },

  // (#27) FAB styling
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...ELEVATION.lg,
    zIndex: 10,
  },
});

export default React.memo(HomeScreen);

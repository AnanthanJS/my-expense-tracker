import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { rowEntering } from '../../constants/motion';
import MonthTransition from '../MonthTransition';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { IconPlus, IconReceipt2 } from '@tabler/icons-react-native';
import { SPACING, GUTTER, ELEVATION, GLASS, TEXT, RADII } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useNavbarHeight } from '../../hooks/useNavbarHeight';
import { useMonthlyStats } from '../../hooks/useMonthlyStats';
import { useExpenseToast } from '../../hooks/useExpenseToast';
import { getSpendDriver } from '../../utils/insights';
import { getMonthName } from '../../utils/storage';
import type { Expense } from '../../utils/storage';

import MonthPill from '../MonthPill';
import SummaryCard from '../SummaryCard';
import SpendInsight from '../SpendInsight';
import ExpenseForm from '../ExpenseForm';
import type { ExpenseDraft } from '../ExpenseForm';
import type { RecurrenceInput } from '../../context/AppContext';
import CategoryBreakdown from '../CategoryBreakdown';
import RecentActivity from '../RecentActivity';
import UpcomingBills from '../UpcomingBills';
import OnboardingModal from '../OnboardingModal';
import PressableScale from '../PressableScale';

const HomeScreen: React.FC = () => {
  const {
    expenses,
    settings,
    selectedDate,
    setSelectedDate,
    saveExpenseWithRecurrence,
    completeOnboarding,
  } = useApp();
  const { colors, isDark } = useAppTheme();
  const glass = isDark ? GLASS.dark : GLASS.light;
  const navbarHeight = useNavbarHeight();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { announceSaved, announceFailed } = useExpenseToast();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const stats = useMonthlyStats(expenses, selectedDate);
  const budget = useMemo(() => parseFloat(settings.budget) || 0, [settings.budget]);
  const driver = useMemo(() => getSpendDriver(stats.byCategory), [stats.byCategory]);

  /** Newest first, for the Recent card. */
  const recent = useMemo(
    () => [...stats.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [stats.expenses],
  );

  const monthName = useMemo(() => getMonthName(selectedDate), [selectedDate]);
  const isEmptyMonth = stats.count === 0;

  const goTo = useCallback((tab: string) => navigation.navigate(tab), [navigation]);

  const closeForm = useCallback(() => {
    setIsFormVisible(false);
    setEditing(null);
  }, []);

  /** Saves, then confirms — warning instead when it tips a category over. */
  const handleAdd = useCallback(async (draft: ExpenseDraft) => {
    const { recurrence, ...expense } = draft;
    try {
      // One write: the expense, and its rule if the repeat toggle was on.
      await saveExpenseWithRecurrence(expense, recurrence ?? null);
      announceSaved(expense, recurrence?.frequency);
    } catch {
      announceFailed(() => { handleAdd(draft); });
    }
  }, [saveExpenseWithRecurrence, announceSaved, announceFailed]);

  const handleSave = useCallback(async (updated: Expense & { recurrence?: RecurrenceInput | null }) => {
    const { recurrence, ...expense } = updated;
    try {
      await saveExpenseWithRecurrence(expense, recurrence ?? null);
      closeForm();
    } catch {
      announceFailed(() => { handleSave(updated); });
    }
  }, [saveExpenseWithRecurrence, announceFailed, closeForm]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.maxWidthWrapper}>
          <MonthPill selectedDate={selectedDate} onDateChange={setSelectedDate} />

          <MonthTransition
            monthKey={selectedDate.getFullYear() * 12 + selectedDate.getMonth()}
          >
            <SummaryCard
              total={stats.total}
              budget={budget}
              count={stats.count}
              average={stats.average}
              topCategory={stats.topCategory}
              trendPct={stats.trendPct}
              currency={settings.currency}
            />

            {driver && (
              <SpendInsight
                driver={driver}
                currency={settings.currency}
                onView={() => goTo('Analytics')}
              />
            )}

            <UpcomingBills />

            {isEmptyMonth ? (
              <Animated.View
                entering={rowEntering()}
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
                    ? 'Tap Add expense below. Your budget, categories and charts fill in from there.'
                    : 'Add one below, or use the month picker above to look at another month.'}
                </Text>
              </Animated.View>
            ) : (
              <>
                <CategoryBreakdown
                  byCategory={stats.byCategory}
                  currency={settings.currency}
                  onSeeAll={() => goTo('Analytics')}
                />

                <RecentActivity
                  expenses={recent}
                  totalCount={stats.count}
                  currency={settings.currency}
                  groups={settings.categoryGroups || {}}
                  onSeeAll={() => goTo('Expenses')}
                  onSelect={(expense) => { setEditing(expense); setIsFormVisible(true); }}
                />
              </>
            )}
          </MonthTransition>

          <View style={{ height: navbarHeight + 72 }} />
        </View>
      </ScrollView>

      {/* Labelled action rather than a bare FAB — the icon alone never said
          what it added, and there is room for the word. */}
      <PressableScale
        style={[styles.addButton, { backgroundColor: colors.primary, bottom: navbarHeight + SPACING.md }]}
        onPress={() => { setEditing(null); setIsFormVisible(true); }}
        accessibilityLabel="Add expense"
        accessibilityRole="button"
      >
        <IconPlus size={22} color={colors.onPrimary} strokeWidth={2.6} />
        <Text style={[styles.addLabel, { color: colors.onPrimary }]}>Add expense</Text>
      </PressableScale>

      <ExpenseForm
        visible={isFormVisible}
        editing={editing}
        onClose={closeForm}
        onAdd={handleAdd}
        onSave={handleSave}
      />

      <OnboardingModal
        visible={!settings.hasSeenOnboarding}
        onComplete={completeOnboarding}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  scroll: { flex: 1 },
  content: { padding: GUTTER, alignItems: 'stretch' },
  maxWidthWrapper: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },

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

  addButton: {
    position: 'absolute',
    right: GUTTER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 56,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADII.md,
    ...ELEVATION.lg,
    zIndex: 10,
  },
  addLabel: { ...TEXT.button },
});

export default React.memo(HomeScreen);

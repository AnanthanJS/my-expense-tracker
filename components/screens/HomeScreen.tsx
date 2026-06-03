import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import IconChevronLeft from '@tabler/icons-react-native/dist/esm/icons/IconChevronLeft';
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight';
import IconTrendingUp from '@tabler/icons-react-native/dist/esm/icons/IconTrendingUp';
import IconTrendingDown from '@tabler/icons-react-native/dist/esm/icons/IconTrendingDown';
import IconWallet from '@tabler/icons-react-native/dist/esm/icons/IconWallet';
import IconSparkles from '@tabler/icons-react-native/dist/esm/icons/IconSparkles';
import { FONTS, SPACING, RADIUS, SHADOWS, CATEGORY_COLORS } from '../../constants/theme';
import { getMonthName } from '../../utils/storage';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import OnboardingModal from '../OnboardingModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatAmount(amount: number, currency: string): string {
  return `${currency}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getCategoryInitial(category: string): string {
  return category.charAt(0).toUpperCase();
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#94A3B8';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface HeroCardProps {
  balance: number;
  income: number;
  totalSpent: number;
  budget: number;
  currency: string;
  colors: ReturnType<typeof import('../../hooks/useAppTheme').useAppTheme>['colors'];
  isDark: boolean;
}

const HeroCard: React.FC<HeroCardProps> = ({
  balance,
  income,
  totalSpent,
  budget,
  currency,
  colors,
  isDark,
}) => {
  const budgetPct = budget > 0 ? Math.min(totalSpent / budget, 1) : 0;
  const budgetColor =
    budgetPct >= 0.9
      ? colors.danger
      : budgetPct >= 0.7
      ? colors.warning
      : colors.success;

  return (
    <View
      style={[
        styles.heroCard,
        SHADOWS.lg,
        { backgroundColor: colors.surfaceElevated },
      ]}
    >
      {/* Primary color overlay layer */}
      <View
        style={[
          styles.heroOverlay,
          { backgroundColor: colors.primary, opacity: isDark ? 0.18 : 0.08 },
        ]}
        pointerEvents="none"
      />
      {/* Top accent line */}
      <View style={[styles.heroAccentLine, { backgroundColor: colors.primary }]} />

      {/* Decorative circles */}
      <View
        style={[
          styles.heroBubble1,
          { backgroundColor: colors.primary, opacity: isDark ? 0.12 : 0.06 },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.heroBubble2,
          { backgroundColor: colors.secondary, opacity: isDark ? 0.1 : 0.05 },
        ]}
        pointerEvents="none"
      />

      {/* Label */}
      <View style={styles.heroTopRow}>
        <View style={[styles.heroBadge, { backgroundColor: colors.primary + '22' }]}>
          <IconWallet size={14} color={colors.primary} />
          <Text style={[styles.heroBadgeText, { color: colors.primary }]}>
            Total Balance
          </Text>
        </View>
      </View>

      {/* Balance */}
      <Text style={[styles.heroBalance, { color: colors.text }]}>
        {formatAmount(balance, currency)}
      </Text>

      {/* Income / Expense chips */}
      <View style={styles.heroChipsRow}>
        <View style={[styles.heroChip, { backgroundColor: colors.success + '18' }]}>
          <IconTrendingUp size={14} color={colors.success} />
          <View style={styles.heroChipText}>
            <Text style={[styles.heroChipLabel, { color: colors.textMuted }]}>Income</Text>
            <Text style={[styles.heroChipAmount, { color: colors.success }]}>
              {formatAmount(income, currency)}
            </Text>
          </View>
        </View>
        <View style={[styles.heroChip, { backgroundColor: colors.danger + '18' }]}>
          <IconTrendingDown size={14} color={colors.danger} />
          <View style={styles.heroChipText}>
            <Text style={[styles.heroChipLabel, { color: colors.textMuted }]}>Expenses</Text>
            <Text style={[styles.heroChipAmount, { color: colors.danger }]}>
              {formatAmount(totalSpent, currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Budget progress bar */}
      {budget > 0 && (
        <View style={styles.heroBudgetSection}>
          <View style={styles.heroBudgetHeader}>
            <Text style={[styles.heroBudgetLabel, { color: colors.textMuted }]}>
              Budget used
            </Text>
            <Text style={[styles.heroBudgetPct, { color: budgetColor }]}>
              {Math.round(budgetPct * 100)}%
            </Text>
          </View>
          <View style={[styles.heroBudgetTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.heroBudgetFill,
                { width: `${Math.round(budgetPct * 100)}%` as any, backgroundColor: budgetColor },
              ]}
            />
          </View>
          <View style={styles.heroBudgetFooter}>
            <Text style={[styles.heroBudgetSub, { color: colors.textDim }]}>
              {formatAmount(totalSpent, currency)} of {formatAmount(budget, currency)}
            </Text>
            <Text style={[styles.heroBudgetSub, { color: colors.textDim }]}>
              {formatAmount(Math.max(budget - totalSpent, 0), currency)} left
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── HomeScreen ───────────────────────────────────────────────────────────────

const HomeScreen: React.FC = () => {
  const {
    expenses,
    settings,
    selectedDate,
    setSelectedDate,
    completeOnboarding,
  } = useApp();
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

  // ── Derived data ──
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

  const totalSpent = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const income = useMemo(() => parseFloat(settings.income) || 0, [settings.income]);
  const budget = useMemo(() => parseFloat(settings.budget) || 0, [settings.budget]);
  const balance = useMemo(() => income - totalSpent, [income, totalSpent]);

  const avgExpense = useMemo(
    () =>
      filteredExpenses.length > 0
        ? Math.round(totalSpent / filteredExpenses.length)
        : 0,
    [totalSpent, filteredExpenses.length]
  );

  const savings = useMemo(() => Math.max(income - totalSpent, 0), [income, totalSpent]);

  const recentExpenses = useMemo(
    () =>
      [...filteredExpenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [filteredExpenses]
  );

  const monthName = useMemo(() => getMonthName(selectedDate), [selectedDate]);

  // ── Today date string ──
  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const greeting = getGreeting();
  const userName = settings.userName ? `, ${settings.userName.split(' ')[0]}` : '';

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <View style={styles.greetingRow}>
            <IconSparkles size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.greeting, { color: colors.textMuted }]}>
              {greeting}{userName}
            </Text>
          </View>
          <Text style={[styles.todayDate, { color: colors.textDim }]}>{todayStr}</Text>
        </View>
      </View>

      {/* ── Hero Balance Card ── */}
      <HeroCard
        balance={balance}
        income={income}
        totalSpent={totalSpent}
        budget={budget}
        currency={settings.currency}
        colors={colors}
        isDark={isDark}
      />

      {/* ── Month Picker ── */}
      <View style={[styles.monthPicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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

      {/* ── Quick Stats Row ── */}
      <View style={styles.statsRow}>
        {/* Transactions */}
        <View style={[styles.statCard, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {filteredExpenses.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textDim }]}>Transactions</Text>
        </View>
        {/* Avg expense */}
        <View style={[styles.statCard, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatAmount(avgExpense, settings.currency)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textDim }]}>Avg / Expense</Text>
        </View>
        {/* Savings */}
        <View style={[styles.statCard, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {formatAmount(savings, settings.currency)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textDim }]}>Savings</Text>
        </View>
      </View>

      {/* ── Recent Transactions ── */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Transactions
          </Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentExpenses.length === 0 ? (
          /* ── Empty State ── */
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💸</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No expenses yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Tap the + button to add your first expense for {monthName}
            </Text>
          </View>
        ) : (
          recentExpenses.map((expense, index) => {
            const catColor = getCategoryColor(expense.category);
            const isLast = index === recentExpenses.length - 1;
            return (
              <View
                key={expense.id}
                style={[
                  styles.transactionItem,
                  !isLast && styles.transactionBorder,
                  !isLast && { borderBottomColor: colors.border },
                ]}
              >
                {/* Category circle */}
                <View style={[styles.categoryCircle, { backgroundColor: catColor + '22' }]}>
                  <Text style={[styles.categoryInitial, { color: catColor }]}>
                    {getCategoryInitial(expense.category)}
                  </Text>
                </View>

                {/* Description + meta */}
                <View style={styles.transactionMeta}>
                  <Text
                    style={[styles.transactionDesc, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {expense.description}
                  </Text>
                  <Text style={[styles.transactionSub, { color: colors.textDim }]}>
                    {expense.category} · {formatShortDate(expense.date)}
                  </Text>
                </View>

                {/* Amount */}
                <Text style={[styles.transactionAmount, { color: colors.danger }]}>
                  −{formatAmount(expense.amount, settings.currency)}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Bottom spacer for floating nav bar */}
      <View style={styles.bottomSpacer} />

      {/* ── Onboarding Modal ── */}
      <OnboardingModal
        visible={!settings.hasSeenOnboarding}
        onComplete={completeOnboarding}
      />
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  greeting: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  todayDate: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },

  // Hero card
  heroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.xl,
  },
  heroAccentLine: {
    position: 'absolute',
    top: 0,
    left: SPACING.xl,
    right: SPACING.xl,
    height: 3,
    borderBottomLeftRadius: RADIUS.xs,
    borderBottomRightRadius: RADIUS.xs,
  },
  heroBubble1: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    top: -40,
    right: -30,
  },
  heroBubble2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    bottom: -20,
    left: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  heroBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  heroBalance: {
    fontSize: 42,
    fontFamily: FONTS.bold,
    letterSpacing: -1,
    marginBottom: SPACING.lg,
  },
  heroChipsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  heroChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  heroChipText: {
    gap: 1,
  },
  heroChipLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    letterSpacing: 0.3,
  },
  heroChipAmount: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  heroBudgetSection: {
    gap: SPACING.xs,
  },
  heroBudgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBudgetLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    letterSpacing: 0.3,
  },
  heroBudgetPct: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  heroBudgetTrack: {
    height: 6,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  heroBudgetFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  heroBudgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroBudgetSub: {
    fontSize: 10,
    fontFamily: FONTS.regular,
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
  monthArrow: {
    padding: SPACING.xs,
  },
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

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Recent transactions section
  section: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },

  // Transaction item
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  transactionBorder: {
    borderBottomWidth: 1,
  },
  categoryCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryInitial: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  transactionMeta: {
    flex: 1,
    gap: 2,
  },
  transactionDesc: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  transactionSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  transactionAmount: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    flexShrink: 0,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyEmoji: {
    fontSize: 48,
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
  },

  bottomSpacer: {
    height: 24,
  },
});

export default React.memo(HomeScreen);

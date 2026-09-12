import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { FONTS, SPACING, GUTTER } from '../../constants/theme';
import { getMonthName } from '../../utils/storage';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useNavbarHeight } from '../../hooks/useNavbarHeight';

import MonthPicker from '../MonthPicker';
import SummaryCard from '../SummaryCard';
import ExpenseForm from '../ExpenseForm';
import CategoryBreakdown from '../CategoryBreakdown';
import OnboardingModal from '../OnboardingModal';

const HomeScreen: React.FC = () => {
  const {
    expenses,
    settings,
    selectedDate,
    setSelectedDate,
    addExpense,
    completeOnboarding,
  } = useApp();
  const { colors } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const navbarHeight = useNavbarHeight(); // (#4)

  const isNarrow = windowWidth < 360;

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
    () => filteredExpenses.length > 0
      ? (totalSpent / filteredExpenses.length).toFixed(0)
      : null,
    [totalSpent, filteredExpenses.length],
  );

  const savings = useMemo(
    () => Math.max(parseFloat(settings.income) - totalSpent, 0).toFixed(0),
    [settings.income, totalSpent],
  );

  const budget = useMemo(() => parseFloat(settings.budget), [settings.budget]);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* (#17) max-width wrapper for tablet — caps at 640px centered */}
      <View style={styles.maxWidthWrapper}>
        <MonthPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

        {/* (#26) income prop removed from SummaryCard */}
        <SummaryCard
          spent={totalSpent}
          budget={budget}
          currency={settings.currency}
          month={monthName}
        />

        <ExpenseForm onAdd={addExpense} />

        <CategoryBreakdown
          expenses={filteredExpenses}
          totalSpent={totalSpent}
          currency={settings.currency}
        />

        {/* (#26) Stat row is always rendered to avoid layout jump.
            Shows '—' placeholders when there are no expenses. */}
        <View style={[styles.statsRow, isNarrow && styles.statsRowWrap]}>
          <View style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
            isNarrow && styles.statCardHalf,
          ]}>
            {/* (#8) statLabel bumped from 9px → 11px (below mobile floor) */}
            <Text
              style={[styles.statLabel, { color: colors.textDim }]}
              maxFontSizeMultiplier={1.3} // (#16)
            >
              TRANSACTIONS
            </Text>
            <Text
              style={[styles.statValue, { color: colors.text }]}
              maxFontSizeMultiplier={1.3}
            >
              {filteredExpenses.length > 0 ? filteredExpenses.length : '—'}
            </Text>
          </View>

          <View style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
            isNarrow && styles.statCardHalf,
          ]}>
            <Text
              style={[styles.statLabel, { color: colors.textDim }]}
              maxFontSizeMultiplier={1.3}
            >
              AVG / EXPENSE
            </Text>
            <Text
              style={[styles.statValue, { color: colors.text }]}
              maxFontSizeMultiplier={1.3}
            >
              {avgExpense != null ? `${settings.currency}${avgExpense}` : '—'}
            </Text>
          </View>

          <View style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
            isNarrow && styles.statCardFull,
          ]}>
            <Text
              style={[styles.statLabel, { color: colors.textDim }]}
              maxFontSizeMultiplier={1.3}
            >
              SAVINGS
            </Text>
            <Text
              style={[styles.statValue, { color: colors.accent }]}
              maxFontSizeMultiplier={1.3}
            >
              {filteredExpenses.length > 0 ? `${settings.currency}${savings}` : '—'}
            </Text>
          </View>
        </View>

        {/* (#4) Dynamic navbar clearance replaces hardcoded height: 100 */}
        <View style={{ height: navbarHeight }} />
      </View>

      <OnboardingModal
        visible={!settings.hasSeenOnboarding}
        onComplete={completeOnboarding}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    borderRadius: 14,
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
    // (#8) was 9px — below mobile floor of 11px
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});

export default React.memo(HomeScreen);

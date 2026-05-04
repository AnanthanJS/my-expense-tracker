import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { FONTS, SPACING } from '../../constants/theme';
import { getMonthName } from '../../utils/storage';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';

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
    completeOnboarding
  } = useApp();
  const { colors } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();

  const isNarrow = windowWidth < 360;

  const filteredExpenses = useMemo(() =>
    expenses.filter((e) => {
      const date = new Date(e.date);
      return (
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      );
    }),
    [expenses, selectedDate]
  );

  const totalSpent = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const monthName = useMemo(() => getMonthName(selectedDate), [selectedDate]);

  const avgExpense = useMemo(
    () => filteredExpenses.length > 0
      ? (totalSpent / filteredExpenses.length).toFixed(0)
      : '0',
    [totalSpent, filteredExpenses.length]
  );

  const savings = useMemo(
    () => Math.max(parseFloat(settings.income) - totalSpent, 0).toFixed(0),
    [settings.income, totalSpent]
  );

  const budget = useMemo(() => parseFloat(settings.budget), [settings.budget]);
  const income = useMemo(() => parseFloat(settings.income), [settings.income]);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MonthPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <SummaryCard
        spent={totalSpent}
        budget={budget}
        income={income}
        currency={settings.currency}
        month={monthName}
      />

      <ExpenseForm onAdd={addExpense} />

      <CategoryBreakdown
        expenses={filteredExpenses}
        totalSpent={totalSpent}
        currency={settings.currency}
      />

      {filteredExpenses.length > 0 && (
        <View style={[styles.statsRow, isNarrow && styles.statsRowWrap]}>
          <View style={[
            styles.statCard, 
            { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
            isNarrow && styles.statCardHalf
          ]}>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>TRANSACTIONS</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{filteredExpenses.length}</Text>
          </View>
          <View style={[
            styles.statCard, 
            { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
            isNarrow && styles.statCardHalf
          ]}>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>AVG / EXPENSE</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {settings.currency}{avgExpense}
            </Text>
          </View>
          <View style={[
            styles.statCard, 
            { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
            isNarrow && styles.statCardFull
          ]}>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>SAVINGS</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {settings.currency}{savings}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.navbarSpacer} />

      {/* Onboarding Guide */}
      <OnboardingModal 
        visible={!settings.hasSeenOnboarding} 
        onComplete={completeOnboarding} 
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: SPACING.lg },
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
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  navbarSpacer: {
    height: 100,
  },
});

export default React.memo(HomeScreen);

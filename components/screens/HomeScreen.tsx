import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { Expense, Settings, getMonthName } from '../../utils/storage';

import MonthPicker from '../MonthPicker';
import SummaryCard from '../SummaryCard';
import ExpenseForm from '../ExpenseForm';
import CategoryBreakdown from '../CategoryBreakdown';

interface HomeScreenProps {
  expenses: Expense[];
  settings: Settings;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  expenses,
  settings,
  selectedDate,
  onDateChange,
  onAddExpense,
}) => {
  const filteredExpenses = expenses.filter((e) => {
    const date = new Date(e.date);
    return (
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  });

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthName = getMonthName(selectedDate);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MonthPicker selectedDate={selectedDate} onDateChange={onDateChange} />

      <SummaryCard
        spent={totalSpent}
        budget={parseFloat(settings.budget)}
        income={parseFloat(settings.income)}
        currency={settings.currency}
        month={monthName}
      />

      <ExpenseForm onAdd={onAddExpense} />

      <CategoryBreakdown
        expenses={filteredExpenses}
        totalSpent={totalSpent}
        currency={settings.currency}
      />

      {/* Quick Stats */}
      {filteredExpenses.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TRANSACTIONS</Text>
            <Text style={styles.statValue}>{filteredExpenses.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>AVG / EXPENSE</Text>
            <Text style={styles.statValue}>
              {settings.currency}{(totalSpent / filteredExpenses.length).toFixed(0)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SAVINGS</Text>
            <Text style={[styles.statValue, { color: COLORS.accent }]}>
              {settings.currency}{Math.max(parseFloat(settings.income) - totalSpent, 0).toFixed(0)}
            </Text>
          </View>
        </View>
      )}

      {/* bottom padding for the navbar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: COLORS.textDim,
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});

export default HomeScreen;

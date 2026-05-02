import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import ProgressCircle from './ProgressCircle';

interface SummaryCardProps {
  spent: number;
  budget: number;
  income: number;
  currency: string;
  month: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  spent,
  budget,
  income,
  currency,
  month,
}) => {
  const percentage = (spent / budget) * 100;
  const remaining = Math.max(budget - spent, 0);
  const savings = Math.max(income - spent, 0);

  const getRemainingColor = () => {
    return percentage > 90 ? COLORS.danger : COLORS.accent;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MONTHLY PROGRESS</Text>
        <Text style={styles.month}>{month}</Text>
      </View>

      <View style={styles.content}>
        <ProgressCircle percentage={percentage} size={96} />
        
        <View style={styles.stats}>
          <Text style={styles.spentAmount}>
            {currency}{spent.toFixed(2)}
          </Text>
          <Text style={styles.budgetAmount}>
            of {currency}{budget.toFixed(2)} budget
          </Text>
          <Text style={[styles.remainingText, { color: getRemainingColor() }]}>
            {currency}{remaining.toFixed(2)} remaining
          </Text>
          <Text style={styles.savingsText}>
            {currency}{savings.toFixed(2)} saved
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  month: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stats: {
    flex: 1,
  },
  spentAmount: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  budgetAmount: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  savingsText: {
    color: COLORS.info,
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
});

export default SummaryCard;

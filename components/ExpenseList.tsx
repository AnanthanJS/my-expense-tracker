import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { COLORS, FONTS, CATEGORY_COLORS } from '../constants/theme';
import { Expense } from '../utils/storage';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

interface ExpenseListProps {
  expenses: Expense[];
  currency: string;
  onDelete: (id: string) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  currency,
  onDelete,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RECENT EXPENSES</Text>
      <View style={styles.list}>
        {expenses.length === 0 ? (
          <Text style={styles.emptyMsg}>No expenses yet. Add one above!</Text>
        ) : (
          expenses.map((expense) => (
            <View key={expense.id} style={styles.item}>
              <View style={styles.itemLeft}>
                <View
                  style={[
                    styles.categoryIndicator,
                    { backgroundColor: CATEGORY_COLORS[expense.category] || COLORS.textDim },
                  ]}
                />
                <View>
                  <Text style={styles.description}>{expense.description}</Text>
                  <Text style={styles.meta}>
                    {expense.category} · {formatDate(expense.date)}
                  </Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.amount}>
                  {currency}{expense.amount.toFixed(2)}
                </Text>
                <TouchableOpacity
                  onPress={() => onDelete(expense.id)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  title: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    marginBottom: 15,
  },
  list: {
    gap: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  description: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  meta: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amount: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    color: COLORS.textDim,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  emptyMsg: {
    color: COLORS.textDim,
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default ExpenseList;

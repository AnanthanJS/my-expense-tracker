import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, CATEGORY_COLORS } from '../constants/theme';

interface CategoryBreakdownProps {
  expenses: { category: string; amount: number }[];
  totalSpent: number;
  currency: string;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  expenses,
  totalSpent,
  currency,
}) => {
  if (expenses.length === 0) return null;

  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BY CATEGORY</Text>
      <View style={styles.list}>
        {sortedCategories.map(([category, amount]) => {
          const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
          return (
            <View key={category} style={styles.item}>
              <Text style={styles.categoryName} numberOfLines={1}>
                {category}
              </Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${percentage}%`,
                      backgroundColor: CATEGORY_COLORS[category] || COLORS.textDim,
                    },
                  ]}
                />
              </View>
              <Text style={styles.amount}>
                {currency}{amount.toFixed(0)}
              </Text>
            </View>
          );
        })}
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
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    width: 80,
  },
  barContainer: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  amount: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.regular,
    width: 60,
    textAlign: 'right',
  },
});

export default CategoryBreakdown;

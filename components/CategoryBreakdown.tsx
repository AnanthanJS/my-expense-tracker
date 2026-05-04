import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS, CATEGORY_COLORS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

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
  const { colors } = useAppTheme();
  
  const sortedCategories = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    return Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  if (expenses.length === 0) return null;

  return (
    <View 
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}
      accessible={true}
      accessibilityLabel={`Spending breakdown by category. Total spent: ${currency}${totalSpent.toFixed(2)}`}
    >
      <Text style={[styles.title, { color: colors.textMuted }]}>BY CATEGORY</Text>
      <View style={styles.list}>
        {sortedCategories.map(([category, amount]) => {
          const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
          return (
            <View 
              key={category} 
              style={styles.item}
              accessible={true}
              accessibilityLabel={`${category}: ${currency}${amount.toFixed(0)}, which is ${Math.round(percentage)}% of total spending.`}
            >
              <Text style={[styles.categoryName, { color: colors.textMuted }]} numberOfLines={1}>
                {category}
              </Text>
              <View style={[styles.barContainer, { backgroundColor: colors.surfaceLight }]} aria-hidden={true}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${percentage}%`,
                      backgroundColor: CATEGORY_COLORS[category] || colors.textDim,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.amount, { color: colors.textDim }]}>
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
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
  },
  title: {
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
    fontSize: 12,
    fontFamily: FONTS.regular,
    width: 80,
  },
  barContainer: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  amount: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    width: 60,
    textAlign: 'right',
  },
});

export default React.memo(CategoryBreakdown);

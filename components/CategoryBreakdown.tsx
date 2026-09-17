import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SPACING, GLASS, TEXT, RADII, getCategoryColor, getBudgetTone } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useApp } from '../context/AppContext';
import { formatCurrencyCompact } from '../utils/formatCurrency';

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
  const { colors, isDark } = useAppTheme();
  const { settings } = useApp();
  const glass = isDark ? GLASS.dark : GLASS.light;
  
  const sortedCategories = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    return Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  if (expenses.length === 0) return null;

  return (
    <Animated.View 
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.duration(200)}
      style={[styles.container, { 
        backgroundColor: glass.card, 
        borderColor: glass.border,
        shadowColor: glass.shadow,
        elevation: 3
      }]}
      accessible={true}
      accessibilityLabel={`Spending breakdown by category. Total spent: ${formatCurrencyCompact(totalSpent, currency)}`}
    >
      <Text style={[styles.title, { color: colors.textDim }]}>By category</Text>
      <View style={styles.list}>
        {sortedCategories.map(([category, amount]) => {
          const budgetLimit = settings.categoryBudgets?.[category];
          let percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
          let barColor = getCategoryColor(category);
          let displayAmount = formatCurrencyCompact(amount, currency);

          if (budgetLimit && budgetLimit > 0) {
            percentage = (amount / budgetLimit) * 100;
            displayAmount = `${formatCurrencyCompact(amount, currency)} / ${budgetLimit.toLocaleString()}`;
            // Same ramp as the monthly budget, rather than a second
            // hand-rolled threshold with a hardcoded amber.
            barColor = getBudgetTone(amount, budgetLimit, colors);
          }
          const barWidth = Math.min(percentage, 100);

          return (
            <View 
              key={category} 
              style={styles.item}
              accessible={true}
              accessibilityLabel={`${category}: ${displayAmount}, which is ${Math.round(percentage)}% of ${budgetLimit ? 'budget limit' : 'total spending'}.`}
            >
              <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                {category}
              </Text>
              <View style={[styles.barContainer, { backgroundColor: colors.surfaceLight }]} aria-hidden={true}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${barWidth}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.amount, { color: colors.textMuted }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {displayAmount}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
  },
  title: {
    ...TEXT.labelSm,
    marginBottom: SPACING.lg,
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
    ...TEXT.labelSm,
    width: 80,
  },
  barContainer: {
    flex: 1,
    height: 12,
    borderRadius: RADII.pill,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: RADII.pill,
  },
  amount: {
    ...TEXT.moneySm,
    minWidth: 64,
    maxWidth: 120,
    flexShrink: 0,
    textAlign: 'right',
  },
});

export default React.memo(CategoryBreakdown);

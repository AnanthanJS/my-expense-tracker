import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import type { ListRenderItemInfo } from 'react-native';

import { FONTS, SPACING, CATEGORY_COLORS } from '../constants/theme';
import type { Expense } from '../utils/storage';
import { formatDate } from '../utils/formatDate';
import { useAppTheme } from '../hooks/useAppTheme';

type ThemeColors = ReturnType<typeof useAppTheme>['colors'];

interface ExpenseListProps {
  expenses: Expense[];
  currency: string;
  onDelete: (id: string) => void;
}

const ITEM_HEIGHT = 62;

interface RowProps {
  item: Expense;
  currency: string;
  onDelete: (id: string) => void;
  colors: ThemeColors;
}

const ExpenseRow = React.memo(({ item, currency, onDelete, colors }: RowProps) => {
  const handleDelete = useCallback(() => onDelete(item.id), [item.id, onDelete]);
  return (
    <View style={[styles.item, { borderBottomColor: colors.surfaceLight }]}>
      <View style={styles.itemLeft}>
        <View
          style={[
            styles.categoryIndicator,
            { backgroundColor: CATEGORY_COLORS[item.category] || colors.textDim },
          ]}
        />
        <View>
          <Text style={[styles.description, { color: colors.text }]}>{item.description}</Text>
          <Text style={[styles.meta, { color: colors.textDim }]}>
            {item.category} · {formatDate(item.date)}
          </Text>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.amount, { color: colors.text }]}>
          {currency}{item.amount.toFixed(2)}
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.deleteText, { color: colors.textDim }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, currency, onDelete }) => {
  const { colors } = useAppTheme();
  
  const keyExtractor = useCallback((item: Expense) => item.id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<Expense> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Expense>) => (
      <ExpenseRow item={item} currency={currency} onDelete={onDelete} colors={colors} />
    ),
    [currency, onDelete, colors]
  );

  const ListEmpty = useMemo(() => (
    <Text style={[styles.emptyMsg, { color: colors.textDim }]}>No expenses yet. Add one above!</Text>
  ), [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
      <Text style={[styles.title, { color: colors.textMuted }]}>RECENT EXPENSES</Text>
      <FlatList
        data={expenses}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        scrollEnabled={false}
        ListEmptyComponent={ListEmpty}
      />
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    height: ITEM_HEIGHT,
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
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  meta: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amount: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  emptyMsg: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default React.memo(ExpenseList);

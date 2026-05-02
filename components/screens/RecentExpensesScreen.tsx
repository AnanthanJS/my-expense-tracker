import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS, FONTS, CATEGORY_COLORS } from '../../constants/theme';
import { Expense } from '../../utils/storage';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

interface RecentExpensesScreenProps {
  expenses: Expense[];
  currency: string;
  onDelete: (id: string) => void;
}

const ALL_CATEGORIES = ['All', 'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];

const RecentExpensesScreen: React.FC<RecentExpensesScreenProps> = ({
  expenses,
  currency,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          placeholderTextColor={COLORS.textDim}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {ALL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary row */}
      {filtered.length > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>{filtered.length} expense{filtered.length !== 1 ? 's' : ''}</Text>
          <Text style={styles.summaryAmount}>{currency}{totalFiltered.toFixed(2)}</Text>
        </View>
      )}

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={styles.emptyTitle}>No expenses found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your search or filter.'
                : 'Add your first expense from the Home tab.'}
            </Text>
          </View>
        ) : (
          filtered.map((expense) => (
            <View key={expense.id} style={styles.item}>
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: CATEGORY_COLORS[expense.category] || COLORS.textDim },
                ]}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemDesc} numberOfLines={1}>{expense.description}</Text>
                <Text style={styles.itemMeta}>{expense.category} · {formatDate(expense.date)}</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemAmount}>{currency}{expense.amount.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => onDelete(expense.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        {/* extra bottom padding for navbar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.regular,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  clearIcon: { color: COLORS.textDim, fontSize: 14, padding: 4 },
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  filterChipTextActive: {
    color: COLORS.background,
    fontFamily: FONTS.bold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  summaryText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  summaryAmount: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    gap: 12,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  itemInfo: { flex: 1 },
  itemDesc: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  itemMeta: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemAmount: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  deleteBtn: { padding: 4 },
  deleteText: {
    color: COLORS.textDim,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  emptySubtitle: {
    color: COLORS.textDim,
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RecentExpensesScreen;

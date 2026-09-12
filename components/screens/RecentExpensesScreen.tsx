import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import {
  IconSearch,
  IconX,
  IconFilter,
  IconCheck,
  IconArrowsSort,
  IconTrendingUp,
  IconTrendingDown,
  IconFileExport,
  IconFileTypePdf,
  IconFileImport,
  IconDotsVertical,
  IconReceipt,
} from '@tabler/icons-react-native';
import { FONTS, CATEGORY_COLORS, GUTTER, SCRIM } from '../../constants/theme';
import type { Expense } from '../../utils/storage';
import { formatDate } from '../../utils/formatDate';
import { exportExpensesAsJson, exportExpensesAsPdf, pickExpensesJson } from '../../utils/expenseTransfer';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useNavbarHeight } from '../../hooks/useNavbarHeight';

type ThemeColors = ReturnType<typeof useAppTheme>['colors'];

const ITEM_HEIGHT = 68;

interface ExpenseRowProps {
  item: Expense;
  currency: string;
  onDelete: (id: string) => void;
  colors: ThemeColors;
}

const ExpenseRow = React.memo(({ item, currency, onDelete, colors }: ExpenseRowProps) => {
  const handleDelete = useCallback(() => onDelete(item.id), [item.id, onDelete]);

  return (
    <View
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}
      accessible={true}
      accessibilityLabel={`Expense: ${item.description}, Amount: ${currency}${item.amount.toFixed(2)}, Category: ${item.category}, Date: ${formatDate(item.date)}`}
    >
      <View
        style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[item.category] || colors.textDim }]}
      />
      <View style={styles.itemInfo}>
        <Text
          style={[styles.itemDesc, { color: colors.text }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.3} // (#16)
        >
          {item.description}
        </Text>
        <Text
          style={[styles.itemMeta, { color: colors.textDim }]}
          numberOfLines={1} // (#16) prevents clip at large system font sizes
          maxFontSizeMultiplier={1.3}
        >
          {item.category} · {formatDate(item.date)}
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text
          style={[styles.itemAmount, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {currency}{item.amount.toFixed(2)}
        </Text>
        {/* (#14, #15) accessibilityLabel + role; hitSlop 12 all sides */}
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Delete expense"
          accessibilityRole="button"
        >
          <IconX size={18} color={colors.textDim} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

type SortOption = 'newest' | 'oldest' | 'high-to-low' | 'low-to-high';

const RecentExpensesScreen: React.FC = () => {
  const { expenses, settings, deleteExpense, importExpenses, showFeedback } = useApp();
  const { colors } = useAppTheme();
  const navbarHeight = useNavbarHeight(); // (#4)

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showTransferSheet, setShowTransferSheet] = useState(false); // (#21)

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const filtered = useMemo(() => {
    let result = [...expenses];

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.description.toLowerCase().includes(lower) ||
        e.category.toLowerCase().includes(lower),
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter(e => selectedCategories.includes(e.category));
    }

    if (minPrice) result = result.filter(e => e.amount >= parseFloat(minPrice));
    if (maxPrice) result = result.filter(e => e.amount <= parseFloat(maxPrice));

    result.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOption === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOption === 'high-to-low') return b.amount - a.amount;
      if (sortOption === 'low-to-high') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [expenses, searchQuery, selectedCategories, sortOption, minPrice, maxPrice]);

  const totalFiltered = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered],
  );

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSortOption('newest');
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters = selectedCategories.length > 0 || minPrice || maxPrice || sortOption !== 'newest';
  const activeFilterCount = useMemo(
    () =>
      selectedCategories.length +
      (minPrice ? 1 : 0) +
      (maxPrice ? 1 : 0) +
      (sortOption !== 'newest' ? 1 : 0),
    [maxPrice, minPrice, selectedCategories.length, sortOption],
  );

  // (#19) Route non-blocking alerts through Snackbar
  const handleExportJson = useCallback(async () => {
    setShowTransferSheet(false);
    if (filtered.length === 0) {
      showFeedback('Nothing to export — no expenses in current view.', 'error');
      return;
    }
    try {
      await exportExpensesAsJson(filtered);
    } catch (e) {
      showFeedback(`Export failed: ${e instanceof Error ? e.message : 'Could not export JSON.'}`, 'error');
    }
  }, [filtered, showFeedback]);

  const handleExportPdf = useCallback(async () => {
    setShowTransferSheet(false);
    if (filtered.length === 0) {
      showFeedback('Nothing to export — no expenses in current view.', 'error');
      return;
    }
    try {
      await exportExpensesAsPdf(filtered, settings);
    } catch (e) {
      showFeedback(`Export failed: ${e instanceof Error ? e.message : 'Could not export PDF.'}`, 'error');
    }
  }, [filtered, settings, showFeedback]);

  const handleImportJson = useCallback(async () => {
    setShowTransferSheet(false);
    try {
      const imported = await pickExpensesJson();
      if (!imported) return;
      // (#19) Keep Alert only for this genuinely blocking merge/replace choice
      Alert.alert(
        'Import expenses',
        `${imported.length} expense${imported.length === 1 ? '' : 's'} found. How would you like to import them?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Merge', onPress: () => importExpenses(imported, 'merge') },
          { text: 'Replace', style: 'destructive', onPress: () => importExpenses(imported, 'replace') },
        ],
      );
    } catch (e) {
      showFeedback(`Import failed: ${e instanceof Error ? e.message : 'Could not import JSON.'}`, 'error');
    }
  }, [importExpenses, showFeedback]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Expense>) => (
      <ExpenseRow item={item} currency={settings.currency} onDelete={deleteExpense} colors={colors} />
    ),
    [settings.currency, deleteExpense, colors],
  );

  // (#22) Two distinct empty states
  const hasFiltersApplied = hasActiveFilters || searchQuery.length > 0;
  const ListEmpty = useMemo(() => {
    if (expenses.length === 0) {
      // No data yet — friendly first-run state
      return (
        <View style={styles.empty}>
          <IconReceipt size={64} color={colors.surfaceLight} strokeWidth={1} />
          <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No expenses yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>
            Head to the Home tab to add your first expense.
          </Text>
        </View>
      );
    }
    // Data exists but filters matched nothing
    return (
      <View style={styles.empty}>
        <IconSearch size={64} color={colors.surfaceLight} strokeWidth={1} />
        <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No results found</Text>
        {hasFiltersApplied && (
          <TouchableOpacity
            onPress={() => { resetFilters(); setSearchQuery(''); }}
            style={[styles.clearFiltersBtn, { borderColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
          >
            <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [expenses.length, hasFiltersApplied, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
          <IconSearch size={18} color={colors.textDim} strokeWidth={2} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search expenses..."
            placeholderTextColor={colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search expenses" // (#14)
          />
          {searchQuery.length > 0 && (
            // (#14) Clear search button labeled
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <IconX size={16} color={colors.textDim} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* (#14) Filter button labeled; (#21) overflow dots beside it */}
        <TouchableOpacity
          style={[
            styles.headerIconBtn,
            { backgroundColor: colors.surface, borderColor: hasActiveFilters ? colors.primary : colors.surfaceLight },
          ]}
          onPress={() => setShowFilters(true)}
          accessibilityLabel="Filter expenses"
          accessibilityRole="button"
        >
          <IconFilter size={20} color={hasActiveFilters ? colors.primary : colors.textMuted} strokeWidth={2} />
          {hasActiveFilters && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.filterBadgeText, { color: colors.onPrimary }]}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* (#21) Overflow menu button — replaces always-visible transferRow */}
        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}
          onPress={() => setShowTransferSheet(true)}
          accessibilityLabel="Export or import expenses"
          accessibilityRole="button"
        >
          <IconDotsVertical size={20} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Summary Row — always rendered (#22) */}
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryText, { color: colors.textDim }]}>
          {filtered.length} expense{filtered.length !== 1 ? 's' : ''} shown
        </Text>
        <Text style={[styles.summaryAmount, { color: colors.primary }]}>
          {filtered.length > 0 ? `${settings.currency}${totalFiltered.toFixed(0)}` : ''}
        </Text>
      </View>

      {/* Main List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        initialNumToRender={12}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={<View style={{ height: navbarHeight }} />}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        {/* (#13) SCRIM token at 0.5 — was 0.8 */}
        <View style={[styles.modalOverlay, { backgroundColor: `rgba(0,0,0,${SCRIM})` }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter & Sort</Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                accessibilityLabel="Close filter sheet"
                accessibilityRole="button"
              >
                <IconX size={24} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Sort Section */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.textMuted }]}>SORT BY</Text>
                <View style={styles.sortGrid}>
                  {(['newest', 'oldest', 'high-to-low', 'low-to-high'] as SortOption[]).map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.sortCard,
                        { backgroundColor: colors.surfaceLight, borderColor: sortOption === opt ? colors.primary : 'transparent' },
                      ]}
                      onPress={() => setSortOption(opt)}
                      // (#14) Sort cards get selected state
                      accessibilityState={{ selected: sortOption === opt }}
                      accessibilityRole="radio"
                      accessibilityLabel={opt.replace(/-/g, ' ')}
                    >
                      {opt === 'high-to-low'
                        ? <IconTrendingUp size={18} color={sortOption === opt ? colors.primary : colors.textDim} />
                        : opt === 'low-to-high'
                          ? <IconTrendingDown size={18} color={sortOption === opt ? colors.primary : colors.textDim} />
                          : <IconArrowsSort size={18} color={sortOption === opt ? colors.primary : colors.textDim} />
                      }
                      <Text style={[styles.sortLabel, { color: sortOption === opt ? colors.text : colors.textMuted }]}>
                        {opt.replace(/-/g, ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.textMuted }]}>PRICE RANGE</Text>
                <View style={styles.rangeRow}>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                    placeholder="Min"
                    placeholderTextColor={colors.textDim}
                    keyboardType="decimal-pad"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    accessibilityLabel="Minimum price"
                  />
                  <Text style={{ color: colors.textDim }}>-</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                    placeholder="Max"
                    placeholderTextColor={colors.textDim}
                    keyboardType="decimal-pad"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    accessibilityLabel="Maximum price"
                  />
                </View>
              </View>

              {/* Categories */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.textMuted }]}>CATEGORIES</Text>
                <View style={styles.catGrid}>
                  {settings.categories.map(cat => {
                    const active = selectedCategories.includes(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.catChip,
                          { backgroundColor: colors.surfaceLight },
                          active && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => toggleCategory(cat)}
                        // (#14) Category chips get selected state
                        accessibilityState={{ selected: active }}
                        accessibilityRole="checkbox"
                        accessibilityLabel={cat}
                      >
                        <Text style={[styles.catChipText, { color: active ? colors.onPrimary : colors.textMuted }]}>
                          {cat}
                        </Text>
                        {active && <IconCheck size={14} color={colors.onPrimary} style={{ marginLeft: 4 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.surfaceLight }]}>
              <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
                <Text style={[styles.resetText, { color: colors.textDim }]}>Reset All</Text>
              </TouchableOpacity>
              {/* (#20) "Apply Filters" → "Done" — filters apply live, button only dismisses */}
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                accessibilityLabel="Done, close filter sheet"
                accessibilityRole="button"
              >
                <Text style={[styles.applyText, { color: colors.onPrimary }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* (#21) Transfer Bottom Sheet — export/import moved out of main UI */}
      <Modal
        visible={showTransferSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTransferSheet(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: `rgba(0,0,0,${SCRIM})` }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Export & Import</Text>
              <TouchableOpacity
                onPress={() => setShowTransferSheet(false)}
                accessibilityLabel="Close export sheet"
                accessibilityRole="button"
              >
                <IconX size={24} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <View style={styles.transferSheetBody}>
              {/* (#14) All transfer buttons labeled */}
              <TouchableOpacity
                style={[styles.transferSheetRow, { borderBottomColor: colors.surfaceLight }]}
                onPress={handleExportJson}
                accessibilityLabel="Export as JSON"
                accessibilityRole="button"
              >
                <IconFileExport size={22} color={colors.primary} />
                <View style={styles.transferSheetText}>
                  <Text style={[styles.transferSheetTitle, { color: colors.text }]}>Export JSON</Text>
                  <Text style={[styles.transferSheetDesc, { color: colors.textDim }]}>Share current view as a JSON file</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.transferSheetRow, { borderBottomColor: colors.surfaceLight }]}
                onPress={handleExportPdf}
                accessibilityLabel="Export as PDF"
                accessibilityRole="button"
              >
                <IconFileTypePdf size={22} color={colors.primary} />
                <View style={styles.transferSheetText}>
                  <Text style={[styles.transferSheetTitle, { color: colors.text }]}>Export PDF</Text>
                  <Text style={[styles.transferSheetDesc, { color: colors.textDim }]}>Save current view as a printable PDF</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.transferSheetRow, { borderBottomColor: 'transparent' }]}
                onPress={handleImportJson}
                accessibilityLabel="Import from JSON"
                accessibilityRole="button"
              >
                <IconFileImport size={22} color={colors.primary} />
                <View style={styles.transferSheetText}>
                  <Text style={[styles.transferSheetTitle, { color: colors.text }]}>Import JSON</Text>
                  <Text style={[styles.transferSheetDesc, { color: colors.textDim }]}>Merge or replace from a JSON file</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    // (#3) GUTTER — was SPACING.xl (24), now 20
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  headerIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // (#3) GUTTER
    paddingHorizontal: GUTTER,
    marginBottom: 12,
  },
  summaryText: { fontSize: 11, fontFamily: FONTS.regular },
  summaryAmount: { fontSize: 13, fontFamily: FONTS.bold },
  // (#3) GUTTER
  listContent: { paddingHorizontal: GUTTER },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
    height: ITEM_HEIGHT,
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  itemInfo: { flex: 1 },
  itemDesc: { fontSize: 14, fontFamily: FONTS.medium },
  itemMeta: { fontSize: 12, fontFamily: FONTS.regular },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemAmount: { fontSize: 14, fontFamily: FONTS.bold },
  deleteBtn: { padding: 4 },

  // (#22) Empty states
  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: FONTS.bold },
  emptySubtitle: { fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center', paddingHorizontal: 32 },
  clearFiltersBtn: { marginTop: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  clearFiltersText: { fontSize: 13, fontFamily: FONTS.bold },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold },
  modalScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  modalSection: { marginBottom: 24 },
  modalSectionTitle: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.5, marginBottom: 12 },
  sortGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sortCard: {
    width: '48.5%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  sortLabel: { fontSize: 10, fontFamily: FONTS.bold },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalInput: { flex: 1, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: FONTS.regular },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  catChipText: { fontSize: 12, fontFamily: FONTS.medium },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    gap: 16,
  },
  resetBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resetText: { fontSize: 14, fontFamily: FONTS.bold },
  applyBtn: { flex: 2, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  applyText: { fontSize: 16, fontFamily: FONTS.bold },

  // (#21) Transfer bottom sheet
  transferSheetBody: { paddingHorizontal: 24, paddingBottom: 40 },
  transferSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  transferSheetText: { flex: 1 },
  transferSheetTitle: { fontSize: 15, fontFamily: FONTS.bold, marginBottom: 2 },
  transferSheetDesc: { fontSize: 12, fontFamily: FONTS.regular },
});

export default React.memo(RecentExpensesScreen);

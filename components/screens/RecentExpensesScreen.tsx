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
import IconSearch from '@tabler/icons-react-native/dist/esm/icons/IconSearch';
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX';
import IconFilter from '@tabler/icons-react-native/dist/esm/icons/IconFilter';
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck';
import IconArrowsSort from '@tabler/icons-react-native/dist/esm/icons/IconArrowsSort';
import IconTrendingUp from '@tabler/icons-react-native/dist/esm/icons/IconTrendingUp';
import IconTrendingDown from '@tabler/icons-react-native/dist/esm/icons/IconTrendingDown';
import IconFileExport from '@tabler/icons-react-native/dist/esm/icons/IconFileExport';
import IconFileTypePdf from '@tabler/icons-react-native/dist/esm/icons/IconFileTypePdf';
import IconFileImport from '@tabler/icons-react-native/dist/esm/icons/IconFileImport';
import { FONTS, CATEGORY_COLORS, SPACING } from '../../constants/theme';
import type { Expense } from '../../utils/storage';
import { formatDate } from '../../utils/formatDate';
import { exportExpensesAsJson, exportExpensesAsPdf, pickExpensesJson } from '../../utils/expenseTransfer';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';

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
        style={[
          styles.categoryDot,
          { backgroundColor: CATEGORY_COLORS[item.category] || colors.textDim },
        ]}
      />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemDesc, { color: colors.text }]} numberOfLines={1}>{item.description}</Text>
        <Text style={[styles.itemMeta, { color: colors.textDim }]}>{item.category} · {formatDate(item.date)}</Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemAmount, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
          {currency}{item.amount.toFixed(2)}
        </Text>
        <TouchableOpacity 
          onPress={handleDelete} 
          style={styles.deleteBtn} 
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <IconX size={18} color={colors.textDim} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

type SortOption = 'newest' | 'oldest' | 'high-to-low' | 'low-to-high';

const RecentExpensesScreen: React.FC = () => {
  const { expenses, settings, deleteExpense, importExpenses } = useApp();
  const { colors } = useAppTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const filtered = useMemo(() => {
    let result = [...expenses];

    // Search
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.description.toLowerCase().includes(lower) || 
        e.category.toLowerCase().includes(lower)
      );
    }

    // Category Filter
    if (selectedCategories.length > 0) {
      result = result.filter(e => selectedCategories.includes(e.category));
    }

    // Price Range Filter
    if (minPrice) {
      result = result.filter(e => e.amount >= parseFloat(minPrice));
    }
    if (maxPrice) {
      result = result.filter(e => e.amount <= parseFloat(maxPrice));
    }

    // Sorting
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
    [filtered]
  );

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
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

  const handleExportJson = useCallback(async () => {
    if (filtered.length === 0) {
      Alert.alert('Nothing to export', 'There are no expenses in the current view.');
      return;
    }

    try {
      await exportExpensesAsJson(filtered);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Could not export expenses as JSON.');
    }
  }, [filtered]);

  const handleExportPdf = useCallback(async () => {
    if (filtered.length === 0) {
      Alert.alert('Nothing to export', 'There are no expenses in the current view.');
      return;
    }

    try {
      await exportExpensesAsPdf(filtered, settings);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Could not export expenses as PDF.');
    }
  }, [filtered, settings]);

  const handleImportJson = useCallback(async () => {
    try {
      const imported = await pickExpensesJson();
      if (!imported) return;

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
      Alert.alert('Import failed', e instanceof Error ? e.message : 'Could not import this JSON file.');
    }
  }, [importExpenses]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Expense>) => (
      <ExpenseRow item={item} currency={settings.currency} onDelete={deleteExpense} colors={colors} />
    ),
    [settings.currency, deleteExpense, colors]
  );

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
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconX size={16} color={colors.textDim} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[
            styles.filterBtn, 
            { backgroundColor: colors.surface, borderColor: hasActiveFilters ? colors.primary : colors.surfaceLight }
          ]}
          onPress={() => setShowFilters(true)}
        >
          <IconFilter size={20} color={hasActiveFilters ? colors.primary : colors.textMuted} strokeWidth={2} />
          {hasActiveFilters && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.filterBadgeText, { color: colors.background }]}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.transferRow}>
        <TouchableOpacity
          style={[styles.transferBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}
          onPress={handleExportJson}
        >
          <IconFileExport size={16} color={colors.primary} />
          <Text style={[styles.transferText, { color: colors.textMuted }]}>JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.transferBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}
          onPress={handleExportPdf}
        >
          <IconFileTypePdf size={16} color={colors.primary} />
          <Text style={[styles.transferText, { color: colors.textMuted }]}>PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.transferBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}
          onPress={handleImportJson}
        >
          <IconFileImport size={16} color={colors.primary} />
          <Text style={[styles.transferText, { color: colors.textMuted }]}>Import</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Row */}
      {filtered.length > 0 && (
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: colors.textDim }]}>
            {filtered.length} expense{filtered.length !== 1 ? 's' : ''} shown
          </Text>
          <Text style={[styles.summaryAmount, { color: colors.primary }]}>{settings.currency}{totalFiltered.toFixed(0)}</Text>
        </View>
      )}

      {/* Main List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        initialNumToRender={12}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSearch size={64} color={colors.surfaceLight} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No results found</Text>
          </View>
        }
        ListFooterComponent={<View style={styles.navbarSpacer} />}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
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
                        { backgroundColor: colors.surfaceLight, borderColor: sortOption === opt ? colors.primary : 'transparent' }
                      ]}
                      onPress={() => setSortOption(opt)}
                    >
                      {opt === 'high-to-low' ? <IconTrendingUp size={18} color={sortOption === opt ? colors.primary : colors.textDim} /> :
                       opt === 'low-to-high' ? <IconTrendingDown size={18} color={sortOption === opt ? colors.primary : colors.textDim} /> :
                       <IconArrowsSort size={18} color={sortOption === opt ? colors.primary : colors.textDim} />}
                      <Text style={[
                        styles.sortLabel, 
                        { color: sortOption === opt ? colors.text : colors.textMuted }
                      ]}>
                        {opt.replace(/-/g, ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range Section */}
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
                  />
                  <Text style={{ color: colors.textDim }}>-</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                    placeholder="Max"
                    placeholderTextColor={colors.textDim}
                    keyboardType="decimal-pad"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                </View>
              </View>

              {/* Categories Section */}
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
                          active && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => toggleCategory(cat)}
                      >
                        <Text style={[styles.catChipText, { color: active ? colors.background : colors.textMuted }]}>
                          {cat}
                        </Text>
                        {active && <IconCheck size={14} color={colors.background} style={{ marginLeft: 4 }} />}
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
              <TouchableOpacity 
                onPress={() => setShowFilters(false)}
                style={[styles.applyBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.applyText, { color: colors.background }]}>Apply Filters</Text>
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
    paddingHorizontal: SPACING.xl,
    paddingTop: 10,
    gap: 12,
    marginBottom: 16,
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
  filterBtn: {
    width: 48,
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
  transferRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: 8,
    marginBottom: 14,
  },
  transferBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  transferText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginBottom: 12,
  },
  summaryText: { fontSize: 11, fontFamily: FONTS.regular },
  summaryAmount: { fontSize: 13, fontFamily: FONTS.bold },
  listContent: { paddingHorizontal: SPACING.xl },
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
  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: FONTS.bold },
  navbarSpacer: { height: 100 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
});

export default React.memo(RecentExpensesScreen);

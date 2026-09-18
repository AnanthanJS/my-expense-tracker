import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  SectionList,
  Platform,
  Modal,
  ScrollView,
  Alert,
  Image,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import AnimatedRN from 'react-native-reanimated';
import { listLayout, rowEntering, rowExiting } from '../../constants/motion';
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
  IconTrash,
  IconPlus,
  IconEdit,
} from '@tabler/icons-react-native';
import { FONTS, GUTTER, GLASS, TEXT, RADII, SCRIM_COLOR, SCRIM_COLOR_OPAQUE, getCategoryColor } from '../../constants/theme';
import type { Expense, RecurringExpense } from '../../utils/storage';
import { formatDate, toLocalISODate } from '../../utils/formatDate';
import { getMonthName } from '../../utils/storage';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency';
import { exportExpensesAsJson, exportExpensesAsPdf, pickExpensesJson } from '../../utils/expenseTransfer';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useNavbarHeight } from '../../hooks/useNavbarHeight';
import ExpenseForm from '../ExpenseForm';
import MonthPill from '../MonthPill';
import { useExpenseToast } from '../../hooks/useExpenseToast';
import PressableScale from '../PressableScale';

type ThemeColors = ReturnType<typeof useAppTheme>['colors'];

/**
 * (A10) Rows were a hard `height: 72` pinned by `getItemLayout`. At the 1.3x
 * font scale the rows themselves allow, the description plus meta line needs
 * ~48px against the 44px that left — so the text clipped. `minHeight` lets a
 * row grow; dropping `getItemLayout` is the cost (the list measures rows
 * itself instead), which is the right trade at this list size.
 */
const ITEM_MIN_HEIGHT = 72;

/** "Today" / "Yesterday" / "14 Sep 2026" for a YYYY-MM-DD key. */
function formatDayHeading(dateKey: string): string {
  const today = toLocalISODate(new Date());
  if (dateKey === today) return 'Today';
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  if (dateKey === toLocalISODate(yesterdayDate)) return 'Yesterday';
  return formatDate(dateKey);
}

// ─── Expense Row ──────────────────────────────────────────────────────────────
interface ExpenseRowProps {
  item: Expense;
  currency: string;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  onViewReceipt?: (uri: string) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ExpenseRow = React.memo(({ item, currency, onDelete, onEdit, onViewReceipt, colors, isDark }: ExpenseRowProps) => {
  const glass = isDark ? GLASS.dark : GLASS.light;
  const categoryColor = getCategoryColor(item.category);

  // (C4) Deletes immediately; the toast offers Undo for 5s.
  const handleDelete = useCallback(() => onDelete(item.id), [item.id, onDelete]);

  return (
    <AnimatedRN.View
      // Fade only, no travel: rows here mount as the list scrolls, and a row
      // sliding in while the list is already moving reads as a glitch.
      entering={rowEntering()}
      exiting={rowExiting()}
      layout={listLayout()}
      style={[styles.item, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}
    >
      {/* (C5) The whole row opens the editor — previously an expense could
          only be deleted and retyped. */}
      <PressableScale
        style={styles.itemMain}
        onPress={() => onEdit(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.description}, ${formatCurrency(item.amount, currency)}, ${item.category}`}
        accessibilityHint="Opens this expense for editing"
      >
        <View style={[styles.categoryPill, { backgroundColor: categoryColor + '28' }]}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemDesc, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {item.description}
          </Text>
          <Text style={[styles.itemMeta, { color: colors.textDim }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {item.category} · {formatDate(item.date)}
          </Text>
        </View>
      </PressableScale>
      <View style={styles.itemRight}>
        <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <Text style={[styles.itemAmount, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(item.amount, currency, { negative: true })}
          </Text>
          {item.receiptUri && (
            <PressableScale style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={`View receipt for ${item.description}`} accessibilityRole="button"
              onPress={() => onViewReceipt && onViewReceipt(item.receiptUri!)}>
              <IconReceipt size={13} color={colors.primary} />
              <Text style={{ ...TEXT.caption, color: colors.primary }}>Receipt</Text>
            </PressableScale>
          )}
        </View>
        <PressableScale onPress={handleDelete} style={styles.deleteBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel={`Delete ${item.description}`} accessibilityRole="button">
          <IconTrash size={15} color={colors.danger} strokeWidth={2} />
        </PressableScale>
      </View>
    </AnimatedRN.View>
  );
});

// ─── Recurring Card ───────────────────────────────────────────────────────────
interface RecurringCardProps {
  item: RecurringExpense;
  currency: string;
  colors: ThemeColors;
  isDark: boolean;
  onEdit: (item: RecurringExpense) => void;
  onDelete: (id: string) => void;
}

const RecurringCard = React.memo(({ item, currency, colors, isDark, onEdit, onDelete }: RecurringCardProps) => {
  const glass = isDark ? GLASS.dark : GLASS.light;
  const categoryColor = getCategoryColor(item.category);

  return (
    <AnimatedRN.View
      entering={rowEntering()} exiting={rowExiting()} layout={listLayout()}
      style={[styles.item, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow, paddingVertical: 14 }]}
    >
      <View style={[styles.categoryPill, { backgroundColor: categoryColor + '28' }]}>
        <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemDesc, { color: colors.text }]} numberOfLines={1}>{item.description}</Text>
        <Text style={[styles.itemMeta, { color: colors.textDim }]} numberOfLines={1}>{item.category} · {item.frequency}</Text>
        <Text style={[styles.itemMeta, { color: colors.primary, marginTop: 2 }]} numberOfLines={1}>Next: {item.nextDueDate}</Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemAmount, { color: colors.text }]}>
          {item.isVariableAmount ? 'Variable' : formatCurrency(item.amount, currency)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PressableScale onPress={() => onEdit(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconEdit size={15} color={colors.textDim} />
          </PressableScale>
          <PressableScale onPress={() => onDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Delete ${item.description}`} accessibilityRole="button">
            <IconTrash size={15} color={colors.danger} />
          </PressableScale>
        </View>
      </View>
    </AnimatedRN.View>
  );
});

// ─── Segmented Control ────────────────────────────────────────────────────────
interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const SegmentedControl = React.memo(({ segments, selectedIndex, onChange, colors, isDark }: SegmentedControlProps) => {
  const glass = isDark ? GLASS.dark : GLASS.light;
  return (
    <View style={[styles.segContainer, { backgroundColor: glass.card, borderColor: glass.border }]}>
      {segments.map((seg, i) => {
        const isActive = i === selectedIndex;
        return (
          <PressableScale key={seg}
            style={[styles.segItem, isActive && [styles.segItemActive, { backgroundColor: colors.primary }]]}
            onPress={() => onChange(i)} accessibilityRole="tab" accessibilityState={{ selected: isActive }}>
            <Text style={[styles.segLabel, { color: isActive ? colors.onPrimary : colors.textMuted }, isActive && { fontFamily: FONTS.text.semibold }]}>
              {seg}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
});

// ─── Types ────────────────────────────────────────────────────────────────────
type SortOption = 'newest' | 'oldest' | 'high-to-low' | 'low-to-high';

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RecentExpensesScreen: React.FC = () => {
  const {
    expenses, recurringExpenses, settings, selectedDate, setSelectedDate, deleteExpense, editExpense, addExpense, importExpenses, showFeedback,
    addRecurringExpense, editRecurringExpense, deleteRecurringExpense,
  } = useApp();
  const { colors, isDark } = useAppTheme();
  const navbarHeight = useNavbarHeight();
  const { announceSaved, announceFailed } = useExpenseToast();
  const glass = isDark ? GLASS.dark : GLASS.light;

  const [activeTab, setActiveTab] = useState(0);

  // Expense filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showTransferSheet, setShowTransferSheet] = useState(false);
  const [viewingReceiptUri, setViewingReceiptUri] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Recurring form
  const [recurringModalVisible, setRecurringModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recDescription, setRecDescription] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recCategory, setRecCategory] = useState(settings.categories[0] || 'Bills');
  const [recFrequency, setRecFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [recIsVariable, setRecIsVariable] = useState(false);
  const [recNextDue, setRecNextDue] = useState(() => toLocalISODate(new Date()));

  /**
   * (C1) The list is scoped to the globally selected month, matching Home and
   * Analytics — it used to show every expense ever recorded, so the three
   * screens disagreed about what "your expenses" meant.
   *
   * Searching deliberately escapes that scope: a search that silently ignored
   * eleven months of history would be worse than useless. The summary row says
   * so whenever it happens.
   */
  const isSearching = searchQuery.trim().length > 0;

  const filtered = useMemo(() => {
    let result = isSearching
      ? [...expenses]
      : expenses.filter((e) => {
          const date = new Date(e.date);
          return (
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear()
          );
        });
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(e => e.description.toLowerCase().includes(lower) || e.category.toLowerCase().includes(lower));
    }
    if (selectedCategories.length > 0) result = result.filter(e => selectedCategories.includes(e.category));
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
  }, [expenses, isSearching, selectedDate, searchQuery, selectedCategories, sortOption, minPrice, maxPrice]);

  const totalFiltered = useMemo(() => filtered.reduce((sum, e) => sum + e.amount, 0), [filtered]);

  /**
   * (C3) Group into day sections with a running total per day.
   *
   * A flat list of a few hundred uniform rows has no rhythm — there is nothing
   * to anchor a scan on and no sense of "a heavy day". Sticky day headers give
   * the list structure and the per-day total answers the question people
   * actually scroll this screen to ask.
   *
   * Only meaningful for date ordering; amount sorts stay flat, since grouping
   * by day would scatter the very ordering the user asked for.
   */
  const isDateSorted = sortOption === 'newest' || sortOption === 'oldest';

  const sections = useMemo(() => {
    if (!isDateSorted) {
      return filtered.length > 0
        ? [{ title: '', total: 0, showHeader: false, data: filtered }]
        : [];
    }
    const byDay = new Map<string, Expense[]>();
    filtered.forEach((expense) => {
      const key = expense.date.split('T')[0];
      const bucket = byDay.get(key);
      if (bucket) bucket.push(expense);
      else byDay.set(key, [expense]);
    });
    return Array.from(byDay.entries()).map(([key, data]) => ({
      title: formatDayHeading(key),
      total: data.reduce((sum, e) => sum + e.amount, 0),
      showHeader: true,
      data,
    }));
  }, [filtered, isDateSorted]);
  const hasActiveFilters = selectedCategories.length > 0 || !!minPrice || !!maxPrice || sortOption !== 'newest';
  const activeFilterCount = useMemo(
    () => selectedCategories.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (sortOption !== 'newest' ? 1 : 0),
    [maxPrice, minPrice, selectedCategories.length, sortOption],
  );

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };
  const resetFilters = () => { setSelectedCategories([]); setSortOption('newest'); setMinPrice(''); setMaxPrice(''); };

  // Export/Import
  const handleExportJson = useCallback(async () => {
    setShowTransferSheet(false);
    if (filtered.length === 0 && recurringExpenses.length === 0) { showFeedback('Nothing to export.', 'error'); return; }
    try { await exportExpensesAsJson(filtered, recurringExpenses, settings); }
    catch (e) { showFeedback(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error'); }
  }, [filtered, recurringExpenses, settings, showFeedback]);

  const handleExportPdf = useCallback(async () => {
    setShowTransferSheet(false);
    if (filtered.length === 0) { showFeedback('Nothing to export.', 'error'); return; }
    try { await exportExpensesAsPdf(filtered, settings); }
    catch (e) { showFeedback(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error'); }
  }, [filtered, settings, showFeedback]);

  const handleImportJson = useCallback(async () => {
    setShowTransferSheet(false);
    try {
      const imported = await pickExpensesJson();
      if (!imported) return;
      const count = imported.expenses.length + imported.recurringExpenses.length;
      Alert.alert('Import expenses', `${count} item${count === 1 ? '' : 's'} found. How would you like to import them?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Merge', onPress: () => importExpenses(imported, 'merge') },
        { text: 'Replace', style: 'destructive', onPress: () => importExpenses(imported, 'replace') },
      ]);
    } catch (e) { showFeedback(`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error'); }
  }, [importExpenses, showFeedback]);

  // Recurring CRUD
  const openRecurringForm = useCallback((expense?: RecurringExpense) => {
    if (expense) {
      setEditingId(expense.id); setRecDescription(expense.description);
      setRecAmount(expense.amount > 0 ? expense.amount.toString() : '');
      setRecCategory(expense.category); setRecFrequency(expense.frequency);
      setRecIsVariable(expense.isVariableAmount); setRecNextDue(expense.nextDueDate);
    } else {
      setEditingId(null); setRecDescription(''); setRecAmount('');
      setRecCategory(settings.categories[0] || 'Bills'); setRecFrequency('monthly');
      setRecIsVariable(false); setRecNextDue(toLocalISODate(new Date()));
    }
    setRecurringModalVisible(true);
  }, [settings.categories]);

  const handleRecurringSave = () => {
    const amt = parseFloat(recAmount);
    if (!recDescription.trim() || (!recIsVariable && (isNaN(amt) || amt <= 0))) return;
    const data = { description: recDescription.trim(), amount: recIsVariable ? 0 : amt, category: recCategory, frequency: recFrequency, nextDueDate: recNextDue, isVariableAmount: recIsVariable };
    if (editingId) { editRecurringExpense({ ...data, id: editingId }); } else { addRecurringExpense(data); }
    setRecurringModalVisible(false);
  };

  const renderExpense = useCallback(
    ({ item }: ListRenderItemInfo<Expense>) => (
      <ExpenseRow item={item} currency={settings.currency} onDelete={deleteExpense}
        onEdit={setEditingExpense}
        onViewReceipt={setViewingReceiptUri} colors={colors} isDark={isDark} />
    ),
    [settings.currency, deleteExpense, colors, isDark],
  );

  const renderRecurring = useCallback(
    ({ item }: ListRenderItemInfo<RecurringExpense>) => (
      <RecurringCard item={item} currency={settings.currency} colors={colors} isDark={isDark}
        onEdit={openRecurringForm} onDelete={deleteRecurringExpense} />
    ),
    [settings.currency, colors, isDark, deleteRecurringExpense, openRecurringForm],
  );

  const handleAdd = useCallback(async (draft: Parameters<typeof addExpense>[0]) => {
    try {
      await addExpense(draft);
      announceSaved(draft);
    } catch {
      announceFailed(() => { handleAdd(draft); });
    }
  }, [addExpense, announceSaved, announceFailed]);

  const hasFiltersApplied = hasActiveFilters || searchQuery.length > 0;

  const ExpenseEmpty = useMemo(() => (
    <View style={styles.empty}>
      {expenses.length === 0 ? (
        <>
          <IconReceipt size={64} color={colors.surfaceLight} strokeWidth={1} />
          <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No expenses yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>Head to the Home tab to add your first expense.</Text>
        </>
      ) : filtered.length === 0 && !hasFiltersApplied ? (
        <>
          <IconReceipt size={64} color={colors.surfaceLight} strokeWidth={1} />
          <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>Nothing in {getMonthName(selectedDate)}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>Use the month arrows in the header to look at another month.</Text>
        </>
      ) : (
        <>
          <IconSearch size={64} color={colors.surfaceLight} strokeWidth={1} />
          <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No results found</Text>
          {hasFiltersApplied && (
            <PressableScale onPress={() => { resetFilters(); setSearchQuery(''); }}
              style={[styles.clearFiltersBtn, { borderColor: colors.primary }]}>
              <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Clear filters</Text>
            </PressableScale>
          )}
        </>
      )}
    </View>
  ), [expenses.length, filtered.length, hasFiltersApplied, selectedDate, colors]);

  const RecurringEmpty = (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No recurring bills yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>Tap + to add your first recurring bill.</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: GUTTER }}>
        <MonthPill selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </View>

      {/* Segmented Tab */}
      <View style={[styles.segRow, { paddingHorizontal: GUTTER }]}>
        <SegmentedControl
          segments={['Expenses', 'Recurring']}
          selectedIndex={activeTab}
          onChange={setActiveTab}
          colors={colors}
          isDark={isDark}
        />
      </View>

      {/* ── Expenses Tab ── */}
      {activeTab === 0 && (
        <>
          <View style={styles.header}>
            <View style={[styles.searchBar, { backgroundColor: glass.card, borderColor: glass.border }]}>
              <IconSearch size={17} color={colors.textDim} strokeWidth={2} style={{ marginRight: 8 }} />
              <TextInput style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search expenses..." placeholderTextColor={colors.textDim}
                value={searchQuery} onChangeText={setSearchQuery} accessibilityLabel="Search expenses" />
              {searchQuery.length > 0 && (
                <PressableScale onPress={() => setSearchQuery('')} accessibilityLabel="Clear search" accessibilityRole="button">
                  <IconX size={15} color={colors.textDim} strokeWidth={2.5} />
                </PressableScale>
              )}
            </View>
            <PressableScale style={[styles.headerIconBtn, { backgroundColor: glass.card, borderColor: hasActiveFilters ? colors.primary : glass.border }]}
              onPress={() => setShowFilters(true)} accessibilityLabel="Filter" accessibilityRole="button">
              <IconFilter size={19} color={hasActiveFilters ? colors.primary : colors.textMuted} strokeWidth={2} />
              {hasActiveFilters && (
                <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.filterBadgeText, { color: colors.onPrimary }]}>{activeFilterCount}</Text>
                </View>
              )}
            </PressableScale>
            <PressableScale style={[styles.headerIconBtn, { backgroundColor: glass.card, borderColor: glass.border }]}
              onPress={() => setShowTransferSheet(true)} accessibilityLabel="Export or import" accessibilityRole="button">
              <IconDotsVertical size={19} color={colors.textMuted} strokeWidth={2} />
            </PressableScale>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryText, { color: colors.textDim }]}>
              {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
              {isSearching ? ' · all months' : ` · ${getMonthName(selectedDate)}`}
            </Text>
            <Text style={[styles.summaryAmount, { color: colors.primary }]}>
              {filtered.length > 0 ? formatCurrencyCompact(totalFiltered, settings.currency) : ''}
            </Text>
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderExpense}
            renderSectionHeader={({ section }) => section.showHeader ? (
              <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{section.title}</Text>
                <Text style={[styles.sectionTotal, { color: colors.textDim }]}>
                  {formatCurrencyCompact(section.total, settings.currency)}
                </Text>
              </View>
            ) : null}
            stickySectionHeadersEnabled
            initialNumToRender={12}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={ExpenseEmpty}
            ListFooterComponent={<View style={{ height: navbarHeight + 16 }} />}
          />
        </>
      )}

      {/* ── Recurring Tab ── */}
      {activeTab === 1 && (
        <>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryText, { color: colors.textDim }]}>
              {recurringExpenses.length} recurring bill{recurringExpenses.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <FlatList
            data={recurringExpenses} keyExtractor={(item) => item.id} renderItem={renderRecurring}
            contentContainerStyle={styles.listContent} ListEmptyComponent={RecurringEmpty}
            ListFooterComponent={<View style={{ height: navbarHeight + 80 }} />}
          />
          <PressableScale style={[styles.fab, { backgroundColor: colors.primary, bottom: navbarHeight + 16 }]}
            onPress={() => openRecurringForm()}>
            <IconPlus size={24} color={colors.onPrimary} />
          </PressableScale>
        </>
      )}

      {/* (C5) Edit sheet — the same form used to add, in edit mode. */}
      <ExpenseForm
        visible={editingExpense !== null}
        editing={editingExpense}
        onClose={() => setEditingExpense(null)}
        onAdd={handleAdd}
        onSave={(updated) => { editExpense(updated); setEditingExpense(null); }}
      />

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: SCRIM_COLOR }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter & Sort</Text>
              <PressableScale onPress={() => setShowFilters(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close filters" accessibilityRole="button">
                <IconX size={24} color={colors.textDim} />
              </PressableScale>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.textDim }]}>Sort by</Text>
                <View style={styles.sortGrid}>
                  {(['newest', 'oldest', 'high-to-low', 'low-to-high'] as SortOption[]).map(opt => (
                    <PressableScale key={opt}
                      style={[styles.sortCard, { backgroundColor: colors.surfaceLight, borderColor: sortOption === opt ? colors.primary : 'transparent' }]}
                      onPress={() => setSortOption(opt)} accessibilityState={{ selected: sortOption === opt }} accessibilityRole="radio" accessibilityLabel={opt.replace(/-/g, ' ')}>
                      {opt === 'high-to-low' ? <IconTrendingUp size={18} color={sortOption === opt ? colors.primary : colors.textDim} />
                        : opt === 'low-to-high' ? <IconTrendingDown size={18} color={sortOption === opt ? colors.primary : colors.textDim} />
                        : <IconArrowsSort size={18} color={sortOption === opt ? colors.primary : colors.textDim} />}
                      <Text style={[styles.sortLabel, { color: sortOption === opt ? colors.text : colors.textMuted }]}>
                        {opt.replace(/-/g, ' ').toUpperCase()}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
              </View>
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.textDim }]}>Price range</Text>
                <View style={styles.rangeRow}>
                  <TextInput style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                    placeholder="Min" placeholderTextColor={colors.textDim} keyboardType="decimal-pad" value={minPrice} onChangeText={setMinPrice} accessibilityLabel="Minimum price" />
                  <Text style={{ color: colors.textDim }}>-</Text>
                  <TextInput style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                    placeholder="Max" placeholderTextColor={colors.textDim} keyboardType="decimal-pad" value={maxPrice} onChangeText={setMaxPrice} accessibilityLabel="Maximum price" />
                </View>
              </View>
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.textDim }]}>Categories</Text>
                <View style={styles.catGrid}>
                  {settings.categories.map(cat => {
                    const active = selectedCategories.includes(cat);
                    return (
                      <PressableScale key={cat}
                        style={[styles.catChip, { backgroundColor: colors.surfaceLight }, active && { backgroundColor: colors.primary }]}
                        onPress={() => toggleCategory(cat)} accessibilityState={{ selected: active }} accessibilityRole="checkbox" accessibilityLabel={cat}>
                        <Text style={[styles.catChipText, { color: active ? colors.onPrimary : colors.textMuted }]}>{cat}</Text>
                        {active && <IconCheck size={14} color={colors.onPrimary} style={{ marginLeft: 4 }} />}
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: colors.surfaceLight }]}>
              <PressableScale onPress={resetFilters} style={styles.resetBtn}>
                <Text style={[styles.resetText, { color: colors.textDim }]}>Reset All</Text>
              </PressableScale>
              <PressableScale onPress={() => setShowFilters(false)} style={[styles.applyBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.applyText, { color: colors.onPrimary }]}>Done</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transfer Sheet */}
      <Modal visible={showTransferSheet} animationType="slide" transparent onRequestClose={() => setShowTransferSheet(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: SCRIM_COLOR }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Export & Import</Text>
              <PressableScale onPress={() => setShowTransferSheet(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close export and import sheet" accessibilityRole="button">
                <IconX size={24} color={colors.textDim} />
              </PressableScale>
            </View>
            <View style={styles.transferSheetBody}>
              {[
                { icon: <IconFileExport size={22} color={colors.primary} />, title: 'Export JSON', desc: 'Share current view as a JSON file', onPress: handleExportJson },
                { icon: <IconFileTypePdf size={22} color={colors.primary} />, title: 'Export PDF', desc: 'Save current view as a printable PDF', onPress: handleExportPdf },
                { icon: <IconFileImport size={22} color={colors.primary} />, title: 'Import JSON', desc: 'Merge or replace from a JSON file', onPress: handleImportJson },
              ].map((row, i, arr) => (
                <PressableScale key={row.title}
                  style={[styles.transferSheetRow, { borderBottomColor: i < arr.length - 1 ? colors.surfaceLight : 'transparent' }]}
                  onPress={row.onPress} accessibilityLabel={row.title} accessibilityRole="button">
                  {row.icon}
                  <View style={styles.transferSheetText}>
                    <Text style={[styles.transferSheetTitle, { color: colors.text }]}>{row.title}</Text>
                    <Text style={[styles.transferSheetDesc, { color: colors.textDim }]}>{row.desc}</Text>
                  </View>
                </PressableScale>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Viewer */}
      <Modal visible={!!viewingReceiptUri} transparent animationType="fade" onRequestClose={() => setViewingReceiptUri(null)}>
        {/* Full-screen photo viewer — deliberately opaque, not the standard scrim. */}
        <View style={[styles.modalOverlay, { backgroundColor: SCRIM_COLOR_OPAQUE }]}>
          <PressableScale
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: RADII.pill }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Close receipt" accessibilityRole="button"
            onPress={() => setViewingReceiptUri(null)}>
            <IconX size={24} color="#fff" />
          </PressableScale>
          {viewingReceiptUri && (
            <Image source={{ uri: viewingReceiptUri }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
          )}
        </View>
      </Modal>

      {/* Recurring Form Modal */}
      <Modal visible={recurringModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={[styles.modalOverlay, { backgroundColor: SCRIM_COLOR }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingId ? 'Edit Recurring Bill' : 'New Recurring Bill'}
                </Text>
                <PressableScale onPress={() => setRecurringModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close recurring bill form" accessibilityRole="button">
                <IconX size={24} color={colors.textDim} />
              </PressableScale>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Description</Text>
                <TextInput style={[styles.formInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                  value={recDescription} onChangeText={setRecDescription} placeholder="e.g. Gym Membership" placeholderTextColor={colors.textDim} />
                <View style={styles.switchRow}>
                  <Text style={[styles.formLabel, { color: colors.textMuted, marginBottom: 0 }]}>Variable Amount?</Text>
                  <Switch value={recIsVariable} onValueChange={setRecIsVariable} trackColor={{ true: colors.primary }} />
                </View>
                {!recIsVariable && (
                  <>
                    <Text style={[styles.formLabel, { color: colors.textMuted }]}>Amount</Text>
                    <TextInput style={[styles.formInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                      value={recAmount} onChangeText={setRecAmount} placeholder="0.00" placeholderTextColor={colors.textDim} keyboardType="numeric" />
                  </>
                )}
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Frequency</Text>
                <View style={styles.freqRow}>
                  {(['monthly', 'weekly', 'yearly'] as const).map(freq => (
                    <PressableScale key={freq}
                      style={[styles.freqChip, { backgroundColor: colors.surfaceLight }, recFrequency === freq && { backgroundColor: colors.primary }]}
                      onPress={() => setRecFrequency(freq)}>
                      <Text style={[styles.catChipText, { color: recFrequency === freq ? colors.onPrimary : colors.textMuted }]}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Next Due Date (YYYY-MM-DD)</Text>
                <TextInput style={[styles.formInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                  value={recNextDue} onChangeText={setRecNextDue} placeholder="2026-09-01" placeholderTextColor={colors.textDim} />
                <PressableScale style={[styles.applyBtn, { backgroundColor: colors.primary, marginTop: 24 }]} onPress={handleRecurringSave}>
                  <Text style={[styles.applyText, { color: colors.onPrimary }]}>Save</Text>
                </PressableScale>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  segRow: { paddingTop: 10, paddingBottom: 6 },
  segContainer: { flexDirection: 'row', borderRadius: RADII.md, borderWidth: 1, padding: 4, gap: 4 },
  segItem: { flex: 1, minHeight: 44, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center' },
  segItemActive: { borderRadius: RADII.sm },
  segLabel: { ...TEXT.label },
  header: { flexDirection: 'row', paddingHorizontal: GUTTER, paddingTop: 4, gap: 10, marginBottom: 10 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: RADII.md, paddingHorizontal: 14, borderWidth: 1 },
  searchInput: { flex: 1, ...TEXT.bodySm, paddingVertical: Platform.OS === 'ios' ? 12 : 8 },
  headerIconBtn: { width: 46, height: 46, borderRadius: RADII.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  filterBadge: { position: 'absolute', top: -6, right: -6, minWidth: 19, height: 19, borderRadius: RADII.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterBadgeText: { ...TEXT.caption, fontFamily: FONTS.text.bold },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: GUTTER, marginBottom: 10 },
  summaryText: { ...TEXT.caption },
  summaryAmount: { ...TEXT.money },
  listContent: { paddingHorizontal: GUTTER },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  sectionTitle: { ...TEXT.rowTitle },
  sectionTotal: { ...TEXT.moneySm },
  item: {
    flexDirection: 'row', alignItems: 'center', borderRadius: RADII.lg, padding: 14, marginBottom: 10,
    borderWidth: 1, gap: 12, minHeight: ITEM_MIN_HEIGHT,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 3,
  },
  categoryPill: { width: 32, height: 32, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center' },
  categoryDot: { width: 10, height: 10, borderRadius: RADII.pill },
  itemMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemInfo: { flex: 1 },
  itemDesc: { ...TEXT.rowTitle },
  itemMeta: { ...TEXT.caption, marginTop: 2 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemAmount: { ...TEXT.money },
  deleteBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { ...TEXT.subheading },
  emptySubtitle: { ...TEXT.proseSm, textAlign: 'center', paddingHorizontal: 32 },
  clearFiltersBtn: { marginTop: 4, borderWidth: 1, borderRadius: RADII.pill, paddingHorizontal: 20, minHeight: 44, justifyContent: 'center' },
  clearFiltersText: { ...TEXT.buttonSm },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: RADII.pill, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: RADII.xxl, borderTopRightRadius: RADII.xxl, maxHeight: '88%', paddingTop: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 20 },
  modalTitle: { ...TEXT.heading },
  modalScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  modalSection: { marginBottom: 24 },
  modalSectionTitle: { ...TEXT.labelSm, marginBottom: 12 },
  sortGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sortCard: { width: '48.5%', padding: 12, borderRadius: RADII.sm, borderWidth: 1, alignItems: 'center', gap: 6 },
  sortLabel: { ...TEXT.caption, fontFamily: FONTS.text.semibold },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalInput: { flex: 1, borderRadius: RADII.sm, padding: 12, ...TEXT.bodySm },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, minHeight: 44, borderRadius: RADII.pill },
  catChipText: { ...TEXT.labelSm },
  modalFooter: { flexDirection: 'row', padding: 24, borderTopWidth: 1, gap: 16 },
  resetBtn: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  resetText: { ...TEXT.buttonSm },
  applyBtn: { flex: 2, minHeight: 52, justifyContent: 'center', borderRadius: RADII.md, alignItems: 'center' },
  applyText: { ...TEXT.button },
  transferSheetBody: { paddingHorizontal: 24, paddingBottom: 40 },
  transferSheetRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, borderBottomWidth: 1 },
  transferSheetText: { flex: 1 },
  transferSheetTitle: { ...TEXT.rowTitle, marginBottom: 2 },
  transferSheetDesc: { ...TEXT.caption },
  formLabel: { ...TEXT.labelSm, marginBottom: 8, marginTop: 12 },
  formInput: { borderRadius: RADII.sm, padding: 14, ...TEXT.bodySm },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  freqRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  freqChip: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: RADII.sm },
});

export default React.memo(RecentExpensesScreen);


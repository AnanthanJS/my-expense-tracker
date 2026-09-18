import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Modal, Platform } from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { IconSearch, IconX, IconPencilPlus } from '@tabler/icons-react-native';
import { TEXT, RADII, SPACING, GUTTER, SCRIM_COLOR, getCategoryColor } from '../constants/theme';
import { GROUP_TINTS, UNGROUPED_LABEL, getCategoryIcon, resolveGroup } from '../constants/categories';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import type { Expense, RecurringExpense } from '../utils/storage';
import { useAppTheme } from '../hooks/useAppTheme';
import PressableScale from './PressableScale';

interface ExpensePickerSheetProps {
  visible: boolean;
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  currency: string;
  groups: Record<string, string>;
  onSelect: (expense: Expense) => void;
  onSkip: () => void;
  onClose: () => void;
}

/**
 * Identity of a bill for the duplicate guard: the three fields a person would
 * use to say "that is the same one". Deliberately not the id — the whole point
 * is to catch a second bill being made from a different expense that describes
 * the same thing.
 */
const billKey = (description: string, category: string, amount: number) =>
  `${description.trim().toLowerCase()}|${category.toLowerCase()}|${amount}`;

/**
 * Picks an already-logged expense to base a recurring bill on.
 *
 * Copying, not linking: see the note on RecurringExpense.sourceExpenseId.
 */
const ExpensePickerSheet: React.FC<ExpensePickerSheetProps> = ({
  visible,
  expenses,
  recurringExpenses,
  currency,
  groups,
  onSelect,
  onSkip,
  onClose,
}) => {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');

  const existingBills = useMemo(
    () => new Set(recurringExpenses.map((r) => billKey(r.description, r.category, r.amount))),
    [recurringExpenses],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? expenses.filter(
          (e) =>
            e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q),
        )
      : expenses;
    return [...matched].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [expenses, query]);

  const renderRow = ({ item }: ListRenderItemInfo<Expense>) => {
    const Icon = getCategoryIcon(item.category);
    const tone = GROUP_TINTS[resolveGroup(item.category, groups)] ?? GROUP_TINTS[UNGROUPED_LABEL];
    const alreadyRecurring = existingBills.has(billKey(item.description, item.category, item.amount));
    const money = formatCurrency(item.amount, currency);
    const when = formatDate(item.date);

    return (
      <PressableScale
        style={[styles.row, { borderColor: colors.surfaceLight }]}
        disabled={alreadyRecurring}
        onPress={() => onSelect(item)}
        accessibilityRole="button"
        accessibilityState={{ disabled: alreadyRecurring }}
        accessibilityLabel={
          alreadyRecurring
            ? `${item.description}, ${money}, ${item.category}, ${when}. Already recurring.`
            : `${item.description}, ${money}, ${item.category}, ${when}`
        }
        accessibilityHint={alreadyRecurring ? undefined : 'Uses this expense as the basis for the bill'}
      >
        <View style={[styles.tile, { backgroundColor: tone.bg, opacity: alreadyRecurring ? 0.45 : 1 }]}>
          <Icon size={20} color={tone.fg} strokeWidth={2} />
        </View>

        <View style={styles.info}>
          <Text
            style={[styles.name, { color: alreadyRecurring ? colors.textDim : colors.text }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.chip, { backgroundColor: getCategoryColor(item.category) + '22' }]}>
              <Text style={[styles.chipText, { color: colors.textMuted }]} numberOfLines={1}>
                {item.category}
              </Text>
            </View>
            <Text style={[styles.date, { color: colors.textDim }]} numberOfLines={1}>
              {when}
            </Text>
          </View>
        </View>

        {alreadyRecurring ? (
          <Text style={[styles.already, { color: colors.textDim }]} numberOfLines={1}>
            Already recurring
          </Text>
        ) : (
          <Text style={[styles.amount, { color: colors.text }]} numberOfLines={1}>
            {money}
          </Text>
        )}
      </PressableScale>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: SCRIM_COLOR }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Use an existing expense</Text>
            <PressableScale
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close expense picker"
            >
              <IconX size={24} color={colors.textDim} />
            </PressableScale>
          </View>

          <View style={[styles.search, { backgroundColor: colors.surfaceLight }]}>
            <IconSearch size={18} color={colors.textDim} strokeWidth={2} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={query}
              onChangeText={setQuery}
              placeholder="Search description or category"
              placeholderTextColor={colors.textDim}
              autoCorrect={false}
              accessibilityLabel="Search your expenses"
            />
            {query.length > 0 && (
              <PressableScale
                onPress={() => setQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <IconX size={18} color={colors.textDim} />
              </PressableScale>
            )}
          </View>

          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            renderItem={renderRow}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.textDim }]}>
                Nothing matches that search.
              </Text>
            }
          />

          <PressableScale
            style={[styles.skip, { borderColor: colors.surfaceLight }]}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip, enter the bill manually"
          >
            <IconPencilPlus size={18} color={colors.primary} strokeWidth={2.2} />
            <Text style={[styles.skipText, { color: colors.primary }]}>Skip — enter manually</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  title: { ...TEXT.subheading, flex: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADII.sm,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  searchInput: { flex: 1, ...TEXT.bodySm, paddingVertical: 0 },
  list: { paddingVertical: SPACING.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 4 },
  name: { ...TEXT.rowTitle },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADII.pill, flexShrink: 1 },
  chipText: { ...TEXT.caption },
  date: { ...TEXT.caption, flexShrink: 0 },
  amount: { ...TEXT.money, flexShrink: 0 },
  already: { ...TEXT.caption, flexShrink: 0, fontStyle: 'italic' },
  empty: { ...TEXT.prose, textAlign: 'center', paddingVertical: SPACING.xl },
  skip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 52,
    borderRadius: RADII.md,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  skipText: { ...TEXT.button },
});

export default React.memo(ExpensePickerSheet);

import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native'
import IconSearch from '@tabler/icons-react-native/dist/esm/icons/IconSearch'
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX'
import IconTrash from '@tabler/icons-react-native/dist/esm/icons/IconTrash'
import IconFilter from '@tabler/icons-react-native/dist/esm/icons/IconFilter'
import IconReceipt from '@tabler/icons-react-native/dist/esm/icons/IconReceipt'
import { useAppTheme } from '../../hooks/useAppTheme'
import { useApp } from '../../context/AppContext'
import { FONTS, SPACING, RADIUS, SHADOWS, CATEGORY_COLORS } from '../../constants/theme'
import { Expense } from '../../utils/storage'

type DateRange = 'All Time' | 'This Month' | 'Last Month' | 'This Week'

const DATE_RANGES: DateRange[] = ['All Time', 'This Month', 'Last Month', 'This Week']

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatAmount = (amount: number, currency: string) =>
  `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ─── Transaction Item ─────────────────────────────────────────────────────────
interface TransactionItemProps {
  expense: Expense
  currency: string
  colors: any
  onLongPress: () => void
}

const TransactionItem: React.FC<TransactionItemProps> = ({ expense, currency, colors, onLongPress }) => {
  const dotColor = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS['Other'] || '#7C3AED'
  return (
    <TouchableOpacity
      style={[styles.txItem, { backgroundColor: colors.surface }, SHADOWS.sm]}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={[styles.txDot, { backgroundColor: dotColor + '25' }]}>
        <View style={[styles.txDotInner, { backgroundColor: dotColor }]} />
      </View>
      <View style={styles.txInfo}>
        <Text style={[styles.txDesc, { color: colors.text }]} numberOfLines={1}>
          {expense.description}
        </Text>
        <Text style={[styles.txCat, { color: colors.textMuted }]}>{expense.category}</Text>
        <Text style={[styles.txDate, { color: colors.textDim }]}>{formatDate(expense.date)}</Text>
      </View>
      <Text style={[styles.txAmount, { color: colors.text }]}>
        {formatAmount(expense.amount, currency)}
      </Text>
    </TouchableOpacity>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const SearchScreen: React.FC = () => {
  const { colors } = useAppTheme()
  const { expenses, deleteExpense, settings } = useApp()

  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [dateRange, setDateRange] = useState<DateRange>('All Time')

  const currency = settings.currency || '$'

  const categories = useMemo(() => {
    const cats = new Set<string>()
    expenses.forEach(e => cats.add(e.category))
    return ['All', ...Array.from(cats).sort()]
  }, [expenses])

  const results = useMemo(() => {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    return expenses.filter(e => {
      const matchesSearch =
        e.description.toLowerCase().includes(query.toLowerCase()) ||
        e.category.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory
      const date = new Date(e.date)
      let matchesDate = true
      if (dateRange === 'This Month') matchesDate = date >= thisMonthStart
      else if (dateRange === 'Last Month') matchesDate = date >= lastMonthStart && date <= lastMonthEnd
      else if (dateRange === 'This Week') matchesDate = date >= weekStart
      return matchesSearch && matchesCategory && matchesDate
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [expenses, query, selectedCategory, dateRange])

  const totalAmount = useMemo(() => results.reduce((s, e) => s + e.amount, 0), [results])

  const handleDelete = (expense: Expense) => {
    Alert.alert(
      'Delete Transaction',
      `Delete "${expense.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(expense.id) },
      ]
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
          <IconSearch size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <IconX size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {/* Date range chips */}
          {DATE_RANGES.map(range => (
            <TouchableOpacity
              key={range}
              style={[
                styles.chip,
                {
                  backgroundColor: dateRange === range ? colors.primary : colors.surface,
                  borderColor: dateRange === range ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setDateRange(range)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: dateRange === range ? '#fff' : colors.textMuted },
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={[styles.chipDivider, { backgroundColor: colors.border }]} />

          {/* Category chips */}
          {categories.map(cat => {
            const active = selectedCategory === cat
            const dotColor = cat === 'All' ? colors.primary : (CATEGORY_COLORS[cat] || colors.primary)
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? dotColor : colors.surface,
                    borderColor: active ? dotColor : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                {cat !== 'All' && (
                  <View style={[styles.chipDot, { backgroundColor: active ? '#ffffff80' : dotColor }]} />
                )}
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.textMuted }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Results header */}
      <View style={styles.resultsHeader}>
        <View style={styles.resultsHeaderLeft}>
          <IconFilter size={14} color={colors.textMuted} />
          <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </Text>
        </View>
        {results.length > 0 && (
          <Text style={[styles.resultsTotal, { color: colors.text }]}>
            Total: <Text style={{ color: colors.primary }}>{formatAmount(totalAmount, currency)}</Text>
          </Text>
        )}
      </View>

      {/* Results list */}
      {results.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceLight }]}>
            <IconReceipt size={40} color={colors.textDim} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {query || selectedCategory !== 'All' || dateRange !== 'All Time'
              ? 'No Matches Found'
              : 'No Transactions Yet'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {query
              ? `No transactions match "${query}"`
              : 'Try adjusting your filters or search term'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TransactionItem
              expense={item}
              currency={currency}
              colors={colors}
              onLongPress={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  searchWrap: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
  },
  searchInput: { flex: 1, fontFamily: FONTS.regular, fontSize: 15 },

  filtersSection: { paddingBottom: SPACING.sm },
  chipsRow: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  chipText: { fontFamily: FONTS.medium, fontSize: 12 },
  chipDot: { width: 7, height: 7, borderRadius: RADIUS.full },
  chipDivider: { width: 1, height: 20, marginHorizontal: 4 },

  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  resultsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  resultsCount: { fontFamily: FONTS.regular, fontSize: 12 },
  resultsTotal: { fontFamily: FONTS.medium, fontSize: 13 },

  listContent: { padding: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 120 },

  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm,
  },
  txDot: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  txDotInner: { width: 12, height: 12, borderRadius: RADIUS.full },
  txInfo: { flex: 1 },
  txDesc: { fontFamily: FONTS.medium, fontSize: 14 },
  txCat: { fontFamily: FONTS.regular, fontSize: 12, marginTop: 1 },
  txDate: { fontFamily: FONTS.regular, fontSize: 11, marginTop: 1 },
  txAmount: { fontFamily: FONTS.bold, fontSize: 15 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl, gap: SPACING.md },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 18 },
  emptyText: { fontFamily: FONTS.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
})

export default React.memo(SearchScreen)

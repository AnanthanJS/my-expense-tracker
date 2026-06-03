import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar'
import IconChevronLeft from '@tabler/icons-react-native/dist/esm/icons/IconChevronLeft'
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight'
import IconPlus from '@tabler/icons-react-native/dist/esm/icons/IconPlus'
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX'
import IconCurrencyDollar from '@tabler/icons-react-native/dist/esm/icons/IconCurrencyDollar'
import IconReceipt from '@tabler/icons-react-native/dist/esm/icons/IconReceipt'
import { useAppTheme } from '../../hooks/useAppTheme'
import { useApp } from '../../context/AppContext'
import { FONTS, SPACING, RADIUS, SHADOWS, CATEGORY_COLORS } from '../../constants/theme'
import { Bill } from '../../utils/storage'

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const BILL_COLORS = [
  '#7C3AED', '#EC4899', '#10B981', '#F59E0B',
  '#3B82F6', '#EF4444', '#8B5CF6', '#06B6D4',
]
type Frequency = 'monthly' | 'quarterly' | 'yearly'
const FREQUENCIES: Frequency[] = ['monthly', 'quarterly', 'yearly']
const FREQ_LABEL: Record<Frequency, string> = {
  monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
}

interface BillCalendarScreenProps {
  onSelectBill: (bill: Bill) => void
}

// ─── Add Bill Modal ───────────────────────────────────────────────────────────
interface AddBillModalProps {
  visible: boolean
  onClose: () => void
  onAdd: (bill: Omit<Bill, 'id'>) => void
  categories: string[]
  currency: string
  colors: any
}

const AddBillModal: React.FC<AddBillModalProps> = ({ visible, onClose, onAdd, categories, currency, colors }) => {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [category, setCategory] = useState(categories[0] || 'Bills')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [color, setColor] = useState(BILL_COLORS[0])
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setName(''); setAmount(''); setDueDay('')
    setCategory(categories[0] || 'Bills'); setFrequency('monthly'); setColor(BILL_COLORS[0])
  }

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Missing Field', 'Please enter a bill name.'); return }
    const amtNum = parseFloat(amount)
    if (!amtNum || amtNum <= 0) { Alert.alert('Invalid Amount', 'Enter a valid amount.'); return }
    const dayNum = parseInt(dueDay)
    if (!dayNum || dayNum < 1 || dayNum > 31) { Alert.alert('Invalid Day', 'Enter a due day between 1 and 31.'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    onAdd({
      name: name.trim(), amount: amtNum, dueDay: dayNum, category,
      autoPay: false, reminder: true, color, frequency, notes: '',
    })
    setLoading(false)
    reset()
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Bill</Text>
              <TouchableOpacity onPress={() => { reset(); onClose() }} style={styles.closeBtn}>
                <IconX size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Bill Name</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
                <IconReceipt size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={name} onChangeText={setName}
                  placeholder="e.g. Electric Bill" placeholderTextColor={colors.textDim}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Amount ({currency})</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
                <IconCurrencyDollar size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={amount} onChangeText={setAmount}
                  keyboardType="decimal-pad" placeholder="120.00" placeholderTextColor={colors.textDim}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Due Day of Month (1–31)</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
                <IconCalendar size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={dueDay} onChangeText={setDueDay}
                  keyboardType="number-pad" placeholder="15" placeholderTextColor={colors.textDim}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
                <View style={styles.chipsRow}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, {
                        backgroundColor: category === cat ? color : colors.surfaceLight,
                        borderColor: category === cat ? color : colors.border,
                      }]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.chipText, { color: category === cat ? '#fff' : colors.textMuted }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Frequency</Text>
              <View style={styles.chipsRow}>
                {FREQUENCIES.map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.chip, {
                      backgroundColor: frequency === f ? color : colors.surfaceLight,
                      borderColor: frequency === f ? color : colors.border,
                    }]}
                    onPress={() => setFrequency(f)}
                  >
                    <Text style={[styles.chipText, { color: frequency === f ? '#fff' : colors.textMuted }]}>{FREQ_LABEL[f]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Color</Text>
              <View style={styles.colorRow}>
                {BILL_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorCircleSelected]}
                    onPress={() => setColor(c)}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: color }]}
                onPress={handleSubmit} disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add Bill</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const BillCalendarScreen: React.FC<BillCalendarScreenProps> = ({ onSelectBill }) => {
  const { colors } = useAppTheme()
  const { bills, addBill, settings } = useApp()

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [modalVisible, setModalVisible] = useState(false)

  const currency = settings.currency || '$'
  const categories = useMemo(() => settings.categories || ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'], [settings])

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay()

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const prevMonthDays = getDaysInMonth(year, month - 1)
    const cells: { day: number; isCurrentMonth: boolean; isToday: boolean }[] = []

    // Leading days from prev month
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, isCurrentMonth: false, isToday: false })
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
      cells.push({ day: d, isCurrentMonth: true, isToday })
    }
    // Trailing days
    const remaining = 7 - (cells.length % 7)
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells.push({ day: d, isCurrentMonth: false, isToday: false })
      }
    }
    return cells
  }, [year, month])

  // Bills indexed by dueDay
  const billsByDay = useMemo(() => {
    const map: Record<number, Bill[]> = {}
    bills.forEach(bill => {
      if (!map[bill.dueDay]) map[bill.dueDay] = []
      map[bill.dueDay].push(bill)
    })
    return map
  }, [bills])

  // Upcoming bills sorted
  const upcomingBills = useMemo(() => {
    const todayDay = today.getDate()
    return [...bills]
      .map(b => {
        const daysUntil = b.dueDay >= todayDay
          ? b.dueDay - todayDay
          : getDaysInMonth(year, month) - todayDay + b.dueDay
        return { ...b, daysUntil }
      })
      .filter(b => b.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }, [bills, today])

  const navigateMonth = (dir: -1 | 1) => {
    let newMonth = month + dir
    let newYear = year
    if (newMonth < 0) { newMonth = 11; newYear-- }
    if (newMonth > 11) { newMonth = 0; newYear++ }
    setMonth(newMonth)
    setYear(newYear)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Month Navigation */}
        <View style={[styles.monthNav, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navBtn}>
            <IconChevronLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.monthLabelWrap}>
            <IconCalendar size={16} color={colors.primary} />
            <Text style={[styles.monthLabel, { color: colors.text }]}>
              {MONTHS[month]} {year}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navBtn}>
            <IconChevronRight size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={[styles.calendarCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {DAYS_OF_WEEK.map(d => (
              <Text key={d} style={[styles.dayHeader, { color: colors.textMuted }]}>{d}</Text>
            ))}
          </View>

          {/* Day cells */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((cell, idx) => {
              const cellBills = cell.isCurrentMonth ? (billsByDay[cell.day] || []) : []
              return (
                <View key={idx} style={styles.dayCell}>
                  <View
                    style={[
                      styles.dayCellInner,
                      cell.isToday && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: cell.isCurrentMonth ? colors.text : colors.textDim },
                        cell.isToday && { color: '#fff' },
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </View>
                  {/* Bill dots */}
                  {cellBills.length > 0 && (
                    <View style={styles.billDots}>
                      {cellBills.slice(0, 3).map((bill, bi) => (
                        <View
                          key={bi}
                          style={[styles.billDot, { backgroundColor: bill.color }]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </View>

        {/* Legend */}
        {bills.length > 0 && (
          <View style={styles.legendRow}>
            {bills.slice(0, 5).map(b => (
              <View key={b.id} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: b.color }]} />
                <Text style={[styles.legendText, { color: colors.textMuted }]} numberOfLines={1}>{b.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Bills */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Bills</Text>
        {upcomingBills.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <IconReceipt size={36} color={colors.textDim} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No bills due in the next 30 days</Text>
          </View>
        ) : (
          upcomingBills.map(bill => (
            <TouchableOpacity
              key={bill.id}
              style={[styles.billItem, { backgroundColor: colors.surface }, SHADOWS.sm]}
              onPress={() => onSelectBill(bill)}
              activeOpacity={0.8}
            >
              <View style={[styles.billColorBar, { backgroundColor: bill.color }]} />
              <View style={styles.billInfo}>
                <Text style={[styles.billName, { color: colors.text }]}>{bill.name}</Text>
                <Text style={[styles.billCat, { color: colors.textMuted }]}>
                  {bill.category} · Day {bill.dueDay}
                </Text>
              </View>
              <View style={styles.billRight}>
                <Text style={[styles.billAmount, { color: colors.text }]}>
                  {currency}{bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={[
                  styles.billDue,
                  { color: bill.daysUntil === 0 ? colors.danger : bill.daysUntil <= 3 ? colors.warning : colors.textDim },
                ]}>
                  {bill.daysUntil === 0 ? 'Due today' : `Due in ${bill.daysUntil}d`}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.warning }, SHADOWS.lg]}
        onPress={() => setModalVisible(true)}
      >
        <IconPlus size={26} color="#fff" />
      </TouchableOpacity>

      <AddBillModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addBill}
        categories={categories}
        currency={currency}
        colors={colors}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: SPACING.lg },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: RADIUS.lg, padding: SPACING.sm, marginBottom: SPACING.md,
  },
  navBtn: { padding: SPACING.sm },
  monthLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  monthLabel: { fontFamily: FONTS.bold, fontSize: 18 },

  calendarCard: { borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  dayHeaders: { flexDirection: 'row', marginBottom: SPACING.sm },
  dayHeader: { flex: 1, textAlign: 'center', fontFamily: FONTS.medium, fontSize: 12 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`, alignItems: 'center',
    paddingVertical: 4, minHeight: 46,
  },
  dayCellInner: {
    width: 30, height: 30, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
  },
  dayNumber: { fontFamily: FONTS.medium, fontSize: 13 },
  billDots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  billDot: { width: 4, height: 4, borderRadius: RADIUS.full },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: RADIUS.full },
  legendText: { fontFamily: FONTS.regular, fontSize: 11, maxWidth: 70 },

  sectionTitle: { fontFamily: FONTS.bold, fontSize: 18, marginBottom: SPACING.md },

  emptyState: {
    alignItems: 'center', padding: SPACING.xl, borderRadius: RADIUS.lg, gap: SPACING.sm,
  },
  emptyText: { fontFamily: FONTS.regular, fontSize: 14 },

  billItem: {
    flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm, overflow: 'hidden',
  },
  billColorBar: { width: 4, alignSelf: 'stretch' },
  billInfo: { flex: 1, padding: SPACING.md },
  billName: { fontFamily: FONTS.bold, fontSize: 14 },
  billCat: { fontFamily: FONTS.regular, fontSize: 12, marginTop: 2 },
  billRight: { padding: SPACING.md, alignItems: 'flex-end', gap: 4 },
  billAmount: { fontFamily: FONTS.bold, fontSize: 15 },
  billDue: { fontFamily: FONTS.medium, fontSize: 12 },

  fab: {
    position: 'absolute', bottom: 100, right: SPACING.xl,
    width: 56, height: 56, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl, maxHeight: '92%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontFamily: FONTS.bold, fontSize: 20 },
  closeBtn: { padding: SPACING.xs },

  inputLabel: { fontFamily: FONTS.medium, fontSize: 13, marginBottom: 6, marginTop: SPACING.md },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm,
  },
  textInput: { flex: 1, fontFamily: FONTS.regular, fontSize: 15, paddingVertical: 4 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  chipText: { fontFamily: FONTS.medium, fontSize: 12 },

  colorRow: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap', marginBottom: SPACING.lg },
  colorCircle: { width: 32, height: 32, borderRadius: RADIUS.full },
  colorCircleSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.15 }] },

  submitBtn: {
    padding: SPACING.lg, borderRadius: RADIUS.lg,
    alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.sm,
  },
  submitBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#fff' },
})

export default React.memo(BillCalendarScreen)

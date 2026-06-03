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
import IconRefresh from '@tabler/icons-react-native/dist/esm/icons/IconRefresh'
import IconPlus from '@tabler/icons-react-native/dist/esm/icons/IconPlus'
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX'
import IconCurrencyDollar from '@tabler/icons-react-native/dist/esm/icons/IconCurrencyDollar'
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar'
import IconTag from '@tabler/icons-react-native/dist/esm/icons/IconTag'
import IconCreditCard from '@tabler/icons-react-native/dist/esm/icons/IconCreditCard'
import { useAppTheme } from '../../hooks/useAppTheme'
import { useApp } from '../../context/AppContext'
import { FONTS, SPACING, RADIUS, SHADOWS, CATEGORY_COLORS } from '../../constants/theme'
import { RecurringPayment } from '../../utils/storage'

type Frequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
const FREQUENCIES: Frequency[] = ['weekly', 'monthly', 'quarterly', 'yearly']
const FREQ_LABEL: Record<Frequency, string> = {
  weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
}
const FREQ_MULTIPLIER: Record<Frequency, number> = {
  weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12,
}

const PAYMENT_COLORS = [
  '#7C3AED', '#EC4899', '#10B981', '#F59E0B',
  '#3B82F6', '#EF4444', '#8B5CF6', '#06B6D4',
]

const getDaysUntilDue = (nextDue: string) => {
  const diff = new Date(nextDue).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Custom Toggle ────────────────────────────────────────────────────────────
interface ToggleProps {
  value: boolean
  onToggle: () => void
  activeColor: string
  colors: any
}
const Toggle: React.FC<ToggleProps> = ({ value, onToggle, activeColor, colors }) => (
  <TouchableOpacity
    style={[
      styles.toggle,
      { backgroundColor: value ? activeColor : colors.border },
    ]}
    onPress={onToggle}
    activeOpacity={0.8}
  >
    <View
      style={[
        styles.toggleThumb,
        { transform: [{ translateX: value ? 18 : 2 }], backgroundColor: '#fff' },
      ]}
    />
  </TouchableOpacity>
)

// ─── Add Payment Modal ────────────────────────────────────────────────────────
interface AddPaymentModalProps {
  visible: boolean
  onClose: () => void
  onAdd: (payment: Omit<RecurringPayment, 'id'>) => void
  categories: string[]
  currency: string
  colors: any
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  visible, onClose, onAdd, categories, currency, colors,
}) => {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories[0] || 'Other')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [nextDue, setNextDue] = useState('')
  const [autoPay, setAutoPay] = useState(false)
  const [color, setColor] = useState(PAYMENT_COLORS[0])
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setName(''); setAmount(''); setCategory(categories[0] || 'Other')
    setFrequency('monthly'); setNextDue(''); setAutoPay(false); setColor(PAYMENT_COLORS[0])
  }

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Missing Field', 'Please enter a payment name.'); return }
    const amtNum = parseFloat(amount)
    if (!amtNum || amtNum <= 0) { Alert.alert('Invalid Amount', 'Enter a valid amount.'); return }
    if (!nextDue.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(nextDue)) {
      Alert.alert('Invalid Date', 'Enter next due date as YYYY-MM-DD.')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    onAdd({ name: name.trim(), amount: amtNum, category, frequency, nextDue, autoPay, color })
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Recurring Payment</Text>
              <TouchableOpacity onPress={() => { reset(); onClose() }} style={styles.closeBtn}>
                <IconX size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Payment Name</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
                <IconCreditCard size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={name} onChangeText={setName}
                  placeholder="e.g. Netflix, Spotify"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              {/* Amount */}
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Amount ({currency})</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
                <IconCurrencyDollar size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={amount} onChangeText={setAmount}
                  keyboardType="decimal-pad" placeholder="14.99"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              {/* Category */}
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
                      <Text style={[styles.chipText, { color: category === cat ? '#fff' : colors.textMuted }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Frequency */}
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
                    <Text style={[styles.chipText, { color: frequency === f ? '#fff' : colors.textMuted }]}>
                      {FREQ_LABEL[f]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Next Due */}
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Next Due Date (YYYY-MM-DD)</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
                <IconCalendar size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={nextDue} onChangeText={setNextDue}
                  placeholder="2025-06-01" placeholderTextColor={colors.textDim}
                />
              </View>

              {/* Auto-pay */}
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Auto-pay</Text>
                <Toggle value={autoPay} onToggle={() => setAutoPay(!autoPay)} activeColor={colors.success} colors={colors} />
              </View>

              {/* Color */}
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Color</Text>
              <View style={styles.colorRow}>
                {PAYMENT_COLORS.map(c => (
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
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add Payment</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RecurringPaymentsScreen: React.FC = () => {
  const { colors } = useAppTheme()
  const { recurringPayments, addRecurringPayment, deleteRecurringPayment, toggleRecurringAutoPay, settings } = useApp()

  const [modalVisible, setModalVisible] = useState(false)
  const currency = settings.currency || '$'

  const categories = useMemo(() => settings.categories || ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'], [settings])

  const totalMonthly = useMemo(() =>
    recurringPayments.reduce((sum, p) => sum + p.amount * (FREQ_MULTIPLIER[p.frequency as Frequency] ?? 1), 0),
    [recurringPayments]
  )

  const handleLongPress = (payment: RecurringPayment) => {
    Alert.alert(
      'Delete Payment',
      `Delete "${payment.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRecurringPayment(payment.id) },
      ]
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.headerIconWrap, { backgroundColor: colors.primary + '20' }]}>
            <IconRefresh size={28} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Recurring Payments</Text>
          <View style={[styles.totalCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
            <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total Monthly Cost</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              {currency}{totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.totalSub, { color: colors.textDim }]}>
              {recurringPayments.length} active subscription{recurringPayments.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Payment Cards */}
        {recurringPayments.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <IconRefresh size={48} color={colors.textDim} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Recurring Payments</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Track subscriptions and regular payments here
            </Text>
          </View>
        ) : (
          recurringPayments.map(payment => {
            const daysUntil = getDaysUntilDue(payment.nextDue)
            const isOverdue = daysUntil < 0
            const isDueSoon = daysUntil >= 0 && daysUntil <= 3
            const freq = payment.frequency as Frequency

            return (
              <TouchableOpacity
                key={payment.id}
                style={[styles.paymentCard, { backgroundColor: colors.surface }, SHADOWS.sm]}
                onLongPress={() => handleLongPress(payment)}
                activeOpacity={0.85}
              >
                {/* Left colored accent */}
                <View style={[styles.paymentAccent, { backgroundColor: payment.color }]} />

                <View style={styles.paymentContent}>
                  <View style={styles.paymentTop}>
                    {/* Left: color dot + name + category */}
                    <View style={styles.paymentLeft}>
                      <View style={[styles.paymentDot, { backgroundColor: payment.color + '25' }]}>
                        <View style={[styles.paymentDotInner, { backgroundColor: payment.color }]} />
                      </View>
                      <View>
                        <Text style={[styles.paymentName, { color: colors.text }]} numberOfLines={1}>
                          {payment.name}
                        </Text>
                        <Text style={[styles.paymentCat, { color: colors.textMuted }]}>
                          {payment.category}
                        </Text>
                      </View>
                    </View>

                    {/* Right: amount */}
                    <View style={styles.paymentRight}>
                      <Text style={[styles.paymentAmount, { color: colors.text }]}>
                        {currency}{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <View style={[styles.freqBadge, { backgroundColor: payment.color + '20' }]}>
                        <Text style={[styles.freqBadgeText, { color: payment.color }]}>
                          {FREQ_LABEL[freq] || payment.frequency}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom row: due info + auto-pay */}
                  <View style={styles.paymentBottom}>
                    <View style={styles.paymentDueWrap}>
                      {payment.autoPay ? (
                        <View style={[styles.autoPayBadge, { backgroundColor: colors.success + '20' }]}>
                          <View style={[styles.autoPayDot, { backgroundColor: colors.success }]} />
                          <Text style={[styles.autoPayText, { color: colors.success }]}>Auto-pay</Text>
                        </View>
                      ) : null}
                      <Text style={[
                        styles.dueText,
                        { color: isOverdue ? colors.danger : isDueSoon ? colors.warning : colors.textDim },
                      ]}>
                        {isOverdue
                          ? `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}`
                          : daysUntil === 0
                            ? 'Due today'
                            : `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
                      </Text>
                    </View>
                    <Toggle
                      value={payment.autoPay}
                      onToggle={() => toggleRecurringAutoPay(payment.id)}
                      activeColor={colors.success}
                      colors={colors}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            )
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, SHADOWS.lg]}
        onPress={() => setModalVisible(true)}
      >
        <IconPlus size={26} color="#fff" />
      </TouchableOpacity>

      <AddPaymentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addRecurringPayment}
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

  headerSection: { alignItems: 'center', marginBottom: SPACING.xl },
  headerIconWrap: {
    width: 56, height: 56, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 26, marginBottom: SPACING.md },
  totalCard: {
    width: '100%', borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', gap: 4,
  },
  totalLabel: { fontFamily: FONTS.regular, fontSize: 13 },
  totalAmount: { fontFamily: FONTS.bold, fontSize: 32 },
  totalSub: { fontFamily: FONTS.regular, fontSize: 12 },

  emptyState: { alignItems: 'center', padding: SPACING.xxl, borderRadius: RADIUS.lg, gap: SPACING.sm },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 18 },
  emptyText: { fontFamily: FONTS.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  paymentCard: {
    flexDirection: 'row', borderRadius: RADIUS.lg, marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  paymentAccent: { width: 4 },
  paymentContent: { flex: 1, padding: SPACING.md, gap: SPACING.sm },
  paymentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  paymentDot: {
    width: 38, height: 38, borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  paymentDotInner: { width: 12, height: 12, borderRadius: RADIUS.full },
  paymentName: { fontFamily: FONTS.bold, fontSize: 14 },
  paymentCat: { fontFamily: FONTS.regular, fontSize: 12, marginTop: 2 },
  paymentRight: { alignItems: 'flex-end', gap: 4 },
  paymentAmount: { fontFamily: FONTS.bold, fontSize: 18 },
  freqBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  freqBadgeText: { fontFamily: FONTS.medium, fontSize: 10 },

  paymentBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentDueWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  autoPayBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  autoPayDot: { width: 6, height: 6, borderRadius: RADIUS.full },
  autoPayText: { fontFamily: FONTS.medium, fontSize: 11 },
  dueText: { fontFamily: FONTS.regular, fontSize: 12 },

  toggle: {
    width: 42, height: 24, borderRadius: RADIUS.full,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20, height: 20, borderRadius: RADIUS.full,
  },

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

  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  toggleLabel: { fontFamily: FONTS.medium, fontSize: 15 },

  colorRow: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap', marginBottom: SPACING.lg },
  colorCircle: { width: 32, height: 32, borderRadius: RADIUS.full },
  colorCircleSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.15 }] },

  submitBtn: {
    padding: SPACING.lg, borderRadius: RADIUS.lg,
    alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.sm,
  },
  submitBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#fff' },
})

export default React.memo(RecurringPaymentsScreen)

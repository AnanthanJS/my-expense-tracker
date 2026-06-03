import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native'
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft'
import IconEdit from '@tabler/icons-react-native/dist/esm/icons/IconEdit'
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck'
import IconTrash from '@tabler/icons-react-native/dist/esm/icons/IconTrash'
import IconRefresh from '@tabler/icons-react-native/dist/esm/icons/IconRefresh'
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar'
import IconTag from '@tabler/icons-react-native/dist/esm/icons/IconTag'
import IconNotes from '@tabler/icons-react-native/dist/esm/icons/IconNotes'
import IconCurrencyDollar from '@tabler/icons-react-native/dist/esm/icons/IconCurrencyDollar'
import IconBell from '@tabler/icons-react-native/dist/esm/icons/IconBell'
import IconCreditCard from '@tabler/icons-react-native/dist/esm/icons/IconCreditCard'
import IconDeviceFloppy from '@tabler/icons-react-native/dist/esm/icons/IconDeviceFloppy'
import { useAppTheme } from '../../hooks/useAppTheme'
import { useApp } from '../../context/AppContext'
import { FONTS, SPACING, RADIUS, SHADOWS, CATEGORY_COLORS } from '../../constants/theme'
import { Bill } from '../../utils/storage'

interface BillDetailScreenProps {
  bill: Bill
  onBack: () => void
}

const FREQ_LABEL: Record<string, string> = {
  monthly: 'Monthly', weekly: 'Weekly', quarterly: 'Quarterly', yearly: 'Yearly',
}

// ─── Custom Toggle ────────────────────────────────────────────────────────────
interface ToggleProps { value: boolean; onToggle: () => void; activeColor: string; colors: any }
const Toggle: React.FC<ToggleProps> = ({ value, onToggle, activeColor, colors }) => (
  <TouchableOpacity
    style={[styles.toggle, { backgroundColor: value ? activeColor : colors.border }]}
    onPress={onToggle} activeOpacity={0.8}
  >
    <View style={[styles.toggleThumb, { transform: [{ translateX: value ? 18 : 2 }] }]} />
  </TouchableOpacity>
)

// ─── Main Screen ──────────────────────────────────────────────────────────────
const BillDetailScreen: React.FC<BillDetailScreenProps> = ({ bill, onBack }) => {
  const { colors } = useAppTheme()
  const { updateBill, deleteBill, toggleBillAutoPay, toggleBillReminder, settings, showFeedback } = useApp()

  const currency = settings.currency || '$'

  // Local state
  const [name, setName] = useState(bill.name)
  const [isEditingName, setIsEditingName] = useState(false)
  const [notes, setNotes] = useState(bill.notes || '')
  const [autoPay, setAutoPay] = useState(bill.autoPay)
  const [reminder, setReminder] = useState(bill.reminder)
  const [isPaid, setIsPaid] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Sync if bill prop changes
  useEffect(() => {
    setName(bill.name)
    setNotes(bill.notes || '')
    setAutoPay(bill.autoPay)
    setReminder(bill.reminder)
    setIsPaid(false)
  }, [bill])

  const categoryColor = CATEGORY_COLORS[bill.category] || bill.color || '#7C3AED'

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Invalid Name', 'Bill name cannot be empty.'); return }
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 300))
    updateBill({ ...bill, name: name.trim(), notes, autoPay, reminder })
    setIsSaving(false)
    showFeedback?.('Bill updated successfully', 'success')
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Bill',
      `Are you sure you want to delete "${bill.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => { deleteBill(bill.id); onBack() },
        },
      ]
    )
  }

  const handleMarkPaid = () => {
    setIsPaid(true)
    showFeedback?.(`${bill.name} marked as paid`, 'success')
  }

  const handleAutoPayToggle = () => {
    const newVal = !autoPay
    setAutoPay(newVal)
  }

  const handleReminderToggle = () => {
    const newVal = !reminder
    setReminder(newVal)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <IconArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>Bill Details</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveIconBtn, { backgroundColor: colors.primary + '15' }]}
          disabled={isSaving}
        >
          <IconDeviceFloppy size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Bill Name Hero */}
        <View style={[styles.heroCard, { backgroundColor: bill.color }, SHADOWS.md]}>
          <View style={styles.heroInner}>
            <View style={[styles.heroIconWrap, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <IconCreditCard size={28} color="#fff" />
            </View>
            <View style={styles.heroTextWrap}>
              {isEditingName ? (
                <TextInput
                  style={[styles.heroNameInput]}
                  value={name}
                  onChangeText={setName}
                  onBlur={() => setIsEditingName(false)}
                  autoFocus
                  selectTextOnFocus
                />
              ) : (
                <TouchableOpacity onPress={() => setIsEditingName(true)} style={styles.heroNameRow}>
                  <Text style={styles.heroName}>{name}</Text>
                  <IconEdit size={16} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              )}
              <Text style={styles.heroSub}>Tap name to edit</Text>
            </View>
          </View>
        </View>

        {/* Info Cards Grid */}
        <View style={styles.infoGrid}>
          {/* Amount */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
            <View style={[styles.infoIconWrap, { backgroundColor: colors.primary + '15' }]}>
              <IconCurrencyDollar size={18} color={colors.primary} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Amount</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {currency}{bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Due Day */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
            <View style={[styles.infoIconWrap, { backgroundColor: colors.warning + '15' }]}>
              <IconCalendar size={18} color={colors.warning} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Due</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>Day {bill.dueDay}</Text>
            <Text style={[styles.infoSub, { color: colors.textDim }]}>of every month</Text>
          </View>

          {/* Frequency */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
            <View style={[styles.infoIconWrap, { backgroundColor: colors.info + '15' }]}>
              <IconRefresh size={18} color={colors.info} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Frequency</Text>
            <View style={[styles.freqBadge, { backgroundColor: bill.color + '20' }]}>
              <Text style={[styles.freqBadgeText, { color: bill.color }]}>
                {FREQ_LABEL[bill.frequency] || bill.frequency}
              </Text>
            </View>
          </View>

          {/* Category */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
            <View style={[styles.infoIconWrap, { backgroundColor: categoryColor + '15' }]}>
              <IconTag size={18} color={categoryColor} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Category</Text>
            <View style={styles.catRow}>
              <View style={[styles.catDot, { backgroundColor: categoryColor }]} />
              <Text style={[styles.infoValue, { color: colors.text }]}>{bill.category}</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>

          <View style={[styles.settingsRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingsLeft}>
              <View style={[styles.settingsIconWrap, { backgroundColor: colors.success + '15' }]}>
                <IconCreditCard size={16} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.settingsLabel, { color: colors.text }]}>Auto-pay</Text>
                <Text style={[styles.settingsSub, { color: colors.textMuted }]}>Automatically pay when due</Text>
              </View>
            </View>
            <Toggle value={autoPay} onToggle={handleAutoPayToggle} activeColor={colors.success} colors={colors} />
          </View>

          <View style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <View style={[styles.settingsIconWrap, { backgroundColor: colors.warning + '15' }]}>
                <IconBell size={16} color={colors.warning} />
              </View>
              <View>
                <Text style={[styles.settingsLabel, { color: colors.text }]}>Reminder</Text>
                <Text style={[styles.settingsSub, { color: colors.textMuted }]}>Get notified before due date</Text>
              </View>
            </View>
            <Toggle value={reminder} onToggle={handleReminderToggle} activeColor={colors.warning} colors={colors} />
          </View>
        </View>

        {/* Notes */}
        <View style={[styles.section, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <View style={styles.sectionHeaderRow}>
            <IconNotes size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
          </View>
          <TextInput
            style={[styles.notesInput, {
              color: colors.text, borderColor: colors.border,
              backgroundColor: colors.surfaceLight,
            }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            placeholder="Add notes about this bill..."
            placeholderTextColor={colors.textDim}
            textAlignVertical="top"
          />
        </View>

        {/* Mark as Paid */}
        <TouchableOpacity
          style={[
            styles.paidBtn,
            {
              backgroundColor: isPaid ? colors.success + '20' : colors.surface,
              borderColor: isPaid ? colors.success : colors.border,
            },
            SHADOWS.sm,
          ]}
          onPress={handleMarkPaid}
          disabled={isPaid}
        >
          <View style={[styles.paidIconWrap, { backgroundColor: isPaid ? colors.success : colors.surfaceLight }]}>
            <IconCheck size={20} color={isPaid ? '#fff' : colors.textMuted} />
          </View>
          <View>
            <Text style={[styles.paidLabel, { color: isPaid ? colors.success : colors.text }]}>
              {isPaid ? 'Paid This Month ✓' : 'Mark as Paid This Month'}
            </Text>
            <Text style={[styles.paidSub, { color: colors.textMuted }]}>
              {isPaid ? 'Payment recorded for this month' : 'Simulate a payment for this billing cycle'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }, SHADOWS.md]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <IconDeviceFloppy size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}
          onPress={handleDelete}
        >
          <IconTrash size={18} color={colors.danger} />
          <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete Bill</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl, paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: { padding: SPACING.xs, marginRight: SPACING.sm },
  topBarTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 18 },
  saveIconBtn: { padding: SPACING.sm, borderRadius: RADIUS.md },

  scroll: { padding: SPACING.lg },

  heroCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.lg },
  heroInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  heroIconWrap: {
    width: 52, height: 52, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTextWrap: { flex: 1 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  heroName: { fontFamily: FONTS.bold, fontSize: 22, color: '#fff', flex: 1 },
  heroNameInput: {
    fontFamily: FONTS.bold, fontSize: 22, color: '#fff',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.6)',
    paddingBottom: 2,
  },
  heroSub: { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  infoCard: {
    width: '47.5%', borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.xs,
  },
  infoIconWrap: {
    width: 34, height: 34, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  infoLabel: { fontFamily: FONTS.regular, fontSize: 11 },
  infoValue: { fontFamily: FONTS.bold, fontSize: 17 },
  infoSub: { fontFamily: FONTS.regular, fontSize: 11 },
  freqBadge: { alignSelf: 'flex-start', paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  freqBadgeText: { fontFamily: FONTS.medium, fontSize: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catDot: { width: 8, height: 8, borderRadius: RADIUS.full },

  section: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 16 },

  settingsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.md, borderBottomWidth: 1,
  },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  settingsIconWrap: {
    width: 32, height: 32, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsLabel: { fontFamily: FONTS.medium, fontSize: 14 },
  settingsSub: { fontFamily: FONTS.regular, fontSize: 11, marginTop: 2 },

  toggle: { width: 42, height: 24, borderRadius: RADIUS.full, justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: RADIUS.full, backgroundColor: '#fff' },

  notesInput: {
    borderWidth: 1, borderRadius: RADIUS.md,
    padding: SPACING.md, fontFamily: FONTS.regular, fontSize: 14,
    minHeight: 100, marginTop: SPACING.sm,
  },

  paidBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.md,
  },
  paidIconWrap: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
  },
  paidLabel: { fontFamily: FONTS.bold, fontSize: 14 },
  paidSub: { fontFamily: FONTS.regular, fontSize: 12, marginTop: 2 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, padding: SPACING.lg, borderRadius: RADIUS.lg, marginBottom: SPACING.md,
  },
  saveBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#fff' },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1,
  },
  deleteBtnText: { fontFamily: FONTS.bold, fontSize: 15 },
})

export default React.memo(BillDetailScreen)

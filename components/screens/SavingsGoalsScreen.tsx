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
import Svg, { Circle } from 'react-native-svg'
import IconPigMoney from '@tabler/icons-react-native/dist/esm/icons/IconPigMoney'
import IconPlus from '@tabler/icons-react-native/dist/esm/icons/IconPlus'
import IconTrash from '@tabler/icons-react-native/dist/esm/icons/IconTrash'
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX'
import IconTarget from '@tabler/icons-react-native/dist/esm/icons/IconTarget'
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar'
import IconCurrencyDollar from '@tabler/icons-react-native/dist/esm/icons/IconCurrencyDollar'
import { useAppTheme } from '../../hooks/useAppTheme'
import { useApp } from '../../context/AppContext'
import { FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme'
import { SavingsGoal } from '../../utils/storage'

const RADIUS_RING = 30
const STROKE = 6
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_RING

const GOAL_COLORS = [
  '#7C3AED',
  '#EC4899',
  '#10B981',
  '#F59E0B',
  '#3B82F6',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
]

// ─── Circular Progress Ring ───────────────────────────────────────────────────
const ProgressRing: React.FC<{ progress: number; color: string }> = ({ progress, color }) => {
  const { colors } = useAppTheme()
  const clampedProgress = Math.min(Math.max(progress, 0), 1)
  const dashOffset = CIRCUMFERENCE * (1 - clampedProgress)
  const size = (RADIUS_RING + STROKE) * 2

  return (
    <Svg width={size} height={size}>
      {/* Track */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={RADIUS_RING}
        stroke={colors.border}
        strokeWidth={STROKE}
        fill="none"
      />
      {/* Progress */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={RADIUS_RING}
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  )
}

// ─── Add Money Modal ──────────────────────────────────────────────────────────
interface AddMoneyModalProps {
  visible: boolean
  goal: SavingsGoal | null
  onClose: () => void
  onContribute: (id: string, amount: number) => void
  currency: string
  colors: any
}

const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  visible,
  goal,
  onClose,
  onContribute,
  currency,
  colors,
}) => {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const num = parseFloat(amount)
    if (!num || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.')
      return
    }
    if (!goal) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    onContribute(goal.id, num)
    setLoading(false)
    setAmount('')
    onClose()
  }

  const remaining = goal ? goal.target - goal.current : 0

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Money</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <IconX size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {goal && (
              <View style={[styles.goalChip, { backgroundColor: goal.color + '20' }]}>
                <Text style={[styles.goalChipText, { color: goal.color }]}>{goal.name}</Text>
                <Text style={[styles.goalChipSub, { color: colors.textMuted }]}>
                  {currency}{goal.current.toLocaleString()} / {currency}{goal.target.toLocaleString()} saved
                </Text>
              </View>
            )}
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Amount to Add</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
              <IconCurrencyDollar size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textDim}
                autoFocus
              />
            </View>
            {remaining > 0 && (
              <Text style={[styles.hintText, { color: colors.textDim }]}>
                {currency}{remaining.toFixed(2)} remaining to reach goal
              </Text>
            )}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: goal?.color || colors.primary }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Add Money</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── New Goal Modal ───────────────────────────────────────────────────────────
interface NewGoalModalProps {
  visible: boolean
  onClose: () => void
  onAdd: (goal: Omit<SavingsGoal, 'id'>) => void
  currency: string
  colors: any
}

const NewGoalModal: React.FC<NewGoalModalProps> = ({ visible, onClose, onAdd, currency, colors }) => {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Missing Field', 'Please enter a goal name.'); return }
    const targetNum = parseFloat(target)
    if (!targetNum || targetNum <= 0) { Alert.alert('Invalid Amount', 'Please enter a valid target amount.'); return }
    if (!deadline.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      Alert.alert('Invalid Date', 'Please enter deadline as YYYY-MM-DD.')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    onAdd({ name: name.trim(), target: targetNum, current: 0, deadline, color: selectedColor, icon: 'pig' })
    setLoading(false)
    setName(''); setTarget(''); setDeadline(''); setSelectedColor(GOAL_COLORS[0])
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Savings Goal</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <IconX size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Goal Name</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
                <IconPigMoney size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Emergency Fund"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Target Amount ({currency})</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
                <IconCurrencyDollar size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="decimal-pad"
                  placeholder="5000.00"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Deadline (YYYY-MM-DD)</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
                <IconCalendar size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={deadline}
                  onChangeText={setDeadline}
                  placeholder="2025-12-31"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Color</Text>
              <View style={styles.colorRow}>
                {GOAL_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c },
                      selectedColor === c && styles.colorCircleSelected,
                    ]}
                    onPress={() => setSelectedColor(c)}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: selectedColor }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Goal</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const SavingsGoalsScreen: React.FC = () => {
  const { colors } = useAppTheme()
  const { savingsGoals, addSavingsGoal, deleteSavingsGoal, contributeSavings, settings } = useApp()

  const [addMoneyVisible, setAddMoneyVisible] = useState(false)
  const [newGoalVisible, setNewGoalVisible] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)

  const currency = settings.currency || '$'

  const totalSaved = useMemo(() => savingsGoals.reduce((s, g) => s + g.current, 0), [savingsGoals])
  const totalTarget = useMemo(() => savingsGoals.reduce((s, g) => s + g.target, 0), [savingsGoals])
  const overallProgress = totalTarget > 0 ? totalSaved / totalTarget : 0

  const handleLongPress = (goal: SavingsGoal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSavingsGoal(goal.id) },
      ]
    )
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.headerIconWrap, { backgroundColor: colors.primary + '20' }]}>
            <IconPigMoney size={28} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Savings Goals</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {currency}{totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} saved of {currency}{totalTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>

          {/* Overall progress bar */}
          {totalTarget > 0 && (
            <View style={styles.overallBarWrap}>
              <View style={[styles.overallBarTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.overallBarFill,
                    { width: `${Math.min(overallProgress * 100, 100)}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
              <Text style={[styles.overallPct, { color: colors.primary }]}>
                {(overallProgress * 100).toFixed(0)}%
              </Text>
            </View>
          )}
        </View>

        {/* Goals */}
        {savingsGoals.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <IconPigMoney size={48} color={colors.textDim} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Savings Goals</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Tap the + button to create your first savings goal
            </Text>
          </View>
        ) : (
          savingsGoals.map(goal => {
            const progress = goal.target > 0 ? goal.current / goal.target : 0
            const daysLeft = getDaysUntilDeadline(goal.deadline)
            const pct = Math.min(progress * 100, 100).toFixed(0)

            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, { backgroundColor: colors.surface, borderLeftColor: goal.color }, SHADOWS.sm]}
                onLongPress={() => handleLongPress(goal)}
                activeOpacity={0.85}
              >
                <View style={styles.goalCardTop}>
                  {/* Ring */}
                  <View style={styles.ringWrap}>
                    <ProgressRing progress={progress} color={goal.color} />
                    <View style={styles.ringLabelAbsolute}>
                      <Text style={[styles.ringPct, { color: goal.color }]}>{pct}%</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalName, { color: colors.text }]} numberOfLines={1}>{goal.name}</Text>
                    <View style={styles.goalMeta}>
                      <IconTarget size={13} color={colors.textMuted} />
                      <Text style={[styles.goalMetaText, { color: colors.textMuted }]}>
                        Target: {currency}{goal.target.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.goalMeta}>
                      <IconCalendar size={13} color={colors.textMuted} />
                      <Text style={[styles.goalMetaText, { color: daysLeft < 30 ? colors.warning : colors.textMuted }]}>
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                      </Text>
                    </View>
                    <Text style={[styles.goalAmounts, { color: colors.textMuted }]}>
                      <Text style={{ color: goal.color, fontFamily: FONTS.bold }}>
                        {currency}{goal.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      {' '}/{' '}{currency}{goal.target.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Add money button */}
                <TouchableOpacity
                  style={[styles.addMoneyBtn, { backgroundColor: goal.color + '15', borderColor: goal.color + '40' }]}
                  onPress={() => { setSelectedGoal(goal); setAddMoneyVisible(true) }}
                >
                  <IconPlus size={14} color={goal.color} />
                  <Text style={[styles.addMoneyText, { color: goal.color }]}>Add Money</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, SHADOWS.lg]}
        onPress={() => setNewGoalVisible(true)}
      >
        <IconPlus size={26} color="#fff" />
      </TouchableOpacity>

      {/* Modals */}
      <AddMoneyModal
        visible={addMoneyVisible}
        goal={selectedGoal}
        onClose={() => { setAddMoneyVisible(false); setSelectedGoal(null) }}
        onContribute={contributeSavings}
        currency={currency}
        colors={colors}
      />
      <NewGoalModal
        visible={newGoalVisible}
        onClose={() => setNewGoalVisible(false)}
        onAdd={addSavingsGoal}
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
  headerTitle: { fontFamily: FONTS.bold, fontSize: 26, marginBottom: 4 },
  headerSub: { fontFamily: FONTS.regular, fontSize: 14, marginBottom: SPACING.md },

  overallBarWrap: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: SPACING.sm },
  overallBarTrack: { flex: 1, height: 8, borderRadius: RADIUS.full, overflow: 'hidden' },
  overallBarFill: { height: '100%', borderRadius: RADIUS.full },
  overallPct: { fontFamily: FONTS.bold, fontSize: 13, width: 36, textAlign: 'right' },

  emptyState: {
    alignItems: 'center', padding: SPACING.xxl, borderRadius: RADIUS.lg, gap: SPACING.sm,
  },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 18 },
  emptyText: { fontFamily: FONTS.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  goalCard: {
    borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md,
    borderLeftWidth: 4, gap: SPACING.md,
  },
  goalCardTop: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  ringWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringLabelAbsolute: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
  },
  ringPct: { fontFamily: FONTS.bold, fontSize: 11 },

  goalInfo: { flex: 1, gap: 4 },
  goalName: { fontFamily: FONTS.bold, fontSize: 16 },
  goalMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalMetaText: { fontFamily: FONTS.regular, fontSize: 12 },
  goalAmounts: { fontFamily: FONTS.regular, fontSize: 13, marginTop: 2 },

  addMoneyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, borderWidth: 1,
  },
  addMoneyText: { fontFamily: FONTS.medium, fontSize: 13 },

  fab: {
    position: 'absolute', bottom: 100, right: SPACING.xl,
    width: 56, height: 56, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
  },

  // Modal shared
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontFamily: FONTS.bold, fontSize: 20 },
  closeBtn: { padding: SPACING.xs },

  goalChip: { borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, gap: 4 },
  goalChipText: { fontFamily: FONTS.bold, fontSize: 15 },
  goalChipSub: { fontFamily: FONTS.regular, fontSize: 12 },

  inputLabel: { fontFamily: FONTS.medium, fontSize: 13, marginBottom: 6, marginTop: SPACING.md },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm,
  },
  textInput: { flex: 1, fontFamily: FONTS.regular, fontSize: 15, paddingVertical: 4 },
  hintText: { fontFamily: FONTS.regular, fontSize: 12, marginTop: 6 },

  colorRow: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap', marginBottom: SPACING.lg },
  colorCircle: { width: 32, height: 32, borderRadius: RADIUS.full },
  colorCircleSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.15 }] },

  submitBtn: {
    padding: SPACING.lg, borderRadius: RADIUS.lg,
    alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.sm,
  },
  submitBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#fff' },
})

export default React.memo(SavingsGoalsScreen)

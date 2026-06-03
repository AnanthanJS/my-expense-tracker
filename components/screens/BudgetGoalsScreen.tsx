import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import IconTarget from '@tabler/icons-react-native/dist/esm/icons/IconTarget';
import IconPlus from '@tabler/icons-react-native/dist/esm/icons/IconPlus';
import IconTrash from '@tabler/icons-react-native/dist/esm/icons/IconTrash';
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX';
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck';
import IconChartBar from '@tabler/icons-react-native/dist/esm/icons/IconChartBar';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONTS, SPACING, RADIUS, SHADOWS, CATEGORY_COLORS } from '../../constants/theme';
import { getMonthName } from '../../utils/storage';
import type { BudgetGoal } from '../../utils/storage';

// ─── Animated Progress Bar ────────────────────────────────────────────────────

interface ProgressBarProps {
  percentage: number;
  color: string;
  backgroundColor: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, color, backgroundColor }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(percentage, 100),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.progressTrack, { backgroundColor }]}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: color }]} />
    </View>
  );
};

// ─── Goal Card ────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: BudgetGoal;
  spent: number;
  currency: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onDelete: (id: string) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, spent, currency, colors, onDelete }) => {
  const percentage = goal.limit > 0 ? (spent / goal.limit) * 100 : 0;
  const remaining = Math.max(goal.limit - spent, 0);

  const barColor =
    percentage >= 90
      ? colors.danger
      : percentage >= 70
      ? colors.warning
      : colors.success;

  const categoryColor = CATEGORY_COLORS[goal.category] ?? colors.primary;

  const handleLongPress = () => {
    Alert.alert(
      'Delete Goal',
      `Remove budget goal for ${goal.category}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(goal.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
      delayLongPress={400}
    >
      {/* Card Header */}
      <View style={styles.goalHeader}>
        <View style={styles.goalLeft}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
          <View>
            <Text style={[styles.goalCategory, { color: colors.text }]}>{goal.category}</Text>
            <Text style={[styles.goalPeriod, { color: colors.textDim }]}>
              per {goal.period}
            </Text>
          </View>
        </View>
        <View style={styles.goalRight}>
          <Text style={[styles.goalSpent, { color: barColor }]}>
            {currency}{spent.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.goalLimit, { color: colors.textMuted }]}>
            {' '}/ {currency}{goal.limit.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        percentage={percentage}
        color={barColor}
        backgroundColor={colors.surfaceLight}
      />

      {/* Footer */}
      <View style={styles.goalFooter}>
        <Text style={[styles.goalPercentage, { color: barColor }]}>
          {Math.min(Math.round(percentage), 100)}% used
        </Text>
        <Text style={[styles.goalRemaining, { color: colors.textMuted }]}>
          {currency}{remaining.toLocaleString('en-IN')} left
        </Text>
      </View>

      {/* Overspent badge */}
      {spent > goal.limit && (
        <View style={[styles.overspentBadge, { backgroundColor: colors.danger + '20' }]}>
          <Text style={[styles.overspentText, { color: colors.danger }]}>
            Over by {currency}{(spent - goal.limit).toLocaleString('en-IN')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Bills',
  'Entertainment', 'Health', 'Education', 'Travel',
  'Fitness', 'Beauty', 'Rent', 'Utilities', 'Other',
];

const BudgetGoalsScreen: React.FC = () => {
  const { budgetGoals, expenses, settings, addBudgetGoal, deleteBudgetGoal } = useApp();
  const { colors } = useAppTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [limitAmount, setLimitAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const monthName = getMonthName(now);

  // ── Calculate spent per category this month ──
  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    expenses.forEach((e) => {
      if (e.date >= monthStart && e.date <= monthEnd) {
        map[e.category] = (map[e.category] ?? 0) + e.amount;
      }
    });
    return map;
  }, [expenses, now]);

  // ── Summary totals ──
  const summary = useMemo(() => {
    const totalBudget = budgetGoals.reduce((sum, g) => sum + g.limit, 0);
    const totalSpent = budgetGoals.reduce((sum, g) => sum + (spentByCategory[g.category] ?? 0), 0);
    return {
      totalBudget,
      totalSpent,
      remaining: Math.max(totalBudget - totalSpent, 0),
    };
  }, [budgetGoals, spentByCategory]);

  const currency = settings.currency;

  const handleAdd = async () => {
    const parsed = parseFloat(limitAmount);
    if (!limitAmount || isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid limit amount.');
      return;
    }
    if (budgetGoals.some((g) => g.category === selectedCategory)) {
      setError(`A goal for ${selectedCategory} already exists.`);
      return;
    }
    setError('');
    setIsSaving(true);
    addBudgetGoal({ category: selectedCategory, limit: parsed, period });
    setIsSaving(false);
    setModalVisible(false);
    setLimitAmount('');
    setSelectedCategory('Food');
    setPeriod('monthly');
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setError('');
    setLimitAmount('');
    setSelectedCategory('Food');
    setPeriod('monthly');
  };

  // ── Empty State ──
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceLight }]}>
        <IconTarget size={48} color={colors.primary} strokeWidth={1.5} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Budget Goals Yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Set spending limits for each category to stay on track with your finances.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Budget Goals</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{monthName}</Text>
          </View>
          <View style={[styles.headerIconWrap, { backgroundColor: colors.surfaceLight }]}>
            <IconChartBar size={22} color={colors.primary} strokeWidth={2} />
          </View>
        </View>

        {/* ── Summary Card ── */}
        {budgetGoals.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.md]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Budget</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {currency}{summary.totalBudget.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Spent</Text>
                <Text style={[styles.summaryValue, { color: colors.danger }]}>
                  {currency}{summary.totalSpent.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Remaining</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {currency}{summary.remaining.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Goal List ── */}
        {budgetGoals.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.goalList}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              SPENDING LIMITS
            </Text>
            {budgetGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                spent={spentByCategory[goal.category] ?? 0}
                currency={currency}
                colors={colors}
                onDelete={deleteBudgetGoal}
              />
            ))}
          </View>
        )}

        {/* ── Add Button ── */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }, SHADOWS.md]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <IconPlus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Add Budget Goal</Text>
        </TouchableOpacity>

        <View style={styles.longPressHint}>
          <Text style={[styles.longPressText, { color: colors.textDim }]}>
            Long-press a goal to delete it
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Add Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Budget Goal</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={[styles.modalClose, { backgroundColor: colors.surfaceLight }]}
              >
                <IconX size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Category Selector */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                const catColor = CATEGORY_COLORS[cat] ?? colors.primary;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      { borderColor: colors.border, backgroundColor: colors.surfaceLight },
                      isSelected && { borderColor: catColor, backgroundColor: catColor + '20' },
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setError('');
                    }}
                  >
                    <View style={[styles.chipDot, { backgroundColor: catColor }]} />
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? catColor : colors.textMuted },
                        isSelected && { fontFamily: FONTS.bold },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Limit Amount */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Monthly Limit</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <Text style={[styles.currencyPrefix, { color: colors.textMuted }]}>{currency}</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={limitAmount}
                onChangeText={(v) => {
                  setLimitAmount(v);
                  setError('');
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textDim}
                returnKeyType="done"
              />
            </View>

            {/* Period Selector */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Period</Text>
            <View style={styles.periodRow}>
              {(['monthly', 'weekly'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.periodChip,
                    { borderColor: colors.border, backgroundColor: colors.surfaceLight },
                    period === p && { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
                  ]}
                  onPress={() => setPeriod(p)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      { color: period === p ? colors.primary : colors.textMuted },
                      period === p && { fontFamily: FONTS.bold },
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Error */}
            {error ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            ) : null}

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: isSaving ? colors.success : colors.primary },
              ]}
              onPress={handleAdd}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <IconCheck size={18} color="#FFFFFF" strokeWidth={3} />
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Goal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary
  summaryCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontFamily: FONTS.medium, letterSpacing: 0.3, marginBottom: 4 },
  summaryValue: { fontSize: 17, fontFamily: FONTS.bold },
  summaryDivider: { width: 1, height: 36, marginHorizontal: SPACING.sm },

  // Section
  sectionLabel: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  goalList: { marginBottom: SPACING.xl },

  // Goal Card
  goalCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  goalLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  categoryDot: { width: 12, height: 12, borderRadius: RADIUS.full },
  goalCategory: { fontSize: 15, fontFamily: FONTS.bold },
  goalPeriod: { fontSize: 11, fontFamily: FONTS.regular, marginTop: 1 },
  goalRight: { flexDirection: 'row', alignItems: 'baseline' },
  goalSpent: { fontSize: 16, fontFamily: FONTS.bold },
  goalLimit: { fontSize: 13, fontFamily: FONTS.regular },

  // Progress
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },

  // Goal Footer
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalPercentage: { fontSize: 12, fontFamily: FONTS.bold },
  goalRemaining: { fontSize: 12, fontFamily: FONTS.regular },

  // Overspent
  overspentBadge: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  overspentText: { fontSize: 12, fontFamily: FONTS.bold },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: { fontSize: 20, fontFamily: FONTS.bold, marginBottom: SPACING.sm },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },

  // Long press hint
  longPressHint: { alignItems: 'center', marginBottom: SPACING.xl },
  longPressText: { fontSize: 12, fontFamily: FONTS.regular },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderWidth: 1,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Form Fields
  fieldLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  categoryScroll: { marginBottom: SPACING.xs },
  categoryScrollContent: { gap: SPACING.sm, paddingVertical: 4 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  chipDot: { width: 8, height: 8, borderRadius: RADIUS.full },
  chipText: { fontSize: 13, fontFamily: FONTS.medium },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  currencyPrefix: { fontSize: 18, fontFamily: FONTS.bold, marginRight: 4 },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: FONTS.bold,
    paddingVertical: SPACING.md,
  },

  periodRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xs },
  periodChip: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  periodText: { fontSize: 14, fontFamily: FONTS.medium },

  errorText: { fontSize: 13, fontFamily: FONTS.medium, textAlign: 'center' },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xs,
  },
  saveButtonText: { fontSize: 16, fontFamily: FONTS.bold, color: '#FFFFFF' },
});

export default React.memo(BudgetGoalsScreen);

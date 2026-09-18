import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Modal, BackHandler } from 'react-native';
import Animated from 'react-native-reanimated';
import { contentExiting, rowEntering } from '../../constants/motion';
import { IconCheck, IconChevronRight, IconX } from '@tabler/icons-react-native';
import { SPACING, GUTTER, GLASS, SCRIM_COLOR, TEXT, RADII, ELEVATION, getBudgetTone } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useNavbarHeight } from '../../hooks/useNavbarHeight';
import { formatCurrencyCompact } from '../../utils/formatCurrency';
import type { ThemePreference, Settings } from '../../utils/storage';
import CategoryBudgetsScreen from './CategoryBudgetsScreen';
import CategoryEditSheet from '../CategoryEditSheet';
import type { CategoryDraft } from '../CategoryEditSheet';
import PressableScale from '../PressableScale';

const CURRENCIES = [
  { symbol: '₹', label: 'Indian Rupee', code: 'INR' },
  { symbol: '$', label: 'US Dollar', code: 'USD' },
  { symbol: '€', label: 'Euro', code: 'EUR' },
  { symbol: '£', label: 'British Pound', code: 'GBP' },
  { symbol: '¥', label: 'Japanese Yen', code: 'JPY' },
  { symbol: 'A$', label: 'Australian Dollar', code: 'AUD' },
  { symbol: 'C$', label: 'Canadian Dollar', code: 'CAD' },
  { symbol: 'CHF', label: 'Swiss Franc', code: 'CHF' },
];

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** How long after the last keystroke a text field is persisted. */
const SAVE_DEBOUNCE_MS = 600;

/** Digits and at most one decimal separator. */
const cleanAmount = (raw: string) => raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, expenses, showFeedback, recategoriseExpenses } = useApp();
  const { colors, isDark } = useAppTheme();
  const glass = isDark ? GLASS.dark : GLASS.light;
  const navbarHeight = useNavbarHeight();

  // ── Local edit buffers for the two free-text fields ──────────────────────
  const [income, setIncome] = useState(settings.income);
  const [budget, setBudget] = useState(settings.budget);

  const [showCurrency, setShowCurrency] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Re-sync only when a mirrored field changes elsewhere, so an unrelated
  // write (a category edit, a theme switch) cannot clobber in-progress typing.
  useEffect(() => {
    setIncome(settings.income);
    setBudget(settings.budget);
  }, [settings.income, settings.budget]);

  /**
   * Persist a patch immediately and flash the "Saved" indicator.
   *
   * Every control on this screen writes straight through — there is no Save
   * button, so nothing can be lost by navigating away mid-edit. That is also
   * why the sticky save bar, the "Save changes?" prompt and the swipe guard
   * are gone: all three existed only because saving used to be manual.
   */
  const persist = useCallback((patch: Partial<Settings>) => {
    updateSettings({ ...settingsRef.current, ...patch });
    setIsSaving(false);
    setSavedAt(Date.now());
    // updateSettings already raises "Settings saved!", which the toast bridge
    // picks up — announcing here too would show it twice.
  }, [updateSettings]);

  /** Debounced variant for text fields, so we don't write on every keystroke. */
  const persistDebounced = useCallback((patch: Partial<Settings>) => {
    setIsSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(patch), SAVE_DEBOUNCE_MS);
  }, [persist]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const handleIncome = useCallback((raw: string) => {
    const next = cleanAmount(raw);
    setIncome(next);
    persistDebounced({ income: next });
  }, [persistDebounced]);

  const handleBudget = useCallback((raw: string) => {
    const next = cleanAmount(raw);
    setBudget(next);
    persistDebounced({ budget: next });
  }, [persistDebounced]);

  // ── Derived numbers for the plan card ────────────────────────────────────
  const incomeValue = parseFloat(income) || 0;
  const budgetValue = parseFloat(budget) || 0;
  const budgetShare = incomeValue > 0 ? Math.round((budgetValue / incomeValue) * 100) : null;

  const limits = useMemo(() => settings.categoryBudgets || {}, [settings.categoryBudgets]);
  const groups = useMemo(() => settings.categoryGroups || {}, [settings.categoryGroups]);
  const assigned = useMemo(
    () => settings.categories.reduce((sum, c) => sum + (limits[c] > 0 ? limits[c] : 0), 0),
    [settings.categories, limits],
  );
  const unassigned = Math.max(budgetValue - assigned, 0);
  const overAssigned = assigned > budgetValue;
  const assignedTone = getBudgetTone(assigned, budgetValue, colors);
  const assignedFill = budgetValue > 0 ? Math.min((assigned / budgetValue) * 100, 100) : 0;
  const withLimit = settings.categories.filter((c) => limits[c] > 0).length;

  const currency = useMemo(
    () => CURRENCIES.find((c) => c.symbol === settings.currency),
    [settings.currency],
  );

  // ── Android back closes the sub-screen before leaving the tab ────────────
  useEffect(() => {
    if (!showCategories) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowCategories(false);
      return true;
    });
    return () => sub.remove();
  }, [showCategories]);

  // ── Category mutations ───────────────────────────────────────────────────
  const handleCategorySave = useCallback((draft: CategoryDraft) => {
    const current = settingsRef.current;
    const { originalName, name, limit, group } = draft;

    const categories = originalName
      ? current.categories.map((c) => (c === originalName ? name : c))
      : [...current.categories, name];

    const nextLimits = { ...(current.categoryBudgets || {}) };
    const nextGroups = { ...(current.categoryGroups || {}) };
    if (originalName && originalName !== name) {
      delete nextLimits[originalName];
      delete nextGroups[originalName];
    }
    if (limit) nextLimits[name] = limit;
    else delete nextLimits[name];
    nextGroups[name] = group;

    persist({ categories, categoryBudgets: nextLimits, categoryGroups: nextGroups });
    if (originalName && originalName !== name) {
      // Expenses store the category as a string, so a rename has to follow
      // through or every past expense keeps a label that no longer exists.
      recategoriseExpenses(originalName, name);
    }
    setIsSheetOpen(false);
    setEditingCategory(null);
  }, [persist, recategoriseExpenses]);

  const handleCategoryDelete = useCallback((name: string) => {
    const current = settingsRef.current;
    if (current.categories.length <= 1) {
      showFeedback('You need at least one category.', 'error');
      return;
    }
    const nextLimits = { ...(current.categoryBudgets || {}) };
    const nextGroups = { ...(current.categoryGroups || {}) };
    delete nextLimits[name];
    delete nextGroups[name];
    persist({
      categories: current.categories.filter((c) => c !== name),
      categoryBudgets: nextLimits,
      categoryGroups: nextGroups,
    });
    setIsSheetOpen(false);
    setEditingCategory(null);

    // The sheet promises past expenses are kept and moved to Other, so do
    // exactly that. Falls back to the first surviving category if the user has
    // deleted "Other" itself.
    const remaining = current.categories.filter((c) => c !== name);
    const fallback = remaining.find((c) => c.toLowerCase() === 'other') ?? remaining[0];
    const affected = expenses.filter((e) => e.category === name).length;
    if (affected > 0 && fallback) {
      recategoriseExpenses(name, fallback);
      showFeedback(`${affected} expense${affected === 1 ? '' : 's'} moved to ${fallback}.`);
    }
  }, [persist, showFeedback, expenses, recategoriseExpenses]);

  /** Names that would collide, excluding the one being edited. */
  const takenNames = useMemo(
    () => settings.categories.filter((c) => c !== editingCategory),
    [settings.categories, editingCategory],
  );

  const sheet = (
    <CategoryEditSheet
      visible={isSheetOpen}
      category={editingCategory}
      currency={settings.currency}
      limits={limits}
      groups={groups}
      assigned={assigned}
      budget={budgetValue}
      takenNames={takenNames}
      onClose={() => { setIsSheetOpen(false); setEditingCategory(null); }}
      onSave={handleCategorySave}
      onDelete={handleCategoryDelete}
    />
  );

  // ── Sub-screen takes over the tab ────────────────────────────────────────
  if (showCategories) {
    return (
      <>
        <CategoryBudgetsScreen
          categories={settings.categories}
          limits={limits}
          groups={groups}
          currency={settings.currency}
          budget={budgetValue}
          onBack={() => setShowCategories(false)}
          onSelect={(name) => { setEditingCategory(name); setIsSheetOpen(true); }}
          onAdd={() => { setEditingCategory(null); setIsSheetOpen(true); }}
        />
        {sheet}
      </>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: navbarHeight + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.maxWidth}>
          {/* Large title + auto-save indicator */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
            {/*
              Always present, because settings are always persisted — it states
              the save model rather than reacting to one. Flips to "Saving…"
              only while a debounced write is in flight.
            */}
            <Animated.View
              key={isSaving ? 'saving' : `saved-${savedAt}`}
              entering={rowEntering()}
              exiting={contentExiting()}
              style={styles.savedChip}
            >
              {!isSaving && <IconCheck size={18} color={colors.success} strokeWidth={2.5} />}
              <Text style={[styles.savedText, { color: isSaving ? colors.textDim : colors.success }]}>
                {isSaving ? 'Saving…' : 'Saved'}
              </Text>
            </Animated.View>
          </View>

          {/* ── Monthly plan ─────────────────────────────────────────────── */}
          <View style={[styles.card, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}>
            <Text style={[styles.cardLabel, { color: colors.textDim }]}>Monthly plan</Text>

            <View style={styles.planRow}>
              <View style={styles.planLabelWrap}>
                <Text style={[styles.planLabel, { color: colors.text }]}>Income</Text>
              </View>
              <Text style={[styles.planCurrency, { color: colors.textDim }]}>{settings.currency}</Text>
              <TextInput
                style={[styles.planInput, { color: colors.text }]}
                value={income}
                onChangeText={handleIncome}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textDim}
                accessibilityLabel="Monthly income"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.surfaceLight }]} />

            <View style={styles.planRow}>
              <View style={styles.planLabelWrap}>
                <Text style={[styles.planLabel, { color: colors.text }]}>Budget</Text>
                {budgetShare !== null && (
                  <Text style={[styles.planSub, { color: colors.textDim }]}>
                    {budgetShare}% of your income
                  </Text>
                )}
              </View>
              <Text style={[styles.planCurrency, { color: colors.textDim }]}>{settings.currency}</Text>
              <TextInput
                style={[styles.planInput, { color: colors.text }]}
                value={budget}
                onChangeText={handleBudget}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textDim}
                accessibilityLabel="Monthly budget"
              />
            </View>

            {/* Inset assignment meter */}
            <View style={[styles.meter, { backgroundColor: colors.surfaceLight }]}>
              <View style={styles.meterTop}>
                <Text style={[styles.meterLabel, { color: colors.text }]}>Assigned to categories</Text>
                <Text style={[styles.meterValue, { color: assignedTone }]}>
                  {formatCurrencyCompact(assigned, settings.currency)}
                </Text>
              </View>
              <View style={[styles.track, { backgroundColor: colors.background }]}>
                <View style={[styles.fill, { width: `${assignedFill}%`, backgroundColor: assignedTone }]} />
              </View>
              <Text style={[styles.meterFoot, { color: colors.textDim }]}>
                {overAssigned
                  ? `${formatCurrencyCompact(assigned - budgetValue, settings.currency)} over budget`
                  : `${formatCurrencyCompact(unassigned, settings.currency)} still unassigned`}
              </Text>
            </View>
          </View>

          {/* ── Preferences ──────────────────────────────────────────────── */}
          <View style={[styles.card, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}>
            <Text style={[styles.cardLabel, { color: colors.textDim }]}>Preferences</Text>

            <PressableScale
              style={styles.linkRow}
              onPress={() => setShowCurrency(true)}
              accessibilityRole="button"
              accessibilityLabel={`Currency, ${currency ? currency.label : settings.currency}`}
            >
              <Text style={[styles.linkLabel, { color: colors.text }]}>Currency</Text>
              <Text style={[styles.linkValue, { color: colors.textMuted }]} numberOfLines={1}>
                {settings.currency} {currency ? currency.label : ''}
              </Text>
              <IconChevronRight size={20} color={colors.textDim} strokeWidth={2} />
            </PressableScale>

            <View style={[styles.divider, { backgroundColor: colors.surfaceLight }]} />

            <Text style={[styles.linkLabel, { color: colors.text, marginTop: SPACING.lg }]}>Appearance</Text>
            <View style={[styles.segment, { backgroundColor: colors.surfaceLight }]}>
              {THEMES.map((t) => {
                const active = (settings.theme ?? 'system') === t.value;
                return (
                  <PressableScale
                    key={t.value}
                    style={[
                      styles.segmentItem,
                      active && { backgroundColor: colors.surface, ...ELEVATION.sm },
                    ]}
                    onPress={() => persist({ theme: t.value })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${t.label} theme`}
                  >
                    <Text style={[
                      styles.segmentText,
                      { color: active ? colors.text : colors.textMuted },
                    ]}>
                      {t.label}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {/* ── Categories & budgets ─────────────────────────────────────── */}
          <PressableScale
            style={[styles.card, styles.navCard, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}
            onPress={() => setShowCategories(true)}
            accessibilityRole="button"
            accessibilityLabel={`Categories and budgets, ${settings.categories.length} categories, ${withLimit} with a limit`}
          >
            <View style={styles.navText}>
              <Text style={[styles.navTitle, { color: colors.text }]}>Categories &amp; budgets</Text>
              <Text style={[styles.navSub, { color: colors.textDim }]}>
                {settings.categories.length} categor{settings.categories.length === 1 ? 'y' : 'ies'} · {withLimit} with a limit
              </Text>
            </View>
            <IconChevronRight size={22} color={colors.textDim} strokeWidth={2} />
          </PressableScale>
        </View>
      </ScrollView>

      {/* Currency picker */}
      <Modal visible={showCurrency} transparent animationType="fade" onRequestClose={() => setShowCurrency(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: SCRIM_COLOR }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Currency</Text>
              <PressableScale
                onPress={() => setShowCurrency(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close" accessibilityRole="button"
              >
                <IconX size={22} color={colors.textDim} />
              </PressableScale>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CURRENCIES.map((c, i) => {
                const active = settings.currency === c.symbol;
                return (
                  <PressableScale
                    key={c.code}
                    style={[
                      styles.currencyRow,
                      i > 0 && { borderTopWidth: 1, borderTopColor: colors.surfaceLight },
                    ]}
                    onPress={() => { persist({ currency: c.symbol }); setShowCurrency(false); }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${c.label}, ${c.code}`}
                  >
                    <Text style={[styles.currencySymbol, { color: active ? colors.primary : colors.text }]}>
                      {c.symbol}
                    </Text>
                    <Text style={[styles.currencyLabel, { color: colors.text }]}>{c.label}</Text>
                    {active && <IconCheck size={20} color={colors.primary} strokeWidth={2.5} />}
                  </PressableScale>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.sm },
  maxWidth: { maxWidth: 640, width: '100%', alignSelf: 'center' },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    minHeight: 48,
  },
  title: { ...TEXT.display, flexShrink: 1 },
  savedChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  savedText: { ...TEXT.label },

  card: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...ELEVATION.sm,
  },
  cardLabel: { ...TEXT.labelSm, marginBottom: SPACING.md },

  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 56,
  },
  planLabelWrap: { flex: 1 },
  planLabel: { ...TEXT.bodyLg },
  planSub: { ...TEXT.caption, marginTop: 2 },
  planCurrency: { ...TEXT.moneyLg },
  planInput: {
    ...TEXT.moneyHero,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'right',
    minWidth: 120,
    paddingVertical: SPACING.sm,
  },
  divider: { height: 1, marginVertical: SPACING.xs },

  meter: {
    borderRadius: RADII.md,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  meterTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  meterLabel: { ...TEXT.rowTitle, flexShrink: 1 },
  meterValue: { ...TEXT.money },
  track: { height: 10, borderRadius: RADII.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: RADII.pill },
  meterFoot: { ...TEXT.caption, marginTop: SPACING.md },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 56,
  },
  linkLabel: { ...TEXT.bodyLg, flex: 1 },
  linkValue: { ...TEXT.bodyLg, flexShrink: 1 },

  segment: {
    flexDirection: 'row',
    borderRadius: RADII.md,
    padding: 4,
    gap: 4,
    marginTop: SPACING.md,
  },
  segmentItem: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { ...TEXT.rowTitle },

  navCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  navText: { flex: 1 },
  navTitle: { ...TEXT.subheading },
  navSub: { ...TEXT.caption, marginTop: 2 },

  modalOverlay: { flex: 1, justifyContent: 'center', padding: SPACING.xl },
  modalCard: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  modalTitle: { ...TEXT.heading },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    minHeight: 56,
  },
  currencySymbol: { ...TEXT.moneyLg, minWidth: 40 },
  currencyLabel: { ...TEXT.bodyLg, flex: 1 },
});

export default SettingsScreen;

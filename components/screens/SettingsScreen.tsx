import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { IconPlus, IconTrash, IconCheck, IconX, IconAlertCircle, IconSun, IconMoon, IconDeviceMobile } from '@tabler/icons-react-native';
import type { IconProps } from '@tabler/icons-react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { SPACING, GUTTER, SCRIM_COLOR, TEXT, RADII, getCategoryColor } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useNavbarHeight } from '../../hooks/useNavbarHeight';
import type { ThemePreference } from '../../utils/storage';

/** Gap between grid tiles, shared by the style and the width calculation. */
const GRID_GAP = 12;
/** Columns in the currency / category grids. */
const GRID_COLUMNS = 3;
/** Matches the `maxWidthWrapper` cap used by Home and About. */
const CONTENT_MAX_WIDTH = 640;

/** Stored numbers -> editable text. A 0 or missing limit shows as empty. */
function budgetsToInputs(budgets?: Record<string, number>): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(budgets || {}).forEach(([cat, value]) => {
    if (value > 0) out[cat] = String(value);
  });
  return out;
}

/** Editable text -> stored numbers. Blank / zero / unparseable entries drop out. */
function inputsToBudgets(inputs: Record<string, string>): Record<string, number> {
  const out: Record<string, number> = {};
  Object.entries(inputs).forEach(([cat, raw]) => {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) out[cat] = parsed;
  });
  return out;
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.FC<IconProps> }[] = [
  { value: 'system', label: 'System', icon: IconDeviceMobile },
  { value: 'light',  label: 'Light',  icon: IconSun },
  { value: 'dark',   label: 'Dark',   icon: IconMoon },
];

const CURRENCY_PRESETS = [
  { symbol: '₹', label: 'INR' },
  { symbol: '$', label: 'USD' },
  { symbol: '€', label: 'EUR' },
  { symbol: '£', label: 'GBP' },
  { symbol: '¥', label: 'JPY' },
];

interface SettingsScreenProps {
  pendingRouteName?: string | null;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
  onClearPendingRoute?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  pendingRouteName = null,
  onUnsavedChangesChange,
  onClearPendingRoute,
}) => {
  const { settings, updateSettings, showFeedback } = useApp(); // (#19) showFeedback
  const { colors } = useAppTheme();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const navbarHeight = useNavbarHeight(); // (#4)
  const { width: windowWidth } = useWindowDimensions();

  // Exact tile width, gaps accounted for — guarantees GRID_COLUMNS per row at
  // every screen width instead of depending on a percentage that overflows.
  const gridItemWidth = useMemo(() => {
    const contentWidth = Math.min(windowWidth, CONTENT_MAX_WIDTH) - GUTTER * 2;
    return (contentWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
  }, [windowWidth]);

  const [income, setIncome]         = useState(settings.income);
  const [budget, setBudget]         = useState(settings.budget);
  const [currency, setCurrency]     = useState(settings.currency);
  const [categories, setCategories] = useState(settings.categories);
  // Held as raw strings while editing. Storing numbers meant every keystroke
  // round-tripped through parseFloat, so "12." collapsed back to "12" and a
  // decimal point could never be typed; a stored 0 also rendered as the empty
  // "No limit" placeholder. Parsed once, on save.
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(
    () => budgetsToInputs(settings.categoryBudgets),
  );

  const [isAddModalVisible, setIsAddModalVisible]     = useState(false);
  const [isSavePromptVisible, setIsSavePromptVisible] = useState(false);
  const [newCategoryName, setNewCategoryName]         = useState('');
  const [isSaving, setIsSaving]                       = useState(false);

  /**
   * Re-sync the local edit buffer only when a *mirrored* field changes.
   *
   * Depending on the whole `settings` object meant any unrelated write reset
   * the form — and Appearance writes immediately (a theme you cannot see until
   * you press Save is not a theme picker), so it would have discarded
   * in-progress income and budget edits.
   */
  useEffect(() => {
    setIncome(settings.income);
    setBudget(settings.budget);
    setCurrency(settings.currency);
    setCategories(settings.categories);
    setCategoryBudgets(budgetsToInputs(settings.categoryBudgets));
  }, [settings.income, settings.budget, settings.currency, settings.categories, settings.categoryBudgets]);

  const hasChanges = useMemo(() => (
    income !== settings.income ||
    budget !== settings.budget ||
    currency !== settings.currency ||
    JSON.stringify(categories) !== JSON.stringify(settings.categories) ||
    JSON.stringify(inputsToBudgets(categoryBudgets)) !== JSON.stringify(settings.categoryBudgets || {})
  ), [income, budget, currency, categories, categoryBudgets, settings]);

  useEffect(() => {
    onUnsavedChangesChange?.(hasChanges);
    return () => onUnsavedChangesChange?.(false);
  }, [hasChanges, onUnsavedChangesChange]);

  useEffect(() => {
    if (pendingRouteName && hasChanges) {
      setIsSavePromptVisible(true);
    }
  }, [hasChanges, pendingRouteName]);

  const continuePendingNavigation = useCallback(() => {
    if (!pendingRouteName) return;
    const routeName = pendingRouteName;
    onClearPendingRoute?.();
    navigation.navigate(routeName);
  }, [navigation, onClearPendingRoute, pendingRouteName]);

  const handleSave = useCallback(async () => {
    if (!income || !budget) {
      showFeedback('Please enter both income and budget.', 'error');
      return;
    }
    setIsSaving(true);
    await updateSettings({
      ...settings, income, budget, currency, categories,
      categoryBudgets: inputsToBudgets(categoryBudgets),
    });
    setIsSaving(false);
    setIsSavePromptVisible(false);
    continuePendingNavigation();
  }, [income, budget, currency, categories, categoryBudgets, settings, updateSettings, continuePendingNavigation, showFeedback]);

  const handleDiscardChanges = useCallback(() => {
    setIncome(settings.income);
    setBudget(settings.budget);
    setCurrency(settings.currency);
    setCategories(settings.categories);
    setCategoryBudgets(budgetsToInputs(settings.categoryBudgets));
    setIsSavePromptVisible(false);
    continuePendingNavigation();
  }, [continuePendingNavigation, settings]);

  const closeSavePrompt = useCallback(() => {
    setIsSavePromptVisible(false);
    onClearPendingRoute?.();
  }, [onClearPendingRoute]);

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      // (#19) Duplicate category through Snackbar
      showFeedback('This category already exists.', 'error');
      return;
    }
    setCategories([...categories, trimmed]);
    setNewCategoryName('');
    setIsAddModalVisible(false);
  };

  const handleRemoveCategory = (cat: string) => {
    if (categories.length <= 1) {
      Alert.alert('Error', 'You must have at least one category.');
      return;
    }
    setCategories(categories.filter((c) => c !== cat));
  };

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tablet: cap content at 640px and centre it, matching Home and About.
            Settings was the only screen without this, so its grid (now capped
            at CONTENT_MAX_WIDTH) would otherwise hug the left edge while the
            cards beside it stretched the full width. */}
        <View style={styles.maxWidthWrapper}>
        {/* Finance Configuration */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textDim }]}>FINANCE CONFIG</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Monthly Income</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                value={income}
                onChangeText={setIncome}
                keyboardType="decimal-pad"
                placeholder="5000"
                placeholderTextColor={colors.textDim}
                accessibilityLabel="Monthly income"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Monthly Budget</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                value={budget}
                onChangeText={setBudget}
                keyboardType="decimal-pad"
                placeholder="2000"
                placeholderTextColor={colors.textDim}
                accessibilityLabel="Monthly budget"
              />
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textDim }]}>APPEARANCE</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = (settings.theme ?? 'system') === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.themeCard,
                    { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.surfaceLight },
                  ]}
                  onPress={() => updateSettings({ ...settings, theme: option.value })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${option.label} theme`}
                >
                  <Icon size={22} color={isSelected ? colors.primary : colors.textMuted} strokeWidth={2} />
                  <Text style={[styles.themeLabel, { color: isSelected ? colors.primary : colors.textMuted }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Currency Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textDim }]}>CURRENCY</Text>
          <View style={styles.grid}>
            {CURRENCY_PRESETS.map((item) => (
              <TouchableOpacity
                key={item.symbol}
                style={[
                  styles.gridItem,
                  { width: gridItemWidth, backgroundColor: colors.surface, borderColor: colors.surfaceLight },
                  currency === item.symbol && { borderColor: colors.primary, backgroundColor: colors.surfaceLight },
                ]}
                onPress={() => { if (currency !== item.symbol) setCurrency(item.symbol); }}
                accessibilityRole="radio"
                accessibilityState={{ selected: currency === item.symbol }}
                accessibilityLabel={`${item.label} currency`}
              >
                <Text style={[styles.gridSymbol, { color: currency === item.symbol ? colors.primary : colors.text }]}>
                  {item.symbol}
                </Text>
                <Text style={[styles.gridLabel, { color: colors.textDim }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={[styles.gridItem, styles.manualCurrency, { width: gridItemWidth, backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
              <TextInput
                style={[styles.manualInput, { color: colors.text }]}
                value={currency}
                onChangeText={setCurrency}
                maxLength={3}
                placeholder="..."
                placeholderTextColor={colors.textDim}
                accessibilityLabel="Custom currency symbol"
              />
              <Text style={[styles.gridLabel, { color: colors.textDim }]}>OTHER</Text>
            </View>
          </View>
        </View>

        {/* Category Budgets */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textDim }]}>CATEGORY BUDGETS</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceLight, paddingVertical: 8 }]}>
            {categories.map((cat, index) => (
              <View key={cat} style={[styles.inputGroup, index > 0 && { borderTopWidth: 1, borderTopColor: colors.surfaceLight, paddingTop: 16, marginTop: 16 }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{cat}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                  value={categoryBudgets[cat] ?? ''}
                  onChangeText={(val) => {
                    // Keep digits and at most one decimal separator.
                    const cleaned = val.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                    setCategoryBudgets(prev => ({ ...prev, [cat]: cleaned }));
                  }}
                  keyboardType="decimal-pad"
                  placeholder="No limit"
                  placeholderTextColor={colors.textDim}
                  accessibilityLabel={`Budget for ${cat}`}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Categories Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textDim }]}>CATEGORIES</Text>
          <View style={styles.grid}>
            {categories.map((cat) => {
              // (#24) Use category color for first-letter tile
              const catColor = getCategoryColor(cat);
              return (
                <View
                  key={cat}
                  style={[styles.gridItem, { width: gridItemWidth, backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}
                >
                  <TouchableOpacity
                    style={styles.deleteIcon}
                    onPress={() => handleRemoveCategory(cat)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel={`Delete ${cat} category`}
                    accessibilityRole="button"
                  >
                    <IconTrash size={14} color={colors.danger} />
                  </TouchableOpacity>
                  {/* (#24) First letter shown in the category's own color */}
                  <Text style={[styles.catEmoji, { color: catColor }]} numberOfLines={1}>
                    {cat.substring(0, 1).toUpperCase()}
                  </Text>
                  <Text style={[styles.gridLabel, { color: colors.text }]} numberOfLines={1}>
                    {cat.toUpperCase()}
                  </Text>
                </View>
              );
            })}

            <TouchableOpacity
              style={[styles.gridItem, { width: gridItemWidth, backgroundColor: 'transparent', borderColor: colors.primary, borderStyle: 'dashed' }]}
              onPress={() => setIsAddModalVisible(true)}
              accessibilityLabel="Add new category"
              accessibilityRole="button"
            >
              <IconPlus size={24} color={colors.primary} strokeWidth={2.5} />
              <Text style={[styles.gridLabel, { color: colors.primary, marginTop: 4 }]}>ADD NEW</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* (#25) Spacer so content scrolls above the sticky save bar */}
        <View style={{ height: navbarHeight + (hasChanges ? 72 : 0) }} />
        </View>
      </ScrollView>

      {/* (#25, #29) Sticky save bar — animates smoothly on mount/unmount */}
      {hasChanges && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOutDown.duration(180)}
          style={[
            styles.saveBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.surfaceLight,
              paddingBottom: navbarHeight,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, styles.maxWidthWrapper, { backgroundColor: isSaving ? colors.success : colors.primary }]}
            activeOpacity={0.9}
            disabled={isSaving}
            accessibilityLabel={isSaving ? 'Saving changes' : 'Save all changes'}
            accessibilityRole="button"
          >
            {isSaving
              ? <IconCheck size={20} color={colors.onPrimary} strokeWidth={3} />
              : <IconAlertCircle size={20} color={colors.onPrimary} strokeWidth={2} />
            }
            <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Save Changes Confirmation */}
      <Modal
        visible={isSavePromptVisible && hasChanges && Boolean(pendingRouteName) && !isAddModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSavePrompt}
      >
        {/* (#13) SCRIM token */}
        <View style={[styles.modalOverlay, { backgroundColor: SCRIM_COLOR }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <View style={styles.savePromptIcon}>
              <IconAlertCircle size={28} color={colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={[styles.savePromptTitle, { color: colors.text }]}>Save changes?</Text>
            <Text style={[styles.savePromptText, { color: colors.textMuted }]}>
              Your settings have new changes. Would you like to save them now?
            </Text>
            <View style={styles.promptActions}>
              <TouchableOpacity
                style={[styles.secondaryPromptBtn, { borderColor: colors.surfaceLight }]}
                onPress={handleDiscardChanges}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Discard changes"
              >
                <Text style={[styles.secondaryPromptText, { color: colors.textMuted }]}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryPromptBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel={isSaving ? 'Saving' : 'Save changes'}
              >
                <IconCheck size={18} color={colors.onPrimary} strokeWidth={3} />
                <Text style={[styles.primaryPromptText, { color: colors.onPrimary }]}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={closeSavePrompt} disabled={isSaving}>
              <Text style={[styles.keepEditingText, { color: colors.textDim }]}>Keep Editing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: SCRIM_COLOR }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Category</Text>
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(false)}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <IconX size={20} color={colors.textDim} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
              placeholder="e.g. Subscriptions"
              placeholderTextColor={colors.textDim}
              autoFocus
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              accessibilityLabel="New category name"
            />
            <TouchableOpacity
              style={[styles.modalAddBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddCategory}
              accessibilityRole="button"
              accessibilityLabel="Add category"
            >
              <Text style={[styles.modalAddText, { color: colors.onPrimary }]}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  scroll: { flex: 1 },
  maxWidthWrapper: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    // (#3) GUTTER — was SPACING.xl (24), now 20
    padding: GUTTER,
  },
  section: { marginBottom: 30 },
  sectionTitle: {
    ...TEXT.overline,
    marginBottom: 16,
  },
  card: {
    borderRadius: RADII.lg,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  inputGroup: { gap: 6 },
  label: { ...TEXT.labelSm },
  input: {
    borderRadius: RADII.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...TEXT.moneyLg,
  },
  themeRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  themeCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  themeLabel: { ...TEXT.labelSm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridItem: {
    // Width is injected at render time — see `gridItemWidth`. A percentage
    // basis cannot work here: 3 × 31% + 2 × 12px gap exceeds 100% on any
    // screen narrower than ~370dp, so the grid silently fell back to two
    // columns on most phones and three on a Pixel.
    aspectRatio: 1,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    position: 'relative',
  },
  gridSymbol: { ...TEXT.title, marginBottom: 2 },
  gridLabel: { ...TEXT.overline, letterSpacing: 0.5 },
  manualCurrency: { overflow: 'hidden' },
  manualInput: { ...TEXT.subheading, textAlign: 'center', width: '100%' },
  catEmoji: { ...TEXT.title, marginBottom: 4 },
  deleteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },

  // (#25) Sticky save bar
  saveBar: {
    borderTopWidth: 1,
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.md,
  },
  saveButton: {
    minHeight: 54,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  saveButtonText: {
    ...TEXT.button,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  modalContent: {
    borderRadius: RADII.xl,
    padding: 24,
    borderWidth: 1,
    gap: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { ...TEXT.subheading },
  modalInput: {
    borderRadius: RADII.sm,
    padding: 16,
    ...TEXT.bodyLg,
  },
  modalAddBtn: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: RADII.sm,
    alignItems: 'center',
  },
  modalAddText: { ...TEXT.button },
  savePromptIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  savePromptTitle: {
    ...TEXT.heading,
    textAlign: 'center',
  },
  savePromptText: {
    ...TEXT.prose,
    textAlign: 'center',
  },
  promptActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryPromptBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryPromptBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primaryPromptText: { ...TEXT.button },
  secondaryPromptText: { ...TEXT.button },
  keepEditingText: {
    ...TEXT.label,
    textAlign: 'center',
    minHeight: 44,
    textAlignVertical: 'center',
    paddingTop: 12,
  },
});

export default SettingsScreen;

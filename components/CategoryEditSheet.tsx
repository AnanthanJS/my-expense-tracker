import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { IconX, IconTrash } from '@tabler/icons-react-native';
import { TEXT, RADII, SPACING, SCRIM_COLOR } from '../constants/theme';
import {
  CATEGORY_GROUPS,
  GROUP_TINTS,
  UNGROUPED_LABEL,
  getCategoryIcon,
  resolveGroup,
} from '../constants/categories';
import { useAppTheme } from '../hooks/useAppTheme';
import { formatCurrencyCompact } from '../utils/formatCurrency';

export interface CategoryDraft {
  /** Original name, so a rename can be applied to existing expenses. */
  originalName: string | null;
  name: string;
  limit: number | null;
  group: string;
}

interface CategoryEditSheetProps {
  visible: boolean;
  /** null = creating a new category. */
  category: string | null;
  currency: string;
  limits: Record<string, number>;
  groups: Record<string, string>;
  /** Total already assigned across all categories, for the helper line. */
  assigned: number;
  budget: number;
  /** Names that would collide, excluding the one being edited. */
  takenNames: string[];
  onClose: () => void;
  onSave: (draft: CategoryDraft) => void;
  onDelete?: (name: string) => void;
}

/** Digits and at most one decimal separator. */
const cleanAmount = (raw: string) => raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

const CategoryEditSheet: React.FC<CategoryEditSheetProps> = ({
  visible,
  category,
  currency,
  limits,
  groups,
  assigned,
  budget,
  takenNames,
  onClose,
  onSave,
  onDelete,
}) => {
  const { colors } = useAppTheme();
  const isEditing = category !== null;

  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [group, setGroup] = useState<string>(CATEGORY_GROUPS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (category) {
      setName(category);
      const existing = limits[category];
      setLimit(existing > 0 ? String(existing) : '');
      const resolved = resolveGroup(category, groups);
      setGroup(resolved === UNGROUPED_LABEL ? CATEGORY_GROUPS[0] : resolved);
    } else {
      setName('');
      setLimit('');
      setGroup(CATEGORY_GROUPS[0]);
    }
    setError(null);
    // Intentionally keyed on open/identity only: re-running when `limits` or
    // `groups` change identity would reset the form out from under the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, category]);

  const Icon = useMemo(() => getCategoryIcon(name || category || ''), [name, category]);
  const tint = GROUP_TINTS[group] ?? GROUP_TINTS[UNGROUPED_LABEL];

  /**
   * Quick-pick amounts around the current value. Recomputed from the category's
   * existing limit so the suggestions stay relevant instead of being fixed.
   */
  const suggestions = useMemo(() => {
    const current = parseFloat(limit);
    const base = !isNaN(current) && current > 0 ? current : Math.round(budget / 8 / 500) * 500 || 1000;
    const unique = Array.from(new Set([
      Math.max(500, Math.round((base * 0.8) / 500) * 500),
      Math.round(base / 500) * 500,
      Math.round((base * 1.25) / 500) * 500,
    ]));
    return unique.sort((a, b) => a - b);
  }, [limit, budget]);

  const handleSave = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the category a name.');
      return;
    }
    if (takenNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setError('A category with that name already exists.');
      return;
    }
    const parsed = parseFloat(limit);
    onSave({
      originalName: category,
      name: trimmed,
      limit: !isNaN(parsed) && parsed > 0 ? parsed : null,
      group,
    });
  }, [name, limit, group, category, takenNames, onSave]);

  const handleDelete = useCallback(() => {
    if (!category || !onDelete) return;
    Alert.alert(
      'Delete category',
      `Delete "${category}"? Past expenses are kept and moved to Other.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(category) },
      ],
    );
  }, [category, onDelete]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View style={[styles.overlay, { backgroundColor: SCRIM_COLOR }]}>
          {/* Solid, same as the add-expense and recurring bill sheets. */}
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <View style={[styles.grabber, { backgroundColor: colors.surfaceLight }]} />

            <View style={styles.header}>
              <View style={[styles.iconTile, { backgroundColor: tint.bg }]}>
                <Icon size={22} color={tint.fg} strokeWidth={2} />
              </View>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {isEditing ? 'Edit category' : 'New category'}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close" accessibilityRole="button"
              >
                <IconX size={22} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.label, { color: colors.textMuted }]}>Name</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.surfaceLight, color: colors.text }]}
                value={name}
                onChangeText={(v) => { setName(v); setError(null); }}
                placeholder="e.g. Groceries"
                placeholderTextColor={colors.textDim}
                accessibilityLabel="Category name"
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>Monthly limit</Text>
              <View style={[styles.amountWrap, { borderColor: colors.surfaceLight }]}>
                <Text style={[styles.currency, { color: colors.textDim }]}>{currency}</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.text }]}
                  value={limit}
                  onChangeText={(v) => setLimit(cleanAmount(v))}
                  keyboardType="decimal-pad"
                  placeholder="No limit"
                  placeholderTextColor={colors.textDim}
                  accessibilityLabel="Monthly limit"
                />
              </View>

              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    {
                      borderColor: limit === '' ? colors.primary : colors.surfaceLight,
                      backgroundColor: limit === '' ? colors.primary + '1A' : 'transparent',
                    },
                  ]}
                  onPress={() => setLimit('')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: limit === '' }}
                >
                  <Text style={[styles.chipText, { color: limit === '' ? colors.primary : colors.textMuted }]}>
                    No limit
                  </Text>
                </TouchableOpacity>
                {suggestions.map((amount) => {
                  const active = parseFloat(limit) === amount;
                  return (
                    <TouchableOpacity
                      key={amount}
                      style={[
                        styles.chip,
                        {
                          borderColor: active ? colors.primary : colors.surfaceLight,
                          backgroundColor: active ? colors.primary + '1A' : 'transparent',
                        },
                      ]}
                      onPress={() => setLimit(String(amount))}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.chipText, { color: active ? colors.primary : colors.textMuted }]}>
                        {formatCurrencyCompact(amount, currency)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.helper, { color: colors.textDim }]}>
                {formatCurrencyCompact(assigned, currency)} of your {formatCurrencyCompact(budget, currency)} budget is assigned.
              </Text>

              <Text style={[styles.label, { color: colors.textMuted }]}>Group</Text>
              <View style={styles.chipRow}>
                {CATEGORY_GROUPS.map((g) => {
                  const active = group === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.chip,
                        {
                          borderColor: active ? colors.primary : colors.surfaceLight,
                          backgroundColor: active ? colors.primary + '1A' : 'transparent',
                        },
                      ]}
                      onPress={() => setGroup(g)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.chipText, { color: active ? colors.primary : colors.textMuted }]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {error && (
                <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
              )}

              {isEditing && onDelete && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.surfaceLight }]} />
                  <TouchableOpacity
                    style={styles.deleteRow}
                    onPress={handleDelete}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${category} category`}
                  >
                    <IconTrash size={20} color={colors.danger} strokeWidth={2} />
                    <Text style={[styles.deleteText, { color: colors.danger }]}>Delete category</Text>
                  </TouchableOpacity>
                  <Text style={[styles.helper, { color: colors.textDim }]}>
                    Past expenses are kept and moved to Other. You&apos;ll be asked to confirm.
                  </Text>
                </>
              )}

              <TouchableOpacity
                style={[styles.save, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Save category"
              >
                <Text style={[styles.saveText, { color: colors.onPrimary }]}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: RADII.xxl,
    borderTopRightRadius: RADII.xxl,
    borderWidth: 1,
    maxHeight: '92%',
    paddingTop: SPACING.md,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: RADII.pill,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...TEXT.heading, flex: 1 },
  body: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },
  label: { ...TEXT.labelSm, marginBottom: SPACING.sm, marginTop: SPACING.lg },
  input: {
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 54,
    ...TEXT.bodyLg,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 54,
    gap: SPACING.sm,
  },
  currency: { ...TEXT.moneyLg },
  amountInput: { flex: 1, ...TEXT.moneyLg },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.lg,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { ...TEXT.label },
  helper: { ...TEXT.caption, marginTop: SPACING.md },
  error: { ...TEXT.caption, marginTop: SPACING.md },
  divider: { height: 1, marginTop: SPACING.xl },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 48,
    marginTop: SPACING.lg,
  },
  deleteText: { ...TEXT.button },
  save: {
    minHeight: 56,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  saveText: { ...TEXT.button },
});

export default CategoryEditSheet;

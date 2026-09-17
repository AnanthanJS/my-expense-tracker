import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { IconPlus, IconX, IconCamera, IconPhoto, IconCheck } from '@tabler/icons-react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import { BlurView } from 'expo-blur';
import { TEXT, RADII, GLASS, SCRIM_BLUR_INTENSITY, getCategoryColor } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useApp } from '../context/AppContext';
import type { Expense } from '../utils/storage';
import { toLocalISODate } from '../utils/formatDate';

export interface ExpenseDraft {
  description: string;
  amount: number;
  category: string;
  date: string;
  receiptUri?: string;
}

interface ExpenseFormProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (expense: ExpenseDraft) => void;
  /**
   * (C5) When set, the sheet edits this expense instead of creating one.
   * Recurring bills have always had an edit affordance; a plain expense could
   * only be deleted and retyped.
   */
  editing?: Expense | null;
  onSave?: (expense: Expense) => void;
}

// ---------------------------------------------------------------------------
// Date masking & validation helpers (#18)
// ---------------------------------------------------------------------------

function maskDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function validateDate(value: string): string | null {
  if (value.length === 0) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (m < 1 || m > 12) return 'Invalid month';
  const daysInMonth = new Date(y, m, 0).getDate();
  if (d < 1 || d > daysInMonth) return 'Invalid day';
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return 'Invalid date';
  return null;
}

/** (C6) One-tap date shortcuts covering the vast majority of real entries. */
const DATE_SHORTCUTS: { label: string; resolve: () => string }[] = [
  { label: 'Today',     resolve: () => toLocalISODate(new Date()) },
  { label: 'Yesterday', resolve: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return toLocalISODate(d);
    } },
];

// ---------------------------------------------------------------------------

const ExpenseForm: React.FC<ExpenseFormProps> = ({ visible, onClose, onAdd, editing = null, onSave }) => {
  const isEditing = Boolean(editing);
  const { colors, isDark } = useAppTheme();
  const glass = isDark ? GLASS.dark : GLASS.light;
  const { showFeedback, settings, updateSettings } = useApp();

  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [category, setCategory]       = useState(settings.categories[0] || 'Other');
  const [date, setDate]               = useState(() => toLocalISODate(new Date()));
  const [dateError, setDateError]     = useState<string | null>(null);
  const [receiptUri, setReceiptUri]   = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);

  // (C5) Load the edited record when the sheet opens, and clear back to a
  // blank draft when it opens for a new expense.
  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setDescription(editing.description);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setDate(editing.date.split('T')[0]);
      setReceiptUri(editing.receiptUri ?? null);
    } else {
      setDescription('');
      setAmount('');
      setCategory(settings.categories[0] || 'Other');
      setDate(toLocalISODate(new Date()));
      setReceiptUri(null);
    }
    setDateError(null);
  }, [visible, editing, settings.categories]);

  useEffect(() => {
    if (!settings.categories.includes(category)) {
      setCategory(settings.categories[0] || 'Other');
    }
  }, [settings.categories, category]);

  useEffect(() => {
    // Skipped while editing: re-applying a learned rule would silently
    // overwrite the category the user came here to change.
    if (isEditing) return;
    const rules = settings.categorizationRules || {};
    const descLower = description.trim().toLowerCase();
    if (rules[descLower] && settings.categories.includes(rules[descLower])) {
      setCategory(rules[descLower]);
    }
  }, [isEditing, description, settings.categorizationRules, settings.categories]);

  const handleDateChange = useCallback((raw: string) => {
    const masked = maskDate(raw);
    setDate(masked);
    if (masked.length === 10) {
      setDateError(validateDate(masked));
    } else {
      setDateError(null);
    }
  }, []);

  const handlePickImage = async () => {
    try {
      setIsPickingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (e) {
      showFeedback('Failed to pick image.', 'error');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setIsPickingImage(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showFeedback('Camera permission required.', 'error');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (e) {
      showFeedback('Failed to take photo.', 'error');
    } finally {
      setIsPickingImage(false);
    }
  };

  const resetForm = useCallback(() => {
    setDescription('');
    setAmount('');
    setDate(toLocalISODate(new Date()));
    setDateError(null);
    setReceiptUri(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(async () => {
    if (!description.trim()) {
      showFeedback('Please enter a description.', 'error');
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showFeedback('Please enter a valid amount greater than 0.', 'error');
      return;
    }
    if (date.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      showFeedback('Please enter a date in YYYY-MM-DD format.', 'error');
      return;
    }
    const dateErr = validateDate(date);
    if (dateErr) {
      showFeedback(`Date: ${dateErr}.`, 'error');
      return;
    }

    let finalReceiptUri = undefined;
    if (receiptUri) {
      try {
        const filename = receiptUri.split('/').pop() || `receipt-${Date.now()}.jpg`;
        const destFile = new File(Paths.document, filename);
        const srcFile = new File(receiptUri);
        await srcFile.copy(destFile);
        finalReceiptUri = destFile.uri;
      } catch (e) {
        console.warn('Failed to save receipt image', e);
      }
    }

    const draft: ExpenseDraft = {
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
      // An untouched receipt keeps its existing URI rather than being dropped.
      receiptUri: finalReceiptUri ?? (receiptUri ?? undefined),
    };

    if (editing && onSave) {
      onSave({ ...editing, ...draft });
    } else {
      onAdd(draft);
    }

    // Save categorization rule
    const descLower = description.trim().toLowerCase();
    const rules = settings.categorizationRules || {};
    if (rules[descLower] !== category) {
      updateSettings({
        ...settings,
        categorizationRules: {
          ...rules,
          [descLower]: category,
        },
      });
    }

    resetForm();
    onClose();
  }, [description, amount, category, date, receiptUri, editing, onSave, onAdd, showFeedback, resetForm, onClose, settings, updateSettings]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      {/*
        (A13) `behavior` was undefined on Android, which relies on the window
        resizing for the keyboard — but with `edgeToEdgeEnabled` (app.json) on
        Android 15 the window no longer resizes, so the submit button sat under
        the keyboard. 'padding' works on both platforms for a bottom sheet.
      */}
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.avoidingView}
      >
        <BlurView
          intensity={SCRIM_BLUR_INTENSITY}
          tint="dark"
          style={styles.modalOverlay}
        >
          {/*
            The one surface where the glass metaphor is real: it floats over
            scrolling content inside a BlurView. It was the only such surface
            still on hardcoded values (80/100 blur, surfaceLight border) rather
            than the GLASS tokens written for it.
          */}
          <BlurView
            intensity={glass.blur}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.modalContent, {
              backgroundColor: glass.floating,
              borderColor: glass.border,
              borderWidth: 1,
            }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isEditing ? 'Edit Expense' : 'Add Expense'}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                accessibilityLabel={isEditing ? 'Close edit expense sheet' : 'Close add expense sheet'}
                accessibilityRole="button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <IconX size={24} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Description Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Description</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                  placeholder="What was it for?"
                  placeholderTextColor={colors.textDim}
                  value={description}
                  onChangeText={setDescription}
                  accessibilityLabel="Expense description"
                  autoFocus={!isEditing}
                />
              </View>

              {/* Amount Field with Currency Prefix */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Amount</Text>
                <View style={[styles.amountWrap, { backgroundColor: colors.surfaceLight }]}>
                  <Text style={[styles.currencyPrefix, { color: colors.textDim }]}>{settings.currency}</Text>
                  <TextInput
                    style={[styles.amountInput, { color: colors.text }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textDim}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    accessibilityLabel={`Amount in ${settings.currency}`}
                  />
                </View>
              </View>

              {/* Category Select Chips */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Category</Text>
                <View style={styles.catGrid}>
                  {settings.categories.map((cat) => {
                    const isSelected = category === cat;
                    const catColor = getCategoryColor(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.catChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surfaceLight,
                            borderColor: isSelected ? colors.primary : colors.surfaceLight,
                          },
                        ]}
                        onPress={() => setCategory(cat)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Category ${cat}`}
                      >
                        <View
                          style={[
                            styles.catChipDot,
                            { backgroundColor: isSelected ? colors.onPrimary : catColor },
                          ]}
                        />
                        <Text
                          style={[
                            styles.catChipText,
                            { color: isSelected ? colors.onPrimary : colors.text },
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Date Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Date</Text>
                {/*
                  (C6) Typing YYYY-MM-DD on a numeric keypad is the slowest
                  possible way to enter "today", which is the overwhelming
                  majority of entries. The field stays for everything else.
                */}
                <View style={styles.dateChips}>
                  {DATE_SHORTCUTS.map((shortcut) => {
                    const value = shortcut.resolve();
                    const isSelected = date === value;
                    return (
                      <TouchableOpacity
                        key={shortcut.label}
                        style={[
                          styles.dateChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surfaceLight,
                            borderColor: isSelected ? colors.primary : colors.surfaceLight,
                          },
                        ]}
                        onPress={() => { setDate(value); setDateError(null); }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Set date to ${shortcut.label}`}
                      >
                        <Text style={[
                          styles.dateChipText,
                          { color: isSelected ? colors.onPrimary : colors.textMuted },
                        ]}>
                          {shortcut.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceLight,
                      color: colors.text,
                      borderWidth: dateError ? 1.5 : 0,
                      borderColor: dateError ? colors.danger : 'transparent',
                    },
                  ]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textDim}
                  value={date}
                  onChangeText={handleDateChange}
                  keyboardType="numeric"
                  maxLength={10}
                  accessibilityLabel="Date in YYYY-MM-DD format"
                />
                {dateError && (
                  <Animated.Text
                    entering={FadeIn.duration(150)}
                    exiting={FadeOut.duration(150)}
                    style={[styles.dateError, { color: colors.danger }]}
                  >
                    {dateError}
                  </Animated.Text>
                )}
              </View>

              {/* Receipt Attachment */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Receipt Image (Optional)</Text>
                <View style={styles.receiptActions}>
                  <TouchableOpacity
                    style={[styles.receiptBtn, { backgroundColor: colors.surfaceLight }]}
                    onPress={handleTakePhoto}
                    disabled={isPickingImage}
                  >
                    <IconCamera size={20} color={colors.text} />
                    <Text style={[styles.receiptBtnText, { color: colors.text }]}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.receiptBtn, { backgroundColor: colors.surfaceLight }]}
                    onPress={handlePickImage}
                    disabled={isPickingImage}
                  >
                    <IconPhoto size={20} color={colors.text} />
                    <Text style={[styles.receiptBtnText, { color: colors.text }]}>Gallery</Text>
                  </TouchableOpacity>
                </View>
                {receiptUri && (
                  <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.receiptAttached}>
                    <Text style={[{ color: colors.primary, ...TEXT.label }]}>
                      ✓ Receipt attached
                    </Text>
                    <TouchableOpacity
                      onPress={() => setReceiptUri(null)}
                      hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                      accessibilityLabel="Remove attached receipt"
                      accessibilityRole="button"
                    >
                      <IconX size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                accessibilityLabel="Add expense"
                accessibilityRole="button"
              >
                {isEditing
                  ? <IconCheck size={20} color={colors.onPrimary} strokeWidth={2.5} />
                  : <IconPlus size={20} color={colors.onPrimary} strokeWidth={2.5} />}
                <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
                  {isEditing ? 'Save Changes' : 'Add Expense'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </BlurView>
        </BlurView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  avoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADII.xxl,
    borderTopRightRadius: RADII.xxl,
    maxHeight: '85%',
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    ...TEXT.heading,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    ...TEXT.labelSm,
    marginLeft: 4,
  },
  input: {
    borderRadius: RADII.md,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    ...TEXT.body,
    minHeight: 50,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.md,
    paddingLeft: 16,
    paddingRight: 12,
    minHeight: 50,
  },
  currencyPrefix: {
    ...TEXT.moneyLg,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    ...TEXT.moneyLg,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: RADII.lg,
    borderWidth: 1,
    gap: 6,
  },
  catChipDot: {
    width: 8,
    height: 8,
    borderRadius: RADII.pill,
  },
  catChipText: {
    ...TEXT.label,
  },
  dateChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  dateChip: {
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  dateChipText: {
    ...TEXT.label,
  },
  dateError: {
    ...TEXT.caption,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: RADII.md,
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    ...TEXT.button,
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 12,
  },
  receiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: RADII.md,
    gap: 6,
  },
  receiptBtnText: {
    ...TEXT.buttonSm,
  },
  receiptAttached: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
});

export default React.memo(ExpenseForm);

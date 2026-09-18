import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Switch,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {
  contentExiting,
  listLayout,
  revealEntering,
  revealExiting,
  rowEntering,
} from '../constants/motion';
import { nextDueAfter } from '../utils/recurrence';
import type { Frequency } from '../utils/recurrence';
import { isCompleteDate } from '../utils/dateInput';
import RecurrenceFields from './RecurrenceFields';
import { IconPlus, IconX, IconCamera, IconPhoto, IconCheck } from '@tabler/icons-react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import { TEXT, RADII, SPACING, SCRIM_COLOR, getCategoryColor } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useApp } from '../context/AppContext';
import type { Expense } from '../utils/storage';
import type { RecurrenceInput } from '../context/AppContext';
import { toLocalISODate } from '../utils/formatDate';
import PressableScale from './PressableScale';

export interface ExpenseDraft {
  description: string;
  amount: number;
  category: string;
  date: string;
  receiptUri?: string;
  /**
   * Set only while the repeat toggle is on. Null clears any rule the expense
   * had, so a toggle switched back off never leaves stale values behind.
   */
  recurrence?: RecurrenceInput | null;
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
  const { colors } = useAppTheme();
  const { showFeedback, settings, updateSettings, recurringExpenses } = useApp();

  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [category, setCategory]       = useState(settings.categories[0] || 'Other');
  const [date, setDate]               = useState(() => toLocalISODate(new Date()));
  const [dateError, setDateError]     = useState<string | null>(null);
  const [receiptUri, setReceiptUri]   = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);

  // Recurrence — a modifier on the expense, so it lives at the bottom of the
  // form and below the fields it modifies.
  const [repeat, setRepeat] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<Frequency>('monthly');
  const [repeatNextDue, setRepeatNextDue] = useState('');
  const [repeatError, setRepeatError] = useState<string | null>(null);
  /** Once the user edits the due date, the frequency stops moving it. */
  const [repeatDueDirty, setRepeatDueDirty] = useState(false);

  /** The rule this expense already has, if any. Read once, never linked. */
  const existingRule = useMemo(
    () => (editing?.recurringId
      ? recurringExpenses.find((r) => r.id === editing.recurringId) ?? null
      : null),
    [editing?.recurringId, recurringExpenses],
  );

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
      // An expense that already repeats opens with the toggle on and the
      // rule's own values, not a freshly computed default.
      const rule = editing.recurringId
        ? recurringExpenses.find((r) => r.id === editing.recurringId)
        : undefined;
      setRepeat(Boolean(rule));
      setRepeatFrequency(rule?.frequency ?? 'monthly');
      setRepeatNextDue(rule?.nextDueDate ?? '');
      setRepeatDueDirty(Boolean(rule));
    } else {
      setDescription('');
      setAmount('');
      setCategory(settings.categories[0] || 'Other');
      setDate(toLocalISODate(new Date()));
      setReceiptUri(null);
      setRepeat(false);
      setRepeatFrequency('monthly');
      setRepeatNextDue('');
      setRepeatDueDirty(false);
    }
    setDateError(null);
    setRepeatError(null);
  }, [visible, editing, settings.categories, recurringExpenses]);

  /**
   * Guards against editing a category out from under an open sheet.
   *
   * Only for a new expense: on an existing one the category is the record's
   * own, and quietly swapping it for the first in the list turned "fix a typo
   * in the description" into a silent re-categorisation. An unknown category
   * is shown as a chip of its own below instead.
   */
  useEffect(() => {
    if (isEditing) return;
    if (!settings.categories.includes(category)) {
      setCategory(settings.categories[0] || 'Other');
    }
  }, [isEditing, settings.categories, category]);

  /**
   * The category list to render: the configured ones, plus this expense's own
   * if it is not among them, so nothing the record holds is unrepresented.
   */
  const categoryOptions = useMemo(
    () => (category && !settings.categories.includes(category)
      ? [...settings.categories, category]
      : settings.categories),
    [settings.categories, category],
  );

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

  /**
   * Turning the toggle on seeds the due date from the expense's own date plus
   * one interval — the next occurrence, never the one being logged.
   */
  const handleToggleRepeat = useCallback((next: boolean) => {
    setRepeatError(null);

    if (!next) {
      // Switching off an expense that already has a rule destroys it, so ask.
      if (existingRule) {
        Alert.alert(
          'Stop repeating?',
          'This deletes the recurring bill for this expense. The expense itself is kept.',
          [
            { text: 'Keep repeating', style: 'cancel' },
            {
              text: 'Delete rule',
              style: 'destructive',
              onPress: () => { setRepeat(false); setRepeatDueDirty(false); },
            },
          ],
        );
        return;
      }
      setRepeat(false);
      setRepeatDueDirty(false);
      return;
    }

    setRepeat(true);
    if (!repeatDueDirty) setRepeatNextDue(nextDueAfter(date, repeatFrequency));
    AccessibilityInfo.announceForAccessibility('Frequency and next due date added');
  }, [existingRule, repeatDueDirty, date, repeatFrequency]);

  const handleRepeatFrequencyChange = useCallback((frequency: Frequency) => {
    setRepeatFrequency(frequency);
    setRepeatError(null);
    if (!repeatDueDirty) setRepeatNextDue(nextDueAfter(date, frequency));
  }, [repeatDueDirty, date]);

  const handleRepeatDueChange = useCallback((value: string) => {
    setRepeatDueDirty(true);
    setRepeatNextDue(value);
    setRepeatError(null);
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
    setRepeat(false);
    setRepeatNextDue('');
    setRepeatError(null);
    setRepeatDueDirty(false);
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

    if (repeat) {
      if (!isCompleteDate(repeatNextDue)) {
        setRepeatError('Enter the next due date as YYYY-MM-DD.');
        return;
      }
      if (repeatNextDue === date) {
        // The expense being saved already counts as this month's spend. A rule
        // due on the same day would show it as still owed, counting it twice.
        setRepeatError(
          'The next due date must be after this expense. This one is already recorded.',
        );
        return;
      }
      const due = new Date(repeatNextDue);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (due <= today) {
        setRepeatError('The next due date must be in the future.');
        return;
      }
      if (due <= new Date(date)) {
        setRepeatError('The next due date must be after this expense.');
        return;
      }
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
      // Null rather than undefined when off: it is an instruction to clear any
      // rule, not an absence of opinion.
      recurrence: repeat ? { frequency: repeatFrequency, nextDueDate: repeatNextDue } : null,
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
  }, [description, amount, category, date, receiptUri, repeat, repeatFrequency, repeatNextDue, editing, onSave, onAdd, showFeedback, resetForm, onClose, settings, updateSettings]);

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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoidingView}
      >
        <View style={[styles.modalOverlay, { backgroundColor: SCRIM_COLOR }]}>
          {/*
            Solid surface, matching the recurring bill modal. A blurred sheet
            let the list behind it show through under every form field, which
            made long labels and the amount input harder to read than they
            needed to be — an opaque sheet is the better call for a form.
          */}
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isEditing ? 'Edit Expense' : 'Add Expense'}
              </Text>
              <PressableScale
                onPress={handleClose}
                accessibilityLabel={isEditing ? 'Close edit expense sheet' : 'Close add expense sheet'}
                accessibilityRole="button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <IconX size={24} color={colors.textDim} />
              </PressableScale>
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
                  {categoryOptions.map((cat) => {
                    const isSelected = category === cat;
                    const catColor = getCategoryColor(cat);
                    return (
                      <PressableScale
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
                      </PressableScale>
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
                      <PressableScale
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
                      </PressableScale>
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
                    entering={rowEntering()}
                    exiting={contentExiting()}
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
                  <PressableScale
                    style={[styles.receiptBtn, { backgroundColor: colors.surfaceLight }]}
                    onPress={handleTakePhoto}
                    disabled={isPickingImage}
                  >
                    <IconCamera size={20} color={colors.text} />
                    <Text style={[styles.receiptBtnText, { color: colors.text }]}>Camera</Text>
                  </PressableScale>
                  <PressableScale
                    style={[styles.receiptBtn, { backgroundColor: colors.surfaceLight }]}
                    onPress={handlePickImage}
                    disabled={isPickingImage}
                  >
                    <IconPhoto size={20} color={colors.text} />
                    <Text style={[styles.receiptBtnText, { color: colors.text }]}>Gallery</Text>
                  </PressableScale>
                </View>
                {receiptUri && (
                  <Animated.View entering={rowEntering()} exiting={contentExiting()} style={styles.receiptAttached}>
                    <Text style={[{ color: colors.primary, ...TEXT.label }]}>
                      ✓ Receipt attached
                    </Text>
                    <PressableScale
                      onPress={() => setReceiptUri(null)}
                      hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                      accessibilityLabel="Remove attached receipt"
                      accessibilityRole="button"
                    >
                      <IconX size={16} color={colors.danger} />
                    </PressableScale>
                  </Animated.View>
                )}
              </View>

              {/*
                Recurrence last: it is a modifier on the expense above it, not
                a property competing with the amount or the category.
              */}
              <View style={styles.inputGroup}>
                <View style={styles.repeatRow}>
                  <View style={styles.repeatCopy}>
                    <Text
                      style={[styles.label, styles.repeatLabel, { color: colors.text }]}
                      nativeID="repeat-expense-label"
                    >
                      Repeat this expense
                    </Text>
                    <Text
                      style={[styles.repeatHint, { color: colors.textDim }]}
                      nativeID="repeat-expense-hint"
                    >
                      We'll remind you when it's next due.
                    </Text>
                  </View>
                  <Switch
                    value={repeat}
                    onValueChange={handleToggleRepeat}
                    trackColor={{ true: colors.primary }}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: repeat }}
                    accessibilityLabel="Repeat this expense"
                    accessibilityHint="We'll remind you when it's next due"
                    accessibilityLabelledBy="repeat-expense-label"
                  />
                </View>

                {repeat && (
                  <Animated.View
                    entering={revealEntering()}
                    exiting={revealExiting()}
                    style={styles.repeatFields}
                  >
                    <RecurrenceFields
                      frequency={repeatFrequency}
                      onFrequencyChange={handleRepeatFrequencyChange}
                      nextDueDate={repeatNextDue}
                      onNextDueDateChange={handleRepeatDueChange}
                      dateError={repeatError}
                      idPrefix="expense-repeat"
                    />
                  </Animated.View>
                )}
              </View>

              {/* Submit Button — laid out with a transition so revealing the
                  recurrence fields slides it down rather than jumping it. */}
              <Animated.View layout={listLayout()}>
                <PressableScale
                  style={[styles.submitButton, { backgroundColor: colors.primary }]}
                  onPress={handleSubmit}
                  accessibilityLabel={isEditing ? 'Save changes' : 'Add expense'}
                  accessibilityRole="button"
                >
                  {isEditing
                    ? <IconCheck size={20} color={colors.onPrimary} strokeWidth={2.5} />
                    : <IconPlus size={20} color={colors.onPrimary} strokeWidth={2.5} />}
                  <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
                    {isEditing ? 'Save Changes' : 'Add Expense'}
                  </Text>
                </PressableScale>
              </Animated.View>
            </ScrollView>
          </View>
        </View>
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
  repeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  repeatCopy: { flex: 1, gap: 2 },
  repeatLabel: { marginBottom: 0 },
  repeatHint: { ...TEXT.caption },
  repeatFields: { marginTop: SPACING.xs },
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

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { IconPlus, IconChevronDown, IconCheck, IconX, IconCategory } from '@tabler/icons-react-native';
import { FONTS, SCRIM } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useApp } from '../context/AppContext';

interface ExpenseFormProps {
  onAdd: (expense: {
    description: string;
    amount: number;
    category: string;
    date: string;
  }) => void;
}

// ---------------------------------------------------------------------------
// Date masking helpers (#18)
// ---------------------------------------------------------------------------

/** Apply YYYY-MM-DD mask as the user types. Strips non-digits, inserts hyphens. */
function maskDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

/** Returns an error string or null. */
function validateDate(value: string): string | null {
  if (value.length === 0) return null; // handled at submit
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null; // still typing
  const [y, m, d] = value.split('-').map(Number);
  if (m < 1 || m > 12) return 'Invalid month';
  const daysInMonth = new Date(y, m, 0).getDate();
  if (d < 1 || d > daysInMonth) return 'Invalid day';
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return 'Invalid date';
  return null;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd }) => {
  const { colors } = useAppTheme();
  const { showFeedback, settings } = useApp();

  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [category, setCategory]       = useState(settings.categories[0]);
  const [date, setDate]               = useState(todayISO);
  const [dateError, setDateError]     = useState<string | null>(null); // (#18)
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  useEffect(() => {
    if (!settings.categories.includes(category)) {
      setCategory(settings.categories[0]);
    }
  }, [settings.categories, category]);

  // (#18) Apply mask on every keystroke
  const handleDateChange = useCallback((raw: string) => {
    const masked = maskDate(raw);
    setDate(masked);
    // Only show error once the field is fully typed
    if (masked.length === 10) {
      setDateError(validateDate(masked));
    } else {
      setDateError(null);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!description.trim()) {
      showFeedback('Please enter a description.', 'error');
      return;
    }
    if (!amount || isNaN(parseFloat(amount))) {
      showFeedback('Please enter a valid amount.', 'error');
      return;
    }
    // (#18) Validate date before submitting
    if (date.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      showFeedback('Please enter a date in YYYY-MM-DD format.', 'error');
      return;
    }
    const dateErr = validateDate(date);
    if (dateErr) {
      showFeedback(`Date: ${dateErr}.`, 'error');
      return;
    }

    onAdd({
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
    });

    setDescription('');
    setAmount('');
    setDate(todayISO());
    setDateError(null);
  }, [description, amount, category, date, onAdd, showFeedback]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
      <Text style={[styles.title, { color: colors.textMuted }]}>ADD EXPENSE</Text>

      <View style={styles.form}>
        {/* Row 1: Description + Amount */}
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex1, { backgroundColor: colors.surfaceLight, color: colors.text }]}
            placeholder="What was it for?"
            placeholderTextColor={colors.textDim}
            value={description}
            onChangeText={setDescription}
            accessibilityLabel="Expense description"
          />
          {/* (#32) Currency prefix + flexible width */}
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

        {/* Category Select */}
        <View style={styles.selectGroup}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Category</Text>
          <TouchableOpacity
            style={[styles.selectField, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceLight }]}
            onPress={() => setIsPickerVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel={`Category: ${category}`}
            accessibilityRole="button"
            accessibilityHint="Opens category picker"
          >
            <View style={styles.selectValue}>
              <IconCategory size={20} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.selectText, { color: colors.text }]}>{category}</Text>
            </View>
            <IconChevronDown size={20} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Row 2: Date + Add */}
        <View style={styles.selectGroup}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Date</Text>
          <View style={styles.row}>
            <View style={styles.flex1}>
              {/* (#18) Masked date input with YYYY-MM-DD hint and inline validation */}
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
              {/* (#18) Inline error below the field */}
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
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              accessibilityLabel="Add expense"
              accessibilityRole="button"
            >
              <IconPlus size={18} color={colors.onPrimary} strokeWidth={3} />
              <Text style={[styles.addButtonText, { color: colors.onPrimary }]}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Category Picker Modal */}
      <Modal
        visible={isPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: `rgba(0,0,0,${SCRIM})` }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setIsPickerVisible(false)}
                accessibilityLabel="Close category picker"
                accessibilityRole="button"
              >
                <IconX size={24} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={settings.categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, category === item && { backgroundColor: colors.surfaceLight }]}
                  onPress={() => { setCategory(item); setIsPickerVisible(false); }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: category === item }}
                  accessibilityLabel={item}
                >
                  <Text style={[styles.pickerItemText, { color: category === item ? colors.primary : colors.text }]}>
                    {item}
                  </Text>
                  {category === item && <IconCheck size={20} color={colors.primary} strokeWidth={2.5} />}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.pickerList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    fontFamily: FONTS.regular,
    minHeight: 52,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingLeft: 12,
    paddingRight: 8,
    minWidth: 90,
    minHeight: 52,
  },
  currencyPrefix: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    marginRight: 2,
  },
  amountInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    minWidth: 60,
  },
  // (#18) Inline date validation
  dateError: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 4,
    marginLeft: 4,
  },
  selectGroup: { gap: 8 },
  label: { fontSize: 12, fontFamily: FONTS.medium, marginLeft: 4 },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    minHeight: 52,
  },
  selectValue: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectText: { fontSize: 15, fontFamily: FONTS.medium },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
    minHeight: 52,
  },
  addButtonText: { fontSize: 15, fontFamily: FONTS.bold },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '70%',
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold },
  pickerList: { paddingBottom: 40 },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  pickerItemText: { fontSize: 16, fontFamily: FONTS.medium },
});

export default React.memo(ExpenseForm);

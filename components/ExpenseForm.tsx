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
import { IconPlus, IconX } from '@tabler/icons-react-native';
import { FONTS, SCRIM, getCategoryColor } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useApp } from '../context/AppContext';

interface ExpenseFormProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (expense: {
    description: string;
    amount: number;
    category: string;
    date: string;
  }) => void;
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

function todayLocalISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------

const ExpenseForm: React.FC<ExpenseFormProps> = ({ visible, onClose, onAdd }) => {
  const { colors } = useAppTheme();
  const { showFeedback, settings } = useApp();

  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [category, setCategory]       = useState(settings.categories[0] || 'Other');
  const [date, setDate]               = useState(todayLocalISO);
  const [dateError, setDateError]     = useState<string | null>(null);

  useEffect(() => {
    if (!settings.categories.includes(category)) {
      setCategory(settings.categories[0] || 'Other');
    }
  }, [settings.categories, category]);

  const handleDateChange = useCallback((raw: string) => {
    const masked = maskDate(raw);
    setDate(masked);
    if (masked.length === 10) {
      setDateError(validateDate(masked));
    } else {
      setDateError(null);
    }
  }, []);

  const resetForm = useCallback(() => {
    setDescription('');
    setAmount('');
    setDate(todayLocalISO());
    setDateError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(() => {
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

    onAdd({
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
    });

    resetForm();
    onClose();
  }, [description, amount, category, date, onAdd, showFeedback, resetForm, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoidingView}
      >
        <View style={[styles.modalOverlay, { backgroundColor: `rgba(0,0,0,${SCRIM})` }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Expense</Text>
              <TouchableOpacity
                onPress={handleClose}
                accessibilityLabel="Close add expense sheet"
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
                  autoFocus
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

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                accessibilityLabel="Add expense"
                accessibilityRole="button"
              >
                <IconPlus size={20} color={colors.onPrimary} strokeWidth={2.5} />
                <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>Add Expense</Text>
              </TouchableOpacity>
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
    fontSize: 20,
    fontFamily: FONTS.bold,
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
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    fontFamily: FONTS.regular,
    minHeight: 50,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 12,
    minHeight: 50,
  },
  currencyPrefix: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
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
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  catChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catChipText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  dateError: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});

export default React.memo(ExpenseForm);

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

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd }) => {
  const { colors } = useAppTheme();
  const { showFeedback, settings } = useApp();

  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [category, setCategory]       = useState(settings.categories[0]);
  const [date, setDate]               = useState(() => new Date().toISOString().split('T')[0]);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  useEffect(() => {
    if (!settings.categories.includes(category)) {
      setCategory(settings.categories[0]);
    }
  }, [settings.categories, category]);

  const handleSubmit = useCallback(() => {
    if (!description.trim()) {
      showFeedback('Please enter a description.', 'error');
      return;
    }
    if (!amount || isNaN(parseFloat(amount))) {
      showFeedback('Please enter a valid amount.', 'error');
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
  }, [description, amount, category, date, onAdd, showFeedback]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
      <Text style={[styles.title, { color: colors.textMuted }]}>ADD EXPENSE</Text>

      <View style={styles.form}>
        {/* Row 1: Description + Amount */}
        <View style={styles.row}>
          {/* (#14) Label + accessibilityLabel for description */}
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
              accessibilityLabel={`Amount in ${settings.currency}`} // (#14)
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
            accessibilityLabel={`Category: ${category}`} // (#14)
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
        <View style={styles.row}>
          {/* (#14) Label + accessibilityLabel for date */}
          <TextInput
            style={[styles.input, styles.flex1, { backgroundColor: colors.surfaceLight, color: colors.text }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textDim}
            value={date}
            onChangeText={setDate}
            accessibilityLabel="Date in YYYY-MM-DD format"
          />
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

      {/* Category Picker Modal */}
      <Modal
        visible={isPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        {/* (#13) SCRIM token */}
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
                  style={[
                    styles.pickerItem,
                    category === item && { backgroundColor: colors.surfaceLight },
                  ]}
                  onPress={() => {
                    setCategory(item);
                    setIsPickerVisible(false);
                  }}
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
  // (#32) Flexible amount field with currency prefix
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

  // Modal
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

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface ExpenseFormProps {
  onAdd: (expense: {
    description: string;
    amount: number;
    category: string;
    date: string;
  }) => void;
}

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Other',
];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (!description || !amount) return;
    onAdd({
      description,
      amount: parseFloat(amount),
      category,
      date,
    });
    setDescription('');
    setAmount('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ADD EXPENSE</Text>
      <View style={styles.form}>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="Description"
            placeholderTextColor={COLORS.textDim}
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="0.00"
            placeholderTextColor={COLORS.textDim}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.selectContainer}>
            <View style={styles.categories}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textDim}
            value={date}
            onChangeText={setDate}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  title: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    marginBottom: 15,
  },
  form: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  amountInput: {
    width: 100,
  },
  selectContainer: {
    flex: 1,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceLight,
  },
  categoryText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  categoryTextActive: {
    color: COLORS.primary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  addButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});

export default ExpenseForm;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { Settings } from '../../utils/storage';

interface SettingsScreenProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

const CURRENCY_PRESETS = [
  { symbol: '₹', label: 'INR ₹' },
  { symbol: '$', label: 'USD $' },
  { symbol: '€', label: 'EUR €' },
  { symbol: '£', label: 'GBP £' },
  { symbol: '¥', label: 'JPY ¥' },
];

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onSave }) => {
  const [income, setIncome] = useState(settings.income);
  const [budget, setBudget] = useState(settings.budget);
  const [currency, setCurrency] = useState(settings.currency);
  const [saved, setSaved] = useState(false);

  // Sync whenever parent settings change
  useEffect(() => {
    setIncome(settings.income);
    setBudget(settings.budget);
    setCurrency(settings.currency);
  }, [settings]);

  const handleSave = () => {
    if (!income || !budget) {
      Alert.alert('Missing fields', 'Please enter both income and budget.');
      return;
    }
    onSave({ income, budget, currency });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Currency Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CURRENCY</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Quick Select</Text>
          <View style={styles.currencyRow}>
            {CURRENCY_PRESETS.map((c) => (
              <TouchableOpacity
                key={c.symbol}
                style={[styles.currencyChip, currency === c.symbol && styles.currencyChipActive]}
                onPress={() => setCurrency(c.symbol)}
              >
                <Text style={[styles.currencyChipText, currency === c.symbol && styles.currencyChipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Custom Symbol</Text>
          <TextInput
            style={styles.input}
            value={currency}
            onChangeText={setCurrency}
            maxLength={3}
            placeholder="e.g. ₹"
            placeholderTextColor={COLORS.textDim}
          />
        </View>
      </View>

      {/* Budget Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BUDGET</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Monthly Income</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>{currency}</Text>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={income}
                onChangeText={setIncome}
                keyboardType="decimal-pad"
                placeholder="50000"
                placeholderTextColor={COLORS.textDim}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Monthly Budget Limit</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>{currency}</Text>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={budget}
                onChangeText={setBudget}
                keyboardType="decimal-pad"
                placeholder="20000"
                placeholderTextColor={COLORS.textDim}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saved && styles.saveButtonSuccess]}
        onPress={handleSave}
        activeOpacity={0.85}
      >
        <Text style={styles.saveButtonText}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </Text>
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Changes are saved locally on your device and applied immediately.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 0,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    gap: 0,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  inputFlex: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencyPrefix: {
    color: COLORS.primary,
    fontSize: 20,
    fontFamily: FONTS.bold,
    minWidth: 24,
    textAlign: 'center',
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  currencyChip: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  currencyChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  currencyChipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  currencyChipTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonSuccess: {
    backgroundColor: COLORS.accent,
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
  },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  infoText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
});

export default SettingsScreen;

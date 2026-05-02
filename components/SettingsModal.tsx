import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { Settings } from '../utils/storage';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  settings,
  onSave,
}) => {
  const [income, setIncome] = useState(settings.income);
  const [budget, setBudget] = useState(settings.budget);
  const [currency, setCurrency] = useState(settings.currency);

  // Sync local state whenever the modal becomes visible or settings change
  useEffect(() => {
    if (visible) {
      setIncome(settings.income);
      setBudget(settings.budget);
      setCurrency(settings.currency);
    }
  }, [visible, settings]);

  const handleSave = () => {
    onSave({ income, budget, currency });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>SETTINGS</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Monthly Income</Text>
              <TextInput
                style={styles.input}
                value={income}
                onChangeText={setIncome}
                keyboardType="decimal-pad"
                placeholder="5000"
                placeholderTextColor={COLORS.textDim}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Monthly Budget</Text>
              <TextInput
                style={styles.input}
                value={budget}
                onChangeText={setBudget}
                keyboardType="decimal-pad"
                placeholder="2000"
                placeholderTextColor={COLORS.textDim}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Currency Symbol</Text>
              <TextInput
                style={styles.input}
                value={currency}
                onChangeText={setCurrency}
                maxLength={3}
                placeholder="₹"
                placeholderTextColor={COLORS.textDim}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  closeText: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontFamily: FONTS.bold,
    paddingHorizontal: 4,
  },
});

export default SettingsModal;

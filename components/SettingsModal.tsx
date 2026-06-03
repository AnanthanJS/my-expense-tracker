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
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX';
import { FONTS } from '../constants/theme';
import type { Settings } from '../utils/storage';
import { useAppTheme } from '../hooks/useAppTheme';

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
  const { colors } = useAppTheme();
  const [income, setIncome] = useState(settings.income);
  const [budget, setBudget] = useState(settings.budget);
  const [currency, setCurrency] = useState(settings.currency);

  useEffect(() => {
    if (visible) {
      setIncome(settings.income);
      setBudget(settings.budget);
      setCurrency(settings.currency);
    }
  }, [visible, settings]);

  const handleSave = () => {
    onSave({ ...settings, income, budget, currency });
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
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textMuted }]}>SETTINGS</Text>
            <TouchableOpacity 
              onPress={onClose}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.7}
              style={styles.closeBtn}
              accessibilityLabel="Close settings"
              accessibilityRole="button"
            >
              <IconX size={20} color={colors.textMuted} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Monthly Income</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                value={income}
                onChangeText={setIncome}
                keyboardType="decimal-pad"
                placeholder="5000"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Monthly Budget</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                value={budget}
                onChangeText={setBudget}
                keyboardType="decimal-pad"
                placeholder="2000"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Currency Symbol</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                value={currency}
                onChangeText={setCurrency}
                maxLength={3}
                placeholder="₹"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]} 
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveButtonText, { color: colors.background }]}>Save Settings</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    fontFamily: FONTS.regular,
    minHeight: 48,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    minHeight: 56,
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(SettingsModal);

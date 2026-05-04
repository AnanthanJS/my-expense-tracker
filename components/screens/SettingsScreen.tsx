import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { IconPlus, IconTrash, IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { FONTS, SPACING } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';

const CURRENCY_PRESETS = [
  { symbol: '₹', label: 'INR' },
  { symbol: '$', label: 'USD' },
  { symbol: '€', label: 'EUR' },
  { symbol: '£', label: 'GBP' },
  { symbol: '¥', label: 'JPY' },
];

interface SettingsScreenProps {
  pendingRouteName?: string | null;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
  onClearPendingRoute?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  pendingRouteName = null,
  onUnsavedChangesChange,
  onClearPendingRoute,
}) => {
  const { settings, updateSettings } = useApp();
  const { colors } = useAppTheme();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  
  const [income, setIncome] = useState(settings.income);
  const [budget, setBudget] = useState(settings.budget);
  const [currency, setCurrency] = useState(settings.currency);
  const [categories, setCategories] = useState(settings.categories);
  
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSavePromptVisible, setIsSavePromptVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIncome(settings.income);
    setBudget(settings.budget);
    setCurrency(settings.currency);
    setCategories(settings.categories);
  }, [settings]);

  // Detect if any changes have been made compared to global settings
  const hasChanges = useMemo(() => {
    return (
      income !== settings.income ||
      budget !== settings.budget ||
      currency !== settings.currency ||
      JSON.stringify(categories) !== JSON.stringify(settings.categories)
    );
  }, [income, budget, currency, categories, settings]);

  useEffect(() => {
    onUnsavedChangesChange?.(hasChanges);
    return () => onUnsavedChangesChange?.(false);
  }, [hasChanges, onUnsavedChangesChange]);

  useEffect(() => {
    if (pendingRouteName && hasChanges) {
      setIsSavePromptVisible(true);
    }
  }, [hasChanges, pendingRouteName]);

  const continuePendingNavigation = useCallback(() => {
    if (!pendingRouteName) return;
    const routeName = pendingRouteName;
    onClearPendingRoute?.();
    navigation.navigate(routeName);
  }, [navigation, onClearPendingRoute, pendingRouteName]);

  const handleSave = useCallback(async () => {
    if (!income || !budget) {
      Alert.alert('Missing fields', 'Please enter both income and budget.');
      return;
    }
    setIsSaving(true);
    await updateSettings({ ...settings, income, budget, currency, categories });
    setIsSaving(false);
    setIsSavePromptVisible(false);
    continuePendingNavigation();
  }, [income, budget, currency, categories, settings, updateSettings, continuePendingNavigation]);

  const handleDiscardChanges = useCallback(() => {
    setIncome(settings.income);
    setBudget(settings.budget);
    setCurrency(settings.currency);
    setCategories(settings.categories);
    setIsSavePromptVisible(false);
    continuePendingNavigation();
  }, [continuePendingNavigation, settings]);

  const closeSavePrompt = useCallback(() => {
    setIsSavePromptVisible(false);
    onClearPendingRoute?.();
  }, [onClearPendingRoute]);

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      Alert.alert('Duplicate', 'This category already exists.');
      return;
    }
    setCategories([...categories, trimmed]);
    setNewCategoryName('');
    setIsAddModalVisible(false);
  };

  const handleRemoveCategory = (cat: string) => {
    if (categories.length <= 1) {
      Alert.alert('Error', 'You must have at least one category.');
      return;
    }
    setCategories(categories.filter((c) => c !== cat));
  };

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Finance Configuration */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FINANCE CONFIG</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <View style={styles.inputGroup}>
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

            <View style={styles.inputGroup}>
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
          </View>
        </View>

        {/* Currency Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CURRENCY</Text>
          <View style={styles.grid}>
            {CURRENCY_PRESETS.map((item) => (
              <TouchableOpacity
                key={item.symbol}
                style={[
                  styles.gridItem,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
                  currency === item.symbol && { borderColor: colors.primary, backgroundColor: colors.surfaceLight }
                ]}
                onPress={() => {
                  if (currency !== item.symbol) {
                    setCurrency(item.symbol);
                  }
                }}
              >
                <Text style={[styles.gridSymbol, { color: currency === item.symbol ? colors.primary : colors.text }]}>
                  {item.symbol}
                </Text>
                <Text style={[styles.gridLabel, { color: colors.textDim }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={[styles.gridItem, styles.manualCurrency, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
               <TextInput 
                  style={[styles.manualInput, { color: colors.text }]}
                  value={currency}
                  onChangeText={setCurrency}
                  maxLength={3}
                  placeholder="..."
                  placeholderTextColor={colors.textDim}
               />
               <Text style={[styles.gridLabel, { color: colors.textDim }]}>OTHER</Text>
            </View>
          </View>
        </View>

        {/* Categories Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CATEGORIES</Text>
          <View style={styles.grid}>
            {categories.map((cat) => (
              <View 
                key={cat} 
                style={[styles.gridItem, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}
              >
                <TouchableOpacity 
                  style={styles.deleteIcon} 
                  onPress={() => handleRemoveCategory(cat)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconTrash size={14} color={colors.danger} />
                </TouchableOpacity>
                <Text style={[styles.catEmoji, { color: colors.text }]} numberOfLines={1}>
                  {cat.substring(0, 1).toUpperCase()}
                </Text>
                <Text style={[styles.gridLabel, { color: colors.text }]} numberOfLines={1}>
                  {cat.toUpperCase()}
                </Text>
              </View>
            ))}
            
            <TouchableOpacity 
              style={[styles.gridItem, { backgroundColor: 'transparent', borderColor: colors.primary, borderStyle: 'dashed' }]}
              onPress={() => setIsAddModalVisible(true)}
            >
              <IconPlus size={24} color={colors.primary} strokeWidth={2.5} />
              <Text style={[styles.gridLabel, { color: colors.primary, marginTop: 4 }]}>ADD NEW</Text>
            </TouchableOpacity>
          </View>
        </View>

        {hasChanges && (
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveButton,
              { backgroundColor: isSaving ? colors.success : colors.primary },
            ]}
            activeOpacity={0.9}
            disabled={isSaving}
          >
            {isSaving ? (
              <IconCheck size={20} color={colors.background} strokeWidth={3} />
            ) : (
              <IconAlertCircle size={20} color={colors.background} strokeWidth={2} />
            )}
            <Text style={[styles.saveButtonText, { color: colors.background }]}>
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Save Changes Confirmation */}
      <Modal
        visible={isSavePromptVisible && hasChanges && Boolean(pendingRouteName) && !isAddModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSavePrompt}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <View style={styles.savePromptIcon}>
              <IconAlertCircle size={28} color={colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={[styles.savePromptTitle, { color: colors.text }]}>Save changes?</Text>
            <Text style={[styles.savePromptText, { color: colors.textMuted }]}>
              Your settings have new changes. Would you like to save them now?
            </Text>

            <View style={styles.promptActions}>
              <TouchableOpacity
                style={[styles.secondaryPromptBtn, { borderColor: colors.surfaceLight }]}
                onPress={handleDiscardChanges}
                disabled={isSaving}
              >
                <Text style={[styles.secondaryPromptText, { color: colors.textMuted }]}>Discard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryPromptBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <IconCheck size={18} color={colors.background} strokeWidth={3} />
                <Text style={[styles.primaryPromptText, { color: colors.background }]}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={closeSavePrompt} disabled={isSaving}>
              <Text style={[styles.keepEditingText, { color: colors.textDim }]}>Keep Editing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Category</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <IconX size={20} color={colors.textDim} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
              placeholder="e.g. Subscriptions"
              placeholderTextColor={colors.textDim}
              autoFocus
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <TouchableOpacity 
              style={[styles.modalAddBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddCategory}
            >
              <Text style={[styles.modalAddText, { color: colors.background }]}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.xl },
  section: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontFamily: FONTS.medium },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    position: 'relative',
  },
  gridSymbol: { fontSize: 24, fontFamily: FONTS.bold, marginBottom: 2 },
  gridLabel: { fontSize: 9, fontFamily: FONTS.bold, letterSpacing: 0.5 },
  manualCurrency: { overflow: 'hidden' },
  manualInput: { fontSize: 18, fontFamily: FONTS.bold, textAlign: 'center', width: '100%' },
  catEmoji: { fontSize: 22, fontFamily: FONTS.bold, marginBottom: 4 },
  deleteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  saveButton: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  spacer: { height: 120 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 30,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    gap: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontFamily: FONTS.bold },
  modalInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  modalAddBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalAddText: { fontSize: 16, fontFamily: FONTS.bold },
  savePromptIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  savePromptTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  savePromptText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    textAlign: 'center',
  },
  promptActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryPromptBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryPromptBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primaryPromptText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  secondaryPromptText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  keepEditingText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
});

export default SettingsScreen;

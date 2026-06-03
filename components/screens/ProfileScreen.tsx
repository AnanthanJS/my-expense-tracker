import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import IconUser from '@tabler/icons-react-native/dist/esm/icons/IconUser';
import IconCurrencyRupee from '@tabler/icons-react-native/dist/esm/icons/IconCurrencyRupee';
import IconDownload from '@tabler/icons-react-native/dist/esm/icons/IconDownload';
import IconUpload from '@tabler/icons-react-native/dist/esm/icons/IconUpload';
import IconDeviceFloppy from '@tabler/icons-react-native/dist/esm/icons/IconDeviceFloppy';
import IconSun from '@tabler/icons-react-native/dist/esm/icons/IconSun';
import IconMoon from '@tabler/icons-react-native/dist/esm/icons/IconMoon';
import IconAdjustments from '@tabler/icons-react-native/dist/esm/icons/IconAdjustments';
import IconInfoCircle from '@tabler/icons-react-native/dist/esm/icons/IconInfoCircle';
import IconHeart from '@tabler/icons-react-native/dist/esm/icons/IconHeart';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { exportExpensesAsJson, pickExpensesJson } from '../../utils/expenseTransfer';
import { type Expense, type Settings } from '../../utils/storage';

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ['₹', '$', '€', '£', '¥'];

const THEME_OPTIONS: { value: Settings['isDarkMode']; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: null },
  { value: 'auto', label: 'Auto', icon: null },
  { value: 'dark', label: 'Dark', icon: null },
];

// ─── Section Card ─────────────────────────────────────────────────────────────

const SectionCard: React.FC<{
  children: React.ReactNode;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ children, colors }) => (
  <View
    style={[
      styles.sectionCard,
      { backgroundColor: colors.surface, borderColor: colors.border },
      SHADOWS.sm,
    ]}
  >
    {children}
  </View>
);

// ─── Row Item ─────────────────────────────────────────────────────────────────

const RowItem: React.FC<{
  label: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isLast?: boolean;
  children: React.ReactNode;
}> = ({ label, colors, isLast, children }) => (
  <View style={[styles.rowItem, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
    <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
    <View style={styles.rowRight}>{children}</View>
  </View>
);

// ─── CSV Helpers ──────────────────────────────────────────────────────────────

function expensesToCSV(expenses: Expense[]): string {
  const header = 'id,description,amount,category,date';
  const rows = expenses.map((e) =>
    [
      e.id,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      `"${e.category}"`,
      e.date,
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

function parseCSV(csv: string): Expense[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const results: Expense[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parse — handle quoted fields
    const cols: string[] = [];
    let inQuote = false;
    let current = '';
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuote && line[j + 1] === '"') { current += '"'; j++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        cols.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current);
    if (cols.length >= 5) {
      const [id, description, amount, category, date] = cols;
      const parsed = parseFloat(amount);
      if (!isNaN(parsed)) {
        results.push({ id: id || `${Date.now()}-${i}`, description, amount: parsed, category, date });
      }
    }
  }
  return results;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ProfileScreen: React.FC = () => {
  const { settings, expenses, updateSettings, importExpenses, showFeedback } = useApp();
  const { colors, isDark } = useAppTheme();

  const [userName, setUserName] = useState(settings.userName);
  const [income, setIncome] = useState(settings.income);
  const [budget, setBudget] = useState(settings.budget);
  const [currency, setCurrency] = useState(settings.currency);
  const [themeMode, setThemeMode] = useState<Settings['isDarkMode']>(settings.isDarkMode);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync when settings change externally
  useEffect(() => {
    setUserName(settings.userName);
    setIncome(settings.income);
    setBudget(settings.budget);
    setCurrency(settings.currency);
    setThemeMode(settings.isDarkMode);
  }, [settings]);

  // Derived
  const initials = userName
    ? userName
        .trim()
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('')
    : 'U';

  const cycleCurrency = useCallback(() => {
    const idx = CURRENCIES.indexOf(currency);
    setCurrency(CURRENCIES[(idx + 1) % CURRENCIES.length]);
  }, [currency]);

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!income || isNaN(parseFloat(income))) {
      Alert.alert('Invalid Input', 'Please enter a valid monthly income.');
      return;
    }
    if (!budget || isNaN(parseFloat(budget))) {
      Alert.alert('Invalid Input', 'Please enter a valid monthly budget.');
      return;
    }
    setIsSaving(true);
    await updateSettings({
      ...settings,
      userName: userName.trim(),
      income,
      budget,
      currency,
      isDarkMode: themeMode,
    });
    setIsSaving(false);
  }, [settings, userName, income, budget, currency, themeMode, updateSettings]);

  // ── Export CSV ──
  const handleExport = useCallback(async () => {
    if (expenses.length === 0) {
      Alert.alert('No Data', 'There are no expenses to export.');
      return;
    }
    setIsExportingCsv(true);
    try {
      const csv = expensesToCSV(expenses);
      const fileName = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Expenses CSV' });
      } else {
        Alert.alert('Exported', `File saved to: ${fileUri}`);
      }
    } catch (err) {
      showFeedback('Export failed. Please try again.', 'error');
    } finally {
      setIsExportingCsv(false);
    }
  }, [expenses, showFeedback]);

  // ── Import CSV ──
  const handleImport = useCallback(async () => {
    setIsImportingCsv(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsImportingCsv(false);
        return;
      }

      const asset = result.assets[0];
      let content = '';
      if (Platform.OS === 'web' && asset.file) {
        content = await asset.file.text();
      } else {
        content = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }
      const parsed = parseCSV(content);

      if (parsed.length === 0) {
        Alert.alert('Import Failed', 'No valid expense rows found in the file.');
        setIsImportingCsv(false);
        return;
      }

      if (Platform.OS === 'web') {
        const proceed = window.confirm(`Found ${parsed.length} expenses. Do you want to import them?`);
        if (!proceed) {
          setIsImportingCsv(false);
          return;
        }
        const replace = window.confirm(`Click OK to REPLACE ALL existing expenses, or Cancel to MERGE with existing expenses.`);
        await importExpenses(parsed, replace ? 'replace' : 'merge');
      } else {
        Alert.alert(
          'Import Expenses',
          `Found ${parsed.length} expense${parsed.length === 1 ? '' : 's'}. How would you like to import them?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Merge',
              onPress: async () => {
                await importExpenses(parsed, 'merge');
              },
            },
            {
              text: 'Replace All',
              style: 'destructive',
              onPress: async () => {
                await importExpenses(parsed, 'replace');
              },
            },
          ]
        );
      }
    } catch (err) {
      showFeedback('Import failed. Please check the file format.', 'error');
    } finally {
      setIsImportingCsv(false);
    }
  }, [importExpenses, showFeedback]);

  // ── Export JSON ──
  const handleExportJson = useCallback(async () => {
    if (expenses.length === 0) {
      Alert.alert('No Data', 'There are no expenses to export.');
      return;
    }
    setIsExportingJson(true);
    try {
      await exportExpensesAsJson(expenses);
    } catch (err) {
      showFeedback('Export failed. Please try again.', 'error');
    } finally {
      setIsExportingJson(false);
    }
  }, [expenses, showFeedback]);

  // ── Import JSON ──
  const handleImportJson = useCallback(async () => {
    setIsImportingJson(true);
    try {
      const imported = await pickExpensesJson();
      if (!imported || imported.length === 0) {
        setIsImportingJson(false);
        return;
      }

      if (Platform.OS === 'web') {
        const proceed = window.confirm(`Found ${imported.length} expenses. Do you want to import them?`);
        if (!proceed) {
          setIsImportingJson(false);
          return;
        }
        const replace = window.confirm(`Click OK to REPLACE ALL existing expenses, or Cancel to MERGE with existing expenses.`);
        await importExpenses(imported, replace ? 'replace' : 'merge');
      } else {
        Alert.alert(
          'Import Expenses',
          `Found ${imported.length} expense${imported.length === 1 ? '' : 's'}. How would you like to import them?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Merge',
              onPress: async () => {
                await importExpenses(imported, 'merge');
              },
            },
            {
              text: 'Replace All',
              style: 'destructive',
              onPress: async () => {
                await importExpenses(imported, 'replace');
              },
            },
          ]
        );
      }
    } catch (err) {
      console.error(err);
      showFeedback('Import failed. Please check the file format.', 'error');
    } finally {
      setIsImportingJson(false);
    }
  }, [importExpenses, showFeedback]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar Section ── */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
            <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
          </View>
          <Text style={[styles.avatarName, { color: colors.text }]}>
            {userName.trim() || 'Your Profile'}
          </Text>
          <Text style={[styles.avatarSub, { color: colors.textMuted }]}>
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
          </Text>
        </View>

        {/* ── User Info Card ── */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PROFILE</Text>
        <SectionCard colors={colors}>
          <RowItem label="Name" colors={colors}>
            <TextInput
              style={[styles.inlineInput, { color: colors.text }]}
              value={userName}
              onChangeText={setUserName}
              placeholder="Your name"
              placeholderTextColor={colors.textDim}
              returnKeyType="done"
            />
          </RowItem>
          <RowItem label="Currency" colors={colors} isLast>
            <TouchableOpacity
              style={[styles.currencyPill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
              onPress={cycleCurrency}
              activeOpacity={0.8}
            >
              <IconCurrencyRupee size={14} color={colors.primary} strokeWidth={2.5} />
              <Text style={[styles.currencyPillText, { color: colors.primary }]}>{currency}</Text>
              <Text style={[styles.currencyHint, { color: colors.primaryLight }]}>tap to change</Text>
            </TouchableOpacity>
          </RowItem>
        </SectionCard>

        {/* ── Financial Settings Card ── */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FINANCES</Text>
        <SectionCard colors={colors}>
          <RowItem label="Monthly Income" colors={colors}>
            <View style={styles.amountInputWrap}>
              <Text style={[styles.amountPrefix, { color: colors.textMuted }]}>{currency}</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={income}
                onChangeText={setIncome}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textDim}
                returnKeyType="done"
              />
            </View>
          </RowItem>
          <RowItem label="Monthly Budget" colors={colors} isLast>
            <View style={styles.amountInputWrap}>
              <Text style={[styles.amountPrefix, { color: colors.textMuted }]}>{currency}</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={budget}
                onChangeText={setBudget}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textDim}
                returnKeyType="done"
              />
            </View>
          </RowItem>
        </SectionCard>

        {/* ── App Settings Card ── */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APPEARANCE</Text>
        <SectionCard colors={colors}>
          <View style={styles.themeRow}>
            <View style={styles.themeLabelRow}>
              {isDark ? (
                <IconMoon size={16} color={colors.textMuted} strokeWidth={2} />
              ) : (
                <IconSun size={16} color={colors.textMuted} strokeWidth={2} />
              )}
              <Text style={[styles.rowLabel, { color: colors.textMuted, marginLeft: 6 }]}>Theme</Text>
            </View>
            <View style={[styles.themeChips, { backgroundColor: colors.surfaceLight }]}>
              {(['light', 'auto', 'dark'] as Settings['isDarkMode'][]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeChip,
                    themeMode === mode && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setThemeMode(mode)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.themeChipText,
                      { color: themeMode === mode ? '#FFFFFF' : colors.textMuted },
                      themeMode === mode && { fontFamily: FONTS.bold },
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SectionCard>

        {/* ── Data Section ── */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DATA</Text>
        <SectionCard colors={colors}>
          <TouchableOpacity
            style={[styles.dataBtn, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={handleExport}
            disabled={isExportingCsv}
            activeOpacity={0.8}
          >
            <View style={[styles.dataBtnIcon, { backgroundColor: colors.success + '20' }]}>
              <IconDownload size={18} color={colors.success} strokeWidth={2} />
            </View>
            <View style={styles.dataBtnContent}>
              <Text style={[styles.dataBtnTitle, { color: colors.text }]}>
                {isExportingCsv ? 'Exporting...' : 'Export as CSV'}
              </Text>
              <Text style={[styles.dataBtnSub, { color: colors.textMuted }]}>
                Share your expenses as a spreadsheet
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataBtn, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={handleExportJson}
            disabled={isExportingJson}
            activeOpacity={0.8}
          >
            <View style={[styles.dataBtnIcon, { backgroundColor: colors.success + '20' }]}>
              <IconDownload size={18} color={colors.success} strokeWidth={2} />
            </View>
            <View style={styles.dataBtnContent}>
              <Text style={[styles.dataBtnTitle, { color: colors.text }]}>
                {isExportingJson ? 'Exporting...' : 'Export as JSON'}
              </Text>
              <Text style={[styles.dataBtnSub, { color: colors.textMuted }]}>
                Backup expenses in JSON format
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataBtn, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={handleImport}
            disabled={isImportingCsv}
            activeOpacity={0.8}
          >
            <View style={[styles.dataBtnIcon, { backgroundColor: colors.info + '20' }]}>
              <IconUpload size={18} color={colors.info} strokeWidth={2} />
            </View>
            <View style={styles.dataBtnContent}>
              <Text style={[styles.dataBtnTitle, { color: colors.text }]}>
                {isImportingCsv ? 'Importing...' : 'Import from CSV'}
              </Text>
              <Text style={[styles.dataBtnSub, { color: colors.textMuted }]}>
                Load expenses from a CSV file
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dataBtn}
            onPress={handleImportJson}
            disabled={isImportingJson}
            activeOpacity={0.8}
          >
            <View style={[styles.dataBtnIcon, { backgroundColor: colors.info + '20' }]}>
              <IconUpload size={18} color={colors.info} strokeWidth={2} />
            </View>
            <View style={styles.dataBtnContent}>
              <Text style={[styles.dataBtnTitle, { color: colors.text }]}>
                {isImportingJson ? 'Importing...' : 'Import from JSON'}
              </Text>
              <Text style={[styles.dataBtnSub, { color: colors.textMuted }]}>
                Restore expenses from a JSON backup
              </Text>
            </View>
          </TouchableOpacity>
        </SectionCard>

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: isSaving ? colors.success : colors.primary },
            SHADOWS.md,
          ]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          <IconDeviceFloppy size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        {/* ── About Section ── */}
        <View style={styles.aboutSection}>
          <View style={[styles.aboutCard, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
            <View style={styles.aboutRow}>
              <IconInfoCircle size={14} color={colors.textDim} strokeWidth={2} />
              <Text style={[styles.aboutText, { color: colors.textDim }]}>Expense Tracker  v1.0.0</Text>
            </View>
            <View style={[styles.aboutDivider, { backgroundColor: colors.border }]} />
            <View style={styles.aboutRow}>
              <IconHeart size={14} color={colors.secondary} strokeWidth={2} />
              <Text style={[styles.aboutText, { color: colors.textDim }]}>Made with love</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.xl, marginBottom: SPACING.md },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarInitials: { fontSize: 32, fontFamily: FONTS.bold, letterSpacing: -1 },
  avatarName: { fontSize: 22, fontFamily: FONTS.bold, letterSpacing: -0.3 },
  avatarSub: { fontSize: 13, fontFamily: FONTS.regular, marginTop: 4 },

  // Section
  sectionTitle: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  sectionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },

  // Row
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 54,
  },
  rowLabel: { fontSize: 14, fontFamily: FONTS.medium },
  rowRight: { flex: 1, alignItems: 'flex-end' },

  // Inline Input
  inlineInput: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    textAlign: 'right',
    minWidth: 150,
    paddingVertical: 4,
  },

  // Currency
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  currencyPillText: { fontSize: 16, fontFamily: FONTS.bold },
  currencyHint: { fontSize: 10, fontFamily: FONTS.regular },

  // Amount Input
  amountInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  amountPrefix: { fontSize: 16, fontFamily: FONTS.bold },
  amountInput: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    textAlign: 'right',
    minWidth: 100,
    paddingVertical: 4,
  },

  // Theme
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  themeLabelRow: { flexDirection: 'row', alignItems: 'center' },
  themeChips: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    padding: 3,
    gap: 2,
  },
  themeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  themeChipText: { fontSize: 13, fontFamily: FONTS.medium },

  // Data Buttons
  dataBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 64,
  },
  dataBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dataBtnContent: { flex: 1 },
  dataBtnTitle: { fontSize: 14, fontFamily: FONTS.bold, marginBottom: 2 },
  dataBtnSub: { fontSize: 12, fontFamily: FONTS.regular },

  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
  },
  saveButtonText: { fontSize: 16, fontFamily: FONTS.bold, color: '#FFFFFF' },

  // About
  aboutSection: { marginTop: SPACING.xl, alignItems: 'center' },
  aboutCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: SPACING.sm },
  aboutText: { fontSize: 12, fontFamily: FONTS.regular },
  aboutDivider: { width: 1, height: 20 },
});

export default React.memo(ProfileScreen);

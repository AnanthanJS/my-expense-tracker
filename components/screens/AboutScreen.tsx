import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Modal, Alert } from 'react-native';
import {
  IconCoin,
  IconLock,
  IconDownload,
  IconDatabase,
  IconRefresh,
  IconTrash,
  IconChevronRight,
  IconTrendingUp,
  IconCalendar,
  IconTarget,
  IconSearch,
  IconCurrencyDollar,
  IconCloudOff,
} from '@tabler/icons-react-native';
import type { IconProps } from '@tabler/icons-react-native';
import appConfig from '../../app.json';
import { GUTTER, SPACING, TEXT, RADII, ELEVATION, GLASS, SCRIM_COLOR, tint, calloutTint, calloutBorder } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useNavbarHeight } from '../../hooks/useNavbarHeight';
import { exportExpensesAsCsv, exportExpensesAsJson, pickExpensesJson } from '../../utils/expenseTransfer';
import { formatDate } from '../../utils/formatDate';
import PressableScale from '../PressableScale';

const FEATURES: { icon: React.FC<IconProps>; label: string }[] = [
  { icon: IconTrendingUp, label: 'Category breakdowns' },
  { icon: IconCalendar, label: 'Month-by-month history' },
  { icon: IconTarget, label: 'Income & budget goals' },
  { icon: IconSearch, label: 'Search & filters' },
  { icon: IconCurrencyDollar, label: 'Any currency you like' },
  { icon: IconCloudOff, label: 'Works fully offline' },
];

const BUILT_WITH = ['Expo', 'React Native', 'AsyncStorage', 'Reanimated', 'Sora', 'Inter'];

/** Typed to confirm an irreversible wipe. */
const ERASE_WORD = 'ERASE';

const AboutScreen: React.FC = () => {
  const { colors, isDark } = useAppTheme();
  const glass = isDark ? GLASS.dark : GLASS.light;
  const navbarHeight = useNavbarHeight();
  const {
    expenses,
    recurringExpenses,
    settings,
    updateSettings,
    importExpenses,
    showFeedback,
    eraseAllData,
  } = useApp();

  const [eraseOpen, setEraseOpen] = useState(false);
  const [eraseConfirm, setEraseConfirm] = useState('');

  const lastBackup = useMemo(
    () => (settings.lastBackupAt ? formatDate(settings.lastBackupAt) : 'never'),
    [settings.lastBackupAt],
  );

  const handleCsv = useCallback(async () => {
    if (expenses.length === 0) {
      showFeedback('Nothing to export yet.', 'error');
      return;
    }
    try {
      await exportExpensesAsCsv(expenses);
    } catch (e) {
      showFeedback(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
    }
  }, [expenses, showFeedback]);

  const handleBackup = useCallback(async () => {
    if (expenses.length === 0 && recurringExpenses.length === 0) {
      showFeedback('Nothing to back up yet.', 'error');
      return;
    }
    try {
      await exportExpensesAsJson(expenses, recurringExpenses, settings);
      // Recorded only after the share sheet resolves, so a cancelled export
      // does not leave a backup date that never happened.
      updateSettings({ ...settings, lastBackupAt: new Date().toISOString() });
    } catch (e) {
      showFeedback(`Backup failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
    }
  }, [expenses, recurringExpenses, settings, updateSettings, showFeedback]);

  const handleRestore = useCallback(async () => {
    try {
      const imported = await pickExpensesJson();
      if (!imported) return;
      const count = imported.expenses.length + imported.recurringExpenses.length;
      Alert.alert(
        'Restore backup',
        `${count} item${count === 1 ? '' : 's'} found. Merge with what you have, or replace it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Merge', onPress: () => importExpenses(imported, 'merge') },
          { text: 'Replace', style: 'destructive', onPress: () => importExpenses(imported, 'replace') },
        ],
      );
    } catch (e) {
      showFeedback(`Restore failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
    }
  }, [importExpenses, showFeedback]);

  const confirmErase = useCallback(() => {
    if (eraseConfirm.trim().toUpperCase() !== ERASE_WORD) return;
    eraseAllData();
    setEraseOpen(false);
    setEraseConfirm('');
  }, [eraseConfirm, eraseAllData]);

  const dataRows = [
    { icon: IconDownload, label: 'Export as CSV', sub: null, onPress: handleCsv, danger: false },
    { icon: IconDatabase, label: 'Back up to a file', sub: `Last backup: ${lastBackup}`, onPress: handleBackup, danger: false },
    { icon: IconRefresh, label: 'Restore from a backup', sub: null, onPress: handleRestore, danger: false },
    { icon: IconTrash, label: 'Erase all data', sub: null, onPress: () => setEraseOpen(true), danger: true },
  ];

  return (
    <>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: navbarHeight + SPACING.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.maxWidth}>
          {/* ── App ──────────────────────────────────────────────────────── */}
          <View style={[styles.card, styles.appCard, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}>
            <View style={[styles.appIcon, { backgroundColor: tint(colors.primary, '1A') }]}>
              <IconCoin size={30} color={colors.primary} strokeWidth={1.8} />
            </View>
            <View style={styles.appText}>
              <Text
                style={[styles.appName, { color: colors.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                My Expense Tracker
              </Text>
              <Text style={[styles.appTagline, { color: colors.textMuted }]}>
                Your personal finance companion — simple, fast and private.
              </Text>
            </View>
          </View>

          {/* ── Privacy ──────────────────────────────────────────────────── */}
          {/*
            styles.flatCard, not styles.card: this one is tinted rather than
            filled, and a translucent background cannot carry an Android
            elevation. See the note on flatCard.
          */}
          <View style={[styles.flatCard, styles.appCard, {
            backgroundColor: calloutTint(colors.primary, isDark),
            borderColor: calloutBorder(colors.primary, isDark),
          }]}>
            {/* A stronger tint than the card: reusing the card's own alpha
                left the tile at 1.11:1 against it in light mode, too faint to
                read as a tile at all. */}
            <View style={[styles.appIcon, { backgroundColor: tint(colors.primary, '3D') }]}>
              <IconLock size={26} color={colors.primary} strokeWidth={1.8} />
            </View>
            <View style={styles.appText}>
              <Text style={[styles.privacyTitle, { color: colors.text }]}>Everything stays on this phone</Text>
              <Text style={[styles.appTagline, { color: colors.textMuted }]}>
                No account, no cloud, no tracking. If you uninstall the app your data goes with it — so keep a backup.
              </Text>
            </View>
          </View>

          {/* ── Your data ────────────────────────────────────────────────── */}
          <View style={[styles.card, styles.listCard, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}>
            <Text style={[styles.cardLabel, { color: colors.textDim }]}>Your data</Text>
            {dataRows.map((row, index) => {
              const Icon = row.icon;
              const tone = row.danger ? colors.danger : colors.text;
              return (
                <PressableScale
                  key={row.label}
                  style={[
                    styles.row,
                    index > 0 && { borderTopWidth: 1, borderTopColor: colors.surfaceLight },
                  ]}
                  onPress={row.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={row.sub ? `${row.label}. ${row.sub}` : row.label}
                >
                  <Icon size={22} color={row.danger ? colors.danger : colors.textMuted} strokeWidth={2} />
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, { color: tone }]} numberOfLines={1}>{row.label}</Text>
                    {row.sub && (
                      <Text style={[styles.rowSub, { color: colors.textDim }]} numberOfLines={1}>{row.sub}</Text>
                    )}
                  </View>
                  <IconChevronRight size={18} color={row.danger ? colors.danger : colors.textDim} strokeWidth={2} />
                </PressableScale>
              );
            })}
          </View>

          {/* ── What it does ─────────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>What it does</Text>
          <View style={styles.grid}>
            {FEATURES.map(({ icon: Icon, label }) => (
              <View
                key={label}
                style={[styles.tile, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}
              >
                <Icon size={22} color={colors.primary} strokeWidth={2} />
                <Text style={[styles.tileLabel, { color: colors.text }]}>{label}</Text>
              </View>
            ))}
          </View>

          {/* ── Built with ───────────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>Built with</Text>
          <View style={styles.chips}>
            {BUILT_WITH.map((name) => (
              <View key={name} style={[styles.chip, { backgroundColor: glass.card, borderColor: glass.border }]}>
                <Text style={[styles.chipText, { color: colors.textMuted }]}>{name}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.version, { color: colors.textDim }]}>
            Version {appConfig.expo.version}
          </Text>
        </View>
      </ScrollView>

      {/* ── Erase confirmation ─────────────────────────────────────────────
          Typed rather than a plain Alert: this clears expenses, recurring
          bills and settings with no undo, so it should take more than a
          mis-tap to reach. */}
      <Modal visible={eraseOpen} transparent animationType="fade" onRequestClose={() => setEraseOpen(false)}>
        <View style={[styles.overlay, { backgroundColor: SCRIM_COLOR }]}>
          <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <View style={[styles.appIcon, { backgroundColor: tint(colors.danger, '1A'), alignSelf: 'center' }]}>
              <IconTrash size={26} color={colors.danger} strokeWidth={2} />
            </View>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Erase all data?</Text>
            <Text style={[styles.dialogBody, { color: colors.textMuted }]}>
              This removes every expense, recurring bill and setting on this phone. It cannot be undone,
              and a backup taken now is the only way back.
            </Text>
            <Text style={[styles.dialogPrompt, { color: colors.textDim }]}>
              Type {ERASE_WORD} to confirm
            </Text>
            <TextInput
              style={[styles.dialogInput, { borderColor: colors.surfaceLight, color: colors.text }]}
              value={eraseConfirm}
              onChangeText={setEraseConfirm}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={ERASE_WORD}
              placeholderTextColor={colors.textDim}
              accessibilityLabel={`Type ${ERASE_WORD} to confirm erasing all data`}
            />
            <View style={styles.dialogActions}>
              <PressableScale
                style={[styles.dialogBtn, { borderColor: colors.surfaceLight, borderWidth: 1 }]}
                onPress={() => { setEraseOpen(false); setEraseConfirm(''); }}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={[styles.dialogBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </PressableScale>
              <PressableScale
                style={[
                  styles.dialogBtn,
                  { backgroundColor: colors.danger },
                  eraseConfirm.trim().toUpperCase() !== ERASE_WORD && styles.dialogBtnDisabled,
                ]}
                onPress={confirmErase}
                disabled={eraseConfirm.trim().toUpperCase() !== ERASE_WORD}
                accessibilityRole="button"
                accessibilityLabel="Erase all data"
              >
                <Text style={[styles.dialogBtnText, { color: colors.onDanger }]}>Erase</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.sm },
  maxWidth: { maxWidth: 640, width: '100%', alignSelf: 'center' },

  card: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    ...ELEVATION.sm,
  },
  /**
   * A card with no shadow, for callouts whose background is a tint rather
   * than a fill.
   *
   * Android draws an elevation shadow from the view's outline and expects an
   * opaque background to hide it. At 8% alpha the shadow shows straight
   * through, which turned the privacy callout into a grey slab with a paler
   * rectangle where its content sat. The insight card on Home has always been
   * flat for the same reason; this matches it.
   */
  flatCard: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    padding: SPACING.lg,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  appText: { flex: 1, gap: 4 },
  appName: { ...TEXT.subheading },
  privacyTitle: { ...TEXT.rowTitle },
  appTagline: { ...TEXT.prose },

  listCard: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  cardLabel: { ...TEXT.labelSm, paddingTop: SPACING.lg, paddingBottom: SPACING.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 60,
  },
  rowText: { flex: 1, gap: 1 },
  rowLabel: { ...TEXT.bodyLg },
  rowSub: { ...TEXT.caption },

  sectionLabel: { ...TEXT.labelSm, marginBottom: SPACING.md, marginLeft: SPACING.xs },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 108,
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    justifyContent: 'space-between',
    ...ELEVATION.sm,
  },
  tileLabel: { ...TEXT.rowTitle },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  chipText: { ...TEXT.label },
  version: { ...TEXT.caption, marginTop: SPACING.lg, textAlign: 'center' },

  overlay: { flex: 1, justifyContent: 'center', padding: SPACING.xl },
  dialog: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  dialogTitle: { ...TEXT.heading, textAlign: 'center' },
  dialogBody: { ...TEXT.prose, textAlign: 'center' },
  dialogPrompt: { ...TEXT.labelSm, marginTop: SPACING.sm },
  dialogInput: {
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 52,
    ...TEXT.bodyLg,
  },
  dialogActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  dialogBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnDisabled: { opacity: 0.45 },
  dialogBtnText: { ...TEXT.button },
});

export default React.memo(AboutScreen);

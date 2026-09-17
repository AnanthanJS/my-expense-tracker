import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
} from '@tabler/icons-react-native';
import { TEXT, RADII, SPACING, GLASS, ELEVATION, SCRIM_COLOR } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { getMonthName } from '../utils/storage';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthPillProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

/**
 * Full-width month control shown beneath the title on every data screen.
 *
 * Replaces the compact inline control that lived inside MainHeader: the month
 * scopes everything on the screen below it, so it reads better as the first
 * row of content than as a subtitle.
 */
const MonthPill: React.FC<MonthPillProps> = ({ selectedDate, onDateChange }) => {
  const { colors, isDark } = useAppTheme();
  const glass = isDark ? GLASS.dark : GLASS.light;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear());

  const today = useMemo(() => new Date(), []);
  const monthName = useMemo(() => getMonthName(selectedDate), [selectedDate]);

  const step = useCallback((delta: number) => {
    const next = new Date(selectedDate);
    next.setMonth(next.getMonth() + delta);
    onDateChange(next);
  }, [selectedDate, onDateChange]);

  const openPicker = useCallback(() => {
    setPickerYear(selectedDate.getFullYear());
    setPickerOpen(true);
  }, [selectedDate]);

  const choose = useCallback((month: number) => {
    onDateChange(new Date(pickerYear, month, 1));
    setPickerOpen(false);
  }, [pickerYear, onDateChange]);

  /** Future months have no data and cannot be reached by stepping past today. */
  const isFuture = useCallback(
    (year: number, month: number) =>
      year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth()),
    [today],
  );

  const nextDisabled = isFuture(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
  );

  return (
    <>
      <View style={[styles.pill, { backgroundColor: glass.card, borderColor: glass.border, shadowColor: glass.shadow }]}>
        <TouchableOpacity
          onPress={() => step(-1)}
          style={styles.arrow}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <IconChevronLeft size={22} color={colors.textMuted} strokeWidth={2.2} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openPicker}
          style={styles.label}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={`${monthName}. Change month`}
        >
          <Text style={[styles.labelText, { color: colors.text }]} numberOfLines={1}>
            {monthName}
          </Text>
          <IconChevronDown size={18} color={colors.textMuted} strokeWidth={2.2} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => step(1)}
          style={[styles.arrow, nextDisabled && styles.arrowDisabled]}
          disabled={nextDisabled}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityState={{ disabled: nextDisabled }}
        >
          <IconChevronRight size={22} color={colors.textMuted} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: SCRIM_COLOR }]}
          activeOpacity={1}
          onPress={() => setPickerOpen(false)}
          accessibilityLabel="Close month picker"
        >
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <View style={styles.yearRow}>
              <TouchableOpacity
                onPress={() => setPickerYear((y) => y - 1)}
                style={styles.arrow}
                accessibilityRole="button"
                accessibilityLabel="Previous year"
              >
                <IconChevronLeft size={22} color={colors.textMuted} strokeWidth={2.2} />
              </TouchableOpacity>
              <Text style={[styles.yearText, { color: colors.text }]}>{pickerYear}</Text>
              <TouchableOpacity
                onPress={() => setPickerYear((y) => y + 1)}
                style={[styles.arrow, pickerYear >= today.getFullYear() && styles.arrowDisabled]}
                disabled={pickerYear >= today.getFullYear()}
                accessibilityRole="button"
                accessibilityLabel="Next year"
              >
                <IconChevronRight size={22} color={colors.textMuted} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            <View style={styles.grid}>
              {MONTHS.map((label, index) => {
                const active =
                  pickerYear === selectedDate.getFullYear() && index === selectedDate.getMonth();
                const disabled = isFuture(pickerYear, index);
                return (
                  <TouchableOpacity
                    key={label}
                    style={[
                      styles.month,
                      active && { backgroundColor: colors.primary },
                      disabled && styles.arrowDisabled,
                    ]}
                    onPress={() => choose(index)}
                    disabled={disabled}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active, disabled }}
                    accessibilityLabel={`${label} ${pickerYear}`}
                  >
                    <Text style={[
                      styles.monthText,
                      { color: active ? colors.onPrimary : colors.text },
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.lg,
    ...ELEVATION.sm,
  },
  arrow: {
    minWidth: 44,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.3 },
  label: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 52,
  },
  labelText: { ...TEXT.subheading },

  overlay: { flex: 1, justifyContent: 'center', padding: SPACING.xl },
  sheet: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  yearText: { ...TEXT.heading },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  month: {
    width: '30%',
    flexGrow: 1,
    minHeight: 48,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: { ...TEXT.rowTitle },
});

export default React.memo(MonthPill);

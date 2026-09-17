import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react-native';

import { SPACING, TEXT, RADII } from '../constants/theme';
import { getMonthName } from '../utils/storage';
import { useAppTheme } from '../hooks/useAppTheme';

interface MonthPickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  /**
   * Inline variant for MainHeader: no card chrome, tighter metrics. The month
   * is now global context rather than a Home-screen control, so it lives in
   * the header where every data screen can see it. (C1)
   */
  compact?: boolean;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ selectedDate, onDateChange, compact = false }) => {
  const { colors } = useAppTheme();
  
  const handlePrev = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  }, [selectedDate, onDateChange]);

  const handleNext = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  }, [selectedDate, onDateChange]);

  const handleCurrent = useCallback(() => {
    onDateChange(new Date());
  }, [onDateChange]);

  const today = useMemo(() => new Date(), []);
  const monthName = useMemo(() => getMonthName(selectedDate), [selectedDate]);
  const isCurrentMonth = useMemo(
    () =>
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear(),
    [selectedDate, today]
  );

  return (
    <View 
      style={[
        styles.container,
        compact
          ? styles.containerCompact
          : { backgroundColor: colors.surface, borderColor: colors.surfaceLight, borderWidth: 1 },
      ]}
      accessible={true}
      accessibilityLabel={`Current viewing month: ${monthName}`}
      accessibilityRole="header"
    >
      <TouchableOpacity 
        onPress={handlePrev} 
        style={styles.btn}
        hitSlop={{ top: 10, bottom: 10, left: 15, right: 10 }}
        activeOpacity={0.7}
        accessibilityLabel="Previous month"
        accessibilityRole="button"
        accessibilityHint="Switches data to the previous month"
      >
        <IconChevronLeft size={compact ? 18 : 22} color={colors.textMuted} strokeWidth={2.5} />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleCurrent} 
        style={styles.monthDisplay}
        activeOpacity={0.7}
        accessibilityLabel={`Month selection: ${monthName}`}
        accessibilityHint="Tap to jump to current month"
        accessibilityRole="button"
      >
        <Text
          style={[
            compact ? styles.monthTextCompact : styles.monthText,
            { color: colors.text },
            isCurrentMonth && { color: colors.primary },
          ]}
          numberOfLines={1}
        >
          {monthName}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleNext} 
        style={styles.btn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 15 }}
        activeOpacity={0.7}
        accessibilityLabel="Next month"
        accessibilityRole="button"
        accessibilityHint="Switches data to the next month"
      >
        <IconChevronRight size={compact ? 18 : 22} color={colors.textMuted} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderRadius: RADII.lg,
    padding: 8,
  },
  containerCompact: {
    marginBottom: 0,
    padding: 0,
    alignSelf: 'flex-start',
  },
  btn: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDisplay: {
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  monthTextCompact: {
    ...TEXT.label,
  },
  monthText: {
    ...TEXT.subheading,
  },
});

export default React.memo(MonthPicker);

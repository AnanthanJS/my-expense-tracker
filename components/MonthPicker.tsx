import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react-native';

import { FONTS, SPACING } from '../constants/theme';
import { getMonthName } from '../utils/storage';
import { useAppTheme } from '../hooks/useAppTheme';

interface MonthPickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ selectedDate, onDateChange }) => {
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
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}
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
        <IconChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleCurrent} 
        style={styles.monthDisplay}
        activeOpacity={0.7}
        accessibilityLabel={`Month selection: ${monthName}`}
        accessibilityHint="Tap to jump to current month"
        accessibilityRole="button"
      >
        <Text style={[
          styles.monthText, 
          { color: colors.text },
          isCurrentMonth && { color: colors.primary }
        ]}>
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
        <IconChevronRight size={22} color={colors.text} strokeWidth={2.5} />
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
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
  },
  btn: {
    padding: 10,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDisplay: {
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  monthText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});

export default React.memo(MonthPicker);

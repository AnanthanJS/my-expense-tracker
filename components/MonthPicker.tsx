import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { COLORS, FONTS } from '../constants/theme';
import { getMonthName } from '../utils/storage';

interface MonthPickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ selectedDate, onDateChange }) => {
  const handlePrev = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const handleCurrent = () => {
    onDateChange(new Date());
  };

  const monthName = getMonthName(selectedDate);
  const isCurrentMonth = 
    selectedDate.getMonth() === new Date().getMonth() && 
    selectedDate.getFullYear() === new Date().getFullYear();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePrev} style={styles.btn}>
        <Text style={styles.arrow}>{'<'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleCurrent} style={styles.monthDisplay}>
        <Text style={[styles.monthText, isCurrentMonth && styles.currentMonthText]}>
          {monthName}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleNext} style={styles.btn}>
        <Text style={styles.arrow}>{'>'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  btn: {
    padding: 8,
  },
  arrow: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FONTS.bold,
    paddingHorizontal: 4,
  },
  monthDisplay: {
    paddingHorizontal: 20,
    minWidth: 180,
    alignItems: 'center',
  },
  monthText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  currentMonthText: {
    color: COLORS.primary,
  },
});

export default MonthPicker;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface ProgressCircleProps {
  percentage: number;
  size?: number;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ percentage, size = 96 }) => {
  const getColor = () => {
    if (percentage > 90) return COLORS.danger;
    if (percentage > 70) return COLORS.warning;
    return COLORS.primary;
  };

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: getColor(),
          },
        ]}
      />
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: getColor() }]}>
          {Math.round(percentage)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderWidth: 6,
    borderColor: COLORS.surfaceLight,
  },
  labelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
});

export default ProgressCircle;

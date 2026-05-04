import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

interface ProgressCircleProps {
  percentage: number;
  size?: number;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ percentage, size = 96 }) => {
  const { colors } = useAppTheme();
  
  const color = useMemo(() => {
    if (percentage > 90) return colors.danger;
    if (percentage > 70) return colors.warning;
    return colors.primary;
  }, [percentage, colors]);

  const displayPercent = useMemo(() => Math.round(percentage), [percentage]);

  const containerStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
  }), [size]);

  const ringStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    borderColor: color,
  }), [size, color]);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.ring, { borderColor: colors.surfaceLight }, ringStyle]} />
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color }]}>
          {displayPercent}%
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

export default React.memo(ProgressCircle);

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { TEXT, getBudgetTone } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

interface ProgressCircleProps {
  /** 0–100+ (values above 100 animate arc at 100%, but label shows real value). */
  percentage: number;
  size?: number;
}

const STROKE_WIDTH = 7;

const ProgressCircle: React.FC<ProgressCircleProps> = ({ percentage, size = 96 }) => {
  const { colors } = useAppTheme();

  // Shared ramp, so the ring and the status beside it never disagree.
  const color = useMemo(() => getBudgetTone(percentage, 100, colors), [percentage, colors]);

  const displayPercent = useMemo(() => Math.round(percentage), [percentage]);

  // SVG arc geometry
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  // Arc capped at 100% visually; label can exceed it
  const arcPercent = Math.min(Math.max(percentage, 0), 100);
  const dashOffset = circumference * (1 - arcPercent / 100);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Rotate −90° so the arc starts at 12-o'clock */}
      <Svg
        width={size}
        height={size}
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.surfaceLight}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
        {/* Progress arc */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      </Svg>

      {/* Centered label */}
      <View style={[StyleSheet.absoluteFill, styles.labelContainer]}>
        <Text style={[styles.label, { color }]}>{displayPercent}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  labelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...TEXT.moneyRing,
  },
});

export default React.memo(ProgressCircle);

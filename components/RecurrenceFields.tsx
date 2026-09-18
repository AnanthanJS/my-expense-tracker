import React, { useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { TEXT, RADII, SPACING } from '../constants/theme';
import { FREQUENCIES, frequencyLabel } from '../utils/recurrence';
import type { Frequency } from '../utils/recurrence';
import { maskDate, validateDate } from '../utils/dateInput';
import { useAppTheme } from '../hooks/useAppTheme';
import PressableScale from './PressableScale';

interface RecurrenceFieldsProps {
  frequency: Frequency;
  onFrequencyChange: (frequency: Frequency) => void;
  nextDueDate: string;
  onNextDueDateChange: (date: string) => void;
  /** Rendered under the date field. Owned by the form, which knows the rules. */
  dateError?: string | null;
  /** Prefix for the accessibility labels, so two instances never collide. */
  idPrefix?: string;
}

/**
 * Frequency and next due date — the two fields that define a recurrence.
 *
 * Shared by the New Recurring Bill form and the repeat toggle on an expense so
 * the two are literally the same control: one option list, one date mask, one
 * set of labels. A second copy would drift the first time either gained an
 * option, and the two forms would start disagreeing about what "monthly"
 * means.
 */
const RecurrenceFields: React.FC<RecurrenceFieldsProps> = ({
  frequency,
  onFrequencyChange,
  nextDueDate,
  onNextDueDateChange,
  dateError,
  idPrefix = 'recurrence',
}) => {
  const { colors } = useAppTheme();

  // Masking lives here rather than in each form: a date field that types its
  // own dashes in one form and not the other is the kind of difference nobody
  // reports but everybody feels.
  const handleDateChange = useCallback(
    (raw: string) => onNextDueDateChange(maskDate(raw)),
    [onNextDueDateChange],
  );

  const formatError = dateError ?? validateDate(nextDueDate);

  return (
    <>
      <Text style={[styles.label, { color: colors.textMuted }]}>Frequency</Text>
      <View style={styles.freqRow} accessibilityRole="radiogroup">
        {FREQUENCIES.map((option) => {
          const isSelected = frequency === option;
          return (
            <PressableScale
              key={option}
              style={[
                styles.freqChip,
                { backgroundColor: colors.surfaceLight },
                isSelected && { backgroundColor: colors.primary },
              ]}
              onPress={() => onFrequencyChange(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, checked: isSelected }}
              accessibilityLabel={`${frequencyLabel(option)} frequency`}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? colors.onPrimary : colors.textMuted },
                ]}
              >
                {frequencyLabel(option)}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <Text style={[styles.label, { color: colors.textMuted }]}>
        Next Due Date (YYYY-MM-DD)
      </Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.surfaceLight, color: colors.text },
          formatError && { borderWidth: 1, borderColor: colors.danger },
        ]}
        value={nextDueDate}
        onChangeText={handleDateChange}
        placeholder="2026-09-01"
        placeholderTextColor={colors.textDim}
        keyboardType="number-pad"
        maxLength={10}
        accessibilityLabel="Next due date"
        accessibilityHint="Enter the date of the next occurrence, as year, month, day"
        testID={`${idPrefix}-next-due`}
      />
      {formatError && (
        <Text style={[styles.error, { color: colors.danger }]} accessibilityLiveRegion="polite">
          {formatError}
        </Text>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  label: { ...TEXT.labelSm, marginBottom: 8, marginTop: 12 },
  input: { borderRadius: RADII.sm, padding: 14, ...TEXT.bodySm },
  freqRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  freqChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: RADII.sm,
  },
  chipText: { ...TEXT.buttonSm },
  error: { ...TEXT.caption, marginTop: 6 },
});

export default React.memo(RecurrenceFields);

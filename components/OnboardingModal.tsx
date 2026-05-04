import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import { 
  IconChartBar, 
  IconSwipe, 
  IconPlus, 
  IconArrowRight,
  IconCheck,
  IconFilter,
  IconFileExport,
  IconSettings,
} from '@tabler/icons-react-native';
import type { IconProps } from '@tabler/icons-react-native';
import { FONTS } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

interface Step {
  title: string;
  description: string;
  icon: React.FC<IconProps>;
}

const STEPS: Step[] = [
  {
    title: 'Welcome to ZarcZ',
    description: 'Track spending, budgets, savings, categories, and backups from one clean workspace.',
    icon: IconChartBar,
  },
  {
    title: 'Move Between Tabs',
    description: 'Use the bottom tabs or swipe left and right to move between Home, Expenses, Settings, and About.',
    icon: IconSwipe,
  },
  {
    title: 'Add and Review',
    description: 'Add expenses on Home, switch months, monitor your budget, and see category breakdowns automatically.',
    icon: IconPlus,
  },
  {
    title: 'Search and Filter',
    description: 'Use Expenses to search, sort, filter by category or price, and spot active filters from the filter badge.',
    icon: IconFilter,
  },
  {
    title: 'Export and Import',
    description: 'Export visible expenses as JSON or PDF. Import JSON backups and choose whether to merge or replace.',
    icon: IconFileExport,
  },
  {
    title: 'Personalise Settings',
    description: 'Set income, budget, currency, and categories. Save changes when ready; if you leave with unsaved edits, ZarcZ will ask first.',
    icon: IconSettings,
  },
];

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible, onComplete }) => {
  const { colors } = useAppTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const step = STEPS[currentStep];
  const progressWidth = useMemo<DimensionValue>(
    () => `${((currentStep + 1) / STEPS.length) * 100}%`,
    [currentStep],
  );
  const StepIcon = step.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onComplete}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
          {/* Progress Bar */}
          <View style={[styles.progressContainer, { backgroundColor: colors.surfaceLight }]}>
            <View style={[styles.progressBar, { backgroundColor: colors.primary, width: progressWidth }]} />
          </View>

          <View style={styles.content}>
            <View style={[styles.iconCircle, { backgroundColor: colors.surfaceLight }]}>
              <StepIcon size={48} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
            <Text style={[styles.description, { color: colors.textMuted }]}>{step.description}</Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={onComplete}
              style={styles.skipBtn}
              accessibilityLabel="Skip guide"
              accessibilityRole="button"
            >
              <Text style={[styles.skipText, { color: colors.textDim }]}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleNext}
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              accessibilityLabel={currentStep === STEPS.length - 1 ? 'Finish guide' : 'Next step'}
              accessibilityRole="button"
            >
              <Text style={[styles.nextText, { color: colors.background }]}>
                {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              {currentStep === STEPS.length - 1 ? (
                <IconCheck size={20} color={colors.background} strokeWidth={2.5} style={{ marginLeft: 8 }} />
              ) : (
                <IconArrowRight size={20} color={colors.background} strokeWidth={2.5} style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  progressContainer: {
    height: 4,
    width: 100,
    borderRadius: 2,
    marginBottom: 40,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  content: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  skipBtn: {
    padding: 12,
  },
  skipText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  nextBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});

export default OnboardingModal;

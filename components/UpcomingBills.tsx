import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useApp } from '../context/AppContext';
import { TEXT, RADII, SCRIM_COLOR, GLASS } from '../constants/theme';
import { IconCheck, IconX } from '@tabler/icons-react-native';
import type { RecurringExpense } from '../utils/storage';
import { toLocalISODate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import Animated from 'react-native-reanimated';
import { listEntering } from '../constants/motion';
import PressableScale from './PressableScale';

const UpcomingBills: React.FC = () => {
  const { recurringExpenses, addExpense, editRecurringExpense, settings } = useApp();
  const currency = settings.currency;
  const { colors, isDark } = useAppTheme();
  const glass = isDark ? GLASS.dark : GLASS.light;

  const [payingBill, setPayingBill] = useState<RecurringExpense | null>(null);
  const [variableAmount, setVariableAmount] = useState('');

  // Filter bills due in next 14 days or overdue
  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in14Days = new Date(today);
    in14Days.setDate(in14Days.getDate() + 14);

    return recurringExpenses
      .filter((bill) => {
        const dueDate = new Date(bill.nextDueDate);
        return dueDate <= in14Days;
      })
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [recurringExpenses]);

  const handlePayClick = (bill: RecurringExpense) => {
    if (bill.isVariableAmount) {
      setPayingBill(bill);
      setVariableAmount('');
    } else {
      processPayment(bill, bill.amount);
    }
  };

  const processPayment = (bill: RecurringExpense, amount: number) => {
    // 1. Log the expense
    addExpense({
      description: bill.description,
      amount,
      category: bill.category,
      // (A9) Local calendar day — toISOString() converts to UTC first and can
      // file the payment under the wrong day east or west of Greenwich.
      date: toLocalISODate(new Date()),
    });

    // 2. Push next due date forward
    const currentDue = new Date(bill.nextDueDate);
    if (bill.frequency === 'monthly') {
      currentDue.setMonth(currentDue.getMonth() + 1);
    } else if (bill.frequency === 'weekly') {
      currentDue.setDate(currentDue.getDate() + 7);
    } else if (bill.frequency === 'yearly') {
      currentDue.setFullYear(currentDue.getFullYear() + 1);
    }
    
    editRecurringExpense({
      ...bill,
      nextDueDate: toLocalISODate(currentDue),
    });

    setPayingBill(null);
  };

  const submitVariablePayment = () => {
    const amt = parseFloat(variableAmount);
    if (isNaN(amt) || amt <= 0 || !payingBill) return;
    processPayment(payingBill, amt);
  };

  if (upcoming.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Upcoming bills</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {upcoming.map((bill, index) => {
          const isOverdue = new Date(bill.nextDueDate) < new Date(new Date().setHours(0,0,0,0));
          return (
            <Animated.View key={bill.id} entering={listEntering(index)} style={[styles.card, { 
              backgroundColor: glass.card, 
              borderColor: isOverdue ? colors.danger : glass.border,
              shadowColor: glass.shadow,
              elevation: 2 
            }]}>
              <View>
                <Text style={[styles.billName, { color: colors.text }]} numberOfLines={1}>{bill.description}</Text>
                <Text style={[styles.billAmount, { color: colors.text }]}>
                  {bill.isVariableAmount ? 'Variable' : formatCurrency(bill.amount, currency)}
                </Text>
                <Text style={[styles.billDate, { color: isOverdue ? colors.danger : colors.primary }]}>
                  {isOverdue ? 'Overdue: ' : 'Due: '}{bill.nextDueDate}
                </Text>
              </View>
              <PressableScale
                style={[styles.payBtn, { backgroundColor: colors.primary }]}
                onPress={() => handlePayClick(bill)}
              >
                <IconCheck size={16} color={colors.onPrimary} strokeWidth={3} />
                <Text style={[styles.payText, { color: colors.onPrimary }]}>Pay</Text>
              </PressableScale>
            </Animated.View>
          );
        })}
      </ScrollView>

      <Modal visible={!!payingBill} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={[styles.modalOverlay, { backgroundColor: SCRIM_COLOR }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Pay {payingBill?.description}</Text>
                <PressableScale onPress={() => setPayingBill(null)}>
                  <IconX size={24} color={colors.textDim} />
                </PressableScale>
              </View>
              <Text style={[styles.label, { color: colors.textMuted }]}>Enter Amount ({settings.currency})</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.text }]}
                value={variableAmount}
                onChangeText={setVariableAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textDim}
                keyboardType="decimal-pad"
                autoFocus
              />
              <PressableScale style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={submitVariablePayment}>
                <Text style={[styles.submitText, { color: colors.onPrimary }]}>Confirm Payment</Text>
              </PressableScale>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...TEXT.labelSm,
    marginLeft: 20,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    width: 160,
    padding: 16,
    borderRadius: RADII.md,
    borderWidth: 1,
    justifyContent: 'space-between',
    gap: 12,
  },
  billName: {
    ...TEXT.rowTitle,
    marginBottom: 4,
  },
  billAmount: {
    ...TEXT.money,
    marginBottom: 4,
  },
  billDate: {
    ...TEXT.caption,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: RADII.xs,
  },
  payText: {
    ...TEXT.buttonSm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: RADII.xl,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...TEXT.subheading,
  },
  label: {
    ...TEXT.labelSm,
    marginBottom: 8,
  },
  input: {
    borderRadius: RADII.sm,
    padding: 14,
    ...TEXT.moneyLg,
    marginBottom: 24,
  },
  submitBtn: {
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: RADII.sm,
    alignItems: 'center',
  },
  submitText: {
    ...TEXT.button,
  },
});

export default UpcomingBills;

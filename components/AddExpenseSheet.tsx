import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX';
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck';
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar';
import IconCoffee from '@tabler/icons-react-native/dist/esm/icons/IconCoffee';
import IconCar from '@tabler/icons-react-native/dist/esm/icons/IconCar';
import IconShoppingBag from '@tabler/icons-react-native/dist/esm/icons/IconShoppingBag';
import IconReceipt2 from '@tabler/icons-react-native/dist/esm/icons/IconReceipt2';
import IconMusic from '@tabler/icons-react-native/dist/esm/icons/IconMusic';
import IconHeartbeat from '@tabler/icons-react-native/dist/esm/icons/IconHeartbeat';
import IconDotsCircleHorizontal from '@tabler/icons-react-native/dist/esm/icons/IconDotsCircleHorizontal';
import IconCamera from '@tabler/icons-react-native/dist/esm/icons/IconCamera';
import IconTrash from '@tabler/icons-react-native/dist/esm/icons/IconTrash';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { useAppTheme } from '../hooks/useAppTheme';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, CATEGORY_COLORS } from '../constants/theme';

let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (e) {
    console.warn('Failed to load DateTimePicker', e);
  }
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.90;

function getCategoryIcon(category: string, size: number, color: string) {
  switch (category) {
    case 'Food':          return <IconCoffee size={size} color={color} strokeWidth={2} />;
    case 'Transport':     return <IconCar size={size} color={color} strokeWidth={2} />;
    case 'Shopping':      return <IconShoppingBag size={size} color={color} strokeWidth={2} />;
    case 'Bills':         return <IconReceipt2 size={size} color={color} strokeWidth={2} />;
    case 'Entertainment': return <IconMusic size={size} color={color} strokeWidth={2} />;
    case 'Health':        return <IconHeartbeat size={size} color={color} strokeWidth={2} />;
    default:              return <IconDotsCircleHorizontal size={size} color={color} strokeWidth={2} />;
  }
}

interface AddExpenseSheetProps {
  visible: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Net Banking'];

const AddExpenseSheet: React.FC<AddExpenseSheetProps> = ({ visible, onClose }) => {
  const { addExpense, settings } = useApp();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const categories = settings.categories.length > 0 ? settings.categories : [
    'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other',
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  const handleClose = useCallback(() => {
    setAmount('');
    setDescription('');
    setSelectedCategory('Food');
    setSelectedDate(new Date());
    setPaymentMethod('UPI');
    setIsRecurring(false);
    setIsSplit(false);
    setReceiptUri(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    if (!description.trim()) return;

    setIsSubmitting(true);
    await addExpense({
      description: description.trim(),
      amount: parsed,
      category: selectedCategory,
      date: selectedDate.toISOString(),
      paymentMethod,
      isRecurring,
      isSplit,
      receiptUri: receiptUri || undefined,
    });
    setIsSubmitting(false);
    handleClose();
  }, [amount, description, selectedCategory, selectedDate, paymentMethod, isRecurring, isSplit, receiptUri, addExpense, handleClose]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const formattedDate = selectedDate.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const canSubmit = !!amount && parseFloat(amount) > 0 && !!description.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontFamily: FONTS.bold }]}>
            Add Expense
          </Text>
          <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceLight }]}>
            <IconX size={18} color={colors.textMuted} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Amount Card */}
            <View style={[styles.amountCard, { backgroundColor: colors.surfaceLight }]}>
              <Text style={[styles.amountLabel, { color: colors.textMuted, fontFamily: FONTS.medium }]}>
                Amount
              </Text>
              <View style={styles.amountInputRow}>
                <Text style={[styles.currency, { color: colors.text }]}>{settings.currency}</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.text, fontFamily: FONTS.bold }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.textDim}
                  autoFocus
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.bold }]}>Description</Text>
              <TextInput
                style={[
                  styles.descriptionInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    fontFamily: FONTS.medium,
                  },
                ]}
                placeholder="What did you spend on?"
                placeholderTextColor={colors.textDim}
                value={description}
                onChangeText={setDescription}
                maxLength={60}
              />
            </View>

            {/* Category Grid */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.bold }]}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map(cat => {
                  const isSelected = selectedCategory === cat;
                  const catColor = CATEGORY_COLORS[cat] ?? '#94A3B8';
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      style={[
                        styles.categoryGridItem,
                        {
                          backgroundColor: isSelected ? catColor : colors.surfaceLight,
                          borderColor: isSelected ? catColor : colors.border,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      {getCategoryIcon(cat, 18, isSelected ? '#FFF' : catColor)}
                      <Text style={[
                        styles.categoryGridLabel,
                        { color: isSelected ? '#FFF' : colors.textMuted, fontFamily: FONTS.medium },
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Date & Payment */}
            <View style={styles.rowSection}>
              <View style={{ flex: 1, paddingRight: SPACING.sm }}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.bold }]}>Date</Text>
                
                {Platform.OS === 'web' ? (
                  <View style={[styles.datePickerBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border, paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden' }]}>
                    <IconCalendar size={18} color={colors.primary} style={{ marginLeft: SPACING.md }} />
                    {React.createElement('input', {
                      type: 'date',
                      value: selectedDate.toISOString().split('T')[0],
                      onChange: (e: any) => {
                        const d = new Date(e.target.value);
                        if (!isNaN(d.getTime())) {
                          setSelectedDate(d);
                        }
                      },
                      style: {
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        color: colors.text,
                        padding: '10px',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer',
                        colorScheme: isDark ? 'dark' : 'light',
                      }
                    })}
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.datePickerBtn,
                        { backgroundColor: colors.surfaceLight, borderColor: colors.border }
                      ]}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <IconCalendar size={18} color={colors.primary} />
                      <Text style={[styles.datePickerText, { color: colors.text, fontFamily: FONTS.medium }]}>
                        {formattedDate}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && DateTimePicker && (
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                      />
                    )}
                  </>
                )}
              </View>
              
              <View style={{ flex: 1, paddingLeft: SPACING.sm }}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.bold }]}>Payment</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {PAYMENT_METHODS.map(method => {
                    const isSel = paymentMethod === method;
                    return (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.chip,
                          { backgroundColor: isSel ? colors.primary : colors.surfaceLight }
                        ]}
                        onPress={() => setPaymentMethod(method)}
                      >
                        <Text style={[styles.chipText, { color: isSel ? '#FFF' : colors.textMuted }]}>{method}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Toggles */}
            <View style={styles.togglesContainer}>
              <View style={[styles.toggleRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <View>
                  <Text style={[styles.toggleLabel, { color: colors.text, fontFamily: FONTS.medium }]}>Recurring</Text>
                  <Text style={[styles.toggleSub, { color: colors.textMuted, fontFamily: FONTS.regular }]}>Repeat this expense</Text>
                </View>
                <Switch 
                  value={isRecurring} 
                  onValueChange={setIsRecurring}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={[styles.toggleLabel, { color: colors.text, fontFamily: FONTS.medium }]}>Split Expense</Text>
                  <Text style={[styles.toggleSub, { color: colors.textMuted, fontFamily: FONTS.regular }]}>Share with friends</Text>
                </View>
                <Switch 
                  value={isSplit} 
                  onValueChange={setIsSplit}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </View>

            {/* Receipt Attachment */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.bold }]}>Receipt</Text>
              {receiptUri ? (
                <View style={[styles.receiptPreviewContainer, { borderColor: colors.border }]}>
                  <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
                  <TouchableOpacity
                    style={[styles.receiptRemoveBtn, { backgroundColor: colors.surface }]}
                    onPress={() => setReceiptUri(null)}
                  >
                    <IconTrash size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.attachBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]} 
                  onPress={pickImage}
                >
                  <IconCamera size={24} color={colors.primary} />
                  <Text style={[styles.attachText, { color: colors.primary, fontFamily: FONTS.medium }]}>
                    Attach Receipt Image
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={{ height: SPACING.xxl + 80 }} />
          </ScrollView>

          {/* Submit Button */}
          <View style={[styles.footer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: canSubmit ? colors.primary : colors.surfaceLight,
                  ...SHADOWS.md,
                },
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              activeOpacity={0.8}
            >
              <IconCheck size={20} color={canSubmit ? '#FFF' : colors.textDim} strokeWidth={2.5} />
              <Text style={[
                styles.submitLabel,
                { color: canSubmit ? '#FFF' : colors.textDim, fontFamily: FONTS.bold },
              ]}>
                {isSubmitting ? 'Saving...' : 'Save Expense'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 24, 0.65)',
    zIndex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  amountCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currency: {
    fontSize: 32,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 40,
    letterSpacing: -1,
    minWidth: 100,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: SPACING.sm,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 15,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  categoryGridLabel: {
    fontSize: 13,
  },
  rowSection: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  datePickerText: {
    fontSize: 14,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
  },
  chipText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  togglesContainer: {
    marginBottom: SPACING.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  toggleLabel: {
    fontSize: 15,
  },
  toggleSub: {
    fontSize: 12,
    marginTop: 2,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  attachText: {
    fontSize: 15,
  },
  receiptPreviewContainer: {
    height: 120,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  receiptRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.xl,
  },
  submitLabel: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
});

export default AddExpenseSheet;

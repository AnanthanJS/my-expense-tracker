import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  receiptUri?: string;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number; // 0 if purely variable
  category: string;
  frequency: 'monthly' | 'weekly' | 'yearly';
  nextDueDate: string; // ISO date string YYYY-MM-DD
  isVariableAmount: boolean;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  income: string;
  budget: string;
  currency: string;
  /** Appearance override. 'system' follows the OS. */
  theme?: ThemePreference;
  hasSeenOnboarding: boolean;
  categories: string[]; // Dynamic categories
  categoryBudgets?: Record<string, number>;
  categorizationRules?: Record<string, string>;
}

export const defaultCategories = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Other',
];

export const defaultSettings: Settings = {
  income: '5000',
  budget: '2000',
  currency: '₹',
  theme: 'system',
  hasSeenOnboarding: false,
  categories: defaultCategories,
};

const EXPENSES_KEY = '@expenses_v1';
const SETTINGS_KEY = '@settings_v1';
const RECURRING_EXPENSES_KEY = '@recurring_expenses_v1';

export const loadExpenses = async (): Promise<Expense[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error loading expenses', e);
    return [];
  }
};

export const loadRecurringExpenses = async (): Promise<RecurringExpense[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(RECURRING_EXPENSES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error loading recurring expenses', e);
    return [];
  }
};

export const saveExpenses = async (expenses: Expense[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(expenses);
    await AsyncStorage.setItem(EXPENSES_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving expenses', e);
  }
};

export const saveRecurringExpenses = async (recurringExpenses: RecurringExpense[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(recurringExpenses);
    await AsyncStorage.setItem(RECURRING_EXPENSES_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving recurring expenses', e);
  }
};

export const loadSettings = async (): Promise<Settings> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    if (jsonValue == null) return defaultSettings;
    const settings = JSON.parse(jsonValue);
    // Ensure categories exists for legacy migrations
    return { 
      ...defaultSettings, 
      ...settings, 
      categories: settings.categories || defaultCategories 
    };
  } catch (e) {
    console.error('Error loading settings', e);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving settings', e);
  }
};

export const getMonthName = (date: Date): string => {
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

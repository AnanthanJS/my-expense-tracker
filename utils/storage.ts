import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface Settings {
  income: string;
  budget: string;
  currency: string;
  hasSeenOnboarding: boolean;
  categories: string[]; // Dynamic categories
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
  hasSeenOnboarding: false,
  categories: defaultCategories,
};

const EXPENSES_KEY = '@expenses_v1';
const SETTINGS_KEY = '@settings_v1';

export const loadExpenses = async (): Promise<Expense[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error loading expenses', e);
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

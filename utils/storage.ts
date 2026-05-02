import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPENSES_KEY = 'expenses';
const SETTINGS_KEY = 'settings';

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
}

export const defaultSettings: Settings = {
  income: '50000',
  budget: '20000',
  currency: '₹',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getMonthName = (date: Date) => {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

export const saveExpenses = async (expenses: Expense[]) => {
  try {
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Failed to save expenses', e);
  }
};

export const loadExpenses = async (): Promise<Expense[]> => {
  try {
    const data = await AsyncStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load expenses', e);
    return [];
  }
};

export const saveSettings = async (settings: Settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
};

export const loadSettings = async (): Promise<Settings> => {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : defaultSettings;
  } catch (e) {
    console.error('Failed to load settings', e);
    return defaultSettings;
  }
};

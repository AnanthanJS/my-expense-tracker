import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Frequency } from './recurrence';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  receiptUri?: string;
  /**
   * The recurring rule this expense created, if it was saved with "Repeat this
   * expense" on. Lets the editor reopen the rule rather than making a second
   * one. Absent on every expense saved before that toggle existed.
   */
  recurringId?: string;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number; // 0 if purely variable
  category: string;
  frequency: Frequency;
  nextDueDate: string; // ISO date string YYYY-MM-DD
  isVariableAmount: boolean;
  /**
   * The expense this rule was copied from. PROVENANCE ONLY — there is no live
   * link. Editing or deleting that expense must never change this rule, and
   * nothing in the app may read through this id to fetch the original. It
   * exists so we can say where a bill came from, nothing more.
   */
  sourceExpenseId?: string;
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
  /** Category -> group name, for the Categories & budgets screen. */
  categoryGroups?: Record<string, string>;
  /** ISO timestamp of the last successful backup, for the About screen. */
  lastBackupAt?: string;
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
const SCHEMA_VERSION_KEY = '@schema_version';

/**
 * Current shape of everything under the keys above.
 *
 * 1 — the original records.
 * 2 — Expense.recurringId and RecurringExpense.sourceExpenseId, both optional.
 *
 * The keys themselves stay on their _v1 names deliberately: renaming them
 * would orphan every existing install's data. The version is tracked
 * separately so a migration can be told apart from a first run.
 */
export const SCHEMA_VERSION = 2;

/**
 * Brings a stored record up to the current shape.
 *
 * Version 2 only added optional fields, so there is nothing to backfill —
 * `recurringId` and `sourceExpenseId` are simply absent on older records,
 * which is exactly what `undefined` means everywhere they are read. The
 * normalisers below therefore pass records through untouched; they exist so
 * that the next migration has somewhere to go, and so a record that is missing
 * a required field cannot take the whole list down with it.
 */
const normalizeStoredExpense = (value: Expense): Expense => value;
const normalizeStoredRecurring = (value: RecurringExpense): RecurringExpense => value;

/** Records the version once the data has been read successfully. */
const stampSchemaVersion = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(SCHEMA_VERSION_KEY);
    if (stored !== String(SCHEMA_VERSION)) {
      await AsyncStorage.setItem(SCHEMA_VERSION_KEY, String(SCHEMA_VERSION));
    }
  } catch {
    // A version stamp that fails to write costs nothing: the migration is a
    // no-op either way, and it will be retried on the next launch.
  }
};

export const loadExpenses = async (): Promise<Expense[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY);
    if (jsonValue == null) return [];
    const parsed = JSON.parse(jsonValue) as Expense[];
    if (!Array.isArray(parsed)) return [];
    void stampSchemaVersion();
    return parsed.map(normalizeStoredExpense);
  } catch (e) {
    console.error('Error loading expenses', e);
    return [];
  }
};

export const loadRecurringExpenses = async (): Promise<RecurringExpense[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(RECURRING_EXPENSES_KEY);
    if (jsonValue == null) return [];
    const parsed = JSON.parse(jsonValue) as RecurringExpense[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeStoredRecurring);
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

/**
 * Removes every key this app owns. Used by "Erase all data", which is a
 * factory reset rather than a data-only clear — a wipe that kept your budget
 * and categories would not be the promise the button makes.
 */
export const clearAllData = async (): Promise<void> => {
  await AsyncStorage.multiRemove([EXPENSES_KEY, SETTINGS_KEY, RECURRING_EXPENSES_KEY, SCHEMA_VERSION_KEY]);
};

export const getMonthName = (date: Date): string => {
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

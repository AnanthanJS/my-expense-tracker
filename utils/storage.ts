import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Existing Types ────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string; // ISO date string
  paymentMethod?: string;
  isRecurring?: boolean;
  isSplit?: boolean;
  receiptUri?: string;
}

export interface Settings {
  income: string;
  budget: string;
  currency: string;
  hasSeenOnboarding: boolean;
  categories: string[];
  userName: string;
  isDarkMode: 'auto' | 'light' | 'dark';
}

// ─── New Types ─────────────────────────────────────────────────────────────────

export interface BudgetGoal {
  id: string;
  category: string;
  limit: number;
  period: 'monthly' | 'weekly';
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string; // ISO date string
  color: string;
  icon: string;
}

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDue: string; // ISO date string
  autoPay: boolean;
  color: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1-31, day of month
  category: string;
  autoPay: boolean;
  reminder: boolean;
  color: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  notes: string;
}

export interface AppNotification {
  id: string;
  type: 'transaction' | 'budget_warning' | 'bill_due' | 'savings' | 'info';
  title: string;
  body: string;
  timestamp: string; // ISO date string
  read: boolean;
}

// ─── Default Data ──────────────────────────────────────────────────────────────

export const defaultCategories = [
  'Food', 'Transport', 'Shopping', 'Bills',
  'Entertainment', 'Health', 'Other',
];

export const defaultSettings: Settings = {
  income: '5000',
  budget: '2000',
  currency: '₹',
  hasSeenOnboarding: false,
  categories: defaultCategories,
  userName: '',
  isDarkMode: 'auto',
};

export const defaultBudgetGoals: BudgetGoal[] = [
  { id: 'bg-1', category: 'Food', limit: 500, period: 'monthly' },
  { id: 'bg-2', category: 'Transport', limit: 200, period: 'monthly' },
  { id: 'bg-3', category: 'Entertainment', limit: 150, period: 'monthly' },
];

export const defaultSavingsGoals: SavingsGoal[] = [
  {
    id: 'sg-1',
    name: 'Emergency Fund',
    target: 50000,
    current: 12000,
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
    color: '#7C3AED',
    icon: 'shield',
  },
  {
    id: 'sg-2',
    name: 'Vacation',
    target: 20000,
    current: 8500,
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
    color: '#EC4899',
    icon: 'plane',
  },
];

export const defaultRecurringPayments: RecurringPayment[] = [
  {
    id: 'rp-1',
    name: 'Netflix',
    amount: 649,
    category: 'Entertainment',
    frequency: 'monthly',
    nextDue: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    autoPay: true,
    color: '#EF4444',
  },
  {
    id: 'rp-2',
    name: 'Spotify',
    amount: 119,
    category: 'Entertainment',
    frequency: 'monthly',
    nextDue: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString(),
    autoPay: true,
    color: '#22C55E',
  },
  {
    id: 'rp-3',
    name: 'Gym Membership',
    amount: 999,
    category: 'Health',
    frequency: 'monthly',
    nextDue: new Date(new Date().setDate(new Date().getDate() + 18)).toISOString(),
    autoPay: false,
    color: '#3B82F6',
  },
];

export const defaultBills: Bill[] = [
  {
    id: 'b-1',
    name: 'Electricity Bill',
    amount: 1200,
    dueDay: 10,
    category: 'Utilities',
    autoPay: false,
    reminder: true,
    color: '#F59E0B',
    frequency: 'monthly',
    notes: 'BESCOM monthly electricity bill',
  },
  {
    id: 'b-2',
    name: 'Internet',
    amount: 899,
    dueDay: 15,
    category: 'Bills',
    autoPay: true,
    reminder: false,
    color: '#3B82F6',
    frequency: 'monthly',
    notes: 'ACT Fibernet 300 Mbps plan',
  },
  {
    id: 'b-3',
    name: 'Rent',
    amount: 15000,
    dueDay: 1,
    category: 'Rent',
    autoPay: false,
    reminder: true,
    color: '#A78BFA',
    frequency: 'monthly',
    notes: '',
  },
];

// ─── Storage Keys ──────────────────────────────────────────────────────────────

const EXPENSES_KEY = '@expenses_v1';
const SETTINGS_KEY = '@settings_v1';
const BUDGET_GOALS_KEY = '@budget_goals_v1';
const SAVINGS_GOALS_KEY = '@savings_goals_v1';
const RECURRING_PAYMENTS_KEY = '@recurring_payments_v1';
const BILLS_KEY = '@bills_v1';
const NOTIFICATIONS_KEY = '@notifications_v1';

// ─── Generic Storage Helpers ───────────────────────────────────────────────────

async function loadData<T>(key: string, fallback: T): Promise<T> {
  try {
    const json = await AsyncStorage.getItem(key);
    return json != null ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
}

async function saveData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const loadExpenses = (): Promise<Expense[]> => loadData(EXPENSES_KEY, []);
export const saveExpenses = (expenses: Expense[]): Promise<void> => saveData(EXPENSES_KEY, expenses);

// ─── Settings ─────────────────────────────────────────────────────────────────

export const loadSettings = async (): Promise<Settings> => {
  const settings = await loadData<Partial<Settings>>(SETTINGS_KEY, {});
  return {
    ...defaultSettings,
    ...settings,
    categories: (settings as Settings).categories || defaultCategories,
  };
};
export const saveSettings = (settings: Settings): Promise<void> => saveData(SETTINGS_KEY, settings);

// ─── Budget Goals ─────────────────────────────────────────────────────────────

export const loadBudgetGoals = (): Promise<BudgetGoal[]> => loadData(BUDGET_GOALS_KEY, defaultBudgetGoals);
export const saveBudgetGoals = (goals: BudgetGoal[]): Promise<void> => saveData(BUDGET_GOALS_KEY, goals);

// ─── Savings Goals ────────────────────────────────────────────────────────────

export const loadSavingsGoals = (): Promise<SavingsGoal[]> => loadData(SAVINGS_GOALS_KEY, defaultSavingsGoals);
export const saveSavingsGoals = (goals: SavingsGoal[]): Promise<void> => saveData(SAVINGS_GOALS_KEY, goals);

// ─── Recurring Payments ───────────────────────────────────────────────────────

export const loadRecurringPayments = (): Promise<RecurringPayment[]> => loadData(RECURRING_PAYMENTS_KEY, defaultRecurringPayments);
export const saveRecurringPayments = (payments: RecurringPayment[]): Promise<void> => saveData(RECURRING_PAYMENTS_KEY, payments);

// ─── Bills ────────────────────────────────────────────────────────────────────

export const loadBills = (): Promise<Bill[]> => loadData(BILLS_KEY, defaultBills);
export const saveBills = (bills: Bill[]): Promise<void> => saveData(BILLS_KEY, bills);

// ─── Notifications ────────────────────────────────────────────────────────────

export const loadNotifications = (): Promise<AppNotification[]> => loadData(NOTIFICATIONS_KEY, []);
export const saveNotifications = (notifications: AppNotification[]): Promise<void> => saveData(NOTIFICATIONS_KEY, notifications);

// ─── Utilities ────────────────────────────────────────────────────────────────

export const getMonthName = (date: Date): string =>
  date.toLocaleString('default', { month: 'long', year: 'numeric' });

export const formatCurrency = (amount: number, currency: string): string =>
  `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const getDaysUntilDue = (nextDue: string): number => {
  const due = new Date(nextDue);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

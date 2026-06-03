import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  defaultSettings,
  loadExpenses, saveExpenses,
  loadSettings, saveSettings,
  loadBudgetGoals, saveBudgetGoals,
  loadSavingsGoals, saveSavingsGoals,
  loadRecurringPayments, saveRecurringPayments,
  loadBills, saveBills,
  loadNotifications, saveNotifications,
} from '../utils/storage';
import type {
  Expense, Settings,
  BudgetGoal, SavingsGoal, RecurringPayment, Bill, AppNotification,
} from '../utils/storage';

// ─── State Shape ───────────────────────────────────────────────────────────────

interface AppState {
  expenses: Expense[];
  settings: Settings;
  selectedDate: Date;
  isLoading: boolean;
  feedback: { message: string; visible: boolean; type: 'success' | 'error' };
  budgetGoals: BudgetGoal[];
  savingsGoals: SavingsGoal[];
  recurringPayments: RecurringPayment[];
  bills: Bill[];
  notifications: AppNotification[];
}

// ─── Actions ───────────────────────────────────────────────────────────────────

type AppAction =
  | { type: 'SET_INITIAL_DATA'; expenses: Expense[]; settings: Settings; budgetGoals: BudgetGoal[]; savingsGoals: SavingsGoal[]; recurringPayments: RecurringPayment[]; bills: Bill[]; notifications: AppNotification[] }
  | { type: 'SET_SELECTED_DATE'; date: Date }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'DELETE_EXPENSE'; id: string }
  | { type: 'IMPORT_EXPENSES'; expenses: Expense[]; mode: 'merge' | 'replace' }
  | { type: 'UPDATE_SETTINGS'; settings: Settings }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SHOW_FEEDBACK'; message: string; feedbackType: 'success' | 'error' }
  | { type: 'HIDE_FEEDBACK' }
  | { type: 'COMPLETE_ONBOARDING' }
  // Budget Goals
  | { type: 'ADD_BUDGET_GOAL'; goal: BudgetGoal }
  | { type: 'UPDATE_BUDGET_GOAL'; goal: BudgetGoal }
  | { type: 'DELETE_BUDGET_GOAL'; id: string }
  // Savings Goals
  | { type: 'ADD_SAVINGS_GOAL'; goal: SavingsGoal }
  | { type: 'UPDATE_SAVINGS_GOAL'; goal: SavingsGoal }
  | { type: 'DELETE_SAVINGS_GOAL'; id: string }
  | { type: 'CONTRIBUTE_SAVINGS'; id: string; amount: number }
  // Recurring Payments
  | { type: 'ADD_RECURRING'; payment: RecurringPayment }
  | { type: 'UPDATE_RECURRING'; payment: RecurringPayment }
  | { type: 'DELETE_RECURRING'; id: string }
  | { type: 'TOGGLE_RECURRING_AUTOPAY'; id: string }
  // Bills
  | { type: 'ADD_BILL'; bill: Bill }
  | { type: 'UPDATE_BILL'; bill: Bill }
  | { type: 'DELETE_BILL'; id: string }
  | { type: 'TOGGLE_BILL_AUTOPAY'; id: string }
  | { type: 'TOGGLE_BILL_REMINDER'; id: string }
  // Notifications
  | { type: 'ADD_NOTIFICATION'; notification: AppNotification }
  | { type: 'MARK_NOTIFICATION_READ'; id: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'DELETE_NOTIFICATION'; id: string }
  | { type: 'CLEAR_NOTIFICATIONS' };

// ─── Reducer ───────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return {
        ...state,
        expenses: action.expenses,
        settings: action.settings,
        budgetGoals: action.budgetGoals,
        savingsGoals: action.savingsGoals,
        recurringPayments: action.recurringPayments,
        bills: action.bills,
        notifications: action.notifications,
        isLoading: false,
      };

    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.date };

    case 'ADD_EXPENSE': {
      const updated = [action.expense, ...state.expenses];
      saveExpenses(updated);
      return { ...state, expenses: updated };
    }
    case 'DELETE_EXPENSE': {
      const updated = state.expenses.filter(e => e.id !== action.id);
      saveExpenses(updated);
      return { ...state, expenses: updated };
    }
    case 'IMPORT_EXPENSES': {
      const seenIds = new Set<string>();
      const normalize = (arr: Expense[]) => arr.map((e, i) => {
        const id = e.id && !seenIds.has(e.id) ? e.id : `${Date.now()}-${i}`;
        seenIds.add(id);
        return { ...e, id };
      });
      const updated = action.mode === 'replace'
        ? normalize(action.expenses)
        : normalize([...action.expenses, ...state.expenses]);
      saveExpenses(updated);
      return { ...state, expenses: updated };
    }
    case 'UPDATE_SETTINGS': {
      saveSettings(action.settings);
      return { ...state, settings: action.settings };
    }
    case 'COMPLETE_ONBOARDING': {
      const s = { ...state.settings, hasSeenOnboarding: true };
      saveSettings(s);
      return { ...state, settings: s };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SHOW_FEEDBACK':
      return { ...state, feedback: { message: action.message, visible: true, type: action.feedbackType } };
    case 'HIDE_FEEDBACK':
      return { ...state, feedback: { ...state.feedback, visible: false } };

    // ── Budget Goals ──
    case 'ADD_BUDGET_GOAL': {
      const updated = [...state.budgetGoals, action.goal];
      saveBudgetGoals(updated);
      return { ...state, budgetGoals: updated };
    }
    case 'UPDATE_BUDGET_GOAL': {
      const updated = state.budgetGoals.map(g => g.id === action.goal.id ? action.goal : g);
      saveBudgetGoals(updated);
      return { ...state, budgetGoals: updated };
    }
    case 'DELETE_BUDGET_GOAL': {
      const updated = state.budgetGoals.filter(g => g.id !== action.id);
      saveBudgetGoals(updated);
      return { ...state, budgetGoals: updated };
    }

    // ── Savings Goals ──
    case 'ADD_SAVINGS_GOAL': {
      const updated = [...state.savingsGoals, action.goal];
      saveSavingsGoals(updated);
      return { ...state, savingsGoals: updated };
    }
    case 'UPDATE_SAVINGS_GOAL': {
      const updated = state.savingsGoals.map(g => g.id === action.goal.id ? action.goal : g);
      saveSavingsGoals(updated);
      return { ...state, savingsGoals: updated };
    }
    case 'DELETE_SAVINGS_GOAL': {
      const updated = state.savingsGoals.filter(g => g.id !== action.id);
      saveSavingsGoals(updated);
      return { ...state, savingsGoals: updated };
    }
    case 'CONTRIBUTE_SAVINGS': {
      const updated = state.savingsGoals.map(g =>
        g.id === action.id
          ? { ...g, current: Math.min(g.current + action.amount, g.target) }
          : g
      );
      saveSavingsGoals(updated);
      return { ...state, savingsGoals: updated };
    }

    // ── Recurring ──
    case 'ADD_RECURRING': {
      const updated = [...state.recurringPayments, action.payment];
      saveRecurringPayments(updated);
      return { ...state, recurringPayments: updated };
    }
    case 'UPDATE_RECURRING': {
      const updated = state.recurringPayments.map(p => p.id === action.payment.id ? action.payment : p);
      saveRecurringPayments(updated);
      return { ...state, recurringPayments: updated };
    }
    case 'DELETE_RECURRING': {
      const updated = state.recurringPayments.filter(p => p.id !== action.id);
      saveRecurringPayments(updated);
      return { ...state, recurringPayments: updated };
    }
    case 'TOGGLE_RECURRING_AUTOPAY': {
      const updated = state.recurringPayments.map(p =>
        p.id === action.id ? { ...p, autoPay: !p.autoPay } : p
      );
      saveRecurringPayments(updated);
      return { ...state, recurringPayments: updated };
    }

    // ── Bills ──
    case 'ADD_BILL': {
      const updated = [...state.bills, action.bill];
      saveBills(updated);
      return { ...state, bills: updated };
    }
    case 'UPDATE_BILL': {
      const updated = state.bills.map(b => b.id === action.bill.id ? action.bill : b);
      saveBills(updated);
      return { ...state, bills: updated };
    }
    case 'DELETE_BILL': {
      const updated = state.bills.filter(b => b.id !== action.id);
      saveBills(updated);
      return { ...state, bills: updated };
    }
    case 'TOGGLE_BILL_AUTOPAY': {
      const updated = state.bills.map(b => b.id === action.id ? { ...b, autoPay: !b.autoPay } : b);
      saveBills(updated);
      return { ...state, bills: updated };
    }
    case 'TOGGLE_BILL_REMINDER': {
      const updated = state.bills.map(b => b.id === action.id ? { ...b, reminder: !b.reminder } : b);
      saveBills(updated);
      return { ...state, bills: updated };
    }

    // ── Notifications ──
    case 'ADD_NOTIFICATION': {
      const updated = [action.notification, ...state.notifications].slice(0, 50);
      saveNotifications(updated);
      return { ...state, notifications: updated };
    }
    case 'MARK_NOTIFICATION_READ': {
      const updated = state.notifications.map(n => n.id === action.id ? { ...n, read: true } : n);
      saveNotifications(updated);
      return { ...state, notifications: updated };
    }
    case 'MARK_ALL_NOTIFICATIONS_READ': {
      const updated = state.notifications.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return { ...state, notifications: updated };
    }
    case 'DELETE_NOTIFICATION': {
      const updated = state.notifications.filter(n => n.id !== action.id);
      saveNotifications(updated);
      return { ...state, notifications: updated };
    }
    case 'CLEAR_NOTIFICATIONS': {
      saveNotifications([]);
      return { ...state, notifications: [] };
    }

    default:
      return state;
  }
}

// ─── Context Interface ─────────────────────────────────────────────────────────

interface AppContextType extends AppState {
  setSelectedDate: (date: Date) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  importExpenses: (expenses: Expense[], mode: 'merge' | 'replace') => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  showFeedback: (message: string, type?: 'success' | 'error') => void;
  hideFeedback: () => void;
  completeOnboarding: () => void;
  // Budget Goals
  addBudgetGoal: (goal: Omit<BudgetGoal, 'id'>) => void;
  updateBudgetGoal: (goal: BudgetGoal) => void;
  deleteBudgetGoal: (id: string) => void;
  // Savings Goals
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateSavingsGoal: (goal: SavingsGoal) => void;
  deleteSavingsGoal: (id: string) => void;
  contributeSavings: (id: string, amount: number) => void;
  // Recurring Payments
  addRecurringPayment: (payment: Omit<RecurringPayment, 'id'>) => void;
  updateRecurringPayment: (payment: RecurringPayment) => void;
  deleteRecurringPayment: (id: string) => void;
  toggleRecurringAutoPay: (id: string) => void;
  // Bills
  addBill: (bill: Omit<Bill, 'id'>) => void;
  updateBill: (bill: Bill) => void;
  deleteBill: (id: string) => void;
  toggleBillAutoPay: (id: string) => void;
  toggleBillReminder: (id: string) => void;
  // Notifications
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  expenses: [],
  settings: defaultSettings,
  selectedDate: new Date(),
  isLoading: true,
  feedback: { message: '', visible: false, type: 'success' },
  budgetGoals: [],
  savingsGoals: [],
  recurringPayments: [],
  bills: [],
  notifications: [],
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    async function prepare() {
      try {
        const [
          loadedExpenses, loadedSettings, loadedBudgetGoals,
          loadedSavingsGoals, loadedRecurringPayments, loadedBills, loadedNotifications,
        ] = await Promise.all([
          loadExpenses(), loadSettings(), loadBudgetGoals(),
          loadSavingsGoals(), loadRecurringPayments(), loadBills(), loadNotifications(),
        ]);
        dispatch({
          type: 'SET_INITIAL_DATA',
          expenses: loadedExpenses,
          settings: loadedSettings,
          budgetGoals: loadedBudgetGoals,
          savingsGoals: loadedSavingsGoals,
          recurringPayments: loadedRecurringPayments,
          bills: loadedBills,
          notifications: loadedNotifications,
        });
      } catch (e) {
        console.warn('Failed to load data', e);
        dispatch({ type: 'SHOW_FEEDBACK', message: 'Failed to load your data.', feedbackType: 'error' });
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    }
    prepare();
  }, []);

  const showFeedback = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    dispatch({ type: 'SHOW_FEEDBACK', message, feedbackType: type });
  }, []);

  const hideFeedback = useCallback(() => dispatch({ type: 'HIDE_FEEDBACK' }), []);
  const setSelectedDate = useCallback((date: Date) => dispatch({ type: 'SET_SELECTED_DATE', date }), []);

  const addExpense = useCallback(async (newExp: Omit<Expense, 'id'>) => {
    try {
      const expense: Expense = { ...newExp, id: Date.now().toString() };
      dispatch({ type: 'ADD_EXPENSE', expense });
      dispatch({
        type: 'ADD_NOTIFICATION',
        notification: {
          id: Date.now().toString() + '-notif',
          timestamp: new Date().toISOString(),
          read: false,
          type: 'transaction',
          title: 'Expense Added',
          body: `${newExp.description} — ${newExp.amount} added to ${newExp.category}`,
        },
      });
      showFeedback('Expense added successfully!');
    } catch {
      showFeedback('Failed to add expense.', 'error');
    }
  }, [showFeedback]);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'DELETE_EXPENSE', id });
      showFeedback('Expense deleted.');
    } catch {
      showFeedback('Failed to delete expense.', 'error');
    }
  }, [showFeedback]);

  const importExpenses = useCallback(async (expenses: Expense[], mode: 'merge' | 'replace') => {
    try {
      dispatch({ type: 'IMPORT_EXPENSES', expenses, mode });
      showFeedback(`${expenses.length} expense${expenses.length === 1 ? '' : 's'} imported.`);
    } catch {
      showFeedback('Failed to import expenses.', 'error');
    }
  }, [showFeedback]);

  const updateSettings = useCallback(async (newSettings: typeof defaultSettings) => {
    try {
      dispatch({ type: 'UPDATE_SETTINGS', settings: newSettings });
      showFeedback('Settings saved!');
    } catch {
      showFeedback('Failed to save settings.', 'error');
    }
  }, [showFeedback]);

  const completeOnboarding = useCallback(() => dispatch({ type: 'COMPLETE_ONBOARDING' }), []);

  // Budget Goals
  const addBudgetGoal = useCallback((goal: Omit<BudgetGoal, 'id'>) => {
    dispatch({ type: 'ADD_BUDGET_GOAL', goal: { ...goal, id: `bg-${Date.now()}` } });
    showFeedback('Budget goal added!');
  }, [showFeedback]);

  const updateBudgetGoal = useCallback((goal: BudgetGoal) => {
    dispatch({ type: 'UPDATE_BUDGET_GOAL', goal });
    showFeedback('Budget goal updated!');
  }, [showFeedback]);

  const deleteBudgetGoal = useCallback((id: string) => {
    dispatch({ type: 'DELETE_BUDGET_GOAL', id });
    showFeedback('Budget goal removed.');
  }, [showFeedback]);

  // Savings Goals
  const addSavingsGoal = useCallback((goal: Omit<SavingsGoal, 'id'>) => {
    dispatch({ type: 'ADD_SAVINGS_GOAL', goal: { ...goal, id: `sg-${Date.now()}` } });
    showFeedback('Savings goal created!');
  }, [showFeedback]);

  const updateSavingsGoal = useCallback((goal: SavingsGoal) => {
    dispatch({ type: 'UPDATE_SAVINGS_GOAL', goal });
    showFeedback('Savings goal updated!');
  }, [showFeedback]);

  const deleteSavingsGoal = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SAVINGS_GOAL', id });
    showFeedback('Savings goal removed.');
  }, [showFeedback]);

  const contributeSavings = useCallback((id: string, amount: number) => {
    dispatch({ type: 'CONTRIBUTE_SAVINGS', id, amount });
    showFeedback(`₹${amount} added to savings!`);
  }, [showFeedback]);

  // Recurring
  const addRecurringPayment = useCallback((payment: Omit<RecurringPayment, 'id'>) => {
    dispatch({ type: 'ADD_RECURRING', payment: { ...payment, id: `rp-${Date.now()}` } });
    showFeedback('Recurring payment added!');
  }, [showFeedback]);

  const updateRecurringPayment = useCallback((payment: RecurringPayment) => {
    dispatch({ type: 'UPDATE_RECURRING', payment });
    showFeedback('Payment updated!');
  }, [showFeedback]);

  const deleteRecurringPayment = useCallback((id: string) => {
    dispatch({ type: 'DELETE_RECURRING', id });
    showFeedback('Payment removed.');
  }, [showFeedback]);

  const toggleRecurringAutoPay = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_RECURRING_AUTOPAY', id });
  }, []);

  // Bills
  const addBill = useCallback((bill: Omit<Bill, 'id'>) => {
    dispatch({ type: 'ADD_BILL', bill: { ...bill, id: `b-${Date.now()}` } });
    showFeedback('Bill added!');
  }, [showFeedback]);

  const updateBill = useCallback((bill: Bill) => {
    dispatch({ type: 'UPDATE_BILL', bill });
    showFeedback('Bill updated!');
  }, [showFeedback]);

  const deleteBill = useCallback((id: string) => {
    dispatch({ type: 'DELETE_BILL', id });
    showFeedback('Bill removed.');
  }, [showFeedback]);

  const toggleBillAutoPay = useCallback((id: string) => dispatch({ type: 'TOGGLE_BILL_AUTOPAY', id }), []);
  const toggleBillReminder = useCallback((id: string) => dispatch({ type: 'TOGGLE_BILL_REMINDER', id }), []);

  // Notifications
  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        ...notif,
        id: `n-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
      },
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => dispatch({ type: 'MARK_NOTIFICATION_READ', id }), []);
  const markAllNotificationsRead = useCallback(() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' }), []);
  const deleteNotification = useCallback((id: string) => dispatch({ type: 'DELETE_NOTIFICATION', id }), []);
  const clearNotifications = useCallback(() => dispatch({ type: 'CLEAR_NOTIFICATIONS' }), []);

  const unreadCount = state.notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      ...state,
      setSelectedDate,
      addExpense, deleteExpense, importExpenses,
      updateSettings, showFeedback, hideFeedback, completeOnboarding,
      addBudgetGoal, updateBudgetGoal, deleteBudgetGoal,
      addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, contributeSavings,
      addRecurringPayment, updateRecurringPayment, deleteRecurringPayment, toggleRecurringAutoPay,
      addBill, updateBill, deleteBill, toggleBillAutoPay, toggleBillReminder,
      addNotification, markNotificationRead, markAllNotificationsRead,
      deleteNotification, clearNotifications,
      unreadCount,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

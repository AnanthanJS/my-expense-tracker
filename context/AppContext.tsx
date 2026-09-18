import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { 
  defaultSettings, 
  loadExpenses, 
  saveExpenses, 
  loadSettings, 
  saveSettings,
  loadRecurringExpenses,
  saveRecurringExpenses,
  clearAllData
} from '../utils/storage';
import type { Expense, Settings, RecurringExpense } from '../utils/storage';

/**
 * Tone of a feedback message, mapped straight onto a toast variant.
 * `destructive` is the one worth calling out: a delete succeeded, so it is not
 * an error, but confirming it with a green tick reads wrong.
 */
export type FeedbackTone = 'success' | 'warning' | 'destructive' | 'error';

// 1. Define State Shape
interface AppState {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  settings: Settings;
  selectedDate: Date;
  isLoading: boolean;
  feedback: {
    message: string;
    visible: boolean;
    type: FeedbackTone;
    /**
     * (C4) Optional undo handler. Deleting is now optimistic with an Undo in
     * the toast instead of an up-front Alert: the common case (a delete the
     * user meant) costs no taps, and the rare case stays recoverable — which a
     * confirm dialog never made it, once confirmed.
     */
    onUndo?: () => void;
  };
}

// 2. Define Action Types
type AppAction =
  | { type: 'SET_INITIAL_DATA'; expenses: Expense[]; settings: Settings; recurringExpenses: RecurringExpense[] }
  | { type: 'SET_SELECTED_DATE'; date: Date }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'EDIT_EXPENSE'; expense: Expense }
  | { type: 'RECATEGORISE_EXPENSES'; from: string; to: string }
  | { type: 'DELETE_EXPENSE'; id: string }
  | { type: 'RESTORE_EXPENSE'; expense: Expense }
  | { type: 'RESTORE_RECURRING_EXPENSE'; recurringExpense: RecurringExpense }
  | { type: 'ADD_RECURRING_EXPENSE'; recurringExpense: RecurringExpense }
  | { type: 'EDIT_RECURRING_EXPENSE'; recurringExpense: RecurringExpense }
  | { type: 'DELETE_RECURRING_EXPENSE'; id: string }
  | { type: 'IMPORT_EXPENSES'; expenses: Expense[]; recurringExpenses?: RecurringExpense[]; mode: 'merge' | 'replace' }
  | { type: 'UPDATE_SETTINGS'; settings: Settings }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SHOW_FEEDBACK'; message: string; feedbackType: FeedbackTone; onUndo?: () => void }
  | { type: 'HIDE_FEEDBACK' }
  | { type: 'ERASE_ALL' }
  | { type: 'COMPLETE_ONBOARDING' };

// 3. Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return { ...state, expenses: action.expenses, recurringExpenses: action.recurringExpenses, settings: action.settings, isLoading: false };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.date };
    case 'ADD_EXPENSE': {
      const updatedExpenses = [action.expense, ...state.expenses];
      saveExpenses(updatedExpenses);
      return { ...state, expenses: updatedExpenses };
    }
    /**
     * Moves every expense filed under one category to another. Used when a
     * category is renamed or deleted — without it those expenses keep a label
     * that no longer exists, and silently vanish from the category breakdown.
     */
    case 'RECATEGORISE_EXPENSES': {
      if (action.from === action.to) return state;
      const updatedExpenses = state.expenses.map((e) =>
        e.category === action.from ? { ...e, category: action.to } : e,
      );
      saveExpenses(updatedExpenses);
      return { ...state, expenses: updatedExpenses };
    }
    case 'EDIT_EXPENSE': {
      const updatedExpenses = state.expenses
        .map((e) => (e.id === action.expense.id ? action.expense : e))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      saveExpenses(updatedExpenses);
      return { ...state, expenses: updatedExpenses };
    }
    case 'DELETE_EXPENSE': {
      const updatedExpenses = state.expenses.filter((e) => e.id !== action.id);
      saveExpenses(updatedExpenses);
      return { ...state, expenses: updatedExpenses };
    }
    case 'ADD_RECURRING_EXPENSE': {
      const updated = [...state.recurringExpenses, action.recurringExpense];
      saveRecurringExpenses(updated);
      return { ...state, recurringExpenses: updated };
    }
    case 'EDIT_RECURRING_EXPENSE': {
      const updated = state.recurringExpenses.map(e => e.id === action.recurringExpense.id ? action.recurringExpense : e);
      saveRecurringExpenses(updated);
      return { ...state, recurringExpenses: updated };
    }
    case 'RESTORE_EXPENSE': {
      const updated = [action.expense, ...state.expenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      saveExpenses(updated);
      return { ...state, expenses: updated };
    }
    case 'RESTORE_RECURRING_EXPENSE': {
      const updated = [...state.recurringExpenses, action.recurringExpense];
      saveRecurringExpenses(updated);
      return { ...state, recurringExpenses: updated };
    }
    case 'DELETE_RECURRING_EXPENSE': {
      const updated = state.recurringExpenses.filter((e) => e.id !== action.id);
      saveRecurringExpenses(updated);
      return { ...state, recurringExpenses: updated };
    }
    case 'IMPORT_EXPENSES': {
      const seenIds = new Set<string>();
      const normalizeIds = <T extends { id: string }>(items: T[]) => items.map((item, index) => {
        const nextId = item.id && !seenIds.has(item.id)
          ? item.id
          : `${Date.now()}-${index}`;
        seenIds.add(nextId);
        return { ...item, id: nextId };
      });

      const updatedExpenses = action.mode === 'replace'
        ? normalizeIds(action.expenses)
        : normalizeIds([...action.expenses, ...state.expenses]);
      saveExpenses(updatedExpenses);

      let updatedRecurring = state.recurringExpenses;
      if (action.recurringExpenses) {
        updatedRecurring = action.mode === 'replace'
          ? normalizeIds(action.recurringExpenses)
          : normalizeIds([...action.recurringExpenses, ...state.recurringExpenses]);
        saveRecurringExpenses(updatedRecurring);
      }

      return { ...state, expenses: updatedExpenses, recurringExpenses: updatedRecurring };
    }
    case 'UPDATE_SETTINGS': {
      saveSettings(action.settings);
      return { ...state, settings: action.settings };
    }
    /** Factory reset: expenses, recurring bills and settings all go. */
    case 'ERASE_ALL': {
      clearAllData();
      return {
        ...state,
        expenses: [],
        recurringExpenses: [],
        // Onboarding stays marked as seen: someone wiping their data is not
        // asking to be walked through the app again.
        settings: { ...defaultSettings, hasSeenOnboarding: true },
      };
    }
    case 'COMPLETE_ONBOARDING': {
      const newSettings = { ...state.settings, hasSeenOnboarding: true };
      saveSettings(newSettings);
      return { ...state, settings: newSettings };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SHOW_FEEDBACK':
      return {
        ...state,
        feedback: {
          message: action.message,
          visible: true,
          type: action.feedbackType,
          onUndo: action.onUndo,
        },
      };
    case 'HIDE_FEEDBACK':
      return { ...state, feedback: { ...state.feedback, visible: false } };
    default:
      return state;
  }
}

interface AppContextType extends AppState {
  setSelectedDate: (date: Date) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  editExpense: (expense: Expense) => Promise<void>;
  recategoriseExpenses: (from: string, to: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id'>) => Promise<void>;
  editRecurringExpense: (expense: RecurringExpense) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  importExpenses: (data: { expenses: Expense[], recurringExpenses?: RecurringExpense[] }, mode: 'merge' | 'replace') => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  showFeedback: (message: string, type?: FeedbackTone, onUndo?: () => void) => void;
  hideFeedback: () => void;
  eraseAllData: () => Promise<void>;
  completeOnboarding: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Non-throwing accessor. `useAppTheme` runs in a few places that sit outside
 * the provider (the splash path, the error boundary), so it needs to ask for
 * settings without exploding when they are not there yet.
 */
export const useAppOptional = () => useContext(AppContext);

const initialState: AppState = {
  expenses: [],
  recurringExpenses: [],
  settings: defaultSettings,
  selectedDate: new Date(),
  isLoading: true,
  feedback: { message: '', visible: false, type: 'success' },
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Lets the delete callbacks read the latest records without taking `state`
  // as a dependency, which would re-create them on every expense change.
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    async function prepare() {
      try {
        const [loadedExpenses, loadedSettings, loadedRecurring] = await Promise.all([
          loadExpenses(),
          loadSettings(),
          loadRecurringExpenses()
        ]);
        dispatch({ type: 'SET_INITIAL_DATA', expenses: loadedExpenses, recurringExpenses: loadedRecurring, settings: loadedSettings });
      } catch (e) {
        console.warn('Failed to load data', e);
        dispatch({ type: 'SHOW_FEEDBACK', message: 'Failed to load your data.', feedbackType: 'error' });
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    }
    prepare();
  }, []);

  const showFeedback = useCallback((
    message: string,
    type: FeedbackTone = 'success',
    onUndo?: () => void,
  ) => {
    dispatch({ type: 'SHOW_FEEDBACK', message, feedbackType: type, onUndo });
  }, []);

  const hideFeedback = useCallback(() => {
    dispatch({ type: 'HIDE_FEEDBACK' });
  }, []);

  const setSelectedDate = useCallback((date: Date) => {
    dispatch({ type: 'SET_SELECTED_DATE', date });
  }, []);

  const addExpense = useCallback(async (newExp: Omit<Expense, 'id'>) => {
    try {
      const expense: Expense = { ...newExp, id: Date.now().toString() };
      dispatch({ type: 'ADD_EXPENSE', expense });
      showFeedback('Expense added successfully!');
    } catch {
      showFeedback('Failed to add expense.', 'error');
    }
  }, [showFeedback]);

  const editExpense = useCallback(async (expense: Expense) => {
    try {
      dispatch({ type: 'EDIT_EXPENSE', expense });
      showFeedback('Expense updated.');
    } catch {
      showFeedback('Failed to update expense.', 'error');
    }
  }, [showFeedback]);

  const recategoriseExpenses = useCallback(async (from: string, to: string) => {
    dispatch({ type: 'RECATEGORISE_EXPENSES', from, to });
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      // Captured before the dispatch so Undo can restore the exact record.
      const removed = stateRef.current.expenses.find((e) => e.id === id);
      dispatch({ type: 'DELETE_EXPENSE', id });
      showFeedback(
        'Expense deleted.',
        'destructive',
        removed ? () => dispatch({ type: 'RESTORE_EXPENSE', expense: removed }) : undefined,
      );
    } catch {
      showFeedback('Failed to delete expense.', 'error');
    }
  }, [showFeedback]);

  const addRecurringExpense = useCallback(async (newExp: Omit<RecurringExpense, 'id'>) => {
    try {
      const recurringExpense: RecurringExpense = { ...newExp, id: Date.now().toString() };
      dispatch({ type: 'ADD_RECURRING_EXPENSE', recurringExpense });
      showFeedback('Recurring bill added!');
    } catch {
      showFeedback('Failed to add recurring bill.', 'error');
    }
  }, [showFeedback]);

  const editRecurringExpense = useCallback(async (recurringExpense: RecurringExpense) => {
    try {
      dispatch({ type: 'EDIT_RECURRING_EXPENSE', recurringExpense });
    } catch {
      showFeedback('Failed to edit recurring bill.', 'error');
    }
  }, [showFeedback]);

  const deleteRecurringExpense = useCallback(async (id: string) => {
    try {
      const removed = stateRef.current.recurringExpenses.find((e) => e.id === id);
      dispatch({ type: 'DELETE_RECURRING_EXPENSE', id });
      showFeedback(
        'Recurring bill deleted.',
        'destructive',
        removed ? () => dispatch({ type: 'RESTORE_RECURRING_EXPENSE', recurringExpense: removed }) : undefined,
      );
    } catch {
      showFeedback('Failed to delete recurring bill.', 'error');
    }
  }, [showFeedback]);

  const importExpenses = useCallback(async (data: { expenses: Expense[], recurringExpenses?: RecurringExpense[] }, mode: 'merge' | 'replace') => {
    try {
      dispatch({ type: 'IMPORT_EXPENSES', expenses: data.expenses, recurringExpenses: data.recurringExpenses, mode });
      showFeedback(`${data.expenses.length} expense${data.expenses.length === 1 ? '' : 's'} imported.`);
    } catch {
      showFeedback('Failed to import expenses.', 'error');
    }
  }, [showFeedback]);

  const updateSettings = useCallback(async (newSettings: Settings) => {
    try {
      dispatch({ type: 'UPDATE_SETTINGS', settings: newSettings });
      showFeedback('Settings saved!');
    } catch {
      showFeedback('Failed to save settings.', 'error');
    }
  }, [showFeedback]);

  const eraseAllData = useCallback(async () => {
    dispatch({ type: 'ERASE_ALL' });
    showFeedback('All data erased.', 'destructive');
  }, [showFeedback]);

  const completeOnboarding = useCallback(() => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setSelectedDate,
        addExpense,
        editExpense,
        recategoriseExpenses,
        deleteExpense,
        addRecurringExpense,
        editRecurringExpense,
        deleteRecurringExpense,
        importExpenses,
        updateSettings,
        showFeedback,
        hideFeedback,
        eraseAllData,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

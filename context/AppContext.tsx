import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { 
  defaultSettings, 
  loadExpenses, 
  saveExpenses, 
  loadSettings, 
  saveSettings 
} from '../utils/storage';
import type { Expense, Settings } from '../utils/storage';

// 1. Define State Shape
interface AppState {
  expenses: Expense[];
  settings: Settings;
  selectedDate: Date;
  isLoading: boolean;
  feedback: { message: string; visible: boolean; type: 'success' | 'error' };
}

// 2. Define Action Types
type AppAction =
  | { type: 'SET_INITIAL_DATA'; expenses: Expense[]; settings: Settings }
  | { type: 'SET_SELECTED_DATE'; date: Date }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'DELETE_EXPENSE'; id: string }
  | { type: 'IMPORT_EXPENSES'; expenses: Expense[]; mode: 'merge' | 'replace' }
  | { type: 'UPDATE_SETTINGS'; settings: Settings }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SHOW_FEEDBACK'; message: string; feedbackType: 'success' | 'error' }
  | { type: 'HIDE_FEEDBACK' }
  | { type: 'COMPLETE_ONBOARDING' };

// 3. Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return { ...state, expenses: action.expenses, settings: action.settings, isLoading: false };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.date };
    case 'ADD_EXPENSE': {
      const updatedExpenses = [action.expense, ...state.expenses];
      saveExpenses(updatedExpenses);
      return { ...state, expenses: updatedExpenses };
    }
    case 'DELETE_EXPENSE': {
      const updatedExpenses = state.expenses.filter((e) => e.id !== action.id);
      saveExpenses(updatedExpenses);
      return { ...state, expenses: updatedExpenses };
    }
    case 'IMPORT_EXPENSES': {
      const seenIds = new Set<string>();
      const normalizeIds = (expenses: Expense[]) => expenses.map((expense, index) => {
        const nextId = expense.id && !seenIds.has(expense.id)
          ? expense.id
          : `${Date.now()}-${index}`;
        seenIds.add(nextId);
        return { ...expense, id: nextId };
      });

      const updatedExpenses = action.mode === 'replace'
        ? normalizeIds(action.expenses)
        : normalizeIds([...action.expenses, ...state.expenses]);
      saveExpenses(updatedExpenses);
      return { ...state, expenses: updatedExpenses };
    }
    case 'UPDATE_SETTINGS': {
      saveSettings(action.settings);
      return { ...state, settings: action.settings };
    }
    case 'COMPLETE_ONBOARDING': {
      const newSettings = { ...state.settings, hasSeenOnboarding: true };
      saveSettings(newSettings);
      return { ...state, settings: newSettings };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SHOW_FEEDBACK':
      return { ...state, feedback: { message: action.message, visible: true, type: action.feedbackType } };
    case 'HIDE_FEEDBACK':
      return { ...state, feedback: { ...state.feedback, visible: false } };
    default:
      return state;
  }
}

interface AppContextType extends AppState {
  setSelectedDate: (date: Date) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  importExpenses: (expenses: Expense[], mode: 'merge' | 'replace') => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  showFeedback: (message: string, type?: 'success' | 'error') => void;
  hideFeedback: () => void;
  completeOnboarding: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  expenses: [],
  settings: defaultSettings,
  selectedDate: new Date(),
  isLoading: true,
  feedback: { message: '', visible: false, type: 'success' },
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    async function prepare() {
      try {
        const [loadedExpenses, loadedSettings] = await Promise.all([
          loadExpenses(),
          loadSettings(),
        ]);
        dispatch({ type: 'SET_INITIAL_DATA', expenses: loadedExpenses, settings: loadedSettings });
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

  const updateSettings = useCallback(async (newSettings: Settings) => {
    try {
      dispatch({ type: 'UPDATE_SETTINGS', settings: newSettings });
      showFeedback('Settings saved!');
    } catch {
      showFeedback('Failed to save settings.', 'error');
    }
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
        deleteExpense,
        importExpenses,
        updateSettings,
        showFeedback,
        hideFeedback,
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

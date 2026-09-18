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
import type { ExportedSettings, ImportedBackup } from '../utils/expenseTransfer';
import type { Frequency } from '../utils/recurrence';

/** What the repeat toggle on an expense form hands back. */
export interface RecurrenceInput {
  frequency: Frequency;
  nextDueDate: string;
}

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
  | {
      type: 'SAVE_EXPENSE_WITH_RECURRENCE';
      expense: Expense;
      /** The rule to create or update, or null when the toggle is off. */
      rule: RecurringExpense | null;
      /** A rule the user switched off, to be removed in the same write. */
      removedRuleId?: string;
    }
  | { type: 'IMPORT_EXPENSES'; expenses: Expense[]; recurringExpenses?: RecurringExpense[]; settings?: ExportedSettings; mode: 'merge' | 'replace' }
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
    /**
     * Saves an expense and its recurring rule in a single state transition.
     *
     * The expense is written first and the rule second, so a rule can never
     * exist for an expense that was not saved. Both land in one dispatch, so
     * no render ever sees one without the other.
     *
     * The rule's nextDueDate is the NEXT occurrence, never the date of the
     * expense just logged — that one has been recorded as spending already,
     * and counting it again as a bill still due would double it. The form
     * refuses to save the two as equal.
     */
    case 'SAVE_EXPENSE_WITH_RECURRENCE': {
      const isExisting = state.expenses.some((e) => e.id === action.expense.id);
      const updatedExpenses = (isExisting
        ? state.expenses.map((e) => (e.id === action.expense.id ? action.expense : e))
        : [action.expense, ...state.expenses]
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      saveExpenses(updatedExpenses);

      let updatedRecurring = state.recurringExpenses;
      if (action.removedRuleId) {
        updatedRecurring = updatedRecurring.filter((r) => r.id !== action.removedRuleId);
      }
      if (action.rule) {
        const rule = action.rule;
        updatedRecurring = updatedRecurring.some((r) => r.id === rule.id)
          ? updatedRecurring.map((r) => (r.id === rule.id ? rule : r))
          : [...updatedRecurring, rule];
      }
      if (updatedRecurring !== state.recurringExpenses) {
        saveRecurringExpenses(updatedRecurring);
      }

      return { ...state, expenses: updatedExpenses, recurringExpenses: updatedRecurring };
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

      /*
       * Categories named by the incoming rows are added whatever else the file
       * carried. Without this an imported expense in a category this phone has
       * never heard of cannot be given a budget, and — worse — opening it in
       * the editor silently re-files it under the first category in the list.
       *
       * This runs for expenses-only backups too, which is the whole point:
       * those files are still valid, and this is the only chance to recover
       * their categories.
       */
      const namedCategories = new Set<string>();
      updatedExpenses.forEach((e) => { if (e.category) namedCategories.add(e.category); });
      updatedRecurring.forEach((r) => { if (r.category) namedCategories.add(r.category); });

      const incoming = action.settings;
      const isReplace = action.mode === 'replace';

      /*
       * Merge follows the choice already made for the expenses: replacing your
       * data replaces the setup around it, merging only fills in what this
       * phone does not already have. A merge never overwrites a budget,
       * currency or income you have set here.
       */
      const mergedCategories = Array.from(new Set([
        ...(isReplace && incoming?.categories ? incoming.categories : state.settings.categories),
        ...(!isReplace && incoming?.categories ? incoming.categories : []),
        ...namedCategories,
      ]));

      const fillMap = <T,>(mine: Record<string, T> | undefined, theirs: Record<string, T> | undefined) => {
        if (!theirs) return mine;
        return isReplace ? theirs : { ...theirs, ...mine };
      };

      const updatedSettings: Settings = {
        ...state.settings,
        categories: mergedCategories,
        categoryBudgets: fillMap(state.settings.categoryBudgets, incoming?.categoryBudgets),
        categoryGroups: fillMap(state.settings.categoryGroups, incoming?.categoryGroups),
        categorizationRules: fillMap(state.settings.categorizationRules, incoming?.categorizationRules),
        ...(isReplace && incoming
          ? {
              currency: incoming.currency ?? state.settings.currency,
              income: incoming.income ?? state.settings.income,
              budget: incoming.budget ?? state.settings.budget,
              theme: incoming.theme ?? state.settings.theme,
            }
          : {}),
      };

      saveSettings(updatedSettings);

      return {
        ...state,
        expenses: updatedExpenses,
        recurringExpenses: updatedRecurring,
        settings: updatedSettings,
      };
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
  saveExpenseWithRecurrence: (
    expense: Omit<Expense, 'id'> | Expense,
    recurrence: RecurrenceInput | null,
  ) => Promise<void>;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id'>) => Promise<void>;
  editRecurringExpense: (expense: RecurringExpense) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  importExpenses: (data: ImportedBackup, mode: 'merge' | 'replace') => Promise<void>;
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

  /**
   * The save behind "Repeat this expense".
   *
   * Handles every combination in one place: a new expense with or without a
   * rule, an existing one gaining a rule, having its rule edited, or having it
   * switched off. Callers do not have to sequence two writes and cannot get
   * the order wrong.
   */
  const saveExpenseWithRecurrence = useCallback(async (
    expense: Omit<Expense, 'id'> | Expense,
    recurrence: RecurrenceInput | null,
  ) => {
    try {
      const existingId = 'id' in expense ? expense.id : undefined;
      const previousRuleId = 'recurringId' in expense ? expense.recurringId : undefined;
      const expenseId = existingId ?? Date.now().toString();
      const ruleId = recurrence ? previousRuleId ?? `${Date.now()}-rule` : undefined;

      const saved: Expense = {
        ...expense,
        id: expenseId,
        // Cleared when the toggle is off, so an expense never points at a rule
        // that has been removed.
        recurringId: ruleId,
      };

      const rule: RecurringExpense | null = recurrence && ruleId
        ? {
            id: ruleId,
            description: saved.description,
            amount: saved.amount,
            category: saved.category,
            frequency: recurrence.frequency,
            nextDueDate: recurrence.nextDueDate,
            isVariableAmount: false,
            sourceExpenseId: expenseId,
          }
        : null;

      dispatch({
        type: 'SAVE_EXPENSE_WITH_RECURRENCE',
        expense: saved,
        rule,
        // Only when a rule existed and the toggle is now off.
        removedRuleId: !recurrence && previousRuleId ? previousRuleId : undefined,
      });
    } catch {
      showFeedback('Failed to save expense.', 'error');
      throw new Error('save-failed');
    }
  }, [showFeedback]);

  const addRecurringExpense = useCallback(async (newExp: Omit<RecurringExpense, 'id'>) => {
    try {
      const recurringExpense: RecurringExpense = { ...newExp, id: Date.now().toString() };
      dispatch({ type: 'ADD_RECURRING_EXPENSE', recurringExpense });
      showFeedback('Recurring bill added');
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

  const importExpenses = useCallback(async (data: ImportedBackup, mode: 'merge' | 'replace') => {
    try {
      dispatch({
        type: 'IMPORT_EXPENSES',
        expenses: data.expenses,
        recurringExpenses: data.recurringExpenses,
        // Undefined for an expenses-only file, which stays a valid backup.
        settings: data.settings,
        mode,
      });
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
        saveExpenseWithRecurrence,
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

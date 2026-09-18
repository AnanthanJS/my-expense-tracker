import { useCallback } from 'react';
import { useToast } from '../providers/ToastProvider';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import type { Expense } from '../utils/storage';
import type { Frequency } from '../utils/recurrence';

/**
 * Toast announcements for saving an expense.
 *
 * Kept out of AppContext deliberately: the toast provider needs the theme,
 * which comes from AppContext, so the context cannot depend on the toast in
 * turn. Deciding what to announce is a UI concern anyway.
 */
export function useExpenseToast() {
  const toast = useToast();
  const { expenses, settings } = useApp();

  /**
   * Confirms a saved expense, warning instead when that save is what pushed
   * the category past its limit — the more useful thing to say at that moment.
   */
  const announceSaved = useCallback((
    expense: Omit<Expense, 'id'>,
    /** Set when the save also created or updated a repeat rule. */
    frequency?: Frequency | null,
  ) => {
    const meta = `${formatCurrency(expense.amount, settings.currency)} · ${expense.category}`;
    const limit = settings.categoryBudgets?.[expense.category];

    if (limit && limit > 0) {
      const date = new Date(expense.date);
      // Includes the expense being saved, which is not in `expenses` yet.
      const spent = expenses
        .filter((e) => {
          if (e.category !== expense.category) return false;
          const d = new Date(e.date);
          return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
        })
        .reduce((sum, e) => sum + e.amount, expense.amount);

      if (spent > limit) {
        toast.show({
          variant: 'warning',
          title: `${expense.category} is over its limit`,
          meta: formatCurrency(spent, settings.currency),
        });
        return;
      }
    }

    toast.show({
      variant: 'success',
      // The recurrence is the part worth confirming — it is the half of the
      // save with no row in the list to look at afterwards.
      title: frequency ? `Expense added · repeats ${frequency}` : 'Expense added',
      meta,
    });
  }, [toast, expenses, settings.currency, settings.categoryBudgets]);

  const announceFailed = useCallback((onRetry: () => void) => {
    toast.show({
      variant: 'error',
      title: "Couldn't save that",
      action: { label: 'Retry', onPress: onRetry },
    });
  }, [toast]);

  return { announceSaved, announceFailed };
}

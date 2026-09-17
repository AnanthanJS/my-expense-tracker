import { useMemo } from 'react';
import type { Expense } from '../utils/storage';

export interface CategorySlice {
  category: string;
  amount: number;
  /** Fraction of the month's total, 0–1. */
  share: number;
}

export interface MonthlyStats {
  expenses: Expense[];
  total: number;
  count: number;
  /** null when there is nothing to average. */
  average: number | null;
  /** Descending by amount. */
  byCategory: CategorySlice[];
  topCategory: CategorySlice | null;
  previousTotal: number;
  /**
   * Percentage change against the previous month. null when the previous
   * month had no spending at all — "up 100% from zero" is noise, not insight.
   */
  trendPct: number | null;
}

const inMonth = (dateStr: string, year: number, month: number) => {
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() === month;
};

/**
 * Everything Home and Analytics need about one month, derived once.
 *
 * Both screens were computing their own totals and category rollups from the
 * same expense list, which is how they came to disagree about what a month
 * contained. One source, one shape.
 */
export function useMonthlyStats(expenses: Expense[], date: Date): MonthlyStats {
  return useMemo(() => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const monthExpenses = expenses.filter((e) => inMonth(e.date, year, month));
    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const totals = new Map<string, number>();
    monthExpenses.forEach((e) => {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    });

    const byCategory: CategorySlice[] = Array.from(totals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        share: total > 0 ? amount / total : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Previous month, wrapping the year boundary.
    const prev = new Date(year, month - 1, 1);
    const previousTotal = expenses
      .filter((e) => inMonth(e.date, prev.getFullYear(), prev.getMonth()))
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      expenses: monthExpenses,
      total,
      count: monthExpenses.length,
      average: monthExpenses.length > 0 ? total / monthExpenses.length : null,
      byCategory,
      topCategory: byCategory[0] ?? null,
      previousTotal,
      trendPct: previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null,
    };
  }, [expenses, date]);
}

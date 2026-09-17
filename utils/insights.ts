import type { Expense } from './storage';
import type { CategorySlice } from '../hooks/useMonthlyStats';

/**
 * Derived read-outs that turn raw totals into something worth saying.
 * Pure functions, no React — so the maths can be reasoned about (and later
 * tested) on its own.
 */

// ── Spend driver ────────────────────────────────────────────────────────────

export interface SpendDriver {
  category: string;
  amount: number;
  /** 0–1. */
  share: number;
}

/**
 * The category responsible for an outsized slice of the month.
 *
 * Only worth surfacing when one category genuinely dominates — below the
 * threshold the "driver" is just whichever category happened to come first,
 * which is a banner that says nothing.
 */
export function getSpendDriver(
  byCategory: CategorySlice[],
  threshold = 0.35,
): SpendDriver | null {
  const top = byCategory[0];
  if (!top || top.share < threshold) return null;
  return { category: top.category, amount: top.amount, share: top.share };
}

// ── Week by week ────────────────────────────────────────────────────────────

export interface WeekBucket {
  label: string;
  /** Day of month the bucket starts on. */
  start: number;
  end: number;
  amount: number;
  /** False for buckets that haven't happened yet in the current month. */
  elapsed: boolean;
}

export interface WeeklyPace {
  buckets: WeekBucket[];
  /** Weekly spend that would keep the month inside budget. */
  pace: number;
  /** Days of the month elapsed (full month when viewing a past month). */
  daysIn: number;
  daysInMonth: number;
  /** One-line read-out, or null when there is nothing notable to say. */
  headline: string | null;
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const spell = (n: number) => (n <= 10 ? WORDS[n] : String(n));

export function getWeeklyPace(
  expenses: Expense[],
  date: Date,
  budget: number,
): WeeklyPace {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const daysIn = isCurrentMonth ? today.getDate() : daysInMonth;

  const buckets: WeekBucket[] = [];
  for (let start = 1; start <= daysInMonth; start += 7) {
    const end = Math.min(start + 6, daysInMonth);
    buckets.push({
      label: `${start}–${end}`,
      start,
      end,
      amount: 0,
      // A bucket counts as elapsed once the month has reached its first day.
      elapsed: daysIn >= start,
    });
  }

  expenses.forEach((e) => {
    const d = new Date(e.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) return;
    const day = d.getDate();
    const bucket = buckets.find((b) => day >= b.start && day <= b.end);
    if (bucket) bucket.amount += e.amount;
  });

  // Weekly allowance: the budget spread evenly across the month's real length,
  // rather than divided by bucket count (the last bucket is a short week).
  const pace = budget > 0 ? (budget / daysInMonth) * 7 : 0;

  let headline: string | null = null;
  const worst = buckets.filter((b) => b.elapsed).sort((a, b) => b.amount - a.amount)[0];
  if (worst && pace > 0 && worst.amount > pace) {
    const weeksWorth = Math.round(worst.amount / pace);
    const index = buckets.indexOf(worst) + 1;
    if (weeksWorth >= 2) {
      headline = `You spent ${spell(weeksWorth)} weeks' worth of budget in week ${spell(index)}.`;
    }
  }

  return { buckets, pace, daysIn, daysInMonth, headline };
}

// ── Six month history ───────────────────────────────────────────────────────

export interface MonthPoint {
  /** Short month name, e.g. "Sep". */
  label: string;
  total: number;
  year: number;
  month: number;
  /** True for the month currently being viewed. */
  isCurrent: boolean;
  /** True when this is the live month and therefore incomplete. */
  partial: boolean;
}

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getSixMonthSeries(expenses: Expense[], date: Date, months = 6): MonthPoint[] {
  const today = new Date();
  const points: MonthPoint[] = [];

  for (let back = months - 1; back >= 0; back--) {
    const d = new Date(date.getFullYear(), date.getMonth() - back, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const total = expenses
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getFullYear() === year && ed.getMonth() === month;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    points.push({
      label: SHORT[month],
      total,
      year,
      month,
      isCurrent: back === 0,
      partial: year === today.getFullYear() && month === today.getMonth(),
    });
  }

  return points;
}

/** Percentage change between two totals, or null when the base is zero. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

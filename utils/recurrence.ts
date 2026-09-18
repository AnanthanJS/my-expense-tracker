import { toLocalISODate } from './formatDate';

/**
 * The one frequency enum in the app. Both the recurring-bill form and the
 * repeat toggle on an expense read their options from here — a second list
 * would drift the moment either form gained an option.
 */
export const FREQUENCIES = ['monthly', 'weekly', 'yearly'] as const;

export type Frequency = (typeof FREQUENCIES)[number];

/** Title-case label for a chip. */
export function frequencyLabel(frequency: Frequency): string {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
}

/**
 * Advances a date by exactly one interval.
 *
 * The same arithmetic UpcomingBills uses when a bill is paid, so a rule
 * created here and a rule rolled forward there stay on the same schedule.
 */
export function advance(date: Date, frequency: Frequency): Date {
  const next = new Date(date);
  if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

/**
 * The first occurrence after `from` that is also still in the future.
 *
 * Used for the "next due date" default: one interval on from the expense being
 * copied, rolled forward again and again if that still lands in the past — a
 * bill based on an expense from eight months ago should be due next month, not
 * seven months ago.
 *
 * Always returns a date strictly after both `from` and today, which is what
 * keeps the expense just logged from also showing up as a bill due.
 */
export function nextDueAfter(from: string, frequency: Frequency): string {
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return toLocalISODate(advance(new Date(), frequency));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let next = advance(start, frequency);
  // Bounded so a corrupt date cannot spin here forever; 600 weeks is a decade.
  for (let i = 0; i < 600 && next <= today; i += 1) {
    next = advance(next, frequency);
  }
  return toLocalISODate(next);
}

/**
 * How a frequency reads inside a sentence — "repeats monthly", not
 * "repeats Monthly".
 */
export function frequencyAdverb(frequency: Frequency): string {
  return frequency;
}

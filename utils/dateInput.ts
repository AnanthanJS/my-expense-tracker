/**
 * Date entry shared by every form that takes a YYYY-MM-DD date.
 *
 * Lifted out of ExpenseForm so the recurring-bill form gets the same masking
 * and the same errors: it previously accepted any string at all, so a bill
 * could be saved due on "banana" and simply never appear.
 */

/** Types the dashes for the user, and refuses anything that is not a digit. */
export function maskDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

/** Null when the value is fine, or still being typed. */
export function validateDate(value: string): string | null {
  if (value.length === 0) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (y < 1900 || y > 2200) return 'Year out of range';
  if (m < 1 || m > 12) return 'Invalid month';
  const daysInMonth = new Date(y, m, 0).getDate();
  if (d < 1 || d > daysInMonth) return 'Invalid day';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Invalid date';
  return null;
}

/** True when a complete, valid date has been typed. */
export function isCompleteDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && validateDate(value) === null;
}

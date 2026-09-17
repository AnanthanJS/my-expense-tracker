const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * `YYYY-MM-DD` in the device's local timezone.
 *
 * `Date.toISOString().split('T')[0]` converts to UTC first, so for anyone east
 * or west of Greenwich it can name the wrong day — an expense entered at 22:00
 * in UTC+5:30 lands on tomorrow's key. Expense dates are authored and read as
 * local calendar days, so every key derived from a `Date` must be local too.
 */
export const toLocalISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Single money formatter for the whole app.
 *
 * Amounts were previously rendered three different ways — `toLocaleString()`
 * in SummaryCard, `toFixed(0)` in the stat row and category breakdown, and
 * `toFixed(2)` in the expense list — so the same ₹1234.5 appeared as
 * "₹1,234.5", "₹1235" and "₹1234.50" on three screens of one app.
 *
 * Grouping separators always come from the device locale; only the decimal
 * places vary by call site.
 */

interface FormatOptions {
  /** Force decimals on (2) or off (0). Default: show cents only when non-zero. */
  decimals?: 0 | 2;
  /** Prefix with a minus sign — used by the expense list. */
  negative?: boolean;
}

export function formatCurrency(
  amount: number,
  currency: string,
  options: FormatOptions = {},
): string {
  const safe = Number.isFinite(amount) ? amount : 0;

  const decimals = options.decimals ?? (Number.isInteger(safe) ? 0 : 2);

  const body = safe.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${options.negative ? '-' : ''}${currency}${body}`;
}

/** Whole-unit form for dense UI — stat tiles, chart labels, bar rows. */
export function formatCurrencyCompact(amount: number, currency: string): string {
  return formatCurrency(amount, currency, { decimals: 0 });
}

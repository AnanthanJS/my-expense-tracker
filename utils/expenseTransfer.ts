import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Expense, Settings, RecurringExpense } from './storage';
import { formatDate } from './formatDate';

interface ExpenseExportFile {
  app: 'my-expense-tracker';
  version: 1;
  exportedAt: string;
  expenses: Expense[];
  recurringExpenses?: RecurringExpense[];
}

const EXPORT_VERSION = 1;

const sanitizeFilePart = (value: string) =>
  value.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();

const getExportName = (extension: 'json' | 'pdf') => {
  const date = new Date().toISOString().slice(0, 10);
  return `expense-export-${sanitizeFilePart(date)}.${extension}`;
};

const assertCanShare = async () => {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }
};

const normalizeExpense = (value: unknown): Expense | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<Expense>;
  const amount = Number(candidate.amount);

  if (
    typeof candidate.description !== 'string' ||
    typeof candidate.category !== 'string' ||
    typeof candidate.date !== 'string' ||
    Number.isNaN(amount)
  ) {
    return null;
  }

  return {
    id: typeof candidate.id === 'string' && candidate.id ? candidate.id : Date.now().toString(),
    description: candidate.description.trim() || 'Imported expense',
    amount,
    category: candidate.category.trim() || 'Other',
    date: Number.isNaN(new Date(candidate.date).getTime())
      ? new Date().toISOString()
      : new Date(candidate.date).toISOString(),
  };
};

const normalizeRecurring = (value: unknown): RecurringExpense | null => {
  if (!value || typeof value !== 'object') return null;
  const c = value as Partial<RecurringExpense>;
  if (!c.description || !c.category || !c.frequency || !c.nextDueDate) return null;
  return {
    id: typeof c.id === 'string' && c.id ? c.id : Date.now().toString() + Math.random(),
    description: c.description,
    amount: Number(c.amount) || 0,
    category: c.category,
    frequency: c.frequency as any,
    nextDueDate: c.nextDueDate,
    isVariableAmount: Boolean(c.isVariableAmount),
  };
};

const readExpensesFromJson = (contents: string): { expenses: Expense[], recurringExpenses: RecurringExpense[] } => {
  const parsed = JSON.parse(contents) as unknown;
  let sourceExpenses: unknown[] | null = null;
  let sourceRecurring: unknown[] | null = null;

  if (Array.isArray(parsed)) {
    sourceExpenses = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const file = parsed as ExpenseExportFile;
    sourceExpenses = Array.isArray(file.expenses) ? file.expenses : null;
    sourceRecurring = Array.isArray(file.recurringExpenses) ? file.recurringExpenses : null;
  }

  if (!sourceExpenses) {
    throw new Error('This file does not contain an expenses array.');
  }

  const expenses = sourceExpenses.map(normalizeExpense).filter((expense): expense is Expense => Boolean(expense));
  const recurringExpenses = sourceRecurring ? sourceRecurring.map(normalizeRecurring).filter((r): r is RecurringExpense => Boolean(r)) : [];

  if (expenses.length === 0 && recurringExpenses.length === 0) {
    throw new Error('No valid expenses or recurring expenses were found in this file.');
  }

  return { expenses, recurringExpenses };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildExpensesPdfHtml = (expenses: Expense[], settings: Settings) => {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const generatedAt = new Date().toLocaleString();
  const rows = expenses.map((expense) => `
    <tr>
      <td>${escapeHtml(formatDate(expense.date))}</td>
      <td>${escapeHtml(expense.description)}</td>
      <td>${escapeHtml(expense.category)}</td>
      <td class="amount">${escapeHtml(settings.currency)}${expense.amount.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
          h1 { font-size: 24px; margin: 0 0 4px; }
          .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
          .summary { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px; margin-bottom: 18px; }
          .summary strong { font-size: 18px; color: #2563eb; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; font-size: 11px; letter-spacing: 0.8px; color: #475569; border-bottom: 1px solid #cbd5e1; padding: 10px 8px; }
          td { font-size: 12px; border-bottom: 1px solid #e2e8f0; padding: 10px 8px; }
          .amount { text-align: right; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>Expense Export</h1>
        <div class="meta">Generated ${escapeHtml(generatedAt)}</div>
        <div class="summary">
          <div>${expenses.length} expense${expenses.length === 1 ? '' : 's'}</div>
          <strong>${escapeHtml(settings.currency)}${total.toFixed(2)}</strong>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
};

export const exportExpensesAsJson = async (expenses: Expense[], recurringExpenses: RecurringExpense[] = []) => {
  await assertCanShare();
  const sanitizedExpenses = expenses.map((e) => {
    const { receiptUri, ...rest } = e;
    return {
      ...rest,
      hasReceipt: !!receiptUri,
    } as unknown as Expense; // Type casting for export
  });

  const file: ExpenseExportFile = {
    app: 'my-expense-tracker',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    expenses: sanitizedExpenses,
    recurringExpenses,
  };

  const exportFile = new File(Paths.cache, getExportName('json'));
  if (exportFile.exists) {
    exportFile.delete();
  }
  exportFile.create({ overwrite: true });
  exportFile.write(JSON.stringify(file, null, 2));

  await Sharing.shareAsync(exportFile.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export expenses as JSON',
  });
};

export const exportExpensesAsPdf = async (expenses: Expense[], settings: Settings) => {
  await assertCanShare();
  const { uri } = await Print.printToFileAsync({
    html: buildExpensesPdfHtml(expenses, settings),
    base64: false,
  });

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Export expenses as PDF',
    UTI: 'com.adobe.pdf',
  });
};

export const pickExpensesJson = async (): Promise<{ expenses: Expense[], recurringExpenses: RecurringExpense[] } | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  const contents = await new File(asset.uri).text();

  return readExpensesFromJson(contents);
};

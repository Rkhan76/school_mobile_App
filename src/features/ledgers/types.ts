/** Shared entry direction for both the ledger and the cashbook (per MOBILE_API_DOCS §21/§22). */
export type EntryType = 'CREDIT' | 'DEBIT';

export type LedgerCategory = 'FEE_PAYMENT' | 'FEE_REVERSAL' | 'EXPENSE' | 'DONATION' | 'SALARY_PAYMENT';
export type LedgerSourceType = 'fee_payment' | 'payroll_payslip' | 'cashbook_entry';

/** GET /ledger row. Entirely read-only — rows only ever appear as a side effect of
 * fee payments, payroll, or cashbook entries. `amount` is a decimal STRING from the
 * API ("1500.00") — keep it as a string for display, parseFloat only for math. */
export type LedgerEntry = {
  id: string;
  schoolId: string;
  entryType: EntryType;
  amount: string;
  category: LedgerCategory;
  sourceType: LedgerSourceType;
  sourceId: string;
  description: string;
  entryDate: string;
  recordedByUserId: string;
  createdAt: string;
  updatedAt: string;
};

/** GET /ledger/summary response — totals are decimal strings too. */
export type LedgerSummary = {
  totalCredit: string;
  totalDebit: string;
  netBalance: string;
};

export type LedgerListParams = {
  entryType?: EntryType;
  category?: LedgerCategory;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type LedgerSummaryParams = Omit<LedgerListParams, 'page' | 'limit'>;

export const LEDGER_CATEGORIES: LedgerCategory[] = [
  'FEE_PAYMENT',
  'FEE_REVERSAL',
  'EXPENSE',
  'DONATION',
  'SALARY_PAYMENT',
];

export type CashbookCategory =
  | 'DONATION'
  | 'UTILITIES'
  | 'MAINTENANCE'
  | 'SUPPLIES'
  | 'SALARIES'
  | 'TRANSPORT'
  | 'EVENTS'
  | 'OTHER';

export type PaymentMethod = 'CASH' | 'ONLINE' | 'CHEQUE' | 'CARD' | 'BANK_TRANSFER';

export const CASHBOOK_CATEGORIES: CashbookCategory[] = [
  'DONATION',
  'UTILITIES',
  'MAINTENANCE',
  'SUPPLIES',
  'SALARIES',
  'TRANSPORT',
  'EVENTS',
  'OTHER',
];

export const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'ONLINE', 'CHEQUE', 'CARD', 'BANK_TRANSFER'];

/** GET /cashbook row / POST /cashbook response. `amount` is a decimal string, same as ledger. */
export type CashbookEntry = {
  id: string;
  schoolId: string;
  entryType: EntryType;
  category: CashbookCategory;
  description: string;
  amount: string;
  entryDate: string;
  paymentMethod: PaymentMethod;
  counterpartyName: string;
  counterpartyContact?: string | null;
  proofUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CashbookListParams = {
  entryType?: EntryType;
  category?: CashbookCategory;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

/** POST /cashbook payload. `amount` is a plain number here (server returns it as a string). */
export type CreateCashbookInput = {
  entryType: EntryType;
  category?: CashbookCategory;
  description: string;
  amount: number;
  entryDate?: string;
  paymentMethod: PaymentMethod;
  counterpartyName: string;
  counterpartyContact?: string;
  proofUrl?: string;
  notes?: string;
};

/* ---------- formatting helpers ---------- */

/** Indian digit grouping, e.g. 1250000 -> ₹12,50,000.00. */
export function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return '₹0.00';
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return `${neg ? '-' : ''}₹${grouped}.${dec}`;
}

/** Parse an API decimal string ("1500.00") to a number for math/formatting; NaN-safe. */
export function parseAmount(amount: string): number {
  const n = parseFloat(amount);
  return Number.isFinite(n) ? n : 0;
}

export function isoToInput(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** DD/MM/YYYY -> ISO, or null when invalid. */
export function inputToIso(v: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.trim());
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 'FEE_PAYMENT' -> 'Fee Payment' for display; the raw value is still what's sent to the API. */
export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export const PAGE_SIZES = [10, 20, 50] as const;

export const ENTRY_TYPE_OPTIONS: { value: EntryType | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'DEBIT', label: 'Debit' },
];

export const LEDGER_CATEGORY_OPTIONS: { value: LedgerCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  ...LEDGER_CATEGORIES.map((c) => ({ value: c, label: titleCase(c) })),
];

export const CASHBOOK_CATEGORY_OPTIONS: { value: CashbookCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  ...CASHBOOK_CATEGORIES.map((c) => ({ value: c, label: titleCase(c) })),
];

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = PAYMENT_METHODS.map((m) => ({
  value: m,
  label: titleCase(m),
}));

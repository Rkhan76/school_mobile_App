import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type EntryType = 'CREDIT' | 'DEBIT';
export type CashType = 'IN' | 'OUT';
export type PayMethod = 'Cash' | 'UPI' | 'Cheque' | 'Bank transfer';

export type LedgerEntry = {
  id: string;
  date: string; // ISO YYYY-MM-DD
  type: EntryType;
  category: string;
  description: string;
  source: string;
  amount: number;
};

export type CashbookEntry = {
  id: string;
  date: string; // ISO YYYY-MM-DD
  type: CashType;
  category: string;
  description: string;
  counterparty: string;
  method: PayMethod;
  amount: number;
};

export type CashbookInput = Omit<CashbookEntry, 'id'>;

export const TODAY_ISO = '2026-10-02';
export const PAGE_SIZES = [10, 20, 50] as const;
export const PAY_METHODS: PayMethod[] = ['Cash', 'UPI', 'Cheque', 'Bank transfer'];
export const LEDGER_CATEGORIES: string[] = [
  'Fee Collection', 'Donation', 'Grant', 'Salary', 'Utilities', 'Maintenance', 'Transport', 'Stationery',
];
export const CASH_CATEGORIES: string[] = [
  'Fee Collection', 'Donation', 'Event Income', 'Canteen', 'Salary Advance', 'Utilities', 'Maintenance', 'Stationery', 'Miscellaneous',
];

/* ---------- formatting helpers ---------- */

/** Indian digit grouping, e.g. 1250000 -> Rs 12,50,000.00 (with rupee sign). */
export function formatMoney(n: number): string {
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return `${neg ? '-' : ''}₹${grouped}.${dec}`;
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

/* ---------- mock data ---------- */

function isoDay(offset: number): string {
  const d = new Date(Date.UTC(2026, 9, 1 - offset));
  return d.toISOString().slice(0, 10);
}

const pad = (n: number, w = 4) => String(n).padStart(w, '0');

type LedgerTpl = { cat: string; desc: string; src: (i: number) => string; amt: number };

function buildLedger(): LedgerEntry[] {
  const out: LedgerEntry[] = [];
  const credits: LedgerTpl[] = [
    { cat: 'Fee Collection', desc: 'Tuition fee - Class 8 A', src: (i) => `Fee Invoice INV-2026-${pad(10 + i)}`, amt: 18500 },
    { cat: 'Fee Collection', desc: 'Term fee - Class 5 B', src: (i) => `Fee Invoice INV-2026-${pad(10 + i)}`, amt: 12250 },
    { cat: 'Fee Collection', desc: 'Transport fee - Route 3', src: (i) => `Fee Invoice INV-2026-${pad(10 + i)}`, amt: 4800 },
    { cat: 'Donation', desc: 'Alumni donation for library', src: (i) => `Donation Receipt DON-${pad(i, 3)}`, amt: 50000 },
    { cat: 'Grant', desc: 'State education grant instalment', src: (i) => `Grant Ref GR-2026-${pad(i, 3)}`, amt: 250000 },
  ];
  const debits: LedgerTpl[] = [
    { cat: 'Salary', desc: 'Teaching staff salaries', src: () => 'Payroll Run Sep 2026', amt: 842500 },
    { cat: 'Salary', desc: 'Non-teaching staff salaries', src: () => 'Payroll Run Aug 2026', amt: 215000 },
    { cat: 'Utilities', desc: 'Electricity bill', src: (i) => `Bill EB-${pad(i, 3)}`, amt: 38640.5 },
    { cat: 'Utilities', desc: 'Water and internet charges', src: (i) => `Bill UT-${pad(i, 3)}`, amt: 9275 },
    { cat: 'Maintenance', desc: 'Classroom repair and painting', src: (i) => `Work Order WO-${pad(i, 3)}`, amt: 64200 },
    { cat: 'Transport', desc: 'Bus fuel and servicing', src: (i) => `Vendor Bill VB-${pad(i, 3)}`, amt: 27800 },
    { cat: 'Stationery', desc: 'Office and lab supplies', src: (i) => `Purchase PO-${pad(i, 3)}`, amt: 8450.75 },
  ];
  for (let i = 0; i < 45; i++) {
    const isCredit = i % 5 < 3;
    const list = isCredit ? credits : debits;
    const t = list[(i * 3 + Math.floor(i / 5)) % list.length];
    out.push({
      id: `l-${i + 1}`,
      date: isoDay(i * 2 + (i % 3)),
      type: isCredit ? 'CREDIT' : 'DEBIT',
      category: t.cat,
      description: t.desc,
      source: t.src(i + 1),
      amount: t.amt + (i % 4) * 250,
    });
  }
  return out;
}

type CashTpl = { cat: string; desc: string; who: string; m: PayMethod; amt: number };

function buildCashbook(): CashbookEntry[] {
  const ins: CashTpl[] = [
    { cat: 'Fee Collection', desc: 'Late fee counter collection', who: 'Parent - Mehta', m: 'Cash', amt: 3500 },
    { cat: 'Donation', desc: 'Annual day sponsorship', who: 'Sharma Traders', m: 'Cheque', amt: 25000 },
    { cat: 'Event Income', desc: 'Science fair stall income', who: 'Student Council', m: 'UPI', amt: 6200 },
    { cat: 'Canteen', desc: 'Canteen rent', who: 'Fresh Bites Canteen', m: 'Bank transfer', amt: 15000 },
  ];
  const outs: CashTpl[] = [
    { cat: 'Stationery', desc: 'Chalk and markers', who: 'Gupta Stationers', m: 'Cash', amt: 1850 },
    { cat: 'Maintenance', desc: 'Plumbing repair', who: 'Raju Plumbing', m: 'UPI', amt: 4200 },
    { cat: 'Utilities', desc: 'Generator diesel', who: 'City Fuel Station', m: 'Cash', amt: 7600 },
    { cat: 'Salary Advance', desc: 'Advance to support staff', who: 'Ramesh Kumar', m: 'Bank transfer', amt: 10000 },
    { cat: 'Miscellaneous', desc: 'Guest refreshments', who: 'Hotel Annapurna', m: 'Cash', amt: 2300 },
  ];
  const out: CashbookEntry[] = [];
  for (let i = 0; i < 30; i++) {
    const isIn = i % 3 === 0;
    const list = isIn ? ins : outs;
    const t = list[(i + Math.floor(i / 3)) % list.length];
    out.push({
      id: `c-${i + 1}`,
      date: isoDay(i * 3 + (i % 2)),
      type: isIn ? 'IN' : 'OUT',
      category: t.cat,
      description: t.desc,
      counterparty: t.who,
      method: t.m,
      amount: t.amt + (i % 3) * 100,
    });
  }
  return out;
}

/* ---------- hooks ---------- */

type BaseParams = {
  search: string;
  category: string;
  /** ISO dates or '' */
  from: string;
  to: string;
  page: number;
  pageSize: number;
};
export type LedgerParams = BaseParams & { type: EntryType | '' };
export type CashbookParams = BaseParams & { type: CashType | '' };

export type LedgerStats = { totalEntries: number; credit: number; debit: number; net: number };

function useLatency() {
  const [isLoading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetch = useCallback(() => {
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), 700);
  }, []);
  useEffect(() => {
    refetch();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refetch]);
  return { isLoading, refetch };
}

function matches(e: { date: string; category: string; description: string }, p: BaseParams, q: string): boolean {
  if (p.category && e.category !== p.category) return false;
  if (p.from && e.date < p.from) return false;
  if (p.to && e.date > p.to) return false;
  return !q || e.description.toLowerCase().includes(q);
}

function byDateDesc<T extends { date: string; id: string }>(a: T, b: T): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.id < b.id ? 1 : -1;
}

function computeStats(items: { amount: number; credit: boolean }[]): LedgerStats {
  let credit = 0;
  let debit = 0;
  for (const i of items) {
    if (i.credit) credit += i.amount;
    else debit += i.amount;
  }
  return { totalEntries: items.length, credit, debit, net: credit - debit };
}

export function useLedger(params: LedgerParams) {
  const [all] = useState<LedgerEntry[]>(() => buildLedger());
  const { isLoading, refetch } = useLatency();
  const { search, type, category, from, to, page, pageSize } = params;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const p = { search, category, from, to, page, pageSize };
    return all.filter((e) => (!type || e.type === type) && matches(e, p, q)).sort(byDateDesc);
  }, [all, search, type, category, from, to, page, pageSize]);

  const data = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const stats = useMemo(
    () => computeStats(filtered.map((e) => ({ amount: e.amount, credit: e.type === 'CREDIT' }))),
    [filtered],
  );

  return { data, total: filtered.length, stats, isLoading, refetch };
}

export function useCashbook(params: CashbookParams) {
  const [all, setAll] = useState<CashbookEntry[]>(() => buildCashbook());
  const { isLoading, refetch } = useLatency();
  const nextId = useRef(1000);
  const { search, type, category, from, to, page, pageSize } = params;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const p = { search, category, from, to, page, pageSize };
    return all.filter((e) => (!type || e.type === type) && matches(e, p, q)).sort(byDateDesc);
  }, [all, search, type, category, from, to, page, pageSize]);

  const data = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const stats = useMemo(
    () => computeStats(filtered.map((e) => ({ amount: e.amount, credit: e.type === 'IN' }))),
    [filtered],
  );

  const add = useCallback((input: CashbookInput) => {
    nextId.current += 1;
    setAll((prev) => [{ ...input, id: `c-${nextId.current}` }, ...prev]);
  }, []);
  const update = useCallback((id: string, input: CashbookInput) => {
    setAll((prev) => prev.map((e) => (e.id === id ? { ...input, id } : e)));
  }, []);
  const remove = useCallback((id: string) => {
    setAll((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { data, total: filtered.length, stats, isLoading, refetch, add, update, remove };
}

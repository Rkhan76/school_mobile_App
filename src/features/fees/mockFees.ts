import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type InvoiceStatus = 'Issued' | 'Paid' | 'Partially paid' | 'Overdue';
export type PaymentMode = 'Cash' | 'Online' | 'Cheque';

export interface FeeType { id: string; name: string }
export interface FeeHead { id: string; feeTypeId: string; name: string; amount: number }
export interface FeeHeadInput { feeTypeId: string; amount: number }
export interface FeeStructure { id: string; classId: string; className: string; heads: FeeHead[] }
export interface StructureInput { classId: string; heads: FeeHeadInput[] }

export interface Student { id: string; name: string; classId: string; className: string; rollNo: number }
export interface SchoolClass { id: string; name: string }

export interface InvoiceItem { name: string; amount: number }
export interface Payment {
  id: string;
  invoiceId: string;
  receiptNo: string;
  amount: number;
  mode: PaymentMode;
  reference: string;
  /** ISO yyyy-mm-dd */
  date: string;
}
export interface Invoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  period: string;
  /** ISO yyyy-mm-dd */
  dueDate: string;
  items: InvoiceItem[];
  total: number;
  paid: number;
  outstanding: number;
  status: InvoiceStatus;
  payments: Payment[];
}
export interface Assignment {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  rollNo: number;
  structureId: string | null;
}
export interface AssignmentRow extends Assignment {
  structureName: string | null;
  structureTotal: number | null;
}

export interface ReceiptLine { invoiceNo: string; amount: number; status: InvoiceStatus }
export interface Receipt {
  receiptNo: string;
  date: string;
  studentName: string;
  className: string;
  mode: PaymentMode;
  reference: string;
  total: number;
  lines: ReceiptLine[];
}
export interface CollectInput {
  studentId: string;
  invoiceIds: string[];
  amount: number;
  mode: PaymentMode;
  reference: string;
}
export type CollectResult = { ok: true; receipt: Receipt } | { ok: false; error: string };

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

export const TODAY = '2026-10-02';

/** Indian digit grouping: 1234567 -> ₹12,34,567 */
export function formatINR(n: number): string {
  const s = String(Math.max(0, Math.round(n)));
  if (s.length <= 3) return `₹${s}`;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${rest},${last3}`;
}

export { formatDate } from '../../lib/date';

/** DD/MM/YYYY -> ISO, or null when invalid. */
export function parseDMY(text: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export function isOverdue(inv: Pick<Invoice, 'dueDate' | 'outstanding'>): boolean {
  return inv.outstanding > 0 && inv.dueDate < TODAY;
}

function statusOf(total: number, paid: number, dueDate: string): InvoiceStatus {
  if (paid >= total) return 'Paid';
  if (paid > 0) return 'Partially paid';
  return dueDate < TODAY ? 'Overdue' : 'Issued';
}

export function statusTone(s: InvoiceStatus): 'success' | 'danger' | 'warning' | 'primary' {
  if (s === 'Paid') return 'success';
  if (s === 'Overdue') return 'danger';
  if (s === 'Partially paid') return 'warning';
  return 'primary';
}

export function structureTotal(s: Pick<FeeStructure, 'heads'>): number {
  return s.heads.reduce((sum, h) => sum + h.amount, 0);
}

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

export const CLASSES: SchoolClass[] = Array.from({ length: 10 }, (_, i) => ({ id: `c${i + 1}`, name: `Class ${i + 1}` }));

const NAMES = [
  'Aarav Sharma', 'Diya Patel', 'Vihaan Singh', 'Ananya Iyer', 'Reyansh Gupta', 'Isha Verma',
  'Arjun Nair', 'Saanvi Reddy', 'Kabir Khan', 'Meera Joshi', 'Ishaan Mehta', 'Anika Das',
  'Rohan Kapoor', 'Kiara Menon', 'Advait Rao', 'Zoya Ansari', 'Dev Malhotra', 'Navya Pillai',
  'Yash Chauhan', 'Riya Bose', 'Aditya Jain', 'Tara Bhatt', 'Krish Saxena', 'Myra Shah',
  'Samar Tiwari', 'Pari Agarwal', 'Veer Choudhury', 'Aisha Siddiqui', 'Neel Desai', 'Sia Kulkarni',
  'Ayaan Qureshi', 'Prisha Banerjee', 'Atharv Kaur', 'Ira Mishra', 'Lakshya Yadav', 'Tanvi Ghosh',
];

export const STUDENTS: Student[] = NAMES.map((name, i) => {
  const c = CLASSES[i % 10];
  return { id: `s${i + 1}`, name, classId: c.id, className: c.name, rollNo: Math.floor(i / 10) + 1 };
});

const FEE_TYPES: FeeType[] = [
  { id: 'ft1', name: 'Tuition' },
  { id: 'ft2', name: 'Lab' },
  { id: 'ft3', name: 'Transport' },
  { id: 'ft4', name: 'Admission' },
  { id: 'ft5', name: 'Library' },
  { id: 'ft6', name: 'Sports' },
];

function seedStructures(): FeeStructure[] {
  return CLASSES.map((c, i) => ({
    id: `fs${i + 1}`,
    classId: c.id,
    className: c.name,
    heads: [
      { id: `fs${i + 1}-h1`, feeTypeId: 'ft1', name: 'Tuition', amount: 20000 + i * 1000 },
      { id: `fs${i + 1}-h2`, feeTypeId: 'ft2', name: 'Lab', amount: 2500 },
      { id: `fs${i + 1}-h3`, feeTypeId: 'ft3', name: 'Transport', amount: 8000 },
      { id: `fs${i + 1}-h4`, feeTypeId: 'ft4', name: 'Admission', amount: 2000 },
    ],
  }));
}

let receiptCounter = 0;
function nextReceiptNo(): string {
  receiptCounter += 1;
  return `RCT-2026-${String(receiptCounter).padStart(4, '0')}`;
}

function finalize(inv: Omit<Invoice, 'outstanding' | 'status'>): Invoice {
  const outstanding = Math.max(0, inv.total - inv.paid);
  return { ...inv, outstanding, status: statusOf(inv.total, inv.paid, inv.dueDate) };
}

const MODES: PaymentMode[] = ['Cash', 'Online', 'Cheque'];

function seedInvoices(structures: FeeStructure[]): Invoice[] {
  const out: Invoice[] = [];
  let n = 0;
  STUDENTS.slice(0, 30).forEach((s, i) => {
    const st = structures.find((x) => x.classId === s.classId);
    if (!st) return;
    for (let term = 1; term <= 2; term += 1) {
      n += 1;
      const items: InvoiceItem[] = st.heads
        .filter((h) => term === 1 || h.name !== 'Admission')
        .map((h) => ({ name: h.name, amount: h.amount }));
      const total = items.reduce((a, b) => a + b.amount, 0);
      const r = term === 1 ? (i * 7) % 10 : (i * 5) % 10;
      let paid = 0;
      if (term === 1) paid = r < 6 ? total : r < 8 ? Math.round(total / 200) * 100 : 0;
      else paid = r < 2 ? total : r < 4 ? Math.round(total / 200) * 100 : 0;
      const dueDate = term === 1 ? '2026-07-15' : ['2026-09-20', '2026-10-20', '2026-11-10'][i % 3];
      const id = `inv${n}`;
      const payments: Payment[] = [];
      if (paid > 0) {
        const mode = MODES[i % 3];
        payments.push({
          id: `p-${id}`,
          invoiceId: id,
          receiptNo: nextReceiptNo(),
          amount: paid,
          mode,
          reference: mode === 'Cash' ? '' : mode === 'Online' ? `UPI${480000 + n * 37}` : `CHQ${100200 + n}`,
          date: term === 1 ? '2026-07-08' : '2026-09-12',
        });
      }
      out.push(finalize({
        id,
        invoiceNo: `INV-2026-${String(n).padStart(4, '0')}`,
        studentId: s.id,
        studentName: s.name,
        classId: s.classId,
        className: s.className,
        period: term === 1 ? 'Term 1' : 'Term 2',
        dueDate,
        items,
        total,
        paid,
        payments,
      }));
    }
  });
  return out;
}

function seedAssignments(structures: FeeStructure[]): Assignment[] {
  return STUDENTS.map((s, i) => ({
    studentId: s.id,
    studentName: s.name,
    classId: s.classId,
    className: s.className,
    rollNo: s.rollNo,
    structureId: i >= 30 || i % 11 === 10 ? null : (structures.find((x) => x.classId === s.classId)?.id ?? null),
  }));
}

/* ------------------------------------------------------------------ */
/* Tiny shared store (state survives switching tabs)                   */
/* ------------------------------------------------------------------ */

interface StoreState {
  invoices: Invoice[];
  structures: FeeStructure[];
  feeTypes: FeeType[];
  assignments: Assignment[];
}

function seed(): StoreState {
  const structures = seedStructures();
  return { invoices: seedInvoices(structures), structures, feeTypes: FEE_TYPES, assignments: seedAssignments(structures) };
}

let state: StoreState = seed();
const listeners = new Set<() => void>();

function setState(fn: (s: StoreState) => StoreState): void {
  state = fn(state);
  listeners.forEach((l) => l());
}
function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
function getState(): StoreState {
  return state;
}
function useStore(): StoreState {
  return useSyncExternalStore(subscribe, getState, getState);
}

let uid = 1000;
function nextId(prefix: string): string {
  uid += 1;
  return `${prefix}${uid}`;
}

/** Simulated network latency (initial load + manual refresh). */
function useFakeLoading(ms = 500): { isLoading: boolean; refetch: () => void } {
  const [isLoading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const run = useCallback(() => {
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), ms);
  }, [ms]);
  useEffect(() => {
    run();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [run]);
  return { isLoading, refetch: run };
}

/* ------------------------------------------------------------------ */
/* Invoices                                                            */
/* ------------------------------------------------------------------ */

export interface InvoiceParams {
  search?: string;
  student?: string;
  classId?: string;
  status?: InvoiceStatus | '';
  /** ISO date */
  dueDate?: string;
  page: number;
  pageSize: number;
}
export interface InvoiceStats { total: number; issued: number; overdue: number; paid: number }

/** Records a payment across the selected invoices (oldest due date first). */
export function collectPayment(input: CollectInput): CollectResult {
  const selected = state.invoices
    .filter((i) => input.invoiceIds.includes(i.id) && i.studentId === input.studentId && i.outstanding > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  if (selected.length === 0) return { ok: false, error: 'Select at least one pending invoice.' };
  const due = selected.reduce((a, b) => a + b.outstanding, 0);
  if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, error: 'Enter a valid amount.' };
  if (input.amount > due) return { ok: false, error: `Amount cannot exceed outstanding ${formatINR(due)}.` };
  if (input.mode !== 'Cash' && !input.reference.trim()) return { ok: false, error: 'Reference number is required.' };

  const receiptNo = nextReceiptNo();
  let remaining = input.amount;
  const lines: ReceiptLine[] = [];
  const updated = new Map<string, Invoice>();
  for (const inv of selected) {
    if (remaining <= 0) break;
    const pay = Math.min(inv.outstanding, remaining);
    remaining -= pay;
    const payment: Payment = {
      id: nextId('p'), invoiceId: inv.id, receiptNo, amount: pay, mode: input.mode,
      reference: input.mode === 'Cash' ? '' : input.reference.trim(), date: TODAY,
    };
    const next = finalize({ ...inv, paid: inv.paid + pay, payments: [...inv.payments, payment] });
    updated.set(inv.id, next);
    lines.push({ invoiceNo: inv.invoiceNo, amount: pay, status: next.status });
  }
  setState((s) => ({ ...s, invoices: s.invoices.map((i) => updated.get(i.id) ?? i) }));
  const stu = selected[0];
  return {
    ok: true,
    receipt: {
      receiptNo, date: TODAY, studentName: stu.studentName, className: stu.className, mode: input.mode,
      reference: input.mode === 'Cash' ? '' : input.reference.trim(), total: input.amount, lines,
    },
  };
}

/** Pending (outstanding > 0) invoices of a student, oldest due first. */
export function usePendingInvoices(studentId: string | null): Invoice[] {
  const { invoices } = useStore();
  return useMemo(
    () => (studentId
      ? invoices.filter((i) => i.studentId === studentId && i.outstanding > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      : []),
    [invoices, studentId],
  );
}

export function useInvoices(params: InvoiceParams) {
  const { invoices } = useStore();
  const { isLoading, refetch } = useFakeLoading();
  const { search, student, classId, status, dueDate, page, pageSize } = params;

  const stats = useMemo<InvoiceStats>(() => ({
    total: invoices.length,
    issued: invoices.filter((i) => i.status === 'Issued').length,
    overdue: invoices.filter((i) => i.status === 'Overdue').length,
    paid: invoices.filter((i) => i.status === 'Paid').length,
  }), [invoices]);

  const filtered = useMemo(() => {
    const q = (search ?? '').trim().toLowerCase();
    const st = (student ?? '').trim().toLowerCase();
    return invoices
      .filter((i) => (!q || i.invoiceNo.toLowerCase().includes(q))
        && (!st || i.studentName.toLowerCase().includes(st))
        && (!classId || i.classId === classId)
        && (!status || i.status === status)
        && (!dueDate || i.dueDate === dueDate))
      .sort((a, b) => b.invoiceNo.localeCompare(a.invoiceNo));
  }, [invoices, search, student, classId, status, dueDate]);

  const data = useMemo(() => filtered.slice(0, page * pageSize), [filtered, page, pageSize]);

  /** Always returns the live version of an invoice (for open detail sheets). */
  const byId = useCallback((id: string) => invoices.find((i) => i.id === id) ?? null, [invoices]);

  return { data, total: filtered.length, stats, isLoading, refetch, byId, collectPayment };
}

/* ------------------------------------------------------------------ */
/* Fee structures + fee types                                          */
/* ------------------------------------------------------------------ */

function buildHeads(prefix: string, heads: FeeHeadInput[], types: FeeType[]): FeeHead[] {
  return heads.map((h, i) => ({
    id: `${prefix}-h${i + 1}-${nextId('')}`,
    feeTypeId: h.feeTypeId,
    name: types.find((t) => t.id === h.feeTypeId)?.name ?? 'Fee',
    amount: h.amount,
  }));
}

export function useFeeStructures() {
  const { structures, feeTypes } = useStore();
  const { isLoading, refetch } = useFakeLoading(400);

  const addStructure = useCallback((input: StructureInput) => {
    setState((s) => {
      const cls = CLASSES.find((c) => c.id === input.classId);
      if (!cls) return s;
      const id = nextId('fs');
      const st: FeeStructure = { id, classId: cls.id, className: cls.name, heads: buildHeads(id, input.heads, s.feeTypes) };
      return { ...s, structures: [...s.structures, st] };
    });
  }, []);

  const updateStructure = useCallback((id: string, input: StructureInput) => {
    setState((s) => {
      const cls = CLASSES.find((c) => c.id === input.classId);
      if (!cls) return s;
      return {
        ...s,
        structures: s.structures.map((x) => (x.id === id
          ? { ...x, classId: cls.id, className: cls.name, heads: buildHeads(id, input.heads, s.feeTypes) }
          : x)),
        assignments: s.assignments.map((a) => (a.structureId === id && a.classId !== cls.id ? { ...a, structureId: null } : a)),
      };
    });
  }, []);

  const removeStructure = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      structures: s.structures.filter((x) => x.id !== id),
      assignments: s.assignments.map((a) => (a.structureId === id ? { ...a, structureId: null } : a)),
    }));
  }, []);

  /** Returns an error message, or null on success. */
  const addFeeType = useCallback((name: string): string | null => {
    const n = name.trim();
    if (n.length < 2) return 'Name must be at least 2 characters.';
    if (state.feeTypes.some((t) => t.name.toLowerCase() === n.toLowerCase())) return 'This fee type already exists.';
    setState((s) => ({ ...s, feeTypes: [...s.feeTypes, { id: nextId('ft'), name: n }] }));
    return null;
  }, []);

  const removeFeeType = useCallback((id: string): string | null => {
    if (state.structures.some((st) => st.heads.some((h) => h.feeTypeId === id))) {
      return 'This fee type is used in a fee structure.';
    }
    setState((s) => ({ ...s, feeTypes: s.feeTypes.filter((t) => t.id !== id) }));
    return null;
  }, []);

  return { structures, feeTypes, isLoading, refetch, addStructure, updateStructure, removeStructure, addFeeType, removeFeeType };
}

/* ------------------------------------------------------------------ */
/* Assignments                                                         */
/* ------------------------------------------------------------------ */

export interface AssignmentParams { search?: string; classId?: string; page: number; pageSize: number }

export function useAssignments(params: AssignmentParams) {
  const { assignments, structures } = useStore();
  const { isLoading, refetch } = useFakeLoading(400);
  const { search, classId, page, pageSize } = params;

  const filtered = useMemo<AssignmentRow[]>(() => {
    const q = (search ?? '').trim().toLowerCase();
    return assignments
      .filter((a) => (!q || a.studentName.toLowerCase().includes(q)) && (!classId || a.classId === classId))
      .map((a) => {
        const st = structures.find((x) => x.id === a.structureId);
        return { ...a, structureName: st ? st.className : null, structureTotal: st ? structureTotal(st) : null };
      });
  }, [assignments, structures, search, classId]);

  const data = useMemo(() => filtered.slice(0, page * pageSize), [filtered, page, pageSize]);

  const assign = useCallback((studentId: string, structureId: string | null) => {
    setState((s) => ({ ...s, assignments: s.assignments.map((a) => (a.studentId === studentId ? { ...a, structureId } : a)) }));
  }, []);

  /** Assigns a structure to every student of a class; returns the number of students affected. */
  const assignClass = useCallback((cid: string, structureId: string): number => {
    const count = state.assignments.filter((a) => a.classId === cid).length;
    setState((s) => ({ ...s, assignments: s.assignments.map((a) => (a.classId === cid ? { ...a, structureId } : a)) }));
    return count;
  }, []);

  const assignedCount = useMemo(() => assignments.filter((a) => a.structureId).length, [assignments]);

  return { data, total: filtered.length, structures, assignedCount, totalStudents: assignments.length, isLoading, refetch, assign, assignClass };
}

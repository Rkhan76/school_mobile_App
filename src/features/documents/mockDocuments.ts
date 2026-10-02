import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

export const TODAY_ISO = '2026-10-02';
export const REQUESTED_BY = 'School Admin';

/* ----------------------------- types ----------------------------- */

export type PersonRole = 'Student' | 'Teacher' | 'Staff';
export const ROLES: PersonRole[] = ['Student', 'Teacher', 'Staff'];

export type RequestStatus = 'OPEN' | 'FULFILLED' | 'CANCELLED';
/** Filter value: a real status or the derived "OVERDUE" (open + past due). */
export type StatusFilter = '' | RequestStatus | 'OVERDUE';

export interface Person {
  id: string;
  name: string;
  role: PersonRole;
}

export interface DocumentType {
  id: string;
  name: string;
  mandatory: boolean;
  appliesTo: PersonRole[];
  expiryRequired: boolean;
}
export type DocumentTypeInput = Omit<DocumentType, 'id'>;

export interface DocumentRequest {
  id: string;
  personId: string;
  personName: string;
  role: PersonRole;
  typeId: string;
  documentName: string;
  note: string;
  /** ISO yyyy-mm-dd */
  dueDate: string;
  status: RequestStatus;
  requestedBy: string;
  /** ISO or null = never */
  lastRemindedAt: string | null;
}

export interface ReviewItem {
  id: string;
  personName: string;
  role: PersonRole;
  documentName: string;
  fileName: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason: string | null;
}

export interface ExpiringDoc {
  id: string;
  personId: string;
  personName: string;
  role: PersonRole;
  typeId: string;
  documentName: string;
  expiresAt: string;
  renewalRequested: boolean;
}

export interface RequestParams {
  search: string;
  status: StatusFilter;
  role: PersonRole | '';
  typeId: string;
  overdueOnly: boolean;
  page: number;
  pageSize: number;
}

export interface BulkInput {
  typeId: string;
  dueDate: string;
  personIds: string[];
}

/* ----------------------------- dates ----------------------------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

/** ISO -> "10 Oct 2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}

/** "10/10/2026" -> ISO, or null when malformed / not a real date. */
export function inputToIso(text: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const d = Number(match[1]);
  const m = Number(match[2]);
  const y = Number(match[3]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

/** Whole days from today to the ISO date (negative = past). */
export function daysFromToday(iso: string): number {
  return dayNumber(iso) - dayNumber(TODAY_ISO);
}

export function isOverdue(r: Pick<DocumentRequest, 'status' | 'dueDate'>): boolean {
  return r.status === 'OPEN' && r.dueDate < TODAY_ISO;
}

/* ----------------------------- tiny store ----------------------------- */

interface Store<T> {
  get: () => T;
  set: (fn: (s: T) => T) => void;
  subscribe: (cb: () => void) => () => void;
}

function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const subs = new Set<() => void>();
  return {
    get: () => state,
    set: (fn) => {
      state = fn(state);
      subs.forEach((s) => s());
    },
    subscribe: (cb) => {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
  };
}

function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** Simulated network latency; `key` change or refetch() re-triggers it. */
function useSimLoading(key: string): { isLoading: boolean; refetch: () => void } {
  const [nonce, setNonce] = useState(0);
  const [isLoading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [key, nonce]);
  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  return { isLoading, refetch };
}

/* ----------------------------- seed data ----------------------------- */

const STUDENT_NAMES = [
  'Test Student', 'Laksh Nair', 'Avni Rao', 'Mahi Reddy', 'Veer Gupta', 'Anika Nair', 'Kiara Sharma',
  'Siya Sharma', 'Siya Singh', 'Veer Singh', 'Aarav Mehta', 'Diya Patel', 'Rohan Iyer', 'Ishita Das',
  'Kabir Khan', 'Myra Joshi', 'Neel Verma', 'Tara Menon', 'Yash Kapoor', 'Zoya Ali', 'Arjun Bose',
  'Pari Saxena', 'Reyansh Jain', 'Sana Qureshi',
];
const TEACHER_NAMES = ['Meera Krishnan', 'Rajesh Pillai', 'Sunita Deshmukh', 'Anil Chauhan', 'Pooja Bhatt'];
const STAFF_NAMES = ['Harish Kumar', 'Lata Fernandes', 'Imran Sheikh'];

export const PEOPLE: Person[] = [
  ...STUDENT_NAMES.map((name, i): Person => ({ id: `s${i + 1}`, name, role: 'Student' })),
  ...TEACHER_NAMES.map((name, i): Person => ({ id: `t${i + 1}`, name, role: 'Teacher' })),
  ...STAFF_NAMES.map((name, i): Person => ({ id: `f${i + 1}`, name, role: 'Staff' })),
];

const SEED_TYPES: DocumentType[] = [
  { id: 'dt1', name: 'Aadhaar Card', mandatory: true, appliesTo: ['Student', 'Teacher', 'Staff'], expiryRequired: false },
  { id: 'dt2', name: 'Birth Certificate', mandatory: true, appliesTo: ['Student'], expiryRequired: false },
  { id: 'dt3', name: 'Transfer Certificate', mandatory: false, appliesTo: ['Student'], expiryRequired: false },
  { id: 'dt4', name: 'Medical Clearance', mandatory: true, appliesTo: ['Student', 'Teacher', 'Staff'], expiryRequired: true },
  { id: 'dt5', name: 'Passport Photo', mandatory: false, appliesTo: ['Student', 'Teacher', 'Staff'], expiryRequired: false },
  { id: 'dt6', name: 'Teaching Licence', mandatory: true, appliesTo: ['Teacher'], expiryRequired: true },
  { id: 'dt7', name: 'Police Verification', mandatory: true, appliesTo: ['Teacher', 'Staff'], expiryRequired: true },
];

function seedRequests(): DocumentRequest[] {
  const base = (p: Person, typeId: string, name: string, over: Partial<DocumentRequest>): DocumentRequest => ({
    id: `rq-${p.id}-${typeId}`,
    personId: p.id,
    personName: p.name,
    role: p.role,
    typeId,
    documentName: name,
    note: 'test',
    dueDate: '2026-10-10',
    status: 'OPEN',
    requestedBy: REQUESTED_BY,
    lastRemindedAt: null,
    ...over,
  });
  const list: DocumentRequest[] = PEOPLE.slice(0, 24).map((p, i) =>
    base(p, 'dt1', 'Aadhaar Card', i === 0 ? { status: 'FULFILLED' } : {}),
  );
  const teachers = PEOPLE.filter((p) => p.role === 'Teacher');
  teachers.slice(0, 3).forEach((p, i) =>
    list.push(base(p, 'dt6', 'Teaching Licence', {
      dueDate: i === 0 ? '2026-09-25' : '2026-10-20',
      note: 'Annual renewal',
      lastRemindedAt: i === 0 ? '2026-09-28' : null,
    })),
  );
  list.push(base(PEOPLE[10], 'dt2', 'Birth Certificate', { dueDate: '2026-09-30', note: 'Original scan' }));
  list.push(base(PEOPLE[11], 'dt4', 'Medical Clearance', { dueDate: '2026-10-15', status: 'FULFILLED', note: 'Annual check' }));
  list.push(base(PEOPLE[12], 'dt5', 'Passport Photo', { dueDate: '2026-10-05', status: 'CANCELLED', note: 'No longer needed' }));
  return list;
}

const SEED_REVIEW: ReviewItem[] = [
  { id: 'rv1', personName: 'Laksh Nair', role: 'Student', documentName: 'Aadhaar Card', fileName: 'laksh_aadhaar.pdf', uploadedAt: '2026-10-01', status: 'PENDING', rejectReason: null },
  { id: 'rv2', personName: 'Avni Rao', role: 'Student', documentName: 'Birth Certificate', fileName: 'avni_birth_cert.jpg', uploadedAt: '2026-10-01', status: 'PENDING', rejectReason: null },
  { id: 'rv3', personName: 'Meera Krishnan', role: 'Teacher', documentName: 'Teaching Licence', fileName: 'meera_licence_2026.pdf', uploadedAt: '2026-09-30', status: 'PENDING', rejectReason: null },
  { id: 'rv4', personName: 'Mahi Reddy', role: 'Student', documentName: 'Medical Clearance', fileName: 'mahi_medical.pdf', uploadedAt: '2026-09-29', status: 'PENDING', rejectReason: null },
  { id: 'rv5', personName: 'Harish Kumar', role: 'Staff', documentName: 'Police Verification', fileName: 'harish_pv.png', uploadedAt: '2026-09-28', status: 'PENDING', rejectReason: null },
  { id: 'rv6', personName: 'Kiara Sharma', role: 'Student', documentName: 'Passport Photo', fileName: 'kiara_photo.jpg', uploadedAt: '2026-09-27', status: 'PENDING', rejectReason: null },
];

const SEED_EXPIRING: ExpiringDoc[] = [
  { id: 'ex1', personId: 't1', personName: 'Meera Krishnan', role: 'Teacher', typeId: 'dt6', documentName: 'Teaching Licence', expiresAt: '2026-10-09', renewalRequested: false },
  { id: 'ex2', personId: 'f1', personName: 'Harish Kumar', role: 'Staff', typeId: 'dt7', documentName: 'Police Verification', expiresAt: '2026-10-21', renewalRequested: false },
  { id: 'ex3', personId: 's11', personName: 'Aarav Mehta', role: 'Student', typeId: 'dt4', documentName: 'Medical Clearance', expiresAt: '2026-10-28', renewalRequested: false },
  { id: 'ex4', personId: 't2', personName: 'Rajesh Pillai', role: 'Teacher', typeId: 'dt6', documentName: 'Teaching Licence', expiresAt: '2026-11-14', renewalRequested: false },
  { id: 'ex5', personId: 's14', personName: 'Ishita Das', role: 'Student', typeId: 'dt4', documentName: 'Medical Clearance', expiresAt: '2026-11-25', renewalRequested: false },
  { id: 'ex6', personId: 'f2', personName: 'Lata Fernandes', role: 'Staff', typeId: 'dt7', documentName: 'Police Verification', expiresAt: '2026-12-05', renewalRequested: false },
  { id: 'ex7', personId: 't3', personName: 'Sunita Deshmukh', role: 'Teacher', typeId: 'dt7', documentName: 'Police Verification', expiresAt: '2026-12-18', renewalRequested: false },
  { id: 'ex8', personId: 's16', personName: 'Myra Joshi', role: 'Student', typeId: 'dt4', documentName: 'Medical Clearance', expiresAt: '2026-09-29', renewalRequested: false },
];

const requestStore = createStore<DocumentRequest[]>(seedRequests());
const reviewStore = createStore<ReviewItem[]>(SEED_REVIEW);
const expiringStore = createStore<ExpiringDoc[]>(SEED_EXPIRING);
const typeStore = createStore<DocumentType[]>(SEED_TYPES);

let idCounter = 1000;
const nextId = (p: string) => `${p}-${idCounter++}`;

/* ----------------------------- hooks ----------------------------- */

export function useRequests(params: RequestParams) {
  const all = useStore(requestStore);
  const key = `${params.search}|${params.status}|${params.role}|${params.typeId}|${params.overdueOnly}`;
  const { isLoading, refetch } = useSimLoading(key);

  const filtered = useMemo(() => {
    const q = params.search.trim().toLowerCase();
    return all.filter((r) => {
      if (q && !`${r.personName} ${r.documentName}`.toLowerCase().includes(q)) return false;
      if (params.status === 'OVERDUE') {
        if (!isOverdue(r)) return false;
      } else if (params.status && r.status !== params.status) return false;
      if (params.overdueOnly && !isOverdue(r)) return false;
      if (params.role && r.role !== params.role) return false;
      if (params.typeId && r.typeId !== params.typeId) return false;
      return true;
    });
  }, [all, params.search, params.status, params.role, params.typeId, params.overdueOnly]);

  const data = useMemo(() => filtered.slice(0, params.page * params.pageSize), [filtered, params.page, params.pageSize]);

  const remind = useCallback((id: string) => {
    requestStore.set((s) => s.map((r) => (r.id === id ? { ...r, lastRemindedAt: TODAY_ISO } : r)));
  }, []);
  const cancel = useCallback((id: string) => {
    requestStore.set((s) => s.map((r) => (r.id === id && r.status === 'OPEN' ? { ...r, status: 'CANCELLED' } : r)));
  }, []);
  /** Creates open requests; skips people who already have an open request for the type. */
  const bulkCreate = useCallback((input: BulkInput): { created: number; skipped: number } => {
    const type = typeStore.get().find((t) => t.id === input.typeId);
    if (!type) return { created: 0, skipped: input.personIds.length };
    const existing = requestStore.get();
    const fresh: DocumentRequest[] = [];
    let skipped = 0;
    input.personIds.forEach((pid) => {
      const person = PEOPLE.find((p) => p.id === pid);
      if (!person) return;
      if (existing.some((r) => r.personId === pid && r.typeId === type.id && r.status === 'OPEN')) {
        skipped += 1;
        return;
      }
      fresh.push({
        id: nextId('rq'), personId: person.id, personName: person.name, role: person.role,
        typeId: type.id, documentName: type.name, note: '', dueDate: input.dueDate, status: 'OPEN',
        requestedBy: REQUESTED_BY, lastRemindedAt: null,
      });
    });
    if (fresh.length) requestStore.set((s) => [...fresh, ...s]);
    return { created: fresh.length, skipped };
  }, []);

  return { data, total: filtered.length, isLoading, refetch, remind, cancel, bulkCreate };
}

export function useReviewQueue() {
  const all = useStore(reviewStore);
  const { isLoading, refetch } = useSimLoading('review');
  const data = useMemo(() => all.filter((r) => r.status === 'PENDING'), [all]);
  const approve = useCallback((id: string) => {
    reviewStore.set((s) => s.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r)));
  }, []);
  const reject = useCallback((id: string, reason: string) => {
    reviewStore.set((s) => s.map((r) => (r.id === id ? { ...r, status: 'REJECTED', rejectReason: reason } : r)));
  }, []);
  return { data, isLoading, refetch, approve, reject };
}

export function useExpiring(days: number) {
  const all = useStore(expiringStore);
  const { isLoading, refetch } = useSimLoading(`exp-${days}`);
  const data = useMemo(
    () => all.filter((d) => daysFromToday(d.expiresAt) <= days).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt)),
    [all, days],
  );
  /** Marks renewal requested and opens a request (due in 14 days). */
  const requestRenewal = useCallback((id: string) => {
    const doc = expiringStore.get().find((d) => d.id === id);
    if (!doc || doc.renewalRequested) return;
    expiringStore.set((s) => s.map((d) => (d.id === id ? { ...d, renewalRequested: true } : d)));
    const due = new Date(Date.UTC(2026, 9, 2 + 14)).toISOString().slice(0, 10);
    requestStore.set((s) => [
      {
        id: nextId('rq'), personId: doc.personId, personName: doc.personName, role: doc.role, typeId: doc.typeId,
        documentName: doc.documentName, note: 'Renewal', dueDate: due, status: 'OPEN',
        requestedBy: REQUESTED_BY, lastRemindedAt: null,
      },
      ...s,
    ]);
  }, []);
  return { data, isLoading, refetch, requestRenewal };
}

export function useDocumentTypes() {
  const data = useStore(typeStore);
  const { isLoading, refetch } = useSimLoading('types');
  const add = useCallback((input: DocumentTypeInput) => {
    typeStore.set((s) => [...s, { ...input, id: nextId('dt') }]);
  }, []);
  const update = useCallback((id: string, input: DocumentTypeInput) => {
    typeStore.set((s) => s.map((t) => (t.id === id ? { ...t, ...input } : t)));
  }, []);
  const remove = useCallback((id: string) => {
    typeStore.set((s) => s.filter((t) => t.id !== id));
  }, []);
  return { data, isLoading, refetch, add, update, remove };
}

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

export type TabKey = 'academicYears' | 'examTypes' | 'feeTypes' | 'leaveTypes' | 'periods' | 'documentCategories';

export interface AcademicYear { id: string; label: string; startDate: string; endDate: string; isActive: boolean }
export interface ExamType { id: string; name: string; description: string; isActive: boolean }
export interface FeeType { id: string; name: string; description: string }
export interface LeaveType { id: string; name: string; daysAllowed: number }
export interface Period { id: string; name: string; startTime: string; endTime: string }
export interface DocumentCategory { id: string; name: string; isMandatory: boolean }

export interface MasterEntityMap {
  academicYears: AcademicYear;
  examTypes: ExamType;
  feeTypes: FeeType;
  leaveTypes: LeaveType;
  periods: Period;
  documentCategories: DocumentCategory;
}

export type Draft<K extends TabKey> = Omit<MasterEntityMap[K], 'id'>;

type Store = { [K in TabKey]: MasterEntityMap[K][] };

const seed = (): Store => ({
  academicYears: [
    { id: 'ay1', label: '2026-2027', startDate: '01/04/2026', endDate: '31/03/2027', isActive: true },
    { id: 'ay2', label: '2025-2026', startDate: '01/04/2025', endDate: '31/03/2026', isActive: false },
  ],
  examTypes: [
    { id: 'et1', name: 'Unit Test 1', description: 'First monthly unit assessment', isActive: true },
    { id: 'et2', name: 'Half Yearly', description: 'Mid-year examination', isActive: true },
    { id: 'et3', name: 'Yearly', description: 'Annual final examination', isActive: true },
    { id: 'et4', name: 'Practical', description: 'Lab and practical assessment', isActive: false },
  ],
  feeTypes: [
    { id: 'ft1', name: 'Tuition', description: 'Monthly tuition fee' },
    { id: 'ft2', name: 'Lab', description: 'Science and computer lab charges' },
    { id: 'ft3', name: 'Transport', description: 'School bus service' },
    { id: 'ft4', name: 'Admission', description: 'One-time admission fee' },
  ],
  leaveTypes: [
    { id: 'lt1', name: 'Casual', daysAllowed: 12 },
    { id: 'lt2', name: 'Sick', daysAllowed: 10 },
    { id: 'lt3', name: 'Earned', daysAllowed: 15 },
  ],
  periods: [
    { id: 'p1', name: 'Period 1', startTime: '09:00', endTime: '09:45' },
    { id: 'p2', name: 'Period 2', startTime: '09:45', endTime: '10:30' },
    { id: 'p3', name: 'Lunch', startTime: '12:30', endTime: '13:15' },
  ],
  documentCategories: [
    { id: 'dc1', name: 'Birth Certificate', isMandatory: true },
    { id: 'dc2', name: 'Transfer Certificate', isMandatory: true },
    { id: 'dc3', name: 'Medical Records', isMandatory: false },
  ],
});

export interface MasterData<K extends TabKey> {
  data: MasterEntityMap[K][];
  isLoading: boolean;
  refetch: () => void;
  add: (draft: Draft<K>) => void;
  update: (id: string, patch: Partial<Draft<K>>) => void;
  remove: (id: string) => void;
  /** Academic years only: makes exactly one record active. */
  setActive: (id: string) => void;
}

let counter = 100;
let store: Store = seed();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getSnapshot = () => store;
const commit = (next: Store) => { store = next; listeners.forEach((l) => l()); };

/** Local-state CRUD for one master tab (module store so edits survive tab switches); swap for API calls later. */
export function useMasterData<K extends TabKey>(tab: K): MasterData<K> {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [isLoading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, [tab, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  const mutate = useCallback((fn: (rows: MasterEntityMap[K][]) => MasterEntityMap[K][]) => {
    commit({ ...store, [tab]: fn(store[tab] as MasterEntityMap[K][]) });
  }, [tab]);

  const add = useCallback((draft: Draft<K>) => {
    counter += 1;
    const row = { ...draft, id: `new${counter}` } as MasterEntityMap[K];
    mutate((rows) => [...rows, row]);
  }, [mutate]);

  const update = useCallback((id: string, patch: Partial<Draft<K>>) => {
    mutate((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, [mutate]);

  const remove = useCallback((id: string) => mutate((rows) => rows.filter((r) => r.id !== id)), [mutate]);

  const setActive = useCallback((id: string) => {
    commit({ ...store, academicYears: store.academicYears.map((y) => ({ ...y, isActive: y.id === id })) });
  }, []);

  return { data: snap[tab] as MasterEntityMap[K][], isLoading, refetch, add, update, remove, setActive };
}

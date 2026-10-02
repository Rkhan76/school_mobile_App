import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildStaff, buildStudents,
  type AttendanceStatus, type StaffMember, type StudentRecord,
} from './mockAttendance';

type Row = { id: string; status: AttendanceStatus | null; remarks: string };
type Saved = Record<string, { status: AttendanceStatus | null; remarks: string }>;

/** In-memory "server": a roster key that was saved once answers 409 until overwritten. */
const savedStore = new Map<string, Saved>();

export type SaveResult = 'saved' | 'conflict';

export type RosterApi<T extends Row> = {
  data: T[];
  isLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;
  dirty: boolean;
  refetch: () => void;
  setStatus: (id: string, status: AttendanceStatus | null) => void;
  setRemarks: (id: string, remarks: string) => void;
  markAll: (status: AttendanceStatus) => void;
  save: (overwrite?: boolean) => Promise<SaveResult>;
};

function useRoster<T extends Row>(storeKey: string | null, build: () => T[]): RosterApi<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [nonce, setNonce] = useState(0);
  const buildRef = useRef(build);
  buildRef.current = build;
  const soft = useRef(false);

  useEffect(() => {
    setDirty(false);
    if (!storeKey) {
      setRows([]);
      setLoading(false);
      setRefreshing(false);
      return undefined;
    }
    if (soft.current) setRefreshing(true);
    else {
      setRows([]);
      setLoading(true);
    }
    soft.current = false;
    const t = setTimeout(() => {
      const saved = savedStore.get(storeKey);
      const base = buildRef.current();
      setRows(saved ? base.map((r) => ({ ...r, ...saved[r.id] })) : base);
      setLoading(false);
      setRefreshing(false);
    }, 600);
    return () => clearTimeout(t);
  }, [storeKey, nonce]);

  const refetch = useCallback(() => {
    soft.current = true;
    setNonce((n) => n + 1);
  }, []);

  const setStatus = useCallback((id: string, status: AttendanceStatus | null) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    setDirty(true);
  }, []);

  const setRemarks = useCallback((id: string, remarks: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, remarks } : r)));
    setDirty(true);
  }, []);

  const markAll = useCallback((status: AttendanceStatus) => {
    setRows((rs) => rs.map((r) => ({ ...r, status })));
    setDirty(true);
  }, []);

  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const save = useCallback(
    async (overwrite = false): Promise<SaveResult> => {
      if (!storeKey) return 'conflict';
      setSaving(true);
      await new Promise<void>((res) => setTimeout(res, 500));
      setSaving(false);
      if (savedStore.has(storeKey) && !overwrite) return 'conflict';
      const snap: Saved = {};
      rowsRef.current.forEach((r) => {
        snap[r.id] = { status: r.status, remarks: r.remarks };
      });
      savedStore.set(storeKey, snap);
      setDirty(false);
      return 'saved';
    },
    [storeKey],
  );

  return useMemo(
    () => ({ data: rows, isLoading, isRefreshing, isSaving, dirty, refetch, setStatus, setRemarks, markAll, save }),
    [rows, isLoading, isRefreshing, isSaving, dirty, refetch, setStatus, setRemarks, markAll, save],
  );
}

/** `date` is ISO YYYY-MM-DD. */
export function useStaffRoster(date: string): RosterApi<StaffMember> {
  return useRoster<StaffMember>(`staff|${date}`, buildStaff);
}

export function useStudentRoster(
  classId: string | null,
  sectionId: string | null,
  date: string,
): RosterApi<StudentRecord> {
  const key = classId && sectionId ? `student|${classId}|${sectionId}|${date}` : null;
  return useRoster<StudentRecord>(key, () => buildStudents(classId ?? 'c1', sectionId ?? 'A'));
}

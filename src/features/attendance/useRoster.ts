import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '../auth/session';
import { getClassAttendance, getClassRoster, markBulk } from './api';
import { buildStaff, type AttendanceStatus, type StaffMember } from './mockAttendance';
import type { StudentRecord } from './types';

type Row = { id: string; status: AttendanceStatus | null; remarks: string };
type Saved = Record<string, { status: AttendanceStatus | null; remarks: string }>;

/** In-memory "server" for the (still-mock) staff roster: a roster key that was
 * saved once answers 409 until overwritten. Staff attendance has no real
 * backend yet (MOBILE_API_DOCS.md §9 explicitly scopes that module out). */
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
  /** true when the signed-in user has no permission to mark/edit — roster should render read-only. */
  readOnly?: boolean;
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

/** `date` is ISO YYYY-MM-DD. Staff attendance stays on mock data — untouched. */
export function useStaffRoster(date: string): RosterApi<StaffMember> {
  return useRoster<StaffMember>(`staff|${date}`, buildStaff);
}

/* ------------------------------------------------------------------------ */
/* Student roster — real backend (GET roster + GET attendance, merged;      */
/* save = POST /attendance/bulk then refetch for confirmed state).          */
/* ------------------------------------------------------------------------ */

const CAN_MARK_PERMISSIONS = ['attendance.record.create', 'attendance.override.create'];

export function useStudentRoster(
  classId: string | null,
  sectionId: string | null,
  date: string,
): RosterApi<StudentRecord> {
  const permissions = useSession((s) => s.permissions);
  const canWrite = permissions.some((p) => CAN_MARK_PERMISSIONS.includes(p));

  const [rows, setRows] = useState<StudentRecord[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [nonce, setNonce] = useState(0);
  const soft = useRef(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  useEffect(() => {
    setDirty(false);
    if (!classId) {
      setRows([]);
      setLoading(false);
      setRefreshing(false);
      return undefined;
    }
    let cancelled = false;
    if (soft.current) setRefreshing(true);
    else {
      setRows([]);
      setLoading(true);
    }
    soft.current = false;

    (async () => {
      try {
        const [roster, attendance] = await Promise.all([
          getClassRoster(classId, sectionId ?? undefined),
          getClassAttendance(classId, date),
        ]);
        if (cancelled) return;
        const byStudent = new Map(attendance.map((a) => [a.studentId, a]));
        const merged: StudentRecord[] = roster.map((s, i) => {
          const a = byStudent.get(s.id);
          const rollFromServer = Number(s.rollNumber);
          return {
            id: s.id,
            rollNo: Number.isFinite(rollFromServer) && rollFromServer > 0 ? rollFromServer : i + 1,
            name: s.fullName,
            admissionNo: s.admissionNumber,
            status: a ? a.status : null,
            remarks: a?.remarks ?? '',
            attendanceId: a?.id ?? null,
          };
        });
        merged.sort((x, y) => x.rollNo - y.rollNo || x.name.localeCompare(y.name));
        setRows(merged);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [classId, sectionId, date, nonce]);

  const refetch = useCallback(() => {
    soft.current = true;
    setNonce((n) => n + 1);
  }, []);

  const setStatus = useCallback(
    (id: string, status: AttendanceStatus | null) => {
      if (!canWrite) return;
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      setDirty(true);
    },
    [canWrite],
  );

  const setRemarks = useCallback(
    (id: string, remarks: string) => {
      if (!canWrite) return;
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, remarks } : r)));
      setDirty(true);
    },
    [canWrite],
  );

  const markAll = useCallback(
    (status: AttendanceStatus) => {
      if (!canWrite) return;
      setRows((rs) => rs.map((r) => ({ ...r, status })));
      setDirty(true);
    },
    [canWrite],
  );

  const save = useCallback(
    async (overwrite = false): Promise<SaveResult> => {
      if (!classId || !canWrite) return 'conflict';
      // Upsert is silent/safe server-side (no real "conflict" response) — this
      // is now purely a client-side nicety before overwriting already-saved rows.
      const hasExisting = rowsRef.current.some((r) => r.attendanceId);
      if (hasExisting && !overwrite) return 'conflict';

      setSaving(true);
      try {
        // The student roster only ever offers the 4 real backend statuses
        // (STUDENT_STATUSES, see ./types) — `r.status` is typed against the
        // wider mock union purely for structural compat with `Row`/`RosterApi`.
        const records = rowsRef.current
          .filter((r): r is StudentRecord & { status: Exclude<AttendanceStatus, 'LEAVE'> } => r.status !== null && r.status !== 'LEAVE')
          .map((r) => ({ studentId: r.id, status: r.status, remarks: r.remarks || undefined }));
        if (records.length > 0) {
          await markBulk({ date, records });
        }
        const refreshed = await getClassAttendance(classId, date);
        const byStudent = new Map(refreshed.map((a) => [a.studentId, a]));
        setRows((rs) =>
          rs.map((r) => {
            const a = byStudent.get(r.id);
            return a ? { ...r, status: a.status, remarks: a.remarks ?? '', attendanceId: a.id } : r;
          }),
        );
        setDirty(false);
        return 'saved';
      } finally {
        setSaving(false);
      }
    },
    [classId, date, canWrite],
  );

  return useMemo(
    () => ({ data: rows, isLoading, isRefreshing, isSaving, dirty, refetch, setStatus, setRemarks, markAll, save, readOnly: !canWrite }),
    [rows, isLoading, isRefreshing, isSaving, dirty, refetch, setStatus, setRemarks, markAll, save, canWrite],
  );
}

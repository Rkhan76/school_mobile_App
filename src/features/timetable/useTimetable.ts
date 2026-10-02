import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../lib/apiClient';
import { getAcademicYearsMaster, getClassesMaster } from '../common/api';
import type { ClassWithSections } from '../common/types';
import { useSession } from '../auth/session';
import {
  createSlot, deleteSlot, getGrid, getMySchedule, listPeriods, updateSlot,
} from './api';
import type {
  CreateSlotPayload, DayOfWeek, Period, TimetableSlot, UpdateSlotPayload,
} from './types';

/* ---------- permissions ---------- */

export function useTimetablePermissions() {
  const permissions = useSession((s) => s.permissions);
  return useMemo(() => {
    const has = (p: string) => permissions.includes(p);
    return {
      canView: has('timetable-slot.list.read'),
      canViewMine: has('timetable-slot.self.read'),
      canListPeriods: has('period-master.list.read'),
      canCreate: has('timetable-slot.record.create') || has('timetable-slot.grid.update'),
      canUpdate: has('timetable-slot.record.update') || has('timetable-slot.grid.update'),
      canDelete: has('timetable-slot.record.delete') || has('timetable-slot.grid.update'),
    };
  }, [permissions]);
}

/* ---------- master data: classes/sections + active academic year ---------- */

export function useClassesMaster() {
  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getClassesMaster()
      .then((rows) => { if (alive) setClasses(rows); })
      .catch(() => { if (alive) setClasses([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return { classes, isLoading };
}

export function useActiveAcademicYearId(): string | null {
  const [yearId, setYearId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getAcademicYearsMaster()
      .then((years) => {
        if (!alive) return;
        const active = years.find((y) => y.isActive) ?? years[0];
        setYearId(active?.id ?? null);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return yearId;
}

/* ---------- periods (row structure: times + which rows are breaks) ---------- */

export function usePeriods(enabled: boolean) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    setLoading(true);
    try {
      const rows = await listPeriods();
      setPeriods([...rows].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch {
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { void load(); }, [load]);

  return { periods, isLoading };
}

/* ---------- a section's weekly grid ---------- */

export function useSectionGrid(sectionId: string | null, academicYearId: string | null, enabled: boolean) {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !sectionId || !academicYearId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const rows = await getGrid(sectionId, academicYearId);
      setSlots(rows);
    } catch (err) {
      setSlots([]);
      setError(err instanceof ApiError ? err.message : 'Could not load the timetable.');
    } finally {
      setLoading(false);
    }
  }, [sectionId, academicYearId, enabled]);

  useEffect(() => { void load(); }, [load]);

  return { slots, isLoading, error, refetch: load };
}

/* ---------- the logged-in user's own schedule (teacher or student) ---------- */

export function useMySchedule(academicYearId: string | null, enabled: boolean) {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !academicYearId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const rows = await getMySchedule(academicYearId);
      setSlots(rows);
    } catch (err) {
      setSlots([]);
      setError(err instanceof ApiError ? err.message : 'Could not load your schedule.');
    } finally {
      setLoading(false);
    }
  }, [academicYearId, enabled]);

  useEffect(() => { void load(); }, [load]);

  return { slots, isLoading, error, refetch: load };
}

/* ---------- single-cell edits (create/update/delete) ---------- */

export type SlotSaveInput = {
  dayOfWeek: DayOfWeek;
  periodId: string;
  subjectId: string;
  teacherId: string;
  roomName: string;
};

export function useSlotMutations(
  sectionId: string | null,
  academicYearId: string | null,
  onChanged: () => void,
) {
  const [isSaving, setSaving] = useState(false);

  const save = useCallback(async (existingId: string | null, input: SlotSaveInput) => {
    if (!sectionId || !academicYearId) throw new Error('Missing section/academic year context.');
    setSaving(true);
    try {
      if (existingId) {
        const payload: UpdateSlotPayload = {
          periodId: input.periodId,
          subjectId: input.subjectId,
          teacherId: input.teacherId,
          roomName: input.roomName || undefined,
        };
        await updateSlot(existingId, payload);
      } else {
        const payload: CreateSlotPayload = {
          academicYearId,
          sectionId,
          dayOfWeek: input.dayOfWeek,
          periodId: input.periodId,
          subjectId: input.subjectId,
          teacherId: input.teacherId,
          roomName: input.roomName || undefined,
        };
        await createSlot(payload);
      }
      onChanged();
    } finally {
      setSaving(false);
    }
  }, [sectionId, academicYearId, onChanged]);

  const remove = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await deleteSlot(id);
      onChanged();
    } finally {
      setSaving(false);
    }
  }, [onChanged]);

  return { save, remove, isSaving };
}

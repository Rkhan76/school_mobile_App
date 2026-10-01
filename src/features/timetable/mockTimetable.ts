import { useCallback, useEffect, useMemo, useState } from 'react';

export type Day = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
export type Option = { value: string; label: string };

export type Period = { id: string; name: string; startTime: string; endTime: string; isBreak: boolean };
export type Slot = {
  day: Day;
  periodId: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  room: string;
};

/** A teacher's period in a given class/section (teacher view). */
export type TeacherEntry = {
  day: Day;
  periodId: string;
  subject: string;
  classLabel: string;
  room: string;
};

export const DAYS: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const DAY_LONG: Record<Day, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday',
};

/** Mock "now": Friday 2 Oct 2026, 10:20 AM. */
export const MOCK_TODAY: Day = 'FRI';
export const MOCK_NOW_MIN = 10 * 60 + 20;

export const PERIODS: Period[] = [
  { id: 'p1', name: 'Period 1', startTime: '08:00', endTime: '08:45', isBreak: false },
  { id: 'p2', name: 'Period 2', startTime: '08:45', endTime: '09:30', isBreak: false },
  { id: 'p3', name: 'Period 3', startTime: '09:30', endTime: '10:15', isBreak: false },
  { id: 'p4', name: 'Period 4', startTime: '10:15', endTime: '11:00', isBreak: false },
  { id: 'recess', name: 'Recess', startTime: '11:00', endTime: '11:30', isBreak: true },
  { id: 'p5', name: 'Period 5', startTime: '11:30', endTime: '12:15', isBreak: false },
  { id: 'p6', name: 'Period 6', startTime: '12:15', endTime: '13:00', isBreak: false },
  { id: 'lunch', name: 'Lunch', startTime: '13:00', endTime: '13:30', isBreak: true },
  { id: 'p7', name: 'Period 7', startTime: '13:30', endTime: '14:15', isBreak: false },
  { id: 'p8', name: 'Period 8', startTime: '14:15', endTime: '15:00', isBreak: false },
];

export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const hh = h ?? 0;
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

export function isCurrentPeriod(p: Period): boolean {
  return MOCK_NOW_MIN >= toMinutes(p.startTime) && MOCK_NOW_MIN < toMinutes(p.endTime);
}

export const TEACHERS: { id: string; name: string }[] = [
  { id: 't1', name: 'Ananya Iyer' },
  { id: 't2', name: 'Diya Verma' },
  { id: 't3', name: 'Saanvi Joshi' },
  { id: 't4', name: 'Aditya Bose' },
  { id: 't5', name: 'Arjun Reddy' },
  { id: 't6', name: 'Kabir Singh' },
  { id: 't7', name: 'Kavya Rao' },
];

export const TEACHER_OPTIONS: Option[] = TEACHERS.map((t) => ({ value: t.id, label: t.name }));

const SUBJECT_TEACHER: Record<string, string> = {
  Hindi: 't1',
  Mathematics: 't2',
  English: 't3',
  'Computer Science': 't4',
  'General Knowledge': 't5',
  'Physical Education': 't5',
  'Art Education': 't3',
  'Moral Science': 't6',
  Music: 't7',
};

export const SUBJECTS = Object.keys(SUBJECT_TEACHER);
export const SUBJECT_OPTIONS: Option[] = SUBJECTS.map((s) => ({ value: s, label: s }));

const SUBJECT_COLORS: Record<string, string> = {
  Hindi: '#f97316',
  Mathematics: '#3b82f6',
  English: '#6366f1',
  'Computer Science': '#0ea5e9',
  'General Knowledge': '#d97706',
  'Physical Education': '#16a34a',
  'Art Education': '#ec4899',
  'Moral Science': '#a855f7',
  Music: '#e11d48',
};

export function subjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] ?? '#25a194';
}

export const CLASS_OPTIONS: Option[] = [
  { value: 'nursery', label: 'Nursery' },
  { value: 'lkg', label: 'LKG' },
  { value: 'ukg', label: 'UKG' },
  ...Array.from({ length: 12 }, (_, i) => ({ value: `class-${i + 1}`, label: `Class ${i + 1}` })),
];
export const SECTION_OPTIONS: Option[] = [
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
];
export const DEFAULT_CLASS = 'nursery';
export const DEFAULT_SECTION = 'A';

export function classLabel(classId: string, sectionId: string): string {
  const c = CLASS_OPTIONS.find((o) => o.value === classId)?.label ?? classId;
  return `${c} - ${sectionId}`;
}

/* ---------- schedule generation ---------- */

const [HI, MA, EN, CS, GK, PE, AR, MS, MU] = [
  'Hindi', 'Mathematics', 'English', 'Computer Science', 'General Knowledge',
  'Physical Education', 'Art Education', 'Moral Science', 'Music',
];

/** Nursery / Section A, exactly as on the web (rows = periods 1,2,3,4,5,6,7,8; cols = MON..SAT). */
const NURSERY_A: string[][] = [
  [HI, HI, HI, HI, HI, MS],
  [HI, HI, HI, MA, MA, MS],
  [MA, MA, MA, EN, EN, MS],
  [MA, MA, MA, CS, CS, MS],
  [EN, EN, EN, GK, GK, MU],
  [EN, CS, CS, PE, PE, MU],
  [CS, GK, GK, AR, AR, MU],
  [CS, PE, PE, AR, AR, MU],
];

const TEACHING_PERIODS = PERIODS.filter((p) => !p.isBreak);

function hash(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h;
}

function makeSlot(day: Day, periodId: string, subject: string, room: string): Slot {
  const teacherId = SUBJECT_TEACHER[subject] ?? '';
  const teacherName = TEACHERS.find((t) => t.id === teacherId)?.name ?? '';
  return { day, periodId, subject, teacherId, teacherName, room };
}

function generate(classId: string, sectionId: string): Slot[] {
  const isBase = classId === DEFAULT_CLASS && sectionId === DEFAULT_SECTION;
  const seed = hash(`${classId}-${sectionId}`);
  const ci = Math.max(0, CLASS_OPTIONS.findIndex((o) => o.value === classId));
  const room = (sectionId === 'A' ? 100 : 200) + ci + 1;
  const out: Slot[] = [];
  DAYS.forEach((day, d) => {
    TEACHING_PERIODS.forEach((p, i) => {
      let subject: string;
      if (isBase) {
        subject = NURSERY_A[i]?.[d] ?? EN;
      } else {
        // Two consecutive periods share a subject, like the template; offsets vary per class/section.
        const idx = (seed + d * 3 + Math.floor(i / 2) * 5 + (i % 2 === 1 && d === 5 ? 1 : 0)) % SUBJECTS.length;
        subject = SUBJECTS[idx] ?? EN;
      }
      out.push(makeSlot(day, p.id, subject, isBase ? '' : `Room ${room}`));
    });
  });
  return out;
}

/* ---------- in-memory store (local edits survive navigation until reload) ---------- */

const store = new Map<string, Slot[]>();
const keyOf = (classId: string, sectionId: string) => `${classId}|${sectionId}`;

function getSlots(classId: string, sectionId: string): Slot[] {
  const k = keyOf(classId, sectionId);
  let s = store.get(k);
  if (!s) {
    s = generate(classId, sectionId);
    store.set(k, s);
  }
  return s;
}

const LATENCY = 500;

export type SlotInput = { subject: string; teacherId: string; room: string };

export function useTimetable(classId: string, sectionId: string) {
  const [isLoading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), LATENCY);
    return () => clearTimeout(t);
  }, [classId, sectionId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const slots = useMemo(() => getSlots(classId, sectionId).slice(), [classId, sectionId, version]);

  const refetch = useCallback(
    () => new Promise<void>((resolve) => {
      setTimeout(() => { setVersion((v) => v + 1); resolve(); }, LATENCY);
    }),
    [],
  );

  const updateSlot = useCallback(
    (day: Day, periodId: string, input: SlotInput) => {
      const list = getSlots(classId, sectionId);
      const next = makeSlot(day, periodId, input.subject, input.room.trim());
      const teacher = TEACHERS.find((t) => t.id === input.teacherId);
      const slot: Slot = teacher ? { ...next, teacherId: teacher.id, teacherName: teacher.name } : { ...next, teacherId: '', teacherName: '' };
      const i = list.findIndex((s) => s.day === day && s.periodId === periodId);
      if (i >= 0) list[i] = slot; else list.push(slot);
      setVersion((v) => v + 1);
    },
    [classId, sectionId],
  );

  const clearSlot = useCallback(
    (day: Day, periodId: string) => {
      const list = getSlots(classId, sectionId);
      const i = list.findIndex((s) => s.day === day && s.periodId === periodId);
      if (i >= 0) list.splice(i, 1);
      setVersion((v) => v + 1);
    },
    [classId, sectionId],
  );

  return { periods: PERIODS, slots, isLoading, refetch, updateSlot, clearSlot };
}

export function useTeacherTimetable(teacherId: string) {
  const [isLoading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), LATENCY);
    return () => clearTimeout(t);
  }, [teacherId]);

  const entries = useMemo<TeacherEntry[]>(() => {
    const out: TeacherEntry[] = [];
    const seen = new Set<string>();
    CLASS_OPTIONS.forEach((c) => {
      SECTION_OPTIONS.forEach((s) => {
        getSlots(c.value, s.value).forEach((slot) => {
          if (slot.teacherId !== teacherId) return;
          const k = `${slot.day}|${slot.periodId}`;
          if (seen.has(k)) return; // a teacher can only be in one class at a time (mock: first wins)
          seen.add(k);
          out.push({
            day: slot.day, periodId: slot.periodId, subject: slot.subject,
            classLabel: classLabel(c.value, s.value), room: slot.room,
          });
        });
      });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, version]);

  const refetch = useCallback(
    () => new Promise<void>((resolve) => {
      setTimeout(() => { setVersion((v) => v + 1); resolve(); }, LATENCY);
    }),
    [],
  );

  return { periods: PERIODS, entries, isLoading, refetch };
}

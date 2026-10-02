import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

export type ExamStatus = 'upcoming' | 'completed';
export type ExamStatusFilter = ExamStatus | 'all';

export interface ExamSchedule {
  id: string;
  examTypeId: string;
  examType: string;
  title: string;
  classId: string;
  className: string;
  sectionName: string;
  subject: string;
  /** ISO date (yyyy-mm-dd) */
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  durationMinutes: number;
  academicYear: string;
  status: ExamStatus;
}

export type ExamInput = Omit<ExamSchedule, 'id' | 'status' | 'academicYear' | 'examTypeId' | 'classId'>;

export interface ExamStats {
  total: number;
  upcoming: number;
  completed: number;
  examTypes: number;
}

export interface ExamsParams {
  search: string;
  examType: string; // 'All' or a type name
  status: ExamStatusFilter;
  className: string; // 'All' or a class name
  page: number;
  pageSize: number;
}

export const TODAY = '2026-10-02';
export const ACADEMIC_YEAR = '2026-2027';

export const CLASS_OPTIONS: string[] = [
  'Nursery', 'LKG', 'UKG', ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`),
];
export const SECTION_OPTIONS = ['A', 'B', 'C', 'D'];
export const SUBJECT_OPTIONS = ['Hindi', 'English', 'Maths', 'Science'];

interface TypeDef { id: string; name: string; max: number; pass: number; minutes: number }
export const EXAM_TYPES: TypeDef[] = [
  { id: 'et-1', name: 'Unit Test 1', max: 25, pass: 9, minutes: 45 },
  { id: 'et-2', name: 'Half Yearly', max: 80, pass: 28, minutes: 150 },
  { id: 'et-3', name: 'Yearly', max: 100, pass: 35, minutes: 180 },
  { id: 'et-4', name: 'Practical', max: 50, pass: 18, minutes: 90 },
];
export const EXAM_TYPE_NAMES = EXAM_TYPES.map((t) => t.name);

export function deriveStatus(isoDate: string): ExamStatus {
  return isoDate < TODAY ? 'completed' : 'upcoming';
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** 2026-08-01 -> "01 Aug 2026" */
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d} ${MONTHS[Number(m) - 1] ?? m} ${y}`;
}

/** Parses DD/MM/YYYY to ISO, or null when not a real calendar date. */
export function parseDate(text: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
}

function buildMock(): ExamSchedule[] {
  const base = Date.UTC(2026, 7, 1);
  return Array.from({ length: 48 }, (_, i) => {
    const t = EXAM_TYPES[Math.floor(i / 12) % EXAM_TYPES.length];
    const subject = SUBJECT_OPTIONS[i % SUBJECT_OPTIONS.length];
    const clsIdx = i % CLASS_OPTIONS.length;
    const dt = new Date(base + ((i * 7) % 48) * 2 * 86400000);
    const examDate = `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
    return {
      id: `exam-${i + 1}`,
      examTypeId: t.id,
      examType: t.name,
      title: `${t.name} — ${subject}`,
      classId: `cls-${clsIdx + 1}`,
      className: CLASS_OPTIONS[clsIdx],
      sectionName: i % 5 === 4 ? 'B' : 'A',
      subject,
      examDate,
      maxMarks: t.max,
      passingMarks: t.pass,
      durationMinutes: t.minutes,
      academicYear: ACADEMIC_YEAR,
      status: deriveStatus(examDate),
    };
  });
}

/* ---- tiny shared store so list + results tabs (and later an API cache) see the same data ---- */
let store: ExamSchedule[] = buildMock();
let nextId = store.length + 1;
const listeners = new Set<() => void>();
function setStore(next: ExamSchedule[]) {
  store = next;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
const getSnapshot = () => store;

export function useExams(params: ExamsParams) {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
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

  const stats = useMemo<ExamStats>(() => ({
    total: all.length,
    upcoming: all.filter((e) => e.status === 'upcoming').length,
    completed: all.filter((e) => e.status === 'completed').length,
    examTypes: new Set(all.map((e) => e.examTypeId)).size,
  }), [all]);

  const filtered = useMemo(() => {
    const q = params.search.trim().toLowerCase();
    return all.filter(
      (e) =>
        (params.status === 'all' || e.status === params.status) &&
        (params.examType === 'All' || e.examType === params.examType) &&
        (params.className === 'All' || e.className === params.className) &&
        (!q ||
          e.title.toLowerCase().includes(q) ||
          `${e.className} - ${e.sectionName}`.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q)),
    );
  }, [all, params.search, params.status, params.examType, params.className]);

  const data = useMemo(
    () => filtered.slice((params.page - 1) * params.pageSize, params.page * params.pageSize),
    [filtered, params.page, params.pageSize],
  );

  const add = useCallback((input: ExamInput) => {
    const t = EXAM_TYPES.find((x) => x.name === input.examType);
    const ci = CLASS_OPTIONS.indexOf(input.className);
    const exam: ExamSchedule = {
      ...input,
      id: `exam-${nextId++}`,
      examTypeId: t?.id ?? 'et-0',
      classId: `cls-${ci + 1}`,
      academicYear: ACADEMIC_YEAR,
      status: deriveStatus(input.examDate),
    };
    setStore([exam, ...store]);
  }, []);

  const update = useCallback((id: string, input: ExamInput) => {
    setStore(store.map((e) => {
      if (e.id !== id) return e;
      const t = EXAM_TYPES.find((x) => x.name === input.examType);
      const ci = CLASS_OPTIONS.indexOf(input.className);
      return {
        ...e, ...input,
        examTypeId: t?.id ?? e.examTypeId,
        classId: ci >= 0 ? `cls-${ci + 1}` : e.classId,
        status: deriveStatus(input.examDate),
      };
    }));
  }, []);

  const remove = useCallback((id: string) => {
    setStore(store.filter((e) => e.id !== id));
  }, []);

  return { data, all, total: filtered.length, stats, isLoading, refetch, add, update, remove };
}

/* ---------------- results ---------------- */

export interface ExamStudent { id: string; name: string; rollNo: string }
export interface ResultSummary { entered: number; average: number; passPercent: number; highest: number }

const FIRST = ['Vivaan', 'Aarav', 'Ananya', 'Diya', 'Ishaan', 'Kavya', 'Rohan', 'Saanvi', 'Arjun', 'Meera',
  'Aditya', 'Riya', 'Krish', 'Navya', 'Reyansh'];
const LAST = ['Rao', 'Sharma', 'Patel', 'Iyer', 'Gupta', 'Nair', 'Reddy', 'Singh', 'Mehta', 'Joshi'];

function studentsFor(scheduleId: string): ExamStudent[] {
  const seed = Number(scheduleId.replace(/\D/g, '')) || 1;
  return Array.from({ length: 15 }, (_, i) => ({
    id: `${scheduleId}-s${i + 1}`,
    name: `${FIRST[(i + seed) % FIRST.length]} ${LAST[(i * 3 + seed) % LAST.length]}`,
    rollNo: String(i + 1).padStart(2, '0'),
  }));
}

/** Saved marks per schedule (module-level so they survive tab switches). */
const savedMarks = new Map<string, Record<string, string>>();

function seedMarks(scheduleId: string, max: number, completed: boolean): Record<string, string> {
  if (!completed) return {};
  const seed = Number(scheduleId.replace(/\D/g, '')) || 1;
  const out: Record<string, string> = {};
  studentsFor(scheduleId).forEach((s, i) => {
    const pct = 0.3 + (((i * 37 + seed * 13) % 70) / 100);
    out[s.id] = String(Math.min(max, Math.round(pct * max)));
  });
  return out;
}

export function gradeFor(marks: number, max: number, passing: number): { grade: string; pass: boolean } {
  const pass = marks >= passing;
  if (!pass) return { grade: 'F', pass };
  const p = (marks / max) * 100;
  if (p >= 90) return { grade: 'A+', pass };
  if (p >= 80) return { grade: 'A', pass };
  if (p >= 70) return { grade: 'B+', pass };
  if (p >= 60) return { grade: 'B', pass };
  if (p >= 50) return { grade: 'C', pass };
  return { grade: 'D', pass };
}

/** Returns an error message, or null when the text is empty or a valid mark. */
export function markError(text: string, max: number): string | null {
  if (text.trim() === '') return null;
  if (!/^\d+(\.\d+)?$/.test(text.trim())) return 'Enter a number';
  if (Number(text) > max) return `Max ${max}`;
  return null;
}

export function useExamResults(exam: ExamSchedule | null) {
  const scheduleId = exam?.id ?? null;
  const max = exam?.maxMarks ?? 0;
  const passing = exam?.passingMarks ?? 0;
  const completed = exam?.status === 'completed';
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [isLoading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!scheduleId) { setMarks({}); return; }
    setLoading(true);
    setDirty(false);
    const t = setTimeout(() => {
      const saved = savedMarks.get(scheduleId) ?? seedMarks(scheduleId, max, completed);
      setMarks(saved);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [scheduleId, max, completed]);

  const students = useMemo(() => (scheduleId ? studentsFor(scheduleId) : []), [scheduleId]);

  const setMark = useCallback((studentId: string, value: string) => {
    setMarks((m) => ({ ...m, [studentId]: value }));
    setDirty(true);
  }, []);

  const hasErrors = useMemo(
    () => students.some((s) => markError(marks[s.id] ?? '', max) !== null),
    [students, marks, max],
  );

  const summary = useMemo<ResultSummary>(() => {
    const vals = students
      .filter((s) => (marks[s.id] ?? '').trim() !== '' && markError(marks[s.id], max) === null)
      .map((s) => Number(marks[s.id]));
    if (vals.length === 0) return { entered: 0, average: 0, passPercent: 0, highest: 0 };
    return {
      entered: vals.length,
      average: vals.reduce((a, b) => a + b, 0) / vals.length,
      passPercent: (vals.filter((v) => v >= passing).length / vals.length) * 100,
      highest: Math.max(...vals),
    };
  }, [students, marks, max, passing]);

  const save = useCallback(() => {
    if (!scheduleId || hasErrors) return false;
    savedMarks.set(scheduleId, { ...marks });
    setDirty(false);
    return true;
  }, [scheduleId, hasErrors, marks]);

  return { students, marks, setMark, save, summary, isLoading, hasErrors, dirty };
}

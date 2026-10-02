import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ---------- Types ---------- */

export interface Chapter {
  id: string;
  title: string;
  topics: number;
}

export interface SubjectSyllabus {
  id: string;
  name: string;
  chapters: Chapter[];
}

export type ExamType = 'Unit Test 1' | 'Unit Test 2' | 'Half Yearly' | 'Annual';

export interface ExamSyllabus {
  id: string;
  title: string;
  examType: ExamType;
  subjectId: string;
  subjectName: string;
  classLabel: string;
  marks: number;
  /** ISO date yyyy-mm-dd */
  date: string;
  /** negative = already held */
  daysLeft: number;
  chapters: Chapter[];
}

export interface ExamFilters {
  classId: string;
  sectionId: string;
  year: string;
  examType: ExamType | '';
  subjectId: string;
  upcomingOnly: boolean;
}

export interface Option {
  value: string;
  label: string;
}

/* ---------- Static lookups ---------- */

export const TODAY = '2026-10-02';

export const CLASS_OPTIONS: Option[] = Array.from({ length: 10 }, (_, i) => ({
  value: `class-${i + 1}`,
  label: `Class ${i + 1}`,
}));
export const SECTION_OPTIONS: Option[] = ['A', 'B', 'C'].map((s) => ({ value: s, label: `Section ${s}` }));
export const YEAR_OPTIONS: Option[] = [
  { value: '2026-2027', label: '2026-2027 (Active year)' },
  { value: '2025-2026', label: '2025-2026' },
  { value: '2024-2025', label: '2024-2025' },
];
export const EXAM_TYPES: ExamType[] = ['Unit Test 1', 'Unit Test 2', 'Half Yearly', 'Annual'];

export const DEFAULT_CLASS = 'class-10';
export const DEFAULT_SECTION = 'A';
export const DEFAULT_YEAR = '2026-2027';

const CHAPTERS_BY_SUBJECT: Record<string, string[]> = {
  'Art Education': ['Elements of Art', 'Colour Theory', 'Perspective Drawing', 'Folk Art of India', 'Poster Making'],
  'Computer Science': ['Networking Basics', 'HTML and Web Design', 'Python Programming', 'Databases and SQL', 'Cyber Safety'],
  English: ['A Letter to God', 'Nelson Mandela', 'Two Stories about Flying', 'From the Diary of Anne Frank', 'The Hundred Dresses'],
  Hindi: ['Surdas ke Pad', 'Ram-Lakshman-Parshuram Samvad', 'Savaiya aur Kavitt', 'Atmakathya', 'Utsah aur At Nahin Rahi Hai'],
  Mathematics: ['Real Numbers', 'Polynomials', 'Pair of Linear Equations', 'Quadratic Equations', 'Arithmetic Progressions'],
  'Moral Science': ['Truthfulness', 'Respect for Elders', 'Service to Others', 'Environmental Ethics', 'Unity in Diversity'],
  Music: ['Basics of Swar', 'Taal and Laya', 'Raag Yaman', 'Patriotic Songs', 'Instruments of India'],
  'Physical Education': ['Fitness and Wellness', 'Rules of Football', 'Athletics Basics', 'Yoga and Asanas', 'First Aid and Safety'],
  Sanskrit: ['Shuchiparyavaranam', 'Buddhirbalavati Sada', 'Shishulalanam', 'Janani Janmabhumishcha', 'Subhashitani'],
  Science: ['Chemical Reactions and Equations', 'Acids, Bases and Salts', 'Metals and Non-metals', 'Life Processes', 'Electricity'],
  'Social Science': ['Rise of Nationalism in Europe', 'Resources and Development', 'Power Sharing', 'Development', 'Money and Credit'],
};

const SUBJECT_NAMES = Object.keys(CHAPTERS_BY_SUBJECT);

export const SUBJECT_OPTIONS: Option[] = SUBJECT_NAMES.map((n) => ({ value: slug(n), label: n }));

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/* ---------- Date helpers ---------- */

function toUtc(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysFromToday(iso: string): number {
  return Math.round((toUtc(iso) - toUtc(TODAY)) / 86400000);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}

function addDays(iso: string, n: number): string {
  const dt = new Date(toUtc(iso) + n * 86400000);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export function examStatusLabel(daysLeft: number): string {
  if (daysLeft < 0) return 'Completed';
  if (daysLeft === 0) return 'Today';
  return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
}

/* ---------- Seed builders ---------- */

let uid = 0;
function nextId(prefix: string): string {
  uid += 1;
  return `${prefix}-${uid}`;
}

function buildSyllabus(): SubjectSyllabus[] {
  return SUBJECT_NAMES.map((name) => ({
    id: slug(name),
    name,
    chapters: CHAPTERS_BY_SUBJECT[name].map((title, i) => ({
      id: nextId('ch'),
      title,
      topics: 2 + ((i + name.length) % 4),
    })),
  }));
}

const EXAM_PLAN: Record<ExamType, { start: string; marks: number; from: number; to: number }> = {
  'Unit Test 1': { start: '2026-08-03', marks: 25, from: 0, to: 2 },
  'Unit Test 2': { start: '2026-11-09', marks: 25, from: 2, to: 4 },
  'Half Yearly': { start: '2026-12-14', marks: 50, from: 0, to: 4 },
  Annual: { start: '2027-03-08', marks: 100, from: 0, to: 5 },
};

function buildExams(classId: string, sectionId: string, syllabus: SubjectSyllabus[]): ExamSyllabus[] {
  const classLabel = `${CLASS_OPTIONS.find((c) => c.value === classId)?.label ?? classId} - ${sectionId}`;
  const out: ExamSyllabus[] = [];
  EXAM_TYPES.forEach((type) => {
    const plan = EXAM_PLAN[type];
    syllabus.forEach((subj, idx) => {
      const date = addDays(plan.start, idx);
      out.push({
        id: nextId('ex'),
        title: `${type} — ${subj.name}`,
        examType: type,
        subjectId: subj.id,
        subjectName: subj.name,
        classLabel,
        marks: plan.marks,
        date,
        daysLeft: daysFromToday(date),
        chapters: subj.chapters.slice(plan.from, plan.to).map((c) => ({ ...c, id: nextId('ch') })),
      });
    });
  });
  return out;
}

/* ---------- In-memory stores (replace with API later) ---------- */

const syllabusStore = new Map<string, SubjectSyllabus[]>();
const examStore = new Map<string, ExamSyllabus[]>();
const doneStore = new Set<string>();

function key(classId: string, sectionId: string): string {
  return `${classId}|${sectionId}`;
}

function getSyllabus(classId: string, sectionId: string): SubjectSyllabus[] {
  const k = key(classId, sectionId);
  let v = syllabusStore.get(k);
  if (!v) {
    v = buildSyllabus();
    syllabusStore.set(k, v);
  }
  return v;
}

function getExams(classId: string, sectionId: string): ExamSyllabus[] {
  const k = key(classId, sectionId);
  let v = examStore.get(k);
  if (!v) {
    v = buildExams(classId, sectionId, getSyllabus(classId, sectionId));
    examStore.set(k, v);
  }
  return v;
}

/** Simulated network latency: returns [isLoading, refetch]. */
function useFakeLoad(dep: string): [boolean, () => void] {
  const [tick, setTick] = useState(0);
  const [isLoading, setLoading] = useState(true);
  const first = useRef(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), first.current ? 700 : 450);
    first.current = false;
    return () => clearTimeout(t);
  }, [dep, tick]);
  const refetch = useCallback(() => setTick((n) => n + 1), []);
  return [isLoading, refetch];
}

/* ---------- Hooks ---------- */

export function useSyllabus(classId: string, sectionId: string) {
  const [isLoading, refetch] = useFakeLoad(key(classId, sectionId));
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((n) => n + 1), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => getSyllabus(classId, sectionId), [classId, sectionId, version]);

  const updateChapters = useCallback(
    (subjectId: string, chapters: Chapter[]) => {
      const k = key(classId, sectionId);
      syllabusStore.set(
        k,
        getSyllabus(classId, sectionId).map((s) => (s.id === subjectId ? { ...s, chapters } : s)),
      );
      bump();
    },
    [classId, sectionId, bump],
  );

  // fresh Set per change so memoised rows re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doneIds = useMemo<ReadonlySet<string>>(() => new Set(doneStore), [version]);
  const toggleChapter = useCallback(
    (chapterId: string) => {
      if (doneStore.has(chapterId)) doneStore.delete(chapterId);
      else doneStore.add(chapterId);
      bump();
    },
    [bump],
  );

  /** Copies this section's plan to the other sections of the class. Returns the sections touched. */
  const copyToOtherSections = useCallback((): string[] => {
    const src = getSyllabus(classId, sectionId);
    const targets = SECTION_OPTIONS.map((s) => s.value).filter((s) => s !== sectionId);
    targets.forEach((t) => {
      syllabusStore.set(
        key(classId, t),
        src.map((s) => ({ ...s, chapters: s.chapters.map((c) => ({ ...c, id: nextId('ch') })) })),
      );
      examStore.delete(key(classId, t));
    });
    return targets;
  }, [classId, sectionId]);

  return { data, isLoading, refetch, updateChapters, doneIds, toggleChapter, copyToOtherSections };
}

export function useExamSyllabus(filters: ExamFilters) {
  const { classId, sectionId, year, examType, subjectId, upcomingOnly } = filters;
  const [isLoading, refetch] = useFakeLoad(`${classId}|${sectionId}|${year}`);
  const [version, setVersion] = useState(0);

  const all = useMemo(
    () => getExams(classId, sectionId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classId, sectionId, version],
  );

  const data = useMemo(
    () =>
      all
        .filter((e) => (examType ? e.examType === examType : true))
        .filter((e) => (subjectId ? e.subjectId === subjectId : true))
        .filter((e) => (upcomingOnly ? e.daysLeft >= 0 : true))
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    [all, examType, subjectId, upcomingOnly],
  );

  const updateExam = useCallback(
    (examId: string, chapters: Chapter[]) => {
      examStore.set(
        key(classId, sectionId),
        getExams(classId, sectionId).map((e) => (e.id === examId ? { ...e, chapters } : e)),
      );
      setVersion((n) => n + 1);
    },
    [classId, sectionId],
  );

  return { data, total: all.length, isLoading, refetch, updateExam };
}

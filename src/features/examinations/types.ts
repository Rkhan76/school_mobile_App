/* ---------------- shared status/domain helpers ---------------- */

export type ExamStatus = 'upcoming' | 'completed';
export type ExamStatusFilter = ExamStatus | 'all';

export type RefLite = { id: string; name: string };

/* ---------------- exam types (catalog) ---------------- */

export type ExamType = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  isSubjectScoped: boolean;
};

export type ExamTypeInput = {
  name: string;
  description?: string;
  isActive?: boolean;
  isSubjectScoped: boolean;
};

/* ---------------- exam schedules (API shape) ---------------- */

/** Raw shape returned by the backend for a schedule row (list/detail). */
export type ApiExamSchedule = {
  id: string;
  academicYearId: string;
  examTypeId: string;
  title: string;
  classId: string;
  sectionId: string | null;
  subjectId: string;
  examDate: string; // YYYY-MM-DD
  maxMarks: number;
  passingMarks: number;
  durationMinutes: number;
  invigilatorId: string | null;
  academicYear?: { id: string; label: string } | null;
  examType?: RefLite | null;
  class?: RefLite | null;
  section?: RefLite | null;
  subject?: RefLite | null;
  invigilator?: { id: string; fullName: string } | null;
  daysRemaining: number | null;
};

/** Payload for create/update — same shape either way (partial on update). */
export type ExamScheduleInput = {
  academicYearId: string;
  examTypeId: string;
  title: string;
  classId: string;
  sectionId?: string | null;
  subjectId: string;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  durationMinutes: number;
  invigilatorId?: string | null;
};

/** Kept as an alias — components import this name from the old mock module. */
export type ExamInput = ExamScheduleInput;

export type ExamScheduleListParams = {
  academicYearId?: string;
  examTypeId?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  fromDate?: string;
  toDate?: string;
};

/* ---------------- results (API shape) ---------------- */

export type ApiExamResult = {
  id: string;
  examScheduleId: string;
  studentId: string;
  student?: { id: string; fullName: string; rollNumber?: string | null } | null;
  marksObtained: number;
  grade?: string | null;
  isPassed?: boolean | null;
  remarks?: string | null;
  locked?: boolean;
};

export type BulkResultInput = { studentId: string; marksObtained: number; remarks?: string };

/* ---------------- local-only lookup shapes ---------------- */

export type LookupItem = { id: string; name: string };
export type TeacherLookupItem = { id: string; fullName: string };
export type StudentRosterItem = { id: string; fullName: string; rollNumber: string | null };

/* ---------------- view model used by the UI (flattened, like the old mock) ---------------- */

export type ExamSchedule = {
  id: string;
  examTypeId: string;
  examType: string;
  title: string;
  classId: string;
  className: string;
  sectionId: string | null;
  sectionName: string;
  subjectId: string;
  subject: string;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  durationMinutes: number;
  invigilatorId: string | null;
  academicYearId: string;
  academicYear: string;
  status: ExamStatus;
  daysRemaining: number | null;
};

export type ExamStats = {
  total: number;
  upcoming: number;
  completed: number;
  examTypes: number;
};

export type ExamFilters = { examTypeId: string; status: ExamStatusFilter; classId: string };
export type ExamsParams = ExamFilters & { search: string };

export type ExamStudent = { id: string; name: string; rollNo: string };
export type ResultSummary = { entered: number; average: number; passPercent: number; highest: number };

export type MutationResult = { ok: true } | { ok: false; message: string };

/* ---------------- pure helpers (date/grade/validation) ---------------- */

const pad = (n: number) => String(n).padStart(2, '0');

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function deriveStatus(isoDate: string): ExamStatus {
  return isoDate < todayIso() ? 'completed' : 'upcoming';
}

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

/**
 * Client-side grade/pass estimate shown while entering marks. The backend is
 * the source of truth when a grading scale is configured (it recomputes
 * grade/pass server-side and ignores anything we send) — this is only for
 * immediate on-screen feedback before save.
 */
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

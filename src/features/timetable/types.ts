/** Shared types + small presentation helpers for the Timetable feature. */

export type Option = { value: string; label: string };

/** Short weekday code used throughout the UI (chips, grid columns, etc). */
export type Day = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
export const DAYS: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const DAY_LONG: Record<Day, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday',
};

/** Full day-of-week string the backend uses on slots. */
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const DAY_TO_DOW: Record<Day, DayOfWeek> = {
  MON: 'MONDAY', TUE: 'TUESDAY', WED: 'WEDNESDAY', THU: 'THURSDAY', FRI: 'FRIDAY', SAT: 'SATURDAY',
};
export const DOW_TO_DAY: Partial<Record<DayOfWeek, Day>> = {
  MONDAY: 'MON', TUESDAY: 'TUE', WEDNESDAY: 'WED', THURSDAY: 'THU', FRIDAY: 'FRI', SATURDAY: 'SAT',
};

/** Period (master data) row. */
export type Period = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
  isBreak: boolean;
  isActive: boolean;
};

export type PeriodInput = {
  name: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
  isBreak: boolean;
  isActive: boolean;
};

type Ref = { id: string; name: string } | null;

/** One cell of the grid, as returned flat by the backend. */
export type TimetableSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  period: { id: string; name: string; startTime: string; endTime: string; sortOrder?: number; isBreak?: boolean };
  subject: Ref;
  teacher: { id: string; fullName: string } | null;
  section: Ref;
  class: Ref;
  roomName?: string | null;
};

export type GridReplacePayload = {
  academicYearId: string;
  overrideAssignmentCheck?: boolean;
  slots: Array<{
    dayOfWeek: DayOfWeek;
    periodId: string;
    subjectId: string;
    teacherId: string;
    roomName?: string;
  }>;
};

export type CreateSlotPayload = {
  academicYearId: string;
  sectionId: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
  subjectId: string;
  teacherId: string;
  roomName?: string;
  overrideAssignmentCheck?: boolean;
};

export type UpdateSlotPayload = Partial<{
  dayOfWeek: DayOfWeek;
  periodId: string;
  subjectId: string;
  teacherId: string;
  roomName: string;
}>;

export type SubstitutionGap = {
  timetableSlotId: string;
  sectionId: string;
  className: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  periodId: string;
  periodName: string;
  originalTeacherId: string;
  originalTeacherName: string;
};

export type FreeTeacher = { id: string; fullName: string; qualification?: string | null };

export type Substitution = {
  id: string;
  timetableSlotId: string;
  date: string;
  substituteTeacherId: string;
  reason?: string | null;
};

export type SubjectLookupItem = { id: string; name: string };
export type TeacherLookupItem = { id: string; fullName: string };

/* ---------- display helpers ---------- */

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

/** Deterministic color per subject id/name, so any real subject gets a stable tag color
 * without needing a hardcoded subject list (unlike the old mock). Hex (not hsl) so callers
 * can append an alpha suffix (e.g. `${subjectColor(k)}22`) the way the UI already does. */
const SUBJECT_PALETTE = [
  '#f97316', '#3b82f6', '#6366f1', '#0ea5e9', '#d97706',
  '#16a34a', '#ec4899', '#a855f7', '#e11d48', '#25a194',
];

export function subjectColor(key: string): string {
  let h = 7;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) % 9973;
  return SUBJECT_PALETTE[h % SUBJECT_PALETTE.length] ?? '#25a194';
}

/** Today's short day code + minutes-since-midnight, derived from the real clock
 * (replaces the mock's fixed "Friday 10:20 AM" demo clock). */
export function nowInfo(): { day: Day | null; minutes: number } {
  const now = new Date();
  const jsDay = now.getDay(); // 0=Sun..6=Sat
  const map: (Day | null)[] = [null, 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return { day: map[jsDay] ?? null, minutes: now.getHours() * 60 + now.getMinutes() };
}

export function isCurrentPeriod(p: Period, nowMinutes: number): boolean {
  return nowMinutes >= toMinutes(p.startTime) && nowMinutes < toMinutes(p.endTime);
}

import { addDays, weekdayIndex } from './dateUtils';

/**
 * Mock-only status union (staff attendance has no real backend yet — see
 * MOBILE_API_DOCS.md §9's note that staff attendance is a separate,
 * undocumented module). Kept distinct from the real student
 * `AttendanceStatus` (`./types`), which has no `'LEAVE'` value.
 */
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'LEAVE';
export type StaffCategory = 'Teaching' | 'Admin' | 'Support' | 'Transport';

export type StaffMember = {
  id: string;
  empCode: string;
  name: string;
  role: string;
  category: StaffCategory;
  status: AttendanceStatus | null;
  remarks: string;
};

export type HistoryEntry = { date: string; status: AttendanceStatus | null };

export const STAFF_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
export const STAFF_CATEGORIES: StaffCategory[] = ['Teaching', 'Admin', 'Support', 'Transport'];

type StaffSeed = [code: string, name: string, role: string, category: StaffCategory];

const STAFF_SEEDS: StaffSeed[] = [
  ['0001', 'Aarav Sharma', 'Teacher', 'Teaching'],
  ['0012', 'Aditya Bose', 'Teacher', 'Teaching'],
  ['0004', 'Ananya Iyer', 'Teacher', 'Teaching'],
  ['0007', 'Arjun Reddy', 'Teacher', 'Teaching'],
  ['0002', 'Diya Verma', 'Teacher', 'Teaching'],
  ['0006', 'Ishita Nair', 'Teacher', 'Teaching'],
  ['0003', 'Kabir Singh', 'Teacher', 'Teaching'],
  ['0005', 'Meera Joshi', 'Teacher', 'Teaching'],
  ['0008', 'Neha Kapoor', 'Teacher', 'Teaching'],
  ['0009', 'Rohan Mehta', 'Teacher', 'Teaching'],
  ['0010', 'Sanya Gupta', 'Teacher', 'Teaching'],
  ['0011', 'Vikram Rao', 'Teacher', 'Teaching'],
  ['0013', 'Lakshmi Pillai', 'Office Manager', 'Admin'],
  ['0014', 'Rajesh Kulkarni', 'Accountant', 'Admin'],
  ['0015', 'Pooja Deshmukh', 'Receptionist', 'Admin'],
  ['0016', 'Suresh Menon', 'Librarian', 'Admin'],
  ['0017', 'Ramesh Yadav', 'Lab Assistant', 'Support'],
  ['0018', 'Sunita Devi', 'Housekeeping', 'Support'],
  ['0019', 'Mohan Lal', 'Security Guard', 'Support'],
  ['0020', 'Gurpreet Singh', 'Bus Driver', 'Transport'],
  ['0021', 'Anil Kumar', 'Bus Driver', 'Transport'],
  ['0022', 'Sakthi Vel', 'Bus Attendant', 'Transport'],
];

export function buildStaff(): StaffMember[] {
  return STAFF_SEEDS.map(([code, name, role, category]) => ({
    id: `emp-${code}`,
    empCode: `EMP-${code}`,
    name,
    role,
    category,
    status: null,
    remarks: '',
  })).sort((a, b) => a.name.localeCompare(b.name));
}

/* ------------------------------ history (shared mock helpers) ------------------------------ */

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function statusFromRoll(r: number, student: boolean): AttendanceStatus {
  if (r < 0.78) return 'PRESENT';
  if (r < 0.87) return 'ABSENT';
  if (r < 0.94) return 'LATE';
  return student ? 'LEAVE' : 'EXCUSED';
}

/** Last 10 working days before `date` (weekends skipped). Deterministic mock. */
export function buildHistory(id: string, date: string, student: boolean): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  for (let i = 1; out.length < 10 && i < 30; i += 1) {
    const d = addDays(date, -i);
    const wd = weekdayIndex(d);
    if (wd === 0 || wd === 6) continue;
    out.push({ date: d, status: statusFromRoll(lcg(hash(`${id}-${d}`))(), student) });
  }
  return out;
}

/** Class-wide daily attendance percentage (mock); null on weekends. */
export function classDayPercent(classId: string, sectionId: string, iso: string): number | null {
  const wd = weekdayIndex(iso);
  if (wd === 0 || wd === 6) return null;
  const r = lcg(hash(`${classId}-${sectionId}-${iso}`))();
  return Math.round(72 + r * 27);
}

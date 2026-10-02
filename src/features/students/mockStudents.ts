import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type StudentStatus = 'Active' | 'Inactive';
export type Gender = 'Male' | 'Female';

export interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  email: string;
  className: string;
  section: string;
  /** DD/MM/YYYY */
  dob: string;
  phone: string;
  status: StudentStatus;
  gender: Gender;
}

export interface StudentStats {
  total: number;
  male: number;
  female: number;
  portalAccess: number;
}

export interface StudentQuery {
  search?: string;
  className?: string;
  section?: string;
  status?: StudentStatus;
  page: number;
  pageSize: number;
}

export const CLASS_OPTIONS = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
  'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
] as const;
export const SECTION_OPTIONS = ['A', 'B'] as const;
export const STATUS_OPTIONS: readonly StudentStatus[] = ['Active', 'Inactive'];

const MALE = ['Kabir', 'Ishaan', 'Veer', 'Reyansh', 'Neel', 'Samar', 'Om', 'Aarush', 'Aarav', 'Vihaan', 'Arjun', 'Rohan'];
const FEMALE = ['Riya', 'Siya', 'Ira', 'Navya', 'Mahi', 'Aadhya', 'Diya', 'Anaya', 'Myra', 'Kiara', 'Saanvi', 'Tara'];
const LAST = ['Reddy', 'Singh', 'Mehta', 'Rao', 'Nair', 'Patel', 'Iyer', 'Verma', 'Sharma', 'Gupta'];

const TOTAL = 151;

/** Deterministic pseudo-random so the list is identical on every launch. */
function rand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

function buildStudents(): Student[] {
  const list: Student[] = [];
  for (let i = 0; i < TOTAL; i++) {
    // Even indexes plus index 1 are male: 77 male, 74 female.
    const gender: Gender = i % 2 === 0 || i === 1 ? 'Male' : 'Female';
    const firstNames = gender === 'Male' ? MALE : FEMALE;
    const first = firstNames[Math.floor(rand(i + 1) * firstNames.length)];
    const last = LAST[Math.floor(rand(i + 101) * LAST.length)];
    const classIdx = Math.min(CLASS_OPTIONS.length - 1, Math.floor((i * CLASS_OPTIONS.length) / TOTAL));
    const year = 2023 - classIdx;
    const day = 1 + Math.floor(rand(i + 201) * 28);
    const month = 1 + Math.floor(rand(i + 301) * 12);
    const num = i + 9;
    const phone = String(9000000000 + Math.floor(rand(i + 401) * 999999999));
    list.push({
      id: String(i + 1),
      admissionNumber: `ADM-2026-${pad(num, 4)}`,
      fullName: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}.${num}@verdant.test`,
      className: CLASS_OPTIONS[classIdx],
      section: i % 3 === 2 ? 'B' : 'A',
      dob: `${pad(day)}/${pad(month)}/${year}`,
      phone,
      status: i % 47 === 5 ? 'Inactive' : 'Active',
      gender,
    });
  }
  return list;
}

const SEED = buildStudents();

export interface UseStudentsResult {
  data: Student[];
  total: number;
  stats: StudentStats;
  isLoading: boolean;
  refetch: () => void;
  setStatus: (id: string, status: StudentStatus) => void;
  remove: (id: string) => void;
}

/**
 * Mock data source. Replace the body with a real API query later; keep the
 * returned shape (and the mutation helpers) stable so the UI doesn't change.
 */
export function useStudents(params: StudentQuery): UseStudentsResult {
  const [all, setAll] = useState<Student[]>(SEED);
  const [isLoading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setAll(SEED);
      setLoading(false);
    }, 700);
  }, []);

  useEffect(() => {
    refetch();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refetch]);

  const setStatus = useCallback((id: string, status: StudentStatus) => {
    setAll((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }, []);

  const remove = useCallback((id: string) => {
    setAll((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const stats = useMemo<StudentStats>(
    () => ({
      total: all.length,
      male: all.filter((s) => s.gender === 'Male').length,
      female: all.filter((s) => s.gender === 'Female').length,
      portalAccess: all.length,
    }),
    [all],
  );

  const { search, className, section, status, page, pageSize } = params;
  const filtered = useMemo(() => {
    const q = (search ?? '').trim().toLowerCase();
    return all.filter((s) => {
      if (className && s.className !== className) return false;
      if (section && s.section !== section) return false;
      if (status && s.status !== status) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        s.phone.includes(q)
      );
    });
  }, [all, search, className, section, status]);

  const data = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  return { data, total: filtered.length, stats, isLoading, refetch, setStatus, remove };
}

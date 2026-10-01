import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type Gender = 'Male' | 'Female';
export type StaffStatus = 'Active' | 'Inactive';
export type Shift = 'Morning' | 'Afternoon' | 'Full Day';
export type ContractType = 'Permanent' | 'Contract';

export interface Teacher {
  id: string;
  staffId: string;
  fullName: string;
  subject: string;
  class: string | null;
  section: string | null;
  gender: Gender;
  phone: string;
  email: string;
  qualification: string;
  experience: number;
  shift: Shift;
  status: StaffStatus;
}

export interface NonTeachingStaff {
  id: string;
  staffId: string;
  fullName: string;
  designation: string;
  department: string;
  joiningDate: string;
  contractType: ContractType;
  gender: Gender;
  phone: string;
  status: StaffStatus;
}

export const SUBJECTS = ['Maths', 'English', 'Science', 'Hindi', 'Social', 'CS', 'Art', 'PE'] as const;
export const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;
export const PAGE_SIZE = 20;

const maleNames = ['Rajesh Kumar', 'Amit Sharma', 'Suresh Patel', 'Vikram Singh', 'Anil Verma', 'Manoj Gupta', 'Deepak Joshi', 'Rahul Mehta', 'Sanjay Reddy', 'Arjun Nair', 'Karthik Iyer', 'Rohit Yadav', 'Naveen Rao', 'Pradeep Mishra', 'Harish Choudhary'];
const femaleNames = ['Priya Sharma', 'Sunita Devi', 'Anjali Gupta', 'Kavita Singh', 'Meena Kumari', 'Neha Verma', 'Pooja Patel', 'Lakshmi Iyer', 'Divya Nair', 'Rekha Joshi', 'Shweta Mehta', 'Anita Reddy', 'Swati Mishra', 'Geeta Yadav', 'Radhika Rao'];
const quals = ['B.Ed', 'M.Sc, B.Ed', 'M.A, B.Ed', 'M.Sc', 'B.Sc, B.Ed', 'MCA', 'M.P.Ed', 'BFA, B.Ed'];
const shifts: Shift[] = ['Morning', 'Afternoon', 'Full Day'];
const sections = ['A', 'B', 'C'];

function pad(n: number, w = 4) {
  return String(n).padStart(w, '0');
}
function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z]+/g, '.');
}
function phone(seed: number) {
  return `+91 9${pad((seed * 7919) % 10000, 4)}${pad((seed * 104729) % 100000, 5)}`;
}

const TEACHERS: Teacher[] = Array.from({ length: 30 }, (_, i) => {
  const female = i % 2 === 1;
  const names = female ? femaleNames : maleNames;
  const fullName = names[Math.floor(i / 2) % names.length];
  const assigned = i % 4 !== 3;
  return {
    id: `t${i + 1}`,
    staffId: `TCH-${pad(i + 1)}`,
    fullName,
    subject: SUBJECTS[i % SUBJECTS.length],
    class: assigned ? CLASSES[(i * 3) % CLASSES.length] : null,
    section: assigned ? sections[i % sections.length] : null,
    gender: female ? 'Female' : 'Male',
    phone: phone(i + 3),
    email: `${slug(fullName)}${i + 1}@verdant.edu`,
    qualification: quals[i % quals.length],
    experience: 1 + ((i * 5) % 18),
    shift: shifts[i % shifts.length],
    status: i % 7 === 6 ? 'Inactive' : 'Active',
  };
});

const DESIGNATIONS: { designation: string; department: string }[] = [
  { designation: 'Accountant', department: 'Accounts' },
  { designation: 'Librarian', department: 'Library' },
  { designation: 'Peon', department: 'Administration' },
  { designation: 'Lab Assistant', department: 'Science Lab' },
  { designation: 'Security', department: 'Security' },
  { designation: 'Driver', department: 'Transport' },
  { designation: 'Clerk', department: 'Administration' },
];

const STAFF: NonTeachingStaff[] = Array.from({ length: 15 }, (_, i) => {
  const female = i % 3 === 1;
  const names = female ? femaleNames : maleNames;
  const fullName = names[(i + 4) % names.length];
  const d = DESIGNATIONS[i % DESIGNATIONS.length];
  return {
    id: `n${i + 1}`,
    staffId: `NTS-${pad(i + 1)}`,
    fullName,
    designation: d.designation,
    department: d.department,
    joiningDate: `${2012 + (i % 12)}-${pad(1 + ((i * 5) % 12), 2)}-${pad(1 + ((i * 7) % 28), 2)}`,
    contractType: i % 3 === 2 ? 'Contract' : 'Permanent',
    gender: female ? 'Female' : 'Male',
    phone: phone(i + 50),
    status: i % 6 === 5 ? 'Inactive' : 'Active',
  };
});

export interface ListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}
export interface TeacherParams extends ListParams {
  subject?: string;
  class?: string;
  gender?: Gender;
}
export interface StaffParams extends ListParams {
  gender?: Gender;
}

export interface TeacherStats { total: number; male: number; female: number; assigned: number }
export interface StaffStats { total: number; male: number; female: number; active: number }

export interface EmployeesResult<T, S> {
  data: T[];
  total: number;
  stats: S;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  setActive: (id: string, active: boolean) => void;
  remove: (id: string) => void;
}

/** Simulates a network fetch (replace with API calls later). */
function useRecords<T extends { id: string; status: StaffStatus }>(seed: T[]) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setLoading(true);
    setError(null);
    timer.current = setTimeout(() => {
      setItems(seed);
      setLoading(false);
    }, 700);
  }, [seed]);

  useEffect(() => {
    refetch();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refetch]);

  const setActive = useCallback((id: string, active: boolean) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: active ? 'Active' : 'Inactive' } : x)));
  }, []);
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((x) => x.id !== id)), []);
  return { items, isLoading, error, refetch, setActive, remove };
}

function paginate<T>(list: T[], page = 1, pageSize = PAGE_SIZE) {
  return list.slice((page - 1) * pageSize, page * pageSize);
}

export function useTeachers(params: TeacherParams = {}): EmployeesResult<Teacher, TeacherStats> {
  const { items, ...rest } = useRecords<Teacher>(TEACHERS);
  const { search = '', subject, gender, page, pageSize } = params;
  const cls = params.class;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (t) =>
        (!q || t.fullName.toLowerCase().includes(q) || t.staffId.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)) &&
        (!subject || t.subject === subject) &&
        (!cls || t.class === cls) &&
        (!gender || t.gender === gender),
    );
  }, [items, search, subject, cls, gender]);
  const stats = useMemo<TeacherStats>(
    () => ({
      total: items.length,
      male: items.filter((t) => t.gender === 'Male').length,
      female: items.filter((t) => t.gender === 'Female').length,
      assigned: items.filter((t) => t.class !== null).length,
    }),
    [items],
  );
  return { data: paginate(filtered, page, pageSize), total: filtered.length, stats, ...rest };
}

export function useNonTeachingStaff(params: StaffParams = {}): EmployeesResult<NonTeachingStaff, StaffStats> {
  const { items, ...rest } = useRecords<NonTeachingStaff>(STAFF);
  const { search = '', gender, page, pageSize } = params;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (s) =>
        (!q || s.fullName.toLowerCase().includes(q) || s.staffId.toLowerCase().includes(q) || s.designation.toLowerCase().includes(q) || s.department.toLowerCase().includes(q)) &&
        (!gender || s.gender === gender),
    );
  }, [items, search, gender]);
  const stats = useMemo<StaffStats>(
    () => ({
      total: items.length,
      male: items.filter((s) => s.gender === 'Male').length,
      female: items.filter((s) => s.gender === 'Female').length,
      active: items.filter((s) => s.status === 'Active').length,
    }),
    [items],
  );
  return { data: paginate(filtered, page, pageSize), total: filtered.length, stats, ...rest };
}

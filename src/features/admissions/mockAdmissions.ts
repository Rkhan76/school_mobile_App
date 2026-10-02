import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type AdmissionStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'enrolled';

export interface Admission {
  id: string;
  applicationNumber: string;
  fullName: string;
  email: string;
  className: string;
  sectionName: string;
  status: AdmissionStatus;
  /** ISO date (yyyy-mm-dd) */
  appliedOn: string;
  profileImage?: string;
}

export interface AdmissionStats {
  total: number;
  enrolled: number;
  pending: number;
  rejected: number;
  approved: number;
  cancelled: number;
}

export interface AdmissionsParams {
  search: string;
  className: string; // 'All' or a class name
  status: AdmissionStatus | 'all';
  page: number;
  pageSize: number;
}

export const CLASS_OPTIONS: string[] = [
  'Nursery', 'LKG', 'UKG', ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`),
];

const FIRST = ['Vivaan', 'Aarav', 'Ananya', 'Diya', 'Ishaan', 'Kavya', 'Rohan', 'Saanvi', 'Arjun', 'Meera',
  'Aditya', 'Riya', 'Krish', 'Navya', 'Reyansh', 'Tara', 'Dev', 'Pooja', 'Kabir', 'Isha'];
const LAST = ['Rao', 'Sharma', 'Patel', 'Iyer', 'Gupta', 'Nair', 'Reddy', 'Singh', 'Mehta', 'Joshi'];

function buildMock(): Admission[] {
  return Array.from({ length: 75 }, (_, i) => {
    const n = i + 1;
    const first = FIRST[(i * 7) % FIRST.length];
    const last = LAST[(i * 3 + 1) % LAST.length];
    let status: AdmissionStatus = 'pending';
    if (n % 25 === 0) status = 'approved';
    else if (n % 19 === 0) status = 'rejected';
    else if (n % 23 === 0) status = 'cancelled';
    const day = 29 - (i % 8);
    return {
      id: `adm-${n}`,
      applicationNumber: `APP-2026-${String(n).padStart(6, '0')}`,
      fullName: `${first} ${last}`,
      email: `${first}.${last}.${n}@applicants.verdant.test`.toLowerCase(),
      className: CLASS_OPTIONS[(i * 5) % CLASS_OPTIONS.length],
      sectionName: n % 2 === 0 ? 'Sec B' : 'Sec A',
      status,
      appliedOn: `2026-09-${String(day).padStart(2, '0')}`,
    };
  });
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function useAdmissions(params: AdmissionsParams) {
  const [all, setAll] = useState<Admission[]>(() => buildMock());
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

  const stats = useMemo<AdmissionStats>(() => {
    const c = (s: AdmissionStatus) => all.filter((a) => a.status === s).length;
    return {
      total: all.length,
      enrolled: c('enrolled'),
      pending: c('pending'),
      rejected: c('rejected'),
      approved: c('approved'),
      cancelled: c('cancelled'),
    };
  }, [all]);

  const filtered = useMemo(() => {
    const q = params.search.trim().toLowerCase();
    return all.filter(
      (a) =>
        (params.status === 'all' || a.status === params.status) &&
        (params.className === 'All' || a.className === params.className) &&
        (!q ||
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.applicationNumber.toLowerCase().includes(q)),
    );
  }, [all, params.search, params.status, params.className]);

  const data = useMemo(
    () => filtered.slice((params.page - 1) * params.pageSize, params.page * params.pageSize),
    [filtered, params.page, params.pageSize],
  );

  const approve = useCallback((ids: string[]) => {
    setAll((prev) => prev.map((a) => (ids.includes(a.id) && a.status === 'pending' ? { ...a, status: 'approved' } : a)));
  }, []);

  const reject = useCallback((ids: string[], _reason: string) => {
    setAll((prev) => prev.map((a) => (ids.includes(a.id) && a.status === 'pending' ? { ...a, status: 'rejected' } : a)));
  }, []);

  const remove = useCallback((id: string) => {
    setAll((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { data, total: filtered.length, stats, isLoading, refetch, approve, reject, remove };
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface ClassSection {
  id: string;
  name: string;
}

export interface AcademicClass {
  id: string;
  name: string;
  gradeOrder: number;
  description: string;
  sections: ClassSection[];
  studentCount: number;
  createdAt: string; // ISO date
}

export interface ClassInput {
  name: string;
  gradeOrder: number;
  description: string;
}

export interface ClassStats {
  totalClasses: number;
  totalSections: number;
  active: number;
  newThisYear: number;
}

export interface ClassesParams {
  search?: string;
  page: number;
  pageSize: number;
}

const NAMES = ['Nursery', 'LKG', 'UKG', ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`)];

function buildMock(): AcademicClass[] {
  return NAMES.map((name, i) => ({
    id: `cls-${i + 1}`,
    name,
    gradeOrder: i + 1,
    description: i === 3 ? 'Primary foundation year' : '',
    // 16 sections across 15 classes: Class 1 has A and B.
    sections:
      i === 3
        ? [{ id: `cls-${i + 1}-a`, name: 'A' }, { id: `cls-${i + 1}-b`, name: 'B' }]
        : [{ id: `cls-${i + 1}-a`, name: 'A' }],
    studentCount: i === 3 ? 2 : 1,
    createdAt: '2026-09-29',
  }));
}

/** dd/mm/yyyy from an ISO date string. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

const LATENCY = 450;

export function useClasses({ search = '', pageSize }: Omit<ClassesParams, 'page'>) {
  const [items, setItems] = useState<AcademicClass[]>(buildMock);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setIsLoading(true);
    setVisibleCount(pageSize);
    timer.current = setTimeout(() => setIsLoading(false), LATENCY);
  }, [pageSize]);

  useEffect(() => {
    refetch();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refetch]);

  // Reset to the first page of results whenever the search term changes.
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [search, pageSize]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => a.gradeOrder - b.gradeOrder);
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.sections.some((s) => s.name.toLowerCase().includes(q)),
    );
  }, [items, search]);

  const data = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMore = useCallback(() => {
    if (isLoadingMore || isLoading) return;
    setVisibleCount((prev) => {
      const next = prev + pageSize;
      return next >= filtered.length ? filtered.length : next;
    });
    setIsLoadingMore(true);
    setTimeout(() => setIsLoadingMore(false), 300);
  }, [isLoadingMore, isLoading, pageSize, filtered.length]);

  const stats = useMemo<ClassStats>(
    () => ({
      totalClasses: items.length,
      totalSections: items.reduce((n, c) => n + c.sections.length, 0),
      active: items.length,
      // Only classes added during this session count as new this year in the mock.
      newThisYear: items.filter((c) => c.id.startsWith('new-')).length,
    }),
    [items],
  );

  const add = useCallback((input: ClassInput) => {
    const created: AcademicClass = {
      id: `new-${Date.now()}`,
      name: input.name.trim(),
      gradeOrder: input.gradeOrder,
      description: input.description.trim(),
      sections: [],
      studentCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setItems((prev) => [...prev, created]);
  }, []);

  const update = useCallback((id: string, input: ClassInput) => {
    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, name: input.name.trim(), gradeOrder: input.gradeOrder, description: input.description.trim() }
          : c,
      ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { data, total: filtered.length, hasMore, isLoadingMore, loadMore, stats, isLoading, refetch, add, update, remove };
}

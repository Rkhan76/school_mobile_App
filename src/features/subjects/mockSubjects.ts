import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface SubjectAssignment {
  sectionId: string;
  label: string;
}

export interface Subject {
  id: string;
  name: string;
  subjectCode: string;
  description: string;
  assignments: SubjectAssignment[];
}

export interface SubjectInput {
  name: string;
  subjectCode: string;
  description: string;
}

export interface SubjectStats {
  total: number;
  codes: number;
  withDescription: number;
  noDescription: number;
}

export interface SubjectsParams {
  search: string;
  /** class id or '' for all */
  classId: string;
  /** section id or '' for all */
  sectionId: string;
  /** academic year (mock data is year-agnostic) or '' */
  year: string;
  page: number;
  pageSize: number;
}

export interface ClassSection {
  sectionId: string;
  classId: string;
  className: string;
  sectionName: string;
  label: string;
}

export interface ClassOption {
  id: string;
  name: string;
}

export const CLASS_LIST: ClassOption[] = [
  'Nursery', 'LKG', 'UKG', ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`),
].map((name, i) => ({ id: `c${i}`, name }));

const SECTION_NAMES = ['A', 'B'];

export const ALL_SECTIONS: ClassSection[] = CLASS_LIST.flatMap((c) =>
  SECTION_NAMES.map((s) => ({
    sectionId: `${c.id}-${s}`,
    classId: c.id,
    className: c.name,
    sectionName: s,
    label: `${c.name} · ${s}`,
  })),
);

export const ACADEMIC_YEARS = ['2026-2027', '2025-2026', '2024-2025'];

const sectionById = new Map(ALL_SECTIONS.map((s) => [s.sectionId, s]));

export function sectionsOfClass(classId: string): ClassSection[] {
  return ALL_SECTIONS.filter((s) => s.classId === classId);
}

const SEED: { name: string; code: string; desc: string; count: number; offset: number }[] = [
  { name: 'Art Education', code: 'ART', desc: 'Nursery to Class 10', count: 14, offset: 3 },
  { name: 'Computer Science', code: 'CS', desc: 'Nursery to Class 10', count: 14, offset: 12 },
  { name: 'English', code: 'ENG', desc: 'Language — Nursery to Class 10', count: 14, offset: 0 },
  { name: 'Environmental Studies', code: 'EVS', desc: 'Primary — Class 1 to 5', count: 5, offset: 2 },
  { name: 'General Knowledge', code: 'GK', desc: 'Pre-primary & primary', count: 8, offset: 4 },
  { name: 'Hindi', code: 'HIN', desc: 'Language — Nursery to Class 10', count: 14, offset: 18 },
  { name: 'Mathematics', code: 'MATH', desc: 'Nursery to Class 10', count: 14, offset: 16 },
  { name: 'Moral Science', code: 'MS', desc: 'Value education — Nursery to Class 10', count: 14, offset: 5 },
  { name: 'Music', code: 'MUS', desc: 'Co-scholastic — Nursery to Class 10', count: 14, offset: 20 },
  { name: 'Physical Education', code: 'PE', desc: 'Nursery to Class 10', count: 14, offset: 17 },
  { name: 'Sanskrit', code: 'SAN', desc: 'Language — Class 6 to 10', count: 6, offset: 14 },
  { name: 'Science', code: 'SCI', desc: 'Class 6 to 10', count: 6, offset: 20 },
  { name: 'Social Studies', code: 'SST', desc: 'Class 6 to 10', count: 6, offset: 21 },
];

function buildMock(): Subject[] {
  return SEED.map((s, i) => {
    const n = ALL_SECTIONS.length;
    const assignments: SubjectAssignment[] = [];
    for (let k = 0; k < s.count; k++) {
      const sec = ALL_SECTIONS[(s.offset + k * 2) % n];
      if (!assignments.some((a) => a.sectionId === sec.sectionId)) {
        assignments.push({ sectionId: sec.sectionId, label: sec.label });
      }
    }
    return { id: `sub-${i + 1}`, name: s.name, subjectCode: s.code, description: s.desc, assignments };
  });
}

export function useSubjects(params: SubjectsParams) {
  const [all, setAll] = useState<Subject[]>(() => buildMock());
  const [isLoading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1000);

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

  const stats = useMemo<SubjectStats>(() => {
    const withDescription = all.filter((s) => s.description.trim().length > 0).length;
    return {
      total: all.length,
      codes: all.filter((s) => s.subjectCode.trim().length > 0).length,
      withDescription,
      noDescription: all.length - withDescription,
    };
  }, [all]);

  const filtered = useMemo(() => {
    const q = params.search.trim().toLowerCase();
    return all.filter((s) => {
      if (params.sectionId) {
        if (!s.assignments.some((a) => a.sectionId === params.sectionId)) return false;
      } else if (params.classId) {
        if (!s.assignments.some((a) => sectionById.get(a.sectionId)?.classId === params.classId)) return false;
      }
      return (
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.subjectCode.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    });
  }, [all, params.search, params.classId, params.sectionId]);

  const data = useMemo(() => {
    const start = (params.page - 1) * params.pageSize;
    return filtered.slice(start, start + params.pageSize);
  }, [filtered, params.page, params.pageSize]);

  const add = useCallback((input: SubjectInput) => {
    nextId.current += 1;
    const created: Subject = {
      id: `sub-${nextId.current}`,
      name: input.name.trim(),
      subjectCode: input.subjectCode.trim().toUpperCase(),
      description: input.description.trim(),
      assignments: [],
    };
    setAll((prev) => [...prev, created]);
  }, []);

  const update = useCallback((id: string, input: SubjectInput) => {
    setAll((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              name: input.name.trim(),
              subjectCode: input.subjectCode.trim().toUpperCase(),
              description: input.description.trim(),
            }
          : s,
      ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setAll((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const setAssignments = useCallback((id: string, sectionIds: string[]) => {
    const assignments: SubjectAssignment[] = ALL_SECTIONS.filter((s) => sectionIds.includes(s.sectionId)).map((s) => ({
      sectionId: s.sectionId,
      label: s.label,
    }));
    setAll((prev) => prev.map((s) => (s.id === id ? { ...s, assignments } : s)));
  }, []);

  const allCodes = useMemo(() => all.map((s) => ({ id: s.id, code: s.subjectCode.toUpperCase() })), [all]);

  return { data, total: filtered.length, stats, allCodes, isLoading, refetch, add, update, remove, setAssignments };
}

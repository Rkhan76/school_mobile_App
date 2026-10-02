import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../lib/apiClient';
import { getAcademicYearsMaster, getClassesMaster } from '../common/api';
import type { AcademicYearLean, ClassWithSections } from '../common/types';
import {
  createSubject,
  deleteSubject,
  listSubjects,
  syncSubjectSections,
  updateSubject,
} from './api';
import type { SubjectInput, SubjectStats, SubjectWithAssignments } from './types';

export interface SubjectsParams {
  search: string;
  /** class id or '' for all */
  classId: string;
  /** section id or '' for all */
  sectionId: string;
  /** academic year id or '' for all */
  yearId: string;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

/**
 * The real `/academic/subjects` list endpoint is NOT paginated — it always returns the full
 * catalog with each subject's current section assignments embedded. So we fetch it once and do
 * search/class/section/year filtering client-side over the in-memory array, same as the backend
 * doc instructs ("ask separately if server-side filtering is ever added").
 */
export function useSubjects(params: SubjectsParams) {
  const [all, setAll] = useState<SubjectWithAssignments[]>([]);
  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [years, setYears] = useState<AcademicYearLean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeYearId = useMemo(() => {
    const active = years.find((y) => y.isActive);
    return active?.id ?? years[0]?.id ?? '';
  }, [years]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subjects, classesRes, yearsRes] = await Promise.all([
        listSubjects(),
        getClassesMaster(),
        getAcademicYearsMaster(),
      ]);
      setAll(subjects);
      setClasses(classesRes);
      setYears(yearsRes);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load subjects.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo<SubjectStats>(() => {
    const withDescription = all.filter((s) => (s.description ?? '').trim().length > 0).length;
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
        if (
          !s.assignments.some(
            (a) => a.sectionId === params.sectionId && (!params.yearId || a.academicYearId === params.yearId),
          )
        ) {
          return false;
        }
      } else if (params.classId) {
        if (
          !s.assignments.some(
            (a) => a.section?.class?.id === params.classId && (!params.yearId || a.academicYearId === params.yearId),
          )
        ) {
          return false;
        }
      } else if (params.yearId) {
        if (!s.assignments.some((a) => a.academicYearId === params.yearId)) return false;
      }
      return (
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.subjectCode.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [all, params.search, params.classId, params.sectionId, params.yearId]);

  const allCodes = useMemo(
    () => all.map((s) => ({ id: s.id, code: s.subjectCode.trim().toUpperCase() })),
    [all],
  );

  const add = useCallback(
    async (input: SubjectInput) => {
      await createSubject(input);
      await load();
    },
    [load],
  );

  const update = useCallback(
    async (id: string, input: SubjectInput) => {
      await updateSubject(id, input);
      await load();
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteSubject(id);
      await load();
    },
    [load],
  );

  const setAssignments = useCallback(
    async (id: string, sectionIds: string[]) => {
      if (!activeYearId) {
        throw new Error('No academic year is configured for this school yet.');
      }
      await syncSubjectSections(id, { academicYearId: activeYearId, sectionIds, isOptional: false });
      await load();
    },
    [load, activeYearId],
  );

  return {
    data: filtered,
    total: filtered.length,
    stats,
    allCodes,
    classes,
    years,
    activeYearId,
    isLoading,
    error,
    refetch: load,
    add,
    update,
    remove,
    setAssignments,
  };
}

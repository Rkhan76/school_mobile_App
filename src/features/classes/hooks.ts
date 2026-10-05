import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAcademicYearsMaster, getClassesMaster } from '../common/api';
import type { ClassWithSections } from '../common/types';
import { listStudents } from '../students/api';
import type { StudentListItem } from '../students/types';
import { apiErrorMessage, getClassById, getClassSections, getSectionSubjects, listClasses } from './api';
import type { AcademicClass, ClassSection, ClassStats, SectionSubject } from './types';

const errMsg = apiErrorMessage;

/** Generic infinite-scroll accumulator over a paginated fetcher. Resets when `deps` change. */
function useInfinite<T>(
  fetcher: (page: number) => Promise<{ data: T[]; page: number; totalPages: number; total: number }>,
  deps: unknown[],
  enabled = true,
) {
  const [rows, setRows] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchPage = useCallback(async (p: number, replace: boolean) => {
    const mine = ++requestId.current;
    if (replace) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const res = await fetcherRef.current(p);
      if (mine !== requestId.current) return;
      setRows((prev) => (replace ? res.data : [...prev, ...res.data]));
      setTotalPages(Math.max(1, res.totalPages));
      setTotal(res.total);
      setPage(res.page);
    } catch (e) {
      if (mine !== requestId.current) return;
      if (replace) {
        setRows([]);
        setTotalPages(1);
        setTotal(0);
      }
      setError(errMsg(e));
    } finally {
      if (mine === requestId.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      requestId.current++;
      setRows([]);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  const refetch = useCallback(() => fetchPage(1, true), [fetchPage]);
  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || error || page >= totalPages) return;
    fetchPage(page + 1, false);
  }, [fetchPage, isLoading, isLoadingMore, error, page, totalPages]);

  return { rows, total, isLoading, isLoadingMore, error, hasMore: page < totalPages, loadMore, refetch };
}

export function useClasses({ search = '', pageSize }: { search?: string; pageSize: number }) {
  const q = search.trim();
  // Search is a server param; changing it resets to page 1.
  const paged = useInfinite<AcademicClass>((p) => listClasses({ page: p, limit: pageSize, search: q || undefined }), [pageSize, q]);
  const data = paged.rows;

  // Exact totals come from the master list; fall back to the loaded page data until it arrives.
  const [master, setMaster] = useState<ClassWithSections[] | null>(null);
  const { refetch: pagedRefetch } = paged;
  const loadMaster = useCallback(() => {
    getClassesMaster()
      .then(setMaster)
      .catch(() => {});
  }, []);
  useEffect(loadMaster, [loadMaster]);

  const stats = useMemo<ClassStats>(
    () => ({
      totalClasses: master ? master.length : paged.total,
      totalSections: (master ?? paged.rows).reduce((n, c) => n + c.sections.length, 0),
    }),
    [master, paged.total, paged.rows],
  );

  const refetch = useCallback(() => {
    loadMaster();
    pagedRefetch();
  }, [loadMaster, pagedRefetch]);

  return {
    data,
    hasMore: paged.hasMore,
    isLoadingMore: paged.isLoadingMore,
    loadMore: paged.loadMore,
    stats,
    isLoading: paged.isLoading,
    error: paged.error,
    refetch,
  };
}

/**
 * Sections of a class for the active academic year (falls back to every year when that is empty
 * or the years lookup fails).
 */
export function useClassSections(classId: string | undefined) {
  const [data, setData] = useState<ClassSection[]>([]);
  const [isLoading, setIsLoading] = useState(!!classId);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!classId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        let yearId: string | undefined;
        try {
          const years = await getAcademicYearsMaster();
          yearId = years.find((y) => y.isActive)?.id;
        } catch {
          yearId = undefined;
        }
        let secs = await getClassSections(classId, yearId);
        if (secs.length === 0 && yearId) secs = await getClassSections(classId);
        if (!cancelled) setData(secs);
      } catch (e) {
        if (!cancelled) {
          setData([]);
          setError(errMsg(e));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  return { data, isLoading, error, refetch };
}

export function useClassById(id: string | undefined) {
  const [data, setData] = useState<AcademicClass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setError('Class not found');
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getClassById(id)
      .then((c) => {
        if (!cancelled) setData(c);
      })
      .catch((e) => !cancelled && setError(errMsg(e)))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  return { data, isLoading, error, refetch };
}

const STUDENT_PAGE = 10;

export function useSectionStudents(params: { classId: string; sectionId?: string; academicYearId?: string }) {
  const { classId, sectionId, academicYearId } = params;
  return useInfinite<StudentListItem>(
    (page) => listStudents({ classId, sectionId, academicYearId, page, limit: STUDENT_PAGE }),
    [classId, sectionId, academicYearId],
    !!sectionId,
  );
}

export function useSectionSubjects(sectionId?: string, academicYearId?: string) {
  const [data, setData] = useState<SectionSubject[]>([]);
  const [isLoading, setIsLoading] = useState(!!sectionId);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!sectionId || !academicYearId) {
      setData([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getSectionSubjects(sectionId, academicYearId)
      .then((r) => !cancelled && setData(Array.isArray(r) ? r : []))
      .catch((e) => {
        if (cancelled) return;
        setData([]);
        setError(errMsg(e));
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sectionId, academicYearId, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  return { data, isLoading, error, refetch };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { getStudentStats, listStudents, toggleStudentBlock, toggleStudentStatus } from './api';
import type { StudentListItem, StudentStats } from './types';

const PAGE_SIZE = 20;

export interface UseStudentsParams {
  search?: string;
  classId?: string;
  sectionId?: string;
}

/** List row + a client-side-only optimistic status, since /students/list doesn't return enrollmentStatus. */
export type StudentRow = StudentListItem & { status: 'active' | 'inactive' };

export interface UseStudentsResult {
  data: StudentRow[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
  stats: StudentStats;
  /** Resolves true on success; false (after surfacing an alert-worthy error) otherwise. */
  toggleStatus: (id: string) => Promise<boolean>;
  toggleBlock: (id: string) => Promise<boolean>;
}

const EMPTY_STATS: StudentStats = { total: 0, male: 0, female: 0, withPortalAccess: 0 };

/**
 * Infinite-scroll student list: accumulates pages instead of paging by number.
 * Resets to page 1 whenever search/classId/sectionId changes.
 */
export function useStudents(params: UseStudentsParams): UseStudentsResult {
  const { search, classId, sectionId } = params;

  const [rows, setRows] = useState<StudentListItem[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, 'active' | 'inactive'>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [stats, setStats] = useState<StudentStats>(EMPTY_STATS);
  const requestId = useRef(0);

  const fetchStats = useCallback(() => {
    getStudentStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      const myRequest = ++requestId.current;
      if (replace) setIsLoading(true);
      else setIsLoadingMore(true);
      try {
        const result = await listStudents({
          page: pageToLoad,
          limit: PAGE_SIZE,
          classId,
          sectionId,
          search,
        });
        if (myRequest !== requestId.current) return;
        setRows((prev) => (replace ? result.data : [...prev, ...result.data]));
        setTotalPages(Math.max(1, result.totalPages));
        setPage(result.page);
      } catch {
        if (myRequest !== requestId.current) return;
        if (replace) {
          setRows([]);
          setTotalPages(1);
        }
      } finally {
        if (myRequest === requestId.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [classId, sectionId, search],
  );

  const refetch = useCallback(() => {
    fetchPage(1, true);
    fetchStats();
  }, [fetchPage, fetchStats]);

  useEffect(() => {
    fetchPage(1, true);
    // Reset per-row local status overrides whenever the underlying query changes.
    setStatusOverrides({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, classId, sectionId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || page >= totalPages) return;
    fetchPage(page + 1, false);
  }, [fetchPage, isLoading, isLoadingMore, page, totalPages]);

  const toggleStatus = useCallback(
    async (id: string) => {
      try {
        const result = await toggleStudentStatus(id);
        const next = result.enrollmentStatus === 'inactive' ? 'inactive' : 'active';
        setStatusOverrides((prev) => ({ ...prev, [id]: next }));
        fetchStats();
        return true;
      } catch {
        return false;
      }
    },
    [fetchStats],
  );

  const toggleBlock = useCallback(
    async (id: string) => {
      try {
        await toggleStudentBlock(id);
        setRows((prev) => prev.filter((s) => s.id !== id));
        fetchStats();
        return true;
      } catch {
        return false;
      }
    },
    [fetchStats],
  );

  const data: StudentRow[] = rows.map((r) => ({ ...r, status: statusOverrides[r.id] ?? 'active' }));

  return {
    data,
    isLoading,
    isLoadingMore,
    hasMore: page < totalPages,
    loadMore,
    refetch,
    stats,
    toggleStatus,
    toggleBlock,
  };
}

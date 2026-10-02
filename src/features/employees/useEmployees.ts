import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../../lib/apiClient';
import {
  createNonTeachingStaff,
  createTeacher,
  getTeacherStats,
  listNonTeachingStaff,
  listTeachers,
  setTeacherStatus,
  toggleNTSBlock,
  toggleTeacherBlock,
  updateNonTeachingStaff,
} from './api';
import type {
  CreateNTSPayload,
  CreateTeacherPayload,
  EmployeeStatus,
  Gender,
  NTSEntity,
  NTSListItem,
  TeacherEntity,
  TeacherStats,
} from './types';

export const PAGE_SIZE = 20;

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong.';
}

const EMPTY_TEACHER_STATS: TeacherStats = { total: 0, male: 0, female: 0, assignedToClass: 0 };

type TeacherParams = { search: string; pageSize: number; gender?: Gender };

/**
 * Infinite-scroll teacher list backed by GET /teachers. `GET /teachers` only
 * supports `search` server-side (no subject/class/status filter per the doc) —
 * `gender` here is applied client-side to whatever pages have been loaded so far.
 */
export function useTeachers(params: TeacherParams) {
  const [allData, setAllData] = useState<TeacherEntity[]>([]);
  const [stats, setStats] = useState<TeacherStats>(EMPTY_TEACHER_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const requestId = useRef(0);

  const fetchStats = useCallback(async () => {
    try {
      const s = await getTeacherStats();
      setStats(s);
    } catch (err) {
      // Stats are a nice-to-have on this screen; don't block the list over it.
      if (__DEV__) console.warn('[employees] teacher stats failed:', errorMessage(err));
    }
  }, []);

  useEffect(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    setPage(1);
    setHasMore(false);
    (async () => {
      try {
        const result = await listTeachers({ page: 1, limit: params.pageSize, search: params.search });
        if (requestId.current !== id) return;
        setAllData(result.data);
        setPage(result.page);
        setHasMore(result.page < result.totalPages);
      } catch (err) {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      } finally {
        if (requestId.current === id) setIsLoading(false);
      }
    })();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.pageSize, params.search]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    const id = requestId.current;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const result = await listTeachers({ page: nextPage, limit: params.pageSize, search: params.search });
      if (requestId.current !== id) return;
      setAllData((prev) => [...prev, ...result.data]);
      setPage(result.page);
      setHasMore(result.page < result.totalPages);
    } catch (err) {
      if (requestId.current === id) Alert.alert('Error', errorMessage(err));
    } finally {
      if (requestId.current === id) setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, hasMore, page, params.pageSize, params.search]);

  const refetch = useCallback(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    (async () => {
      try {
        const result = await listTeachers({ page: 1, limit: params.pageSize, search: params.search });
        if (requestId.current !== id) return;
        setAllData(result.data);
        setPage(result.page);
        setHasMore(result.page < result.totalPages);
      } catch (err) {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      } finally {
        if (requestId.current === id) setIsLoading(false);
      }
    })();
    fetchStats();
  }, [params.pageSize, params.search, fetchStats]);

  const data = useMemo(() => {
    if (!params.gender) return allData;
    return allData.filter((t) => t.gender === params.gender);
  }, [allData, params.gender]);

  const setStatus = useCallback(
    async (id: string, status: EmployeeStatus) => {
      try {
        await setTeacherStatus(id, status);
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      } finally {
        refetch();
      }
    },
    [refetch]
  );

  const toggleBlock = useCallback(
    async (id: string) => {
      try {
        await toggleTeacherBlock(id);
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      } finally {
        refetch();
      }
    },
    [refetch]
  );

  const create = useCallback(
    async (payload: CreateTeacherPayload) => {
      await createTeacher(payload);
      refetch();
    },
    [refetch]
  );

  return { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, stats, setStatus, toggleBlock, create };
}

type StaffStats = { total: number; male: number; female: number; active: number };

type NTSParams = { search: string; pageSize: number; gender?: Gender };

/**
 * Infinite-scroll non-teaching-staff list backed by GET /non-teaching-staff.
 * There's no stats endpoint for NTS per the doc, so `stats.total` comes from the
 * paginated response's true total, while male/female/active are counted over
 * whatever has been loaded so far (not the full server-side set).
 */
export function useNonTeachingStaff(params: NTSParams) {
  const [allData, setAllData] = useState<NTSListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    setPage(1);
    setHasMore(false);
    (async () => {
      try {
        const result = await listNonTeachingStaff({ page: 1, limit: params.pageSize, search: params.search });
        if (requestId.current !== id) return;
        setAllData(result.data);
        setTotal(result.total);
        setPage(result.page);
        setHasMore(result.page < result.totalPages);
      } catch (err) {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      } finally {
        if (requestId.current === id) setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.pageSize, params.search]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    const id = requestId.current;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const result = await listNonTeachingStaff({ page: nextPage, limit: params.pageSize, search: params.search });
      if (requestId.current !== id) return;
      setAllData((prev) => [...prev, ...result.data]);
      setTotal(result.total);
      setPage(result.page);
      setHasMore(result.page < result.totalPages);
    } catch (err) {
      if (requestId.current === id) Alert.alert('Error', errorMessage(err));
    } finally {
      if (requestId.current === id) setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, hasMore, page, params.pageSize, params.search]);

  const refetch = useCallback(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    (async () => {
      try {
        const result = await listNonTeachingStaff({ page: 1, limit: params.pageSize, search: params.search });
        if (requestId.current !== id) return;
        setAllData(result.data);
        setTotal(result.total);
        setPage(result.page);
        setHasMore(result.page < result.totalPages);
      } catch (err) {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      } finally {
        if (requestId.current === id) setIsLoading(false);
      }
    })();
  }, [params.pageSize, params.search]);

  const data = useMemo(() => {
    if (!params.gender) return allData;
    return allData.filter((s) => s.gender === params.gender);
  }, [allData, params.gender]);

  const stats = useMemo<StaffStats>(
    () => ({
      total,
      male: allData.filter((s) => s.gender === 'Male').length,
      female: allData.filter((s) => s.gender === 'Female').length,
      active: allData.filter((s) => s.status === 'ACTIVE').length,
    }),
    [allData, total]
  );

  const setStatus = useCallback(
    async (id: string, status: EmployeeStatus) => {
      try {
        await updateNonTeachingStaff(id, { status });
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      } finally {
        refetch();
      }
    },
    [refetch]
  );

  const toggleBlock = useCallback(
    async (id: string) => {
      try {
        await toggleNTSBlock(id);
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      } finally {
        refetch();
      }
    },
    [refetch]
  );

  const create = useCallback(
    async (payload: CreateNTSPayload) => {
      await createNonTeachingStaff(payload);
      refetch();
    },
    [refetch]
  );

  return { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, stats, setStatus, toggleBlock, create };
}

export type { TeacherEntity, NTSEntity, NTSListItem };

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../../lib/apiClient';
import {
  approveAdmission,
  bulkApproveAdmissions,
  cancelAdmission,
  deleteAdmission,
  getAdmissionStats,
  listAdmissions,
  rejectAdmission,
} from './api';
import type { AdmissionListItem, AdmissionStats, AdmissionStatus } from './types';

type Params = {
  search: string;
  className: string;
  classId: string;
  status: AdmissionStatus | 'all';
  pageSize: number;
};

const EMPTY_STATS: AdmissionStats = { totalApplications: 0, enrolled: 0, pending: 0, rejected: 0 };

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong.';
}

export function useAdmissions(params: Params) {
  const [data, setData] = useState<AdmissionListItem[]>([]);
  const [stats, setStats] = useState<AdmissionStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Tracks the in-flight/most-recent filter key so stale responses from a
  // superseded fetch (e.g. filters changed while a request was in flight)
  // don't clobber newer state.
  const requestId = useRef(0);

  const fetchStats = useCallback(async () => {
    try {
      const s = await getAdmissionStats();
      setStats(s);
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    }
  }, []);

  // Reset and fetch page 1 whenever the filters change.
  useEffect(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    setPage(1);
    setHasMore(false);
    (async () => {
      try {
        const list = await listAdmissions({
          page: 1,
          limit: params.pageSize,
          status: params.status,
          classId: params.classId || 'all',
          search: params.search,
        });
        if (requestId.current !== id) return;
        setData(list.data);
        setHasMore(list.page < list.totalPages);
        setPage(1);
      } catch (err) {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      } finally {
        if (requestId.current === id) setIsLoading(false);
      }
    })();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.pageSize, params.status, params.classId, params.search]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    const id = requestId.current;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const list = await listAdmissions({
        page: nextPage,
        limit: params.pageSize,
        status: params.status,
        classId: params.classId || 'all',
        search: params.search,
      });
      if (requestId.current !== id) return;
      setData((prev) => [...prev, ...list.data]);
      setPage(list.page);
      setHasMore(list.page < list.totalPages);
    } catch (err) {
      if (requestId.current === id) Alert.alert('Error', errorMessage(err));
    } finally {
      if (requestId.current === id) setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, hasMore, page, params.pageSize, params.status, params.classId, params.search]);

  const refetch = useCallback(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    (async () => {
      try {
        const list = await listAdmissions({
          page: 1,
          limit: params.pageSize,
          status: params.status,
          classId: params.classId || 'all',
          search: params.search,
        });
        if (requestId.current !== id) return;
        setData(list.data);
        setPage(1);
        setHasMore(list.page < list.totalPages);
      } catch (err) {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      } finally {
        if (requestId.current === id) setIsLoading(false);
      }
    })();
    fetchStats();
  }, [params.pageSize, params.status, params.classId, params.search, fetchStats]);

  const approve = useCallback(
    async (ids: string[]) => {
      try {
        if (ids.length === 1) {
          await approveAdmission(ids[0]);
        } else {
          const result = await bulkApproveAdmissions(ids);
          if (result.failed.length > 0) {
            Alert.alert(
              'Some approvals failed',
              result.failed.map((f) => `${f.id}: ${f.error}`).join('\n')
            );
          }
        }
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      } finally {
        refetch();
      }
    },
    [refetch]
  );

  const reject = useCallback(
    async (ids: string[], reason: string) => {
      const failed: { id: string; error: string }[] = [];
      for (const id of ids) {
        try {
          await rejectAdmission(id, reason);
        } catch (err) {
          failed.push({ id, error: errorMessage(err) });
        }
      }
      if (failed.length > 0) {
        Alert.alert(
          'Some rejections failed',
          failed.map((f) => `${f.id}: ${f.error}`).join('\n')
        );
      }
      refetch();
    },
    [refetch]
  );

  const cancelOne = useCallback(
    async (id: string) => {
      try {
        await cancelAdmission(id);
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      } finally {
        refetch();
      }
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteAdmission(id);
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      } finally {
        refetch();
      }
    },
    [refetch]
  );

  return { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, stats, approve, reject, cancelOne, remove };
}

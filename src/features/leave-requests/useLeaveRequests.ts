import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../../lib/apiClient';
import { decideLeaveApplication, listLeaveApplications } from './api';
import type { LeaveApplication, LeaveDecision, LeaveStatus } from './types';

export const PAGE_SIZE = 20;

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong.';
}

type Params = {
  status?: LeaveStatus;
  applicantRole?: string;
  from?: string;
  to?: string;
};

/**
 * Infinite-scroll leave-applications queue backed by GET /leaves. Resets and
 * refetches from page 1 whenever any filter changes; `loadMore` appends pages.
 */
export function useLeaveRequests(params: Params) {
  const [allData, setAllData] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const requestId = useRef(0);

  const fetchPage = useCallback(
    (targetPage: number, mode: 'replace' | 'append') => {
      const id = ++requestId.current;
      if (mode === 'replace') setIsLoading(true);
      else setIsLoadingMore(true);

      (async () => {
        try {
          const result = await listLeaveApplications({
            page: targetPage,
            limit: PAGE_SIZE,
            status: params.status,
            applicantRole: params.applicantRole,
            from: params.from,
            to: params.to,
          });
          if (requestId.current !== id) return;
          setAllData((prev) => (mode === 'replace' ? result.data : [...prev, ...result.data]));
          setPage(result.page);
          setHasMore(result.page < result.totalPages);
        } catch (err) {
          if (requestId.current !== id) return;
          Alert.alert('Error', errorMessage(err));
        } finally {
          if (requestId.current === id) {
            if (mode === 'replace') setIsLoading(false);
            else setIsLoadingMore(false);
          }
        }
      })();
    },
    [params.status, params.applicantRole, params.from, params.to]
  );

  // Reset + refetch whenever a filter changes.
  useEffect(() => {
    setHasMore(false);
    fetchPage(1, 'replace');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.status, params.applicantRole, params.from, params.to]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return;
    fetchPage(page + 1, 'append');
  }, [isLoading, isLoadingMore, hasMore, page, fetchPage]);

  const refetch = useCallback(() => {
    fetchPage(1, 'replace');
  }, [fetchPage]);

  /**
   * Approve/reject one application. Surfaces the backend's own message for the
   * two documented failure cases verbatim: 409 ("already decided" — not PENDING
   * anymore) and 403 (deciding your own application). Returns true on success.
   */
  const decide = useCallback(
    async (id: string, decision: LeaveDecision, reviewComments?: string): Promise<boolean> => {
      try {
        await decideLeaveApplication(id, decision, reviewComments);
        refetch();
        return true;
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
        return false;
      }
    },
    [refetch]
  );

  return { data: allData, isLoading, isLoadingMore, hasMore, loadMore, refetch, decide };
}

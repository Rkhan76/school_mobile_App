import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../../lib/apiClient';
import { listAuditLogs } from './api';
import { PAGE_SIZE } from './types';
import type { AuditLog } from './types';

export type AuditLogQueryParams = {
  entityType?: string;
  action?: string;
  userId?: string;
  fromDate?: string;
  toDate?: string;
};

export const PERMISSION_DENIED_MESSAGE =
  "Audit logs aren't enabled for your account yet — contact your administrator.";

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong.';
}

/**
 * Infinite-scroll audit log list backed by GET /audit-logs. Pure read — no mutations.
 * Resets and refetches page 1 whenever any filter changes; `loadMore` appends subsequent
 * pages. A 403 (school onboarded before `audit-log.list.read` was granted on its Admin
 * role — see doc gotcha) is surfaced as `permissionDenied` rather than a generic alert.
 */
export function useAuditLogs(params: AuditLogQueryParams) {
  const [allData, setAllData] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestId = useRef(0);
  const { entityType, action, userId, fromDate, toDate } = params;

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const id = requestId.current;
      if (append) setIsLoadingMore(true);
      else {
        setIsLoading(true);
        setPermissionDenied(false);
      }
      try {
        const result = await listAuditLogs({
          entityType,
          action,
          userId,
          fromDate,
          toDate,
          page: pageNum,
          limit: PAGE_SIZE,
        });
        if (requestId.current !== id) return;
        setAllData((prev) => (append ? [...prev, ...result.data] : result.data));
        setPage(result.page);
        setHasMore(result.page < result.totalPages);
      } catch (err) {
        if (requestId.current !== id) return;
        if (err instanceof ApiError && err.statusCode === 403) {
          setPermissionDenied(true);
          setAllData([]);
          setHasMore(false);
        } else {
          Alert.alert('Error', errorMessage(err));
        }
      } finally {
        if (requestId.current === id) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [entityType, action, userId, fromDate, toDate]
  );

  useEffect(() => {
    requestId.current += 1;
    setPage(1);
    setHasMore(false);
    fetchPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, action, userId, fromDate, toDate]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore || permissionDenied) return;
    fetchPage(page + 1, true);
  }, [isLoading, isLoadingMore, hasMore, permissionDenied, page, fetchPage]);

  const refetch = useCallback(() => {
    requestId.current += 1;
    fetchPage(1, false);
  }, [fetchPage]);

  return {
    data: allData,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refetch,
    permissionDenied,
    permissionDeniedMessage: PERMISSION_DENIED_MESSAGE,
  };
}

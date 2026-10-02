import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../../lib/apiClient';
import { createNotice, deleteNotice, listNotices, updateNotice } from './api';
import type { Audience, Notice, NoticeInput } from './types';

export const PAGE_SIZE = 10;

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
}

/** Pinned notices float to the top, within whatever pages have been loaded so
 * far — the backend doesn't document a pin-sort guarantee, so this is purely
 * a client-side nicety layered on top of server order. Stable sort keeps
 * relative order within each group (pinned / not pinned) intact. */
function sortPinnedFirst(list: Notice[]): Notice[] {
  return [...list].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
}

export type NoticesParams = {
  search: string;
  /** audience filter, or '' for all (server applies its own audience scoping regardless) */
  audience: Audience | '';
  pageSize: number;
};

/**
 * Infinite-scroll notice list backed by GET /notices. Audience scoping
 * (publish/expiry window + role visibility) happens entirely server-side —
 * this hook just renders whatever page the server returns.
 */
export function useNotices(params: NoticesParams) {
  const [data, setData] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const requestId = useRef(0);

  const fetchFirstPage = useCallback(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    setHasMore(false);
    listNotices({
      page: 1,
      limit: params.pageSize,
      search: params.search || undefined,
      targetAudience: params.audience || undefined,
    })
      .then((result) => {
        if (requestId.current !== id) return;
        setData(sortPinnedFirst(result.data));
        setPage(result.page);
        setHasMore(result.page < result.totalPages);
      })
      .catch((err) => {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      })
      .finally(() => {
        if (requestId.current === id) setIsLoading(false);
      });
  }, [params.pageSize, params.search, params.audience]);

  // Reset to page 1 whenever search/audience change.
  useEffect(() => {
    fetchFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.pageSize, params.search, params.audience]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return;
    const id = requestId.current;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    listNotices({
      page: nextPage,
      limit: params.pageSize,
      search: params.search || undefined,
      targetAudience: params.audience || undefined,
    })
      .then((result) => {
        if (requestId.current !== id) return;
        setData((prev) => sortPinnedFirst([...prev, ...result.data]));
        setPage(result.page);
        setHasMore(result.page < result.totalPages);
      })
      .catch((err) => {
        if (requestId.current === id) Alert.alert('Error', errorMessage(err));
      })
      .finally(() => {
        if (requestId.current === id) setIsLoadingMore(false);
      });
  }, [isLoading, isLoadingMore, hasMore, page, params.pageSize, params.search, params.audience]);

  const refetch = useCallback(() => fetchFirstPage(), [fetchFirstPage]);

  const add = useCallback(
    async (input: NoticeInput) => {
      try {
        const created = await createNotice(input);
        setData((prev) => sortPinnedFirst([created, ...prev]));
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      }
    },
    []
  );

  const update = useCallback(
    async (id: string, input: Partial<NoticeInput>) => {
      try {
        const updated = await updateNotice(id, input);
        setData((prev) => sortPinnedFirst(prev.map((n) => (n.id === id ? updated : n))));
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      }
    },
    []
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteNotice(id);
        setData((prev) => prev.filter((n) => n.id !== id));
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      }
    },
    []
  );

  return { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, add, update, remove };
}

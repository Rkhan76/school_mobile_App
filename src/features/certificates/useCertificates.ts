import { useCallback, useEffect, useRef, useState } from 'react';
import { issueCertificate, listCertificates, revokeCertificate, type IssueCertificateInput } from './api';
import type { Certificate, CertificateStatus, RecipientType } from './types';

const PAGE_SIZE = 10;

export interface UseCertificatesParams {
  search?: string;
  recipientType?: RecipientType | '';
  status?: CertificateStatus | '';
  academicYearId?: string;
}

export interface CertificateStats {
  total: number;
  active: number;
  revoked: number;
}

export interface UseCertificatesResult {
  data: Certificate[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
  stats: CertificateStats;
  issue: (input: IssueCertificateInput) => Promise<Certificate>;
  revoke: (id: string, reason?: string) => Promise<Certificate>;
}

const EMPTY_STATS: CertificateStats = { total: 0, active: 0, revoked: 0 };

/**
 * Infinite-scroll certificates list: accumulates pages instead of paging by
 * number, resetting to page 1 whenever search/filters change.
 *
 * There's no stats endpoint documented for this module, so `stats` is
 * computed from two cheap `limit=1` list calls (one per status) just to read
 * their `total` — cheaper than pulling every row to count client-side.
 */
export function useCertificates(params: UseCertificatesParams): UseCertificatesResult {
  const { search, recipientType, status, academicYearId } = params;

  const [rows, setRows] = useState<Certificate[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [stats, setStats] = useState<CertificateStats>(EMPTY_STATS);
  const requestId = useRef(0);

  const fetchStats = useCallback(() => {
    Promise.all([
      listCertificates({ limit: 1, status: 'ACTIVE' }),
      listCertificates({ limit: 1, status: 'REVOKED' }),
    ])
      .then(([active, revoked]) => {
        setStats({ total: active.total + revoked.total, active: active.total, revoked: revoked.total });
      })
      .catch(() => {});
  }, []);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      const myRequest = ++requestId.current;
      if (replace) setIsLoading(true);
      else setIsLoadingMore(true);
      try {
        const result = await listCertificates({
          page: pageToLoad,
          limit: PAGE_SIZE,
          recipientType: recipientType || undefined,
          status: status || undefined,
          search,
          academicYearId,
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
    [recipientType, status, search, academicYearId],
  );

  const refetch = useCallback(() => {
    fetchPage(1, true);
    fetchStats();
  }, [fetchPage, fetchStats]);

  useEffect(() => {
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, recipientType, status, academicYearId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || page >= totalPages) return;
    fetchPage(page + 1, false);
  }, [fetchPage, isLoading, isLoadingMore, page, totalPages]);

  const issue = useCallback(
    async (input: IssueCertificateInput) => {
      const created = await issueCertificate(input);
      setRows((prev) => [created, ...prev]);
      fetchStats();
      return created;
    },
    [fetchStats],
  );

  const revoke = useCallback(
    async (id: string, reason?: string) => {
      const updated = await revokeCertificate(id, reason);
      setRows((prev) => prev.map((c) => (c.id === id ? updated : c)));
      fetchStats();
      return updated;
    },
    [fetchStats],
  );

  return {
    data: rows,
    isLoading,
    isLoadingMore,
    hasMore: page < totalPages,
    loadMore,
    refetch,
    stats,
    issue,
    revoke,
  };
}

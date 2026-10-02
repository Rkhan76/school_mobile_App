import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../lib/apiClient';
import {
  createCashbookEntry,
  deleteCashbookEntry,
  getLedgerSummary,
  isFeatureNotInPlanError,
  listCashbook,
  listLedger,
} from './api';
import type {
  CashbookCategory,
  CashbookEntry,
  CreateCashbookInput,
  EntryType,
  LedgerCategory,
  LedgerEntry,
  LedgerSummary,
} from './types';

const DEFAULT_PAGE_SIZE = 20;

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.statusCode === 403) return 'You do not have permission to view this.';
    return err.message || fallback;
  }
  return fallback;
}

/* ---------------------------- Ledger (read-only) ---------------------------- */

export interface LedgerFilterParams {
  entryType?: EntryType;
  category?: LedgerCategory;
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
}

export interface UseLedgerResult {
  data: LedgerEntry[];
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
  error: string | null;
  planLocked: boolean;
  summary: LedgerSummary | null;
  summaryLoading: boolean;
}

/**
 * Infinite-scroll, read-only ledger list — no add/update/remove, the real API has none.
 * Also fetches /ledger/summary for the stat tiles, refetched whenever the filters
 * (not pagination) change.
 */
export function useLedger(params: LedgerFilterParams): UseLedgerResult {
  const { entryType, category, dateFrom, dateTo, pageSize = DEFAULT_PAGE_SIZE } = params;

  const [rows, setRows] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listPlanLocked, setListPlanLocked] = useState(false);
  const requestId = useRef(0);

  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryPlanLocked, setSummaryPlanLocked] = useState(false);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      const myRequest = ++requestId.current;
      if (replace) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }
      try {
        const result = await listLedger({
          entryType,
          category,
          dateFrom,
          dateTo,
          page: pageToLoad,
          limit: pageSize,
        });
        if (myRequest !== requestId.current) return;
        setRows((prev) => (replace ? result.data : [...prev, ...result.data]));
        setTotal(result.total);
        setTotalPages(Math.max(1, result.totalPages));
        setPage(result.page);
        setListPlanLocked(false);
      } catch (err) {
        if (myRequest !== requestId.current) return;
        if (isFeatureNotInPlanError(err)) {
          setListPlanLocked(true);
        } else {
          setError(errorMessage(err, 'Could not load ledger entries.'));
        }
        if (replace) {
          setRows([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (myRequest === requestId.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [entryType, category, dateFrom, dateTo, pageSize],
  );

  const fetchSummary = useCallback(() => {
    setSummaryLoading(true);
    getLedgerSummary({ entryType, category, dateFrom, dateTo })
      .then((s) => {
        setSummary(s);
        setSummaryPlanLocked(false);
      })
      .catch((err) => {
        setSummary(null);
        if (isFeatureNotInPlanError(err)) setSummaryPlanLocked(true);
      })
      .finally(() => setSummaryLoading(false));
  }, [entryType, category, dateFrom, dateTo]);

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || listPlanLocked || page >= totalPages) return;
    fetchPage(page + 1, false);
  }, [fetchPage, isLoading, isLoadingMore, listPlanLocked, page, totalPages]);

  const refetch = useCallback(() => {
    fetchPage(1, true);
    fetchSummary();
  }, [fetchPage, fetchSummary]);

  return {
    data: rows,
    total,
    isLoading,
    isLoadingMore,
    hasMore: page < totalPages,
    loadMore,
    refetch,
    error,
    planLocked: listPlanLocked || summaryPlanLocked,
    summary,
    summaryLoading,
  };
}

/* --------------------------- Cashbook (no edit) ----------------------------- */

export interface CashbookFilterParams {
  entryType?: EntryType;
  category?: CashbookCategory;
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
}

export interface UseCashbookResult {
  data: CashbookEntry[];
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
  error: string | null;
  planLocked: boolean;
  isSaving: boolean;
  /** POST /cashbook. Resolves true on success (after refreshing the list from page 1). */
  add: (input: CreateCashbookInput) => Promise<boolean>;
  /** DELETE /cashbook/:id — soft-delete + offsetting ledger reversal, not a true delete. */
  remove: (id: string) => Promise<boolean>;
}

/**
 * Infinite-scroll cashbook list with create + delete (no update — there's no edit
 * endpoint; deleting soft-deletes and writes an offsetting reversal to the ledger).
 */
export function useCashbook(params: CashbookFilterParams): UseCashbookResult {
  const { entryType, category, dateFrom, dateTo, pageSize = DEFAULT_PAGE_SIZE } = params;

  const [rows, setRows] = useState<CashbookEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planLocked, setPlanLocked] = useState(false);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      const myRequest = ++requestId.current;
      if (replace) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }
      try {
        const result = await listCashbook({
          entryType,
          category,
          dateFrom,
          dateTo,
          page: pageToLoad,
          limit: pageSize,
        });
        if (myRequest !== requestId.current) return;
        setRows((prev) => (replace ? result.data : [...prev, ...result.data]));
        setTotal(result.total);
        setTotalPages(Math.max(1, result.totalPages));
        setPage(result.page);
        setPlanLocked(false);
      } catch (err) {
        if (myRequest !== requestId.current) return;
        if (isFeatureNotInPlanError(err)) {
          setPlanLocked(true);
        } else {
          setError(errorMessage(err, 'Could not load cashbook entries.'));
        }
        if (replace) {
          setRows([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (myRequest === requestId.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [entryType, category, dateFrom, dateTo, pageSize],
  );

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || planLocked || page >= totalPages) return;
    fetchPage(page + 1, false);
  }, [fetchPage, isLoading, isLoadingMore, planLocked, page, totalPages]);

  const refetch = useCallback(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  const add = useCallback(
    async (input: CreateCashbookInput) => {
      setIsSaving(true);
      try {
        await createCashbookEntry(input);
        // Newest-dated first on the server; reload from page 1 so the new entry shows up.
        await fetchPage(1, true);
        return true;
      } catch (err) {
        setError(errorMessage(err, 'Could not add this entry.'));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchPage],
  );

  const remove = useCallback(async (id: string) => {
    try {
      await deleteCashbookEntry(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      return true;
    } catch (err) {
      setError(errorMessage(err, 'Could not delete this entry.'));
      return false;
    }
  }, []);

  return {
    data: rows,
    total,
    isLoading,
    isLoadingMore,
    hasMore: page < totalPages,
    loadMore,
    refetch,
    error,
    planLocked,
    isSaving,
    add,
    remove,
  };
}

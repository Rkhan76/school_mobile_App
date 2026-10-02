import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildMockReport } from './mockReports';
import { findReport } from './registry';
import {
  ReportError, type DomainKey, type MockMode, type ReportCapabilities, type ReportFilters, type ReportResponse,
} from './types';

const DEBOUNCE_MS = 350;
const CACHE_TTL_MS = 60_000;
const LATENCY_MS = 450;

const cache = new Map<string, { at: number; data: ReportResponse }>();

/** Keep only filters the report supports so unrelated changes do not refetch. */
export function normalizeFilters(f: ReportFilters, caps: ReportCapabilities): ReportFilters {
  return {
    preset: caps.dateRange ? f.preset : 'any',
    from: caps.dateRange && f.preset === 'custom' ? f.from : '',
    to: caps.dateRange && f.preset === 'custom' ? f.to : '',
    academicYear: caps.academicYear ? f.academicYear : '',
    classId: caps.classFilter ? f.classId : '',
    section: caps.classFilter && caps.section ? f.section : '',
    groupBy: caps.groupBy ? f.groupBy : 'month',
    compare: caps.compare ? f.compare : false,
    minAmount: caps.threshold ? f.minAmount : '',
  };
}

interface Result { key: string; data: ReportResponse | null; error: ReportError | null }

export interface UseReport {
  data: ReportResponse | null;
  isLoading: boolean;
  error: ReportError | null;
  refetch: () => void;
}

/**
 * Loads a report. Filter changes are debounced (350 ms), results are cached in memory for 60 s
 * per (domain, report, filters). Replace the body of `load` with the real API call later.
 */
export function useReport(domain: DomainKey, reportKey: string, filters: ReportFilters, mock: MockMode = 'none'): UseReport {
  const caps = findReport(domain, reportKey).caps;
  const normalized = useMemo(() => normalizeFilters(filters, caps), [filters, caps]);
  const reportId = `${domain}/${reportKey}/${mock}`;
  const filterKey = JSON.stringify(normalized);

  const [settled, setSettled] = useState({ reportId, filterKey, filters: normalized });
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result>({ key: '', data: null, error: null });
  const latest = useRef(normalized);
  latest.current = normalized;

  // Debounce filter edits; switching report/mock applies immediately.
  useEffect(() => {
    if (settled.reportId !== reportId) {
      setSettled({ reportId, filterKey, filters: latest.current });
      return;
    }
    if (settled.filterKey === filterKey) return;
    const t = setTimeout(() => setSettled({ reportId, filterKey, filters: latest.current }), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [reportId, filterKey, settled.reportId, settled.filterKey]);

  const fetchKey = `${settled.reportId}|${settled.filterKey}|${nonce}`;

  useEffect(() => {
    const cacheKey = `${settled.reportId}|${settled.filterKey}`;
    const hit = mock === 'none' ? cache.get(cacheKey) : undefined;
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      setResult({ key: fetchKey, data: hit.data, error: null });
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      if (mock === 'forbidden') return setResult({ key: fetchKey, data: null, error: new ReportError(403, 'You do not have permission to view this report.') });
      if (mock === 'ratelimit') return setResult({ key: fetchKey, data: null, error: new ReportError(429, 'Too many requests. Please wait a moment and retry.') });
      if (mock === 'error') return setResult({ key: fetchKey, data: null, error: new ReportError(500, 'Something went wrong while generating the report.') });
      const data = buildMockReport(domain, reportKey, settled.filters);
      if (mock === 'empty') {
        return setResult({ key: fetchKey, data: { ...data, kpis: [], charts: [], table: undefined, insights: [] }, error: null });
      }
      cache.set(cacheKey, { at: Date.now(), data });
      setResult({ key: fetchKey, data, error: null });
    }, LATENCY_MS);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  const refetch = useCallback(() => {
    cache.delete(`${settled.reportId}|${settled.filterKey}`);
    setNonce((n) => n + 1);
  }, [settled.reportId, settled.filterKey]);

  const pending = result.key !== fetchKey || settled.filterKey !== filterKey || settled.reportId !== reportId;
  return {
    data: pending ? null : result.data,
    isLoading: pending,
    error: pending ? null : result.error,
    refetch,
  };
}

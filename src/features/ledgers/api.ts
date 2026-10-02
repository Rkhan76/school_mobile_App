import { apiRequest, ApiError } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type {
  CashbookEntry,
  CashbookListParams,
  CreateCashbookInput,
  LedgerEntry,
  LedgerListParams,
  LedgerSummary,
  LedgerSummaryParams,
} from './types';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

/* ---------------------------- Ledger (read-only) ---------------------------- */

/** GET /ledger — permission `ledger.list.read`, plan feature "ledger". */
export async function listLedger(params: LedgerListParams): Promise<PaginatedResult<LedgerEntry>> {
  return apiRequest<PaginatedResult<LedgerEntry>>(`/ledger${buildQuery(params)}`);
}

/** GET /ledger/summary — permission `ledger.summary.read`, same filters minus pagination. */
export async function getLedgerSummary(params: LedgerSummaryParams): Promise<LedgerSummary> {
  return apiRequest<LedgerSummary>(`/ledger/summary${buildQuery(params)}`);
}

/* --------------------------- Cashbook (no edit) ----------------------------- */

/** GET /cashbook — permission `cashbook.list.read`, plan feature "cashbook". */
export async function listCashbook(params: CashbookListParams): Promise<PaginatedResult<CashbookEntry>> {
  return apiRequest<PaginatedResult<CashbookEntry>>(`/cashbook${buildQuery(params)}`);
}

/** POST /cashbook — permission `cashbook.entry.create`. Mirrors into the ledger automatically. */
export async function createCashbookEntry(input: CreateCashbookInput): Promise<CashbookEntry> {
  return apiRequest<CashbookEntry>('/cashbook', { method: 'POST', body: input });
}

/** GET /cashbook/:id — permission `cashbook.entry.read`. */
export async function getCashbookEntry(id: string): Promise<CashbookEntry> {
  return apiRequest<CashbookEntry>(`/cashbook/${id}`);
}

/** DELETE /cashbook/:id — permission `cashbook.entry.delete`. Not a true delete: soft-deletes
 * the row and writes an offsetting entry (opposite type, same amount) to the ledger. 204. */
export async function deleteCashbookEntry(id: string): Promise<void> {
  await apiRequest<void>(`/cashbook/${id}`, { method: 'DELETE' });
}

/* ----------------------------- plan gating ----------------------------- */

/** Both /ledger and /cashbook sit under their own plan features ("ledger" and "cashbook"
 * respectively) — either can 403 with this body when the school's plan doesn't include it.
 * Check independently per tab: a school may have one feature without the other. */
export function isFeatureNotInPlanError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    err.statusCode === 403 &&
    typeof err.body === 'object' &&
    err.body !== null &&
    (err.body as { code?: unknown }).code === 'FEATURE_NOT_IN_PLAN'
  );
}

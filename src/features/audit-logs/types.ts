/** Audit Logs — real response shape per MOBILE_API_DOCS.md section 19. Read-only. */
export type AuditLog = {
  id: string;
  schoolId: string;
  userId: string;
  userType: string;
  impersonatedBy: string | null;
  action: string;
  entityType: string;
  entityId: string;
  /** Raw JSON snapshot, or null — not every action in the system logs a before/after diff. */
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  userName: string | null;
  impersonatedByName: string | null;
};

/** Query params for GET /audit-logs. `action` is an EXACT match, not fuzzy. */
export type AuditLogListParams = {
  entityType?: string;
  action?: string;
  userId?: string;
  fromDate?: string; // YYYY-MM-DD, inclusive
  toDate?: string; // YYYY-MM-DD, inclusive
  page?: number;
  limit?: number;
};

/** Screen-level filter draft. Dates are entered as DD/MM/YYYY and converted to YYYY-MM-DD for the API. */
export type AuditFilters = {
  entityType: string;
  action: string;
  userId: string;
  from: string;
  to: string;
};

export const EMPTY_FILTERS: AuditFilters = { entityType: '', action: '', userId: '', from: '', to: '' };

export const PAGE_SIZE = 20;

/** DD/MM/YYYY -> sortable day key (YYYYMMDD) or null when invalid. */
export function parseDMY(s: string): number | null {
  const mt = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!mt) return null;
  const d = Number(mt[1]);
  const m = Number(mt[2]);
  const y = Number(mt[3]);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return y * 10000 + m * 100 + d;
}

/** DD/MM/YYYY -> YYYY-MM-DD for the API's fromDate/toDate params. Caller should validate with parseDMY first. */
export function toApiDate(s: string): string {
  const mt = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!mt) return '';
  return `${mt[3]}-${mt[2]}-${mt[1]}`;
}

/** e.g. "30 Sept 2026, 22:52" from an ISO timestamp. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

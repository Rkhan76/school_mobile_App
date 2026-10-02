import { apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type { AuditLog, AuditLogListParams } from './types';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

/** GET /audit-logs — permission `audit-log.list.read`. Read-only, school-scoped. */
export async function listAuditLogs(params: AuditLogListParams): Promise<PaginatedResult<AuditLog>> {
  return apiRequest<PaginatedResult<AuditLog>>(`/audit-logs${buildQuery(params)}`);
}

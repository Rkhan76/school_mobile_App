import { apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type { LeaveApplication, LeaveDecision, ListLeaveApplicationsParams } from './types';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

/** The API nests the leave type as { id, name }; surface the name so screens never fall back to the UUID. */
function normalizeLeave(raw: LeaveApplication): LeaveApplication {
  return { ...raw, leaveTypeName: raw.leaveTypeName ?? raw.leaveType?.name };
}

/** GET /leaves — admin review queue (all applicants). Rule: leave-application.list.read */
export async function listLeaveApplications(
  params: ListLeaveApplicationsParams
): Promise<PaginatedResult<LeaveApplication>> {
  const res = await apiRequest<PaginatedResult<LeaveApplication>>(`/leaves${buildQuery(params)}`);
  return { ...res, data: res.data.map(normalizeLeave) };
}

/** GET /leaves/:id — one request's detail. Rule: leave-application.record.read */
export async function getLeaveApplication(id: string): Promise<LeaveApplication> {
  return normalizeLeave(await apiRequest<LeaveApplication>(`/leaves/${id}`));
}

/**
 * PATCH /leaves/:id/decision — approve or reject. Rule: leave-application.decision.update
 * Only works while PENDING (409 otherwise). Cannot decide your own application (403),
 * even with the permission — separation-of-duties guard.
 */
export async function decideLeaveApplication(
  id: string,
  decision: LeaveDecision,
  reviewComments?: string
): Promise<LeaveApplication> {
  return normalizeLeave(
    await apiRequest<LeaveApplication>(`/leaves/${id}/decision`, {
      method: 'PATCH',
      body: reviewComments ? { decision, reviewComments } : { decision },
    })
  );
}

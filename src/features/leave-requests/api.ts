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

/** GET /leaves — admin review queue (all applicants). Rule: leave-application.list.read */
export async function listLeaveApplications(
  params: ListLeaveApplicationsParams
): Promise<PaginatedResult<LeaveApplication>> {
  return apiRequest<PaginatedResult<LeaveApplication>>(`/leaves${buildQuery(params)}`);
}

/** GET /leaves/:id — one request's detail. Rule: leave-application.record.read */
export async function getLeaveApplication(id: string): Promise<LeaveApplication> {
  return apiRequest<LeaveApplication>(`/leaves/${id}`);
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
  return apiRequest<LeaveApplication>(`/leaves/${id}/decision`, {
    method: 'PATCH',
    body: reviewComments ? { decision, reviewComments } : { decision },
  });
}

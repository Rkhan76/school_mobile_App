import { apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type {
  CreateNTSPayload,
  CreateTeacherPayload,
  EmployeeStatus,
  NTSEntity,
  NTSListItem,
  NTSListParams,
  TeacherEntity,
  TeacherListParams,
  TeacherStats,
  UpdateNonTeachingStaffPayload,
} from './types';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

// ---------- Teachers ----------

export async function createTeacher(payload: CreateTeacherPayload): Promise<TeacherEntity> {
  return apiRequest<TeacherEntity>('/teachers', { method: 'POST', body: payload });
}

export async function listTeachers(params: TeacherListParams): Promise<PaginatedResult<TeacherEntity>> {
  return apiRequest<PaginatedResult<TeacherEntity>>(`/teachers${buildQuery(params)}`);
}

export async function getTeacherStats(): Promise<TeacherStats> {
  return apiRequest<TeacherStats>('/teachers/stats');
}

/**
 * PATCH /teachers/:id/status — note `exitDate` is accepted by validation but has
 * NO EFFECT server-side (known backend gotcha); it's passed through only in case
 * that changes, callers should not rely on it doing anything today.
 */
export async function setTeacherStatus(
  id: string,
  status: EmployeeStatus,
  exitDate?: string
): Promise<TeacherEntity> {
  return apiRequest<TeacherEntity>(`/teachers/${id}/status`, {
    method: 'PATCH',
    body: exitDate ? { status, exitDate } : { status },
  });
}

export const toggleTeacherStatus = setTeacherStatus;

export async function toggleTeacherBlock(id: string): Promise<{ id: string; blocked: boolean }> {
  return apiRequest<{ id: string; blocked: boolean }>(`/teachers/${id}/toggle-block`, { method: 'PATCH' });
}

// ---------- Non-teaching staff ----------

export async function createNonTeachingStaff(payload: CreateNTSPayload): Promise<NTSEntity> {
  return apiRequest<NTSEntity>('/non-teaching-staff', { method: 'POST', body: payload });
}

export async function listNonTeachingStaff(params: NTSListParams): Promise<PaginatedResult<NTSListItem>> {
  return apiRequest<PaginatedResult<NTSListItem>>(`/non-teaching-staff${buildQuery(params)}`);
}

// No stats endpoint exists for non-teaching staff per the doc — counts are derived
// client-side from the fetched list in useNonTeachingStaff instead.

export async function toggleNTSBlock(id: string): Promise<{ id: string; blocked: boolean }> {
  return apiRequest<{ id: string; blocked: boolean }>(`/non-teaching-staff/${id}/toggle-block`, {
    method: 'PATCH',
  });
}

export async function updateNonTeachingStaff(
  id: string,
  payload: UpdateNonTeachingStaffPayload
): Promise<NTSEntity> {
  return apiRequest<NTSEntity>(`/non-teaching-staff/${id}`, { method: 'PATCH', body: payload });
}

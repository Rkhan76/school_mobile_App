import { apiRequest } from '../../lib/apiClient';
import type {
  EmploymentChangePayload,
  EmploymentHistoryRow,
  TeacherBankResponse,
  TeacherPersonal,
  TeacherRaw,
  TeacherStatus,
  TeacherUpdatePayload,
} from './teacherDetail';

export function getTeacher(id: string): Promise<TeacherRaw> {
  return apiRequest<TeacherRaw>(`/teachers/${id}`);
}

export function getTeacherPersonal(id: string): Promise<TeacherPersonal> {
  return apiRequest<TeacherPersonal>(`/teachers/${id}/personal`);
}

export function getTeacherBank(id: string): Promise<TeacherBankResponse> {
  return apiRequest<TeacherBankResponse>(`/teachers/${id}/bank`);
}

export function getTeacherEmploymentHistory(id: string): Promise<EmploymentHistoryRow[]> {
  return apiRequest<EmploymentHistoryRow[]>(`/teachers/${id}/employment-history`);
}

export function updateTeacher(id: string, partial: TeacherUpdatePayload): Promise<TeacherRaw> {
  return apiRequest<TeacherRaw>(`/teachers/${id}`, { method: 'PATCH', body: partial });
}

export function changeEmployment(id: string, payload: EmploymentChangePayload): Promise<unknown> {
  return apiRequest<unknown>(`/teachers/${id}/employment`, { method: 'PATCH', body: payload });
}

/** `exitDate` is deliberately not accepted here — per the API docs it's validated but never
 * forwarded to the service, so there's no point threading it through the mobile UI. */
export function setTeacherStatus(id: string, status: TeacherStatus): Promise<unknown> {
  return apiRequest<unknown>(`/teachers/${id}/status`, { method: 'PATCH', body: { status } });
}

export function toggleTeacherBlock(id: string): Promise<{ id: string; blocked: boolean }> {
  return apiRequest<{ id: string; blocked: boolean }>(`/teachers/${id}/toggle-block`, { method: 'PATCH' });
}

import { apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type {
  StudentListItem,
  StudentStats,
  StudentDetail,
  StudentPersonal,
  StudentParents,
  StudentBankResponse,
  StudentHostelResponse,
  StudentEnrollmentRow,
} from './types';

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** GET /students/list — lean list for the list screen. */
export async function listStudents(params: {
  page?: number;
  limit?: number;
  classId?: string;
  sectionId?: string;
  academicYearId?: string;
  search?: string;
  /** true -> only blocked students; omitted/false -> only active (server default). */
  blocked?: boolean;
}): Promise<PaginatedResult<StudentListItem>> {
  const qs = buildQuery({ ...params, blocked: params.blocked ? true : undefined });
  return apiRequest<PaginatedResult<StudentListItem>>(`/students/list${qs}`);
}

/** GET /students/stats */
export async function getStudentStats(): Promise<StudentStats> {
  return apiRequest<StudentStats>('/students/stats');
}

/** GET /students/:id */
export async function getStudent(id: string): Promise<StudentDetail> {
  return apiRequest<StudentDetail>(`/students/${id}`);
}

/** GET /students/:id/personal */
export async function getStudentPersonal(id: string): Promise<StudentPersonal> {
  return apiRequest<StudentPersonal>(`/students/${id}/personal`);
}

/** GET /students/:id/parents */
export async function getStudentParents(id: string): Promise<StudentParents> {
  return apiRequest<StudentParents>(`/students/${id}/parents`);
}

/** GET /students/:id/bank */
export async function getStudentBank(id: string): Promise<StudentBankResponse> {
  return apiRequest<StudentBankResponse>(`/students/${id}/bank`);
}

/** GET /students/:id/hostel */
export async function getStudentHostel(id: string): Promise<StudentHostelResponse> {
  return apiRequest<StudentHostelResponse>(`/students/${id}/hostel`);
}

/** GET /students/:id/enrollments — full enrollment history, newest first. */
export async function getStudentEnrollments(id: string): Promise<StudentEnrollmentRow[]> {
  return apiRequest<StudentEnrollmentRow[]>(`/students/${id}/enrollments`);
}

/** PATCH /students/:id — plain JSON partial update (no file upload here). */
export async function updateStudent(id: string, patch: Record<string, unknown>): Promise<StudentDetail> {
  return apiRequest<StudentDetail>(`/students/${id}`, { method: 'PATCH', body: patch });
}

/** PATCH /students/:id/toggle-status — active <-> inactive only; 400 for terminal statuses. */
export async function toggleStudentStatus(id: string): Promise<{ id: string; enrollmentStatus: string }> {
  return apiRequest<{ id: string; enrollmentStatus: string }>(`/students/${id}/toggle-status`, {
    method: 'PATCH',
  });
}

/** PATCH /students/:id/toggle-block — soft block/unblock, cascades to the portal login. */
export async function toggleStudentBlock(id: string): Promise<unknown> {
  return apiRequest<unknown>(`/students/${id}/toggle-block`, { method: 'PATCH' });
}

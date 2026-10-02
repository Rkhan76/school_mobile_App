import { apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type {
  ApiExamResult,
  ApiExamSchedule,
  BulkResultInput,
  ExamScheduleInput,
  ExamScheduleListParams,
  ExamType,
  ExamTypeInput,
  LookupItem,
  StudentRosterItem,
  TeacherLookupItem,
} from './types';

/* ---------------- exam types — /exams/types ---------------- */

export async function listExamTypes(): Promise<ExamType[]> {
  return apiRequest<ExamType[]>('/exams/types');
}

export async function createExamType(payload: ExamTypeInput): Promise<ExamType> {
  return apiRequest<ExamType>('/exams/types', { method: 'POST', body: payload });
}

export async function updateExamType(id: string, payload: Partial<ExamTypeInput>): Promise<ExamType> {
  return apiRequest<ExamType>(`/exams/types/${id}`, { method: 'PATCH', body: payload });
}

export async function deleteExamType(id: string): Promise<void> {
  return apiRequest<void>(`/exams/types/${id}`, { method: 'DELETE' });
}

/* ---------------- exam schedules — /exams/schedules ---------------- */

export async function listExamSchedules(params: ExamScheduleListParams = {}): Promise<ApiExamSchedule[]> {
  const query = new URLSearchParams();
  if (params.academicYearId) query.set('academicYearId', params.academicYearId);
  if (params.examTypeId) query.set('examTypeId', params.examTypeId);
  if (params.classId) query.set('classId', params.classId);
  if (params.sectionId) query.set('sectionId', params.sectionId);
  if (params.subjectId) query.set('subjectId', params.subjectId);
  if (params.fromDate) query.set('fromDate', params.fromDate);
  if (params.toDate) query.set('toDate', params.toDate);

  const qs = query.toString();
  return apiRequest<ApiExamSchedule[]>(`/exams/schedules${qs ? `?${qs}` : ''}`);
}

export async function createExamSchedule(payload: ExamScheduleInput): Promise<ApiExamSchedule> {
  return apiRequest<ApiExamSchedule>('/exams/schedules', { method: 'POST', body: payload });
}

export async function updateExamSchedule(
  id: string,
  payload: Partial<ExamScheduleInput>
): Promise<ApiExamSchedule> {
  return apiRequest<ApiExamSchedule>(`/exams/schedules/${id}`, { method: 'PATCH', body: payload });
}

export async function deleteExamSchedule(id: string): Promise<void> {
  return apiRequest<void>(`/exams/schedules/${id}`, { method: 'DELETE' });
}

/* ---------------- results ---------------- */

export async function listResultsForSchedule(examScheduleId: string): Promise<ApiExamResult[]> {
  return apiRequest<ApiExamResult[]>(`/exams/schedules/${examScheduleId}/results`);
}

/** Upsert semantics — always use this, even for a single student, to sidestep
 * the single-result endpoint's 409-on-existing-result behavior. */
export async function bulkSubmitResults(
  examScheduleId: string,
  results: BulkResultInput[]
): Promise<ApiExamResult[]> {
  return apiRequest<ApiExamResult[]>(`/exams/schedules/${examScheduleId}/results/bulk`, {
    method: 'POST',
    body: { results },
  });
}

/** Irreversible publish step — locks every live result for the schedule. */
export async function lockResults(examScheduleId: string): Promise<{ locked: number }> {
  return apiRequest<{ locked: number }>(`/exams/schedules/${examScheduleId}/results/lock`, {
    method: 'PATCH',
  });
}

/* ---------------- local-only helpers ----------------
 * Subjects/teachers/students aren't owned by this feature folder, so these
 * are small direct calls rather than imports from sibling feature folders. */

export async function lookupSubjects(): Promise<LookupItem[]> {
  return apiRequest<LookupItem[]>('/academic/subjects/lookup');
}

export async function lookupTeachersForPicker(search?: string): Promise<TeacherLookupItem[]> {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  query.set('limit', '50');
  const result = await apiRequest<PaginatedResult<{ id: string; fullName: string }>>(
    `/teachers?${query.toString()}`
  );
  return result.data.map((t) => ({ id: t.id, fullName: t.fullName }));
}

/** Roster for a schedule's class/section — there's no dedicated "roster for a
 * schedule" endpoint, so this derives it from the class/section directly. */
export async function lookupStudentsForClass(
  classId: string,
  sectionId?: string | null
): Promise<StudentRosterItem[]> {
  const qs = sectionId ? `?sectionId=${encodeURIComponent(sectionId)}` : '';
  const rows = await apiRequest<{ id: string; fullName: string; rollNumber?: string | null }[]>(
    `/students/class/${classId}${qs}`
  );
  return rows.map((r) => ({ id: r.id, fullName: r.fullName, rollNumber: r.rollNumber ?? null }));
}

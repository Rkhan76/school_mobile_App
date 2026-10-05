import { ApiError, apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type { AcademicClass, ClassInput, ClassSection, SectionSubject } from './types';

/** Best human message from an API failure; joins 400 validation arrays. */
export function apiErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const m = (e.body as { message?: unknown } | undefined)?.message;
    if (Array.isArray(m) && m.length) return m.map(String).join('\n');
    return e.message;
  }
  return e instanceof Error ? e.message : 'Something went wrong';
}

/** GET /academic/classes — paginated, sections included; `search` matches name/description server-side. */
export async function listClasses(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<PaginatedResult<AcademicClass>> {
  const q = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
  if (params.search) q.set('search', params.search);
  return apiRequest<PaginatedResult<AcademicClass>>(`/academic/classes?${q.toString()}`);
}

/** GET /academic/classes/:id */
export async function getClassById(id: string): Promise<AcademicClass> {
  return apiRequest<AcademicClass>(`/academic/classes/${id}`);
}

/** POST /academic/classes — backend auto-creates starter section A. */
export async function createClass(input: { name: string; gradeOrder?: number; description?: string }): Promise<AcademicClass> {
  return apiRequest<AcademicClass>('/academic/classes', { method: 'POST', body: input });
}

/** PATCH /academic/classes/:id — partial; description "" clears it. */
export async function updateClass(id: string, input: Partial<ClassInput>): Promise<AcademicClass> {
  return apiRequest<AcademicClass>(`/academic/classes/${id}`, { method: 'PATCH', body: input });
}

/** DELETE /academic/classes/:id — 204; 400 while sections remain. */
export async function deleteClass(id: string): Promise<void> {
  await apiRequest<unknown>(`/academic/classes/${id}`, { method: 'DELETE' });
}

/** GET /academic/classes/:classId/sections?academicYearId= */
export async function getClassSections(classId: string, academicYearId?: string): Promise<ClassSection[]> {
  const qs = academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : '';
  return apiRequest<ClassSection[]>(`/academic/classes/${classId}/sections${qs}`);
}

/** DELETE /academic/sections/:id */
export async function deleteSection(id: string): Promise<void> {
  await apiRequest<unknown>(`/academic/sections/${id}`, { method: 'DELETE' });
}

/** GET /academic/sections/:id/subjects-with-teachers — plain array. */
export async function getSectionSubjects(sectionId: string, academicYearId: string): Promise<SectionSubject[]> {
  return apiRequest<SectionSubject[]>(
    `/academic/sections/${sectionId}/subjects-with-teachers?academicYearId=${encodeURIComponent(academicYearId)}`,
  );
}

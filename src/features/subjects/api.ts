import { apiRequest } from '../../lib/apiClient';
import type {
  SectionSubjectLink,
  Subject,
  SubjectInput,
  SubjectWithAssignments,
  SyncSectionsResult,
} from './types';

export async function listSubjects(): Promise<SubjectWithAssignments[]> {
  return apiRequest<SubjectWithAssignments[]>('/academic/subjects');
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  return apiRequest<Subject>('/academic/subjects', { method: 'POST', body: input });
}

export async function updateSubject(id: string, input: Partial<SubjectInput>): Promise<Subject> {
  return apiRequest<Subject>(`/academic/subjects/${id}`, { method: 'PATCH', body: input });
}

/**
 * Soft-deletes the subject. The backend has NO blocking checks here — it deletes even if the
 * subject is actively assigned to sections or referenced by exams/homework/syllabus. Callers
 * MUST show a strong confirmation before invoking this.
 */
export async function deleteSubject(id: string): Promise<void> {
  await apiRequest<void>(`/academic/subjects/${id}`, { method: 'DELETE' });
}

export async function getSectionSubjects(
  sectionId: string,
  academicYearId: string,
): Promise<SectionSubjectLink[]> {
  return apiRequest<SectionSubjectLink[]>(
    `/academic/sections/${sectionId}/subjects?academicYearId=${encodeURIComponent(academicYearId)}`,
  );
}

/** Full-replace sync of a subject's section assignments for one academic year. */
export async function syncSubjectSections(
  subjectId: string,
  params: { academicYearId: string; sectionIds: string[]; isOptional?: boolean },
): Promise<SyncSectionsResult> {
  return apiRequest<SyncSectionsResult>(`/academic/subjects/${subjectId}/sections`, {
    method: 'PUT',
    body: {
      academicYearId: params.academicYearId,
      sectionIds: params.sectionIds,
      isOptional: params.isOptional ?? false,
    },
  });
}

export async function assignSubjectToSection(
  sectionId: string,
  params: { subjectId: string; academicYearId: string; isOptional?: boolean },
): Promise<unknown> {
  return apiRequest<unknown>(`/academic/sections/${sectionId}/subjects`, {
    method: 'POST',
    body: {
      subjectId: params.subjectId,
      academicYearId: params.academicYearId,
      isOptional: params.isOptional ?? false,
    },
  });
}

export async function unassignSubjectFromSection(
  sectionId: string,
  subjectId: string,
  academicYearId: string,
): Promise<void> {
  await apiRequest<void>(
    `/academic/sections/${sectionId}/subjects/${subjectId}?academicYearId=${encodeURIComponent(academicYearId)}`,
    { method: 'DELETE' },
  );
}

import { apiRequest } from '../../lib/apiClient';
import type {
  ChapterInput,
  CopyPlanResult,
  ExamSyllabusFilters,
  ExamSyllabusItem,
  ExamTypeLookupItem,
  SectionSyllabus,
  SubjectLookupItem,
} from './types';

export async function getSyllabus(
  sectionId: string,
  academicYearId?: string,
  subjectId?: string,
): Promise<SectionSyllabus> {
  const query = new URLSearchParams({ sectionId });
  if (academicYearId) query.set('academicYearId', academicYearId);
  if (subjectId) query.set('subjectId', subjectId);
  return apiRequest<SectionSyllabus>(`/syllabus?${query.toString()}`);
}

export async function savePlan(params: {
  academicYearId?: string;
  sectionId: string;
  subjectId: string;
  chapters: ChapterInput[];
}): Promise<SectionSyllabus> {
  return apiRequest<SectionSyllabus>('/syllabus/plans', { method: 'PUT', body: params });
}

export async function copyPlan(params: {
  fromSectionId: string;
  toSectionIds: string[];
  subjectId?: string;
  overwrite?: boolean;
  academicYearId?: string;
}): Promise<CopyPlanResult> {
  return apiRequest<CopyPlanResult>('/syllabus/plans/copy', { method: 'POST', body: params });
}

export async function getExamSyllabus(params: ExamSyllabusFilters): Promise<ExamSyllabusItem[]> {
  const query = new URLSearchParams({ sectionId: params.sectionId });
  if (params.academicYearId) query.set('academicYearId', params.academicYearId);
  if (params.examTypeId) query.set('examTypeId', params.examTypeId);
  if (params.subjectId) query.set('subjectId', params.subjectId);
  if (params.upcoming !== undefined) query.set('upcoming', String(params.upcoming));
  return apiRequest<ExamSyllabusItem[]>(`/syllabus/exams?${query.toString()}`);
}

export async function setExamSyllabusChapters(
  scheduleId: string,
  chapterIds: string[],
): Promise<ExamSyllabusItem> {
  return apiRequest<ExamSyllabusItem>(`/syllabus/exam-schedules/${scheduleId}`, {
    method: 'PUT',
    body: { chapterIds },
  });
}

/** Local helper — intentionally not shared with other feature folders. */
export async function lookupSubjects(): Promise<SubjectLookupItem[]> {
  return apiRequest<SubjectLookupItem[]>('/academic/subjects/lookup');
}

/** Local helper — intentionally not shared with other feature folders. */
export async function lookupExamTypes(): Promise<ExamTypeLookupItem[]> {
  return apiRequest<ExamTypeLookupItem[]>('/exams/types');
}

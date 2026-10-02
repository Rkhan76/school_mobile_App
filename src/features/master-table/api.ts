import { apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type {
  AcademicYear,
  AcademicYearInput,
  DocumentCategoryM,
  ExamTypeM,
  ExamTypeMInput,
  FeeCategory,
  FeeCategoryInput,
  LeaveType,
  LeaveTypeInput,
  LeaveTypeListParams,
  PeriodM,
  PeriodMInput,
} from './types';

/* ---------------- Academic Years — /academic/years ----------------
 * Rule: GET routes need no permission at all (just a valid login). Writes need
 * academic-year.record.create / .record.update / .active.update / .record.delete / .rollover.create. */

export async function listAcademicYears(): Promise<AcademicYear[]> {
  return apiRequest<AcademicYear[]>('/academic/years');
}

export async function createAcademicYear(payload: AcademicYearInput): Promise<AcademicYear> {
  return apiRequest<AcademicYear>('/academic/years', { method: 'POST', body: payload });
}

export async function updateAcademicYear(id: string, patch: Partial<AcademicYearInput>): Promise<AcademicYear> {
  return apiRequest<AcademicYear>(`/academic/years/${id}`, { method: 'PATCH', body: patch });
}

/**
 * The ONLY correct way to switch the active academic year — atomically deactivates every
 * other year for the school and activates this one. Never PATCH `isActive: true` directly
 * via `updateAcademicYear`: that would not deactivate the previously-active year.
 */
export async function setActiveAcademicYear(id: string): Promise<AcademicYear> {
  return apiRequest<AcademicYear>(`/academic/years/${id}/set-active`, { method: 'PATCH' });
}

export async function deleteAcademicYear(id: string): Promise<void> {
  return apiRequest<void>(`/academic/years/${id}`, { method: 'DELETE' });
}

/**
 * Copies every section (class + name + capacity) from `sourceYearId` into `id`; a section
 * with the same class+name already in the target year is silently skipped, not duplicated.
 * Not wired to any UI affordance yet — see useMasterData.ts notes.
 */
export async function rolloverSections(
  id: string,
  sourceYearId: string
): Promise<{ created: number; skipped: number }> {
  return apiRequest<{ created: number; skipped: number }>(`/academic/years/${id}/rollover-sections`, {
    method: 'POST',
    body: { sourceYearId },
  });
}

/* ---------------- Leave Types — /leave-types ----------------
 * Rule: every route here (including GET) needs a permission:
 * leave-type.record.create / .list.read / .record.read / .record.update / .record.delete. */

export async function listLeaveTypes(params: LeaveTypeListParams = {}): Promise<PaginatedResult<LeaveType>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
  const qs = query.toString();
  return apiRequest<PaginatedResult<LeaveType>>(`/leave-types${qs ? `?${qs}` : ''}`);
}

export async function createLeaveType(payload: LeaveTypeInput): Promise<LeaveType> {
  return apiRequest<LeaveType>('/leave-types', { method: 'POST', body: payload });
}

export async function updateLeaveType(id: string, patch: Partial<LeaveTypeInput>): Promise<LeaveType> {
  return apiRequest<LeaveType>(`/leave-types/${id}`, { method: 'PATCH', body: patch });
}

export async function deleteLeaveType(id: string): Promise<void> {
  return apiRequest<void>(`/leave-types/${id}`, { method: 'DELETE' });
}

/* ---------------- Fee Categories — /fees/categories ----------------
 * Rule: fee-category.record.create / .list.read / .record.read / .record.update / .record.delete.
 * `code` must be unique per school — a create/update with a duplicate code gets a 409. */

export async function listFeeCategories(): Promise<FeeCategory[]> {
  return apiRequest<FeeCategory[]>('/fees/categories');
}

export async function createFeeCategory(payload: FeeCategoryInput): Promise<FeeCategory> {
  return apiRequest<FeeCategory>('/fees/categories', { method: 'POST', body: payload });
}

export async function updateFeeCategory(id: string, patch: Partial<FeeCategoryInput>): Promise<FeeCategory> {
  return apiRequest<FeeCategory>(`/fees/categories/${id}`, { method: 'PATCH', body: patch });
}

export async function deleteFeeCategory(id: string): Promise<void> {
  return apiRequest<void>(`/fees/categories/${id}`, { method: 'DELETE' });
}

/* ---------------- Exam Types — /exams/types ----------------
 * Same URLs the Examinations module uses, written independently here (this feature folder
 * must stay self-contained — see useMasterData.ts).
 * Rule: exam-type.record.create / .list.read / .record.read / .record.update / .record.delete. */

export async function listExamTypesM(): Promise<ExamTypeM[]> {
  return apiRequest<ExamTypeM[]>('/exams/types');
}

export async function createExamTypeM(payload: ExamTypeMInput): Promise<ExamTypeM> {
  return apiRequest<ExamTypeM>('/exams/types', { method: 'POST', body: payload });
}

export async function updateExamTypeM(id: string, patch: Partial<ExamTypeMInput>): Promise<ExamTypeM> {
  return apiRequest<ExamTypeM>(`/exams/types/${id}`, { method: 'PATCH', body: patch });
}

export async function deleteExamTypeM(id: string): Promise<void> {
  return apiRequest<void>(`/exams/types/${id}`, { method: 'DELETE' });
}

/* ---------------- Periods — /timetable/periods ----------------
 * Same URLs the Timetable module uses, written independently here.
 * Rule: period-master.record.create / .list.read / .record.read / .record.update / .record.delete. */

export async function listPeriodsM(): Promise<PeriodM[]> {
  return apiRequest<PeriodM[]>('/timetable/periods');
}

export async function createPeriodM(payload: PeriodMInput): Promise<PeriodM> {
  return apiRequest<PeriodM>('/timetable/periods', { method: 'POST', body: payload });
}

export async function updatePeriodM(id: string, patch: Partial<PeriodMInput>): Promise<PeriodM> {
  return apiRequest<PeriodM>(`/timetable/periods/${id}`, { method: 'PATCH', body: patch });
}

export async function deletePeriodM(id: string): Promise<void> {
  return apiRequest<void>(`/timetable/periods/${id}`, { method: 'DELETE' });
}

/* ---------------- Document Categories — /school-documents/categories ----------------
 * READ ONLY. The School Documents doc section only documents a GET for this catalog
 * (auto-seeded with 7 defaults on first call, each row carries a `documentCount`) — there is
 * no create/update/delete endpoint for school-document categories anywhere in the docs. */

export async function listDocumentCategoriesM(): Promise<DocumentCategoryM[]> {
  return apiRequest<DocumentCategoryM[]>('/school-documents/categories');
}

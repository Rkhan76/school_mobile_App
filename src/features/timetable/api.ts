import { apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type {
  CreateSlotPayload,
  FreeTeacher,
  GridReplacePayload,
  Period,
  PeriodInput,
  SubjectLookupItem,
  Substitution,
  SubstitutionGap,
  TeacherLookupItem,
  TimetableSlot,
  UpdateSlotPayload,
} from './types';

/* ---------- grid / slots ---------- */

export function getGrid(sectionId: string, academicYearId: string): Promise<TimetableSlot[]> {
  return apiRequest<TimetableSlot[]>(
    `/timetable/sections/${sectionId}/grid?academicYearId=${encodeURIComponent(academicYearId)}`,
  );
}

/** Full replace of a section's grid for a year — omitted slots are removed. */
export function bulkReplaceGrid(sectionId: string, payload: GridReplacePayload): Promise<TimetableSlot[]> {
  return apiRequest<TimetableSlot[]>(`/timetable/sections/${sectionId}/grid`, {
    method: 'POST',
    body: payload,
  });
}

export function createSlot(payload: CreateSlotPayload): Promise<TimetableSlot> {
  return apiRequest<TimetableSlot>('/timetable/slots', { method: 'POST', body: payload });
}

export function updateSlot(id: string, payload: UpdateSlotPayload): Promise<TimetableSlot> {
  return apiRequest<TimetableSlot>(`/timetable/slots/${id}`, { method: 'PATCH', body: payload });
}

export function deleteSlot(id: string): Promise<void> {
  return apiRequest<void>(`/timetable/slots/${id}`, { method: 'DELETE' });
}

export function getMySchedule(academicYearId: string): Promise<TimetableSlot[]> {
  return apiRequest<TimetableSlot[]>(
    `/timetable/my-schedule?academicYearId=${encodeURIComponent(academicYearId)}`,
  );
}

/* ---------- periods (master data) ---------- */

export function listPeriods(): Promise<Period[]> {
  return apiRequest<Period[]>('/timetable/periods');
}

export function createPeriod(input: PeriodInput): Promise<Period> {
  return apiRequest<Period>('/timetable/periods', { method: 'POST', body: input });
}

export function updatePeriod(id: string, partial: Partial<PeriodInput>): Promise<Period> {
  return apiRequest<Period>(`/timetable/periods/${id}`, { method: 'PATCH', body: partial });
}

export function deletePeriod(id: string): Promise<void> {
  return apiRequest<void>(`/timetable/periods/${id}`, { method: 'DELETE' });
}

/* ---------- substitutions ---------- */

export function getSubstitutionGaps(date: string, academicYearId?: string): Promise<SubstitutionGap[]> {
  const query = new URLSearchParams({ date });
  if (academicYearId) query.set('academicYearId', academicYearId);
  return apiRequest<SubstitutionGap[]>(`/timetable/substitutions/gaps?${query.toString()}`);
}

export function getFreeTeachers(
  date: string,
  periodId: string,
  academicYearId?: string,
): Promise<FreeTeacher[]> {
  const query = new URLSearchParams({ date, periodId });
  if (academicYearId) query.set('academicYearId', academicYearId);
  return apiRequest<FreeTeacher[]>(`/timetable/substitutions/free-teachers?${query.toString()}`);
}

export function createSubstitution(payload: {
  timetableSlotId: string;
  date: string;
  substituteTeacherId: string;
  reason?: string;
}): Promise<Substitution> {
  return apiRequest<Substitution>('/timetable/substitutions', { method: 'POST', body: payload });
}

export function listSubstitutions(date: string): Promise<Substitution[]> {
  return apiRequest<Substitution[]>(`/timetable/substitutions?date=${encodeURIComponent(date)}`);
}

export function deleteSubstitution(id: string): Promise<void> {
  return apiRequest<void>(`/timetable/substitutions/${id}`, { method: 'DELETE' });
}

/* ---------- local lookups (deliberately not shared with other feature folders) ---------- */

export function lookupSubjects(): Promise<SubjectLookupItem[]> {
  return apiRequest<SubjectLookupItem[]>('/academic/subjects/lookup');
}

export async function lookupTeachers(search?: string): Promise<TeacherLookupItem[]> {
  const query = new URLSearchParams({ limit: '50' });
  if (search) query.set('search', search);
  const res = await apiRequest<PaginatedResult<{ id: string; fullName: string }>>(
    `/teachers?${query.toString()}`,
  );
  return res.data.map((t) => ({ id: t.id, fullName: t.fullName }));
}

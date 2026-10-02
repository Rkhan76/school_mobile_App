import { apiRequest } from '../../lib/apiClient';
import type {
  AcademicYearLean,
  ClassWithSections,
  GuardianLookupItem,
  PaginatedResult,
} from './types';

export async function getClassesMaster(): Promise<ClassWithSections[]> {
  return apiRequest<ClassWithSections[]>('/academic/classes/master/all');
}

export async function getAcademicYearsMaster(): Promise<AcademicYearLean[]> {
  return apiRequest<AcademicYearLean[]>('/academic/years/master');
}

export async function searchGuardians(params: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<GuardianLookupItem>> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest<PaginatedResult<GuardianLookupItem>>(
    `/guardians/lookup${qs ? `?${qs}` : ''}`
  );
}

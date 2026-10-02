import { apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type {
  AdmissionDetail,
  AdmissionFiles,
  AdmissionListItem,
  AdmissionListParams,
  AdmissionPayload,
  AdmissionStats,
  BulkApproveResult,
} from './types';

function buildAdmissionFormData(payload: unknown, files?: AdmissionFiles): FormData {
  const form = new FormData();
  form.append('data', JSON.stringify(payload));

  if (files) {
    (Object.keys(files) as (keyof AdmissionFiles)[]).forEach((field) => {
      const part = files[field];
      if (part) {
        // React Native's FormData accepts a { uri, name, type } object for file
        // uploads at runtime, but lib.dom's FormData.append typing only knows
        // about string | Blob — cast through `unknown` to satisfy TS here.
        form.append(field, part as unknown as Blob);
      }
    });
  }

  return form;
}

export async function listAdmissions(
  params: AdmissionListParams
): Promise<PaginatedResult<AdmissionListItem>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.classId) query.set('classId', params.classId);
  if (params.academicYearId) query.set('academicYearId', params.academicYearId);
  if (params.search) query.set('search', params.search);

  const qs = query.toString();
  return apiRequest<PaginatedResult<AdmissionListItem>>(`/admissions${qs ? `?${qs}` : ''}`);
}

export async function getAdmissionStats(academicYearId?: string): Promise<AdmissionStats> {
  const qs = academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : '';
  return apiRequest<AdmissionStats>(`/admissions/stats${qs}`);
}

export async function getAdmission(id: string): Promise<AdmissionDetail> {
  return apiRequest<AdmissionDetail>(`/admissions/${id}`);
}

export async function createAdmission(
  payload: AdmissionPayload,
  files?: AdmissionFiles
): Promise<AdmissionDetail> {
  return apiRequest<AdmissionDetail>('/admissions', {
    method: 'POST',
    body: buildAdmissionFormData(payload, files),
  });
}

export async function updateAdmission(
  id: string,
  payload: Partial<AdmissionPayload>,
  files?: AdmissionFiles
): Promise<AdmissionDetail> {
  return apiRequest<AdmissionDetail>(`/admissions/${id}`, {
    method: 'PATCH',
    body: buildAdmissionFormData(payload, files),
  });
}

export async function approveAdmission(id: string): Promise<AdmissionDetail> {
  return apiRequest<AdmissionDetail>(`/admissions/${id}/approve`, {
    method: 'PATCH',
    body: {},
  });
}

export async function bulkApproveAdmissions(ids: string[]): Promise<BulkApproveResult> {
  return apiRequest<BulkApproveResult>('/admissions/bulk-approve', {
    method: 'POST',
    body: { admissions: ids.map((id) => ({ id })) },
  });
}

export async function rejectAdmission(id: string, reason: string): Promise<AdmissionDetail> {
  return apiRequest<AdmissionDetail>(`/admissions/${id}/reject`, {
    method: 'PATCH',
    body: { reason },
  });
}

export async function cancelAdmission(id: string): Promise<AdmissionDetail> {
  return apiRequest<AdmissionDetail>(`/admissions/${id}/cancel`, {
    method: 'PATCH',
  });
}

export async function deleteAdmission(id: string): Promise<void> {
  return apiRequest<void>(`/admissions/${id}`, {
    method: 'DELETE',
  });
}

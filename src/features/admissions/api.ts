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

/**
 * The admissions endpoints return a flat record (fullName, gender, fatherInfo, addressInfo, previousSchoolName...),
 * while the screens work with the nested AdmissionPayload shape (personalInfo, parentGuardianInfo, ...).
 * Fill the nested fields from the flat ones; a response that is already nested is left as it is.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAdmission(raw: any): AdmissionDetail {
  if (!raw || typeof raw !== 'object') return raw;
  const gender: string | undefined = raw.gender;
  // primaryGuardianSource says which of father/mother/guardian is primary; a linked one carries the guardian's id.
  const primary: 'father' | 'mother' | 'other' | undefined = raw.primaryGuardianSource ?? undefined;
  const primaryBlock = primary === 'father' ? raw.fatherInfo : primary === 'mother' ? raw.motherInfo : primary === 'other' ? raw.guardianInfo : undefined;
  const capitalGender = gender ? ((gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()) as 'Male' | 'Female' | 'Other') : undefined;
  return {
    ...raw,
    academicInfo: raw.academicInfo ?? {
      // The academic year id (the form needs the UUID, not the label).
      year: raw.year,
      class: raw.classId,
      rollNumber: raw.rollNumber,
      admissionNumber: raw.admissionNumber,
    },
    personalInfo: raw.personalInfo ?? {
      fullName: raw.fullName,
      gender: capitalGender,
      dateOfBirth: raw.dateOfBirth,
      category: raw.category,
      subcategory: raw.subcategory,
      religion: raw.religion,
      phone: raw.phone,
      email: raw.email,
      aadharNumber: raw.aadharNumber,
    },
    guardianId: raw.guardianId ?? primaryBlock?.existingGuardianId ?? null,
    parentGuardianInfo: raw.parentGuardianInfo ?? {
      father: raw.fatherInfo,
      mother: raw.motherInfo,
      guardian: raw.guardianInfo,
      primaryGuardian: primary,
    },
    previousSchoolDetails: raw.previousSchoolDetails ?? {
      schoolName: raw.previousSchoolName,
      address: raw.previousSchoolAddress,
    },
    address: raw.address ?? raw.addressInfo,
    hostelDetails: raw.hostelDetails ?? { hostelName: raw.hostelName, roomNumber: raw.roomNumber },
  } as AdmissionDetail;
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
  return normalizeAdmission(await apiRequest<AdmissionDetail>(`/admissions/${id}`));
}

export async function createAdmission(
  payload: AdmissionPayload,
  files?: AdmissionFiles
): Promise<AdmissionDetail> {
  return normalizeAdmission(
    await apiRequest<AdmissionDetail>('/admissions', {
      method: 'POST',
      body: buildAdmissionFormData(payload, files),
    })
  );
}

export async function updateAdmission(
  id: string,
  payload: Partial<AdmissionPayload>,
  files?: AdmissionFiles
): Promise<AdmissionDetail> {
  return normalizeAdmission(
    await apiRequest<AdmissionDetail>(`/admissions/${id}`, {
      method: 'PATCH',
      body: buildAdmissionFormData(payload, files),
    })
  );
}

export async function approveAdmission(id: string): Promise<AdmissionDetail> {
  return normalizeAdmission(
    await apiRequest<AdmissionDetail>(`/admissions/${id}/approve`, {
      method: 'PATCH',
      body: {},
    })
  );
}

export async function bulkApproveAdmissions(ids: string[]): Promise<BulkApproveResult> {
  return apiRequest<BulkApproveResult>('/admissions/bulk-approve', {
    method: 'POST',
    body: { admissions: ids.map((id) => ({ id })) },
  });
}

export async function rejectAdmission(id: string, reason: string): Promise<AdmissionDetail> {
  return normalizeAdmission(
    await apiRequest<AdmissionDetail>(`/admissions/${id}/reject`, {
      method: 'PATCH',
      body: { reason },
    })
  );
}

export async function cancelAdmission(id: string): Promise<AdmissionDetail> {
  return normalizeAdmission(
    await apiRequest<AdmissionDetail>(`/admissions/${id}/cancel`, {
      method: 'PATCH',
    })
  );
}

export async function deleteAdmission(id: string): Promise<void> {
  return apiRequest<void>(`/admissions/${id}`, {
    method: 'DELETE',
  });
}

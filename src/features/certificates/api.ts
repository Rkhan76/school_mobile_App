import { apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type { Certificate, CertificateStatus, PublicCertificateView, RecipientType } from './types';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** GET /certificates — admin list. Permission: certificate.list.read. */
export async function listCertificates(params: {
  page?: number;
  limit?: number;
  recipientType?: RecipientType;
  recipientId?: string;
  status?: CertificateStatus;
  search?: string;
  academicYearId?: string;
}): Promise<PaginatedResult<Certificate>> {
  const qs = buildQuery(params);
  return apiRequest<PaginatedResult<Certificate>>(`/certificates${qs}`);
}

export interface IssueCertificateInput {
  recipientType: RecipientType;
  recipientId: string;
  title: string;
  description?: string;
  /** ISO yyyy-mm-dd, optional — defaults to today server-side. Can't be future. */
  issueDate?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  academicYearId?: string;
}

/** POST /certificates — issue one. Permission: certificate.record.create. */
export async function issueCertificate(input: IssueCertificateInput): Promise<Certificate> {
  return apiRequest<Certificate>('/certificates', { method: 'POST', body: input });
}

/** GET /certificates/:id. Permission: certificate.record.read. */
export async function getCertificate(id: string): Promise<Certificate> {
  return apiRequest<Certificate>(`/certificates/${id}`);
}

/** PATCH /certificates/:id/revoke — one-time, 409 if already revoked. Permission: certificate.revocation.update. */
export async function revokeCertificate(id: string, reason?: string): Promise<Certificate> {
  return apiRequest<Certificate>(`/certificates/${id}/revoke`, {
    method: 'PATCH',
    body: reason ? { reason } : {},
  });
}

/** GET /certificates/verify/:token — public, no auth needed. */
export async function verifyCertificate(token: string): Promise<PublicCertificateView> {
  return apiRequest<PublicCertificateView>(`/certificates/verify/${encodeURIComponent(token)}`, {
    skipAuth: true,
  });
}

/* ------------------------------------------------------------------------ */
/* Local recipient-picker lookups — not shared with other feature folders.  */
/* ------------------------------------------------------------------------ */

/**
 * GET /students/lookup — not paginated and has no `search` query param
 * (only an unvalidated `status` filter per the docs), so we fetch active
 * students once and filter client-side for the picker.
 */
export async function lookupStudents(search?: string): Promise<{ id: string; name: string }[]> {
  const list = await apiRequest<{ id: string; name: string; enrollmentStatus: string }[]>(
    '/students/lookup?status=active',
  );
  const q = search?.trim().toLowerCase();
  const filtered = q ? list.filter((s) => s.name.toLowerCase().includes(q)) : list;
  return filtered.slice(0, 50).map((s) => ({ id: s.id, name: s.name }));
}

/** GET /teachers?search=&limit=50 — no dedicated lookup endpoint; use the list with a high limit. */
export async function lookupTeachers(search?: string): Promise<{ id: string; fullName: string }[]> {
  const qs = buildQuery({ search, limit: 50 });
  const res = await apiRequest<PaginatedResult<{ id: string; fullName: string }>>(`/teachers${qs}`);
  return res.data.map((t) => ({ id: t.id, fullName: t.fullName }));
}

/**
 * GET /non-teaching-staff?search=&limit=50 — same lean-list shape as teachers,
 * search matches fullName/email/employeeCode server-side.
 */
export async function lookupNonTeachingStaff(search?: string): Promise<{ id: string; fullName: string }[]> {
  const qs = buildQuery({ search, limit: 50 });
  const res = await apiRequest<PaginatedResult<{ id: string; fullName: string }>>(`/non-teaching-staff${qs}`);
  return res.data.map((s) => ({ id: s.id, fullName: s.fullName }));
}

// No DRIVER lookup/list endpoint exists anywhere in MOBILE_API_DOCS.md (drivers
// are only mentioned as a possible certificate recipientType and in the shared
// school-user block cascade) — there is no practical way to look one up from
// this app yet. IssueModal falls back to a free-text recipient-id field for
// the Driver recipient kind instead of a searchable picker.

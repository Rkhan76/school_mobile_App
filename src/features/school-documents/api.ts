import { apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type {
  DocumentCategory,
  DocumentVersion,
  DownloadLink,
  FilePart,
  SchoolDocument,
  UpdateSchoolDocumentPayload,
  UploadDocumentPayload,
  UploadVersionPayload,
} from './types';

function buildQuery(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

/** Upload mechanics here: metadata in the query string, one file part (any field name). */
function buildFileForm(file: FilePart): FormData {
  const form = new FormData();
  // React Native's FormData accepts a { uri, name, type } object for file uploads
  // at runtime, but lib.dom's FormData.append typing only knows about
  // string | Blob — cast through `unknown` to satisfy TS here.
  form.append('file', file as unknown as Blob);
  return form;
}

export async function listCategories(): Promise<DocumentCategory[]> {
  return apiRequest<DocumentCategory[]>('/school-documents/categories');
}

export async function uploadDocument(
  payload: UploadDocumentPayload,
  file: FilePart
): Promise<SchoolDocument> {
  const qs = buildQuery({
    categoryId: payload.categoryId,
    title: payload.title,
    description: payload.description,
    confidentiality: payload.confidentiality,
    expiryDate: payload.expiryDate ?? undefined,
  });
  return apiRequest<SchoolDocument>(`/school-documents/upload${qs}`, {
    method: 'POST',
    body: buildFileForm(file),
  });
}

export async function uploadNewVersion(
  id: string,
  payload: UploadVersionPayload,
  file: FilePart
): Promise<SchoolDocument> {
  const qs = buildQuery({ description: payload.description, expiryDate: payload.expiryDate ?? undefined });
  return apiRequest<SchoolDocument>(`/school-documents/${id}/versions${qs}`, {
    method: 'POST',
    body: buildFileForm(file),
  });
}

/**
 * GET /school-documents — the doc documents no query params for this endpoint (no
 * search/categoryId/confidentiality filters, unlike e.g. document-requests), so
 * nothing is forwarded here; useSchoolDocuments applies those filters client-side
 * over the full loaded set. The envelope isn't documented as paginated either (no
 * "paginated" callout like the one for document-requests), so this may come back
 * as a plain array — callers should also tolerate a PaginatedResult envelope
 * defensively.
 */
export async function listDocuments(): Promise<SchoolDocument[] | PaginatedResult<SchoolDocument>> {
  return apiRequest<SchoolDocument[] | PaginatedResult<SchoolDocument>>('/school-documents');
}

export async function getDocument(id: string): Promise<SchoolDocument> {
  return apiRequest<SchoolDocument>(`/school-documents/${id}`);
}

export async function getVersions(id: string): Promise<DocumentVersion[]> {
  return apiRequest<DocumentVersion[]>(`/school-documents/${id}/versions`);
}

/**
 * Signed link — shorter-lived (60s) for classified docs vs 300s for normal ones,
 * per the doc. Always fetch a fresh one right before opening; never cache the URL.
 */
export async function getDownloadLink(id: string): Promise<DownloadLink> {
  return apiRequest<DownloadLink>(`/school-documents/${id}/download`);
}

export async function updateDocument(
  id: string,
  payload: UpdateSchoolDocumentPayload
): Promise<SchoolDocument> {
  return apiRequest<SchoolDocument>(`/school-documents/${id}`, { method: 'PATCH', body: payload });
}

export async function deleteDocument(id: string): Promise<void> {
  return apiRequest<void>(`/school-documents/${id}`, { method: 'DELETE' });
}

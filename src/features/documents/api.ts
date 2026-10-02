import { ApiError, apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type {
  BulkCreateInput,
  BulkCreateResult,
  ChecklistResponse,
  CreateRequestInput,
  DocumentRequest,
  DocumentRequestRow,
  DocumentType,
  DocumentTypeInput,
  DocumentTypeUpdateInput,
  DownloadLink,
  EntityDocument,
  EntityType,
  ListRequestsParams,
  UploadFilePart,
  UploadOnBehalfParams,
} from './types';

/* ----------------------------- document types -----------------------------
 * Small settings-screen catalog (auto-seeded, lazily, per school) — like
 * Academic Year / Fee Categories (MOBILE_API_DOCS.md §23), the doc text never
 * calls this one "paginated": a plain array. */

export async function listDocumentTypes(): Promise<DocumentType[]> {
  return apiRequest<DocumentType[]>('/document-types');
}

export async function createDocumentType(input: DocumentTypeInput): Promise<DocumentType> {
  return apiRequest<DocumentType>('/document-types', { method: 'POST', body: input });
}

export async function updateDocumentType(id: string, input: DocumentTypeUpdateInput): Promise<DocumentType> {
  return apiRequest<DocumentType>(`/document-types/${id}`, { method: 'PATCH', body: input });
}

export async function deleteDocumentType(id: string): Promise<void> {
  return apiRequest<void>(`/document-types/${id}`, { method: 'DELETE' });
}

/* ----------------------------- document requests ----------------------------- */

export async function createRequest(input: CreateRequestInput): Promise<DocumentRequest> {
  return apiRequest<DocumentRequest>('/document-requests', { method: 'POST', body: input });
}

export async function bulkCreateRequests(input: BulkCreateInput): Promise<BulkCreateResult> {
  return apiRequest<BulkCreateResult>('/document-requests/bulk', { method: 'POST', body: input });
}

export async function listRequests(params: ListRequestsParams): Promise<PaginatedResult<DocumentRequestRow>> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.entityType) query.set('entityType', params.entityType);
  if (params.entityId) query.set('entityId', params.entityId);
  if (params.documentTypeId) query.set('documentTypeId', params.documentTypeId);
  if (params.overdue !== undefined) query.set('overdue', String(params.overdue));
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest<PaginatedResult<DocumentRequestRow>>(`/document-requests${qs ? `?${qs}` : ''}`);
}

export async function cancelRequest(id: string): Promise<unknown> {
  return apiRequest(`/document-requests/${id}/cancel`, { method: 'PATCH' });
}

export async function remindRequest(id: string): Promise<unknown> {
  return apiRequest(`/document-requests/${id}/remind`, { method: 'POST' });
}

/* ----------------------------- uploads & review (admin side) ----------------------------- */

export async function uploadOnBehalf(params: UploadOnBehalfParams, file: UploadFilePart): Promise<EntityDocument> {
  const query = new URLSearchParams();
  query.set('entityType', params.entityType);
  query.set('entityId', params.entityId);
  query.set('documentTypeId', params.documentTypeId);
  if (params.expiryDate) query.set('expiryDate', params.expiryDate);

  const form = new FormData();
  // React Native's FormData accepts a { uri, name, type } object for file
  // uploads at runtime, but lib.dom's FormData.append typing only knows
  // about string | Blob — cast through `unknown` to satisfy TS here.
  form.append('file', file as unknown as Blob);

  return apiRequest<EntityDocument>(`/entity-documents/upload?${query.toString()}`, {
    method: 'POST',
    body: form,
  });
}

export async function listReviewQueue(
  params?: { status?: string }
): Promise<PaginatedResult<EntityDocument> | EntityDocument[]> {
  const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
  return apiRequest<PaginatedResult<EntityDocument> | EntityDocument[]>(`/entity-documents${qs}`);
}

export async function listExpiring(days: number): Promise<EntityDocument[]> {
  return apiRequest<EntityDocument[]>(`/entity-documents/expiring?days=${encodeURIComponent(String(days))}`);
}

export async function getEntityDocuments(
  entityType: EntityType,
  entityId: string,
  includeAll?: boolean
): Promise<EntityDocument[]> {
  const qs = includeAll ? '?includeAll=true' : '';
  return apiRequest<EntityDocument[]>(`/entity-documents/entity/${entityType}/${entityId}${qs}`);
}

export async function getEntityChecklist(entityType: EntityType, entityId: string): Promise<ChecklistResponse> {
  return apiRequest<ChecklistResponse>(`/entity-documents/entity/${entityType}/${entityId}/checklist`);
}

export async function approveDocument(id: string): Promise<EntityDocument> {
  return apiRequest<EntityDocument>(`/entity-documents/${id}/approve`, { method: 'PATCH' });
}

export async function rejectDocument(id: string, reason: string): Promise<EntityDocument> {
  return apiRequest<EntityDocument>(`/entity-documents/${id}/reject`, { method: 'PATCH', body: { reason } });
}

export async function deleteDocument(id: string): Promise<void> {
  return apiRequest<void>(`/entity-documents/${id}`, { method: 'DELETE' });
}

export async function getDownloadLink(id: string): Promise<DownloadLink> {
  return apiRequest<DownloadLink>(`/entity-documents/${id}/download`);
}

/* ----------------------------- plan gating ----------------------------- */

/** This whole module sits under `@RequiresFeature("documents")` — every route
 * can 403 with this body if the school's plan doesn't include it. */
export function isFeatureNotInPlanError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    err.statusCode === 403 &&
    typeof err.body === 'object' &&
    err.body !== null &&
    (err.body as { code?: unknown }).code === 'FEATURE_NOT_IN_PLAN'
  );
}

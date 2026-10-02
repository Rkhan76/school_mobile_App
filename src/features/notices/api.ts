import { API_BASE_URL } from '../../config';
import { ApiError, apiRequest, getAccessToken } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type { Notice, NoticeInput, NoticeListParams } from './types';

export async function listNotices(params: NoticeListParams = {}): Promise<PaginatedResult<Notice>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.targetAudience) query.set('targetAudience', params.targetAudience);
  if (params.isPinned !== undefined) query.set('isPinned', String(params.isPinned));
  if (params.search) query.set('search', params.search);
  if (params.academicYearId) query.set('academicYearId', params.academicYearId);
  if (params.activeOnly !== undefined) query.set('activeOnly', String(params.activeOnly));

  const qs = query.toString();
  return apiRequest<PaginatedResult<Notice>>(`/notices${qs ? `?${qs}` : ''}`);
}

/** 404 when the notice is outside the caller's audience/window scope — existence isn't revealed. */
export async function getNotice(id: string): Promise<Notice> {
  return apiRequest<Notice>(`/notices/${id}`);
}

export async function createNotice(payload: NoticeInput): Promise<Notice> {
  return apiRequest<Notice>('/notices', { method: 'POST', body: payload });
}

export async function updateNotice(id: string, payload: Partial<NoticeInput>): Promise<Notice> {
  return apiRequest<Notice>(`/notices/${id}`, { method: 'PATCH', body: payload });
}

/** Soft-delete — 204 on success. */
export async function deleteNotice(id: string): Promise<void> {
  return apiRequest<void>(`/notices/${id}`, { method: 'DELETE' });
}

/**
 * Binary PDF stream (generated live, not stored) — bypasses `apiRequest` since
 * that helper assumes a JSON body. Same base URL + bearer header, read as an
 * ArrayBuffer so the caller can hand raw bytes straight to `File.write()`.
 */
export async function getNoticePdf(id: string): Promise<{ blob: ArrayBuffer; fileName: string }> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/notices/${id}/pdf`, { headers });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    const message =
      body && typeof body === 'object' && 'message' in body && typeof (body as { message?: unknown }).message === 'string'
        ? (body as { message: string }).message
        : 'Could not download the notice PDF.';
    throw new ApiError(response.status, message, body);
  }

  const blob = await response.arrayBuffer();
  const disposition = response.headers.get('content-disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fileName = match ? decodeURIComponent(match[1]) : `notice-${id}.pdf`;
  return { blob, fileName };
}

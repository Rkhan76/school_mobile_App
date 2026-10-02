import { apiRequest, ApiError, getAccessToken } from '../../lib/apiClient';
import { API_BASE_URL } from '../../config';
import type { PaginatedResult } from '../common/types';
import type {
  EventListParams,
  EventMedia,
  EventMediaResourceType,
  EventPayload,
  EventsPdfParams,
  MediaAsset,
  MediaUploadIntent,
  SchoolEvent,
} from './types';

function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    qs.set(key, String(value));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/* ---------- events CRUD ---------- */

export async function listEvents(params: EventListParams): Promise<PaginatedResult<SchoolEvent>> {
  return apiRequest<PaginatedResult<SchoolEvent>>(`/events${buildQuery(params)}`);
}

export async function getEvent(id: string): Promise<SchoolEvent> {
  return apiRequest<SchoolEvent>(`/events/${id}`);
}

export async function createEvent(payload: EventPayload): Promise<SchoolEvent> {
  return apiRequest<SchoolEvent>('/events', { method: 'POST', body: payload });
}

export async function updateEvent(id: string, payload: Partial<EventPayload>): Promise<SchoolEvent> {
  return apiRequest<SchoolEvent>(`/events/${id}`, { method: 'PATCH', body: payload });
}

export async function deleteEvent(id: string): Promise<void> {
  return apiRequest<void>(`/events/${id}`, { method: 'DELETE' });
}

/* ---------- PDF export (binary — raw fetch, same pattern as other binary downloads) ---------- */

function pdfFileNameFromHeaders(headers: Headers): string {
  const disposition = headers.get('content-disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return `events-${Date.now()}.pdf`;
}

export async function getEventsPdf(params: EventsPdfParams): Promise<{ blob: Blob; fileName: string }> {
  const token = getAccessToken();
  const url = `${API_BASE_URL}/events/pdf${buildQuery(params)}`;
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    let message = 'Failed to generate PDF';
    try {
      const body = await response.json();
      if (body && typeof body.message === 'string') message = body.message;
    } catch {
      // body wasn't JSON — keep the default message.
    }
    throw new ApiError(response.status, message);
  }

  const blob = await response.blob();
  return { blob, fileName: pdfFileNameFromHeaders(response.headers) };
}

/* ---------- media: two-step direct-to-Cloudinary upload ---------- */

export async function getMediaUploadIntent(
  eventId: string,
  resourceType: EventMediaResourceType
): Promise<MediaUploadIntent> {
  return apiRequest<MediaUploadIntent>(`/events/${eventId}/media/upload-intent`, {
    method: 'POST',
    body: { resourceType },
  });
}

/** Raw multipart POST straight to Cloudinary's signed upload URL — never goes through our backend. */
export async function uploadToCloudinary(
  uploadUrl: string,
  fields: MediaUploadIntent['fields'],
  file: MediaAsset
): Promise<{ public_id: string; [key: string]: unknown }> {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });
  // React Native's FormData accepts a { uri, name, type } object for file parts at
  // runtime, but lib.dom's typing only knows about string | Blob — cast through
  // `unknown` to satisfy TS here (same pattern used for admission file uploads).
  form.append('file', file as unknown as Blob);

  const response = await fetch(uploadUrl, { method: 'POST', body: form });
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.public_id) {
    const message =
      (typeof body?.error?.message === 'string' && body.error.message) || 'Upload to Cloudinary failed';
    throw new Error(message);
  }

  return body as { public_id: string; [key: string]: unknown };
}

export async function registerMedia(
  eventId: string,
  payload: { resourceType: EventMediaResourceType; publicId: string; caption?: string }
): Promise<EventMedia> {
  return apiRequest<EventMedia>(`/events/${eventId}/media`, { method: 'POST', body: payload });
}

export async function listMedia(eventId: string): Promise<EventMedia[]> {
  return apiRequest<EventMedia[]>(`/events/${eventId}/media`);
}

export async function deleteMedia(eventId: string, mediaId: string): Promise<void> {
  return apiRequest<void>(`/events/${eventId}/media/${mediaId}`, { method: 'DELETE' });
}

/** Orchestrates the full three-step upload: upload-intent -> Cloudinary -> register. */
export async function uploadEventMedia(
  eventId: string,
  asset: MediaAsset,
  resourceType: EventMediaResourceType,
  caption?: string
): Promise<EventMedia> {
  const intent = await getMediaUploadIntent(eventId, resourceType);
  const uploaded = await uploadToCloudinary(intent.uploadUrl, intent.fields, asset);
  return registerMedia(eventId, { resourceType, publicId: uploaded.public_id, caption });
}

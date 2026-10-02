export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type EventAudience = 'ALL' | 'STUDENTS' | 'TEACHERS' | 'PARENTS' | 'STAFF';

export const EVENT_STATUSES: EventStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
export const EVENT_AUDIENCES: EventAudience[] = ['ALL', 'STUDENTS', 'TEACHERS', 'PARENTS', 'STAFF'];

export type SchoolEvent = {
  id: string;
  title: string;
  description: string;
  /** ISO 8601 */
  startDate: string;
  /** ISO 8601 */
  endDate: string;
  location: string;
  status: EventStatus;
  targetAudience: EventAudience;
  isHoliday: boolean;
  academicYearId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** `POST /events` / `PATCH /events/:id` payload. */
export type EventPayload = {
  title: string;
  description?: string;
  /** ISO 8601 */
  startDate: string;
  /** ISO 8601 */
  endDate: string;
  location?: string;
  status?: EventStatus;
  targetAudience: EventAudience;
  isHoliday?: boolean;
  academicYearId?: string;
};

export type EventListParams = {
  page?: number;
  limit?: number;
  status?: EventStatus;
  targetAudience?: EventAudience;
  isHoliday?: boolean;
  search?: string;
  academicYearId?: string;
  /** ISO date/datetime — filters on `startDate`. */
  from?: string;
  /** ISO date/datetime — filters on `startDate`. */
  to?: string;
};

export type EventsPdfParams = {
  isHoliday?: boolean;
  academicYearId?: string;
  from?: string;
  to?: string;
};

/* ---------- media (direct-to-Cloudinary) ---------- */

export type EventMediaResourceType = 'image' | 'video';

export type EventMedia = {
  id: string;
  eventId: string;
  resourceType: EventMediaResourceType;
  publicId: string;
  caption?: string | null;
  /** Freshly computed on every read — do not cache across sessions. */
  streamingUrl: string;
  createdAt?: string;
};

export type MediaUploadIntent = {
  uploadUrl: string;
  fields: {
    api_key: string;
    timestamp: string | number;
    signature: string;
    [key: string]: unknown;
  };
  folder: string;
};

/** A picked local file, in the `{uri, name, type}` shape React Native's FormData/fetch expect. */
export type MediaAsset = {
  uri: string;
  name: string;
  type: string;
};

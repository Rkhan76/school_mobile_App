export type Audience = 'ALL' | 'STUDENTS' | 'TEACHERS' | 'PARENTS' | 'STAFF';

export const AUDIENCES: Audience[] = ['ALL', 'STUDENTS', 'TEACHERS', 'PARENTS', 'STAFF'];

export type NoticeCreatedBy = { id: string; fullName: string } | null;

/** Raw shape returned by the backend for a notice row (list/detail). */
export type Notice = {
  id: string;
  title: string;
  content: string;
  targetAudience: Audience;
  isPinned: boolean;
  /** ISO datetime, or null if not yet published. */
  publishedAt: string | null;
  /** ISO datetime, or null = never expires. */
  expiresAt: string | null;
  academicYearId: string | null;
  createdBy: NoticeCreatedBy;
  createdAt: string;
  updatedAt?: string;
};

/** Payload for create — same shape (all optional except title/content) for update. */
export type NoticeInput = {
  title: string;
  content: string;
  targetAudience?: Audience;
  isPinned?: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
  academicYearId?: string | null;
};

export type NoticeListParams = {
  page?: number;
  limit?: number;
  targetAudience?: Audience;
  isPinned?: boolean;
  search?: string;
  academicYearId?: string;
  /** Restricts to currently-published, non-expired notices. */
  activeOnly?: boolean;
};

/* ---------------- pure helpers (date formatting/validation) ---------------- */

export type NoticeUiStatus = 'Active' | 'Expired' | 'Scheduled';

/** Client-side-only label — the backend doesn't return a status field. */
export function deriveStatus(publishedAt: string | null, expiresAt: string | null): NoticeUiStatus {
  const now = Date.now();
  if (publishedAt && new Date(publishedAt).getTime() > now) return 'Scheduled';
  if (expiresAt && new Date(expiresAt).getTime() < now) return 'Expired';
  return 'Active';
}

export { formatDate } from '../../lib/date';

/** ISO datetime -> "21/08/2026" (date part only, for form inputs). */
export function isoToInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** "21/08/2026" -> ISO datetime (midnight UTC), or null when malformed / not a real date. */
export function inputToIso(text: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const d = Number(match[1]);
  const m = Number(match[2]);
  const y = Number(match[3]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString();
}

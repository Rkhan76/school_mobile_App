// Types modeled directly off MOBILE_API_DOCS.md section "20. Certificates".
// This is a freeform award/achievement certificate (e.g. "Best Teacher of the
// Year") — NOT Transfer/Bonafide/Character. There is no backend PDF
// generation; the API returns JSON and the client renders/exports it.

export type RecipientType = 'STUDENT' | 'TEACHER' | 'NON_TEACHING_STAFF' | 'DRIVER';
export type CertificateStatus = 'ACTIVE' | 'REVOKED';

export const RECIPIENT_TYPES: RecipientType[] = ['STUDENT', 'TEACHER', 'NON_TEACHING_STAFF', 'DRIVER'];
export const STATUSES: CertificateStatus[] = ['ACTIVE', 'REVOKED'];

export const RECIPIENT_TYPE_LABEL: Record<RecipientType, string> = {
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  NON_TEACHING_STAFF: 'Staff',
  DRIVER: 'Driver',
};

/** GET/POST /certificates — list/detail/create response shape. */
export interface Certificate {
  id: string;
  referenceNo: string;
  verificationToken: string;
  recipientType: RecipientType;
  recipientId: string;
  recipientName: string;
  title: string;
  description: string | null;
  /** ISO yyyy-mm-dd */
  issueDate: string;
  signatoryName: string | null;
  signatoryTitle: string | null;
  status: CertificateStatus;
  schoolName: string;
  schoolLogo: string | null;
  schoolAddress: string | null;
  schoolPhone: string | null;
  schoolEmail: string | null;
  issuedById: string | null;
  revokedById: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  academicYearId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /certificates/verify/:token — public, reduced, id-free shape. */
export interface PublicCertificateView {
  referenceNo: string;
  recipientName: string;
  title: string;
  description: string | null;
  issueDate: string;
  status: CertificateStatus;
  schoolName: string;
  schoolLogo: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ISO -> "01 Oct 2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}

/** ISO -> "01/10/2026" */
export function isoToInput(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** "01/10/2026" -> ISO, or null when malformed / not a real date. */
export function inputToIso(text: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const d = Number(match[1]);
  const m = Number(match[2]);
  const y = Number(match[3]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Today as ISO yyyy-mm-dd (local "today", used for the issue-date default/cap). */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

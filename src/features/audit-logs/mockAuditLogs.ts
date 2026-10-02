import { useCallback, useEffect, useMemo, useState } from 'react';

export type AuditValue = string | number | boolean | null;
export type AuditData = Record<string, AuditValue>;

export type AuditLog = {
  id: string;
  createdAt: string; // local time, "YYYY-MM-DDTHH:mm:ss"
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  userRole: string;
  before?: AuditData;
  after?: AuditData;
};

export type AuditFilters = {
  entityType: string;
  action: string;
  userId: string;
  from: string; // DD/MM/YYYY or ''
  to: string; // DD/MM/YYYY or ''
  pageSize: number;
};

export const EMPTY_FILTERS: AuditFilters = { entityType: '', action: '', userId: '', from: '', to: '', pageSize: 20 };
export const PAGE_SIZES = [10, 20, 50] as const;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

/** "2026-09-30T22:52:00" -> "30 Sept 2026, 22:52" (parsed manually, no timezone shifts). */
export function formatDateTime(iso: string): string {
  const y = iso.slice(0, 4);
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  return `${d} ${MONTHS[m - 1] ?? ''} ${y}, ${iso.slice(11, 16)}`;
}

/** DD/MM/YYYY -> sortable day key (YYYYMMDD) or null when invalid. */
export function parseDMY(s: string): number | null {
  const mt = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!mt) return null;
  const d = Number(mt[1]);
  const m = Number(mt[2]);
  const y = Number(mt[3]);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return y * 10000 + m * 100 + d;
}

function dayKey(iso: string): number {
  return Number(iso.slice(0, 10).replace(/-/g, ''));
}

const ADMIN = { userId: 'USR-001', userName: 'School Admin', userRole: 'SCHOOL' } as const;
const STUDENT = { userId: 'USR-214', userName: 'Test Student', userRole: 'SCHOOL' } as const;
const USERS = [
  ADMIN,
  { userId: 'USR-002', userName: 'Anita Verma', userRole: 'TEACHER' },
  { userId: 'USR-003', userName: 'Rahul Mehta', userRole: 'ACCOUNTANT' },
  { userId: 'USR-004', userName: 'Priya Nair', userRole: 'TEACHER' },
  STUDENT,
] as const;

type Seed = Omit<AuditLog, 'id'>;

const FIXED: Seed[] = [
  { createdAt: '2026-09-30T22:52:00', action: 'chat.oversight.list_groups', entityType: 'ChatGroupEntity', entityId: 'all', ...ADMIN },
  { createdAt: '2026-09-30T22:46:00', action: 'chat.oversight.list_groups', entityType: 'ChatGroupEntity', entityId: 'all', ...ADMIN },
  {
    createdAt: '2026-09-30T19:06:00', action: 'entity-document.approved', entityType: 'EntityDocumentEntity', entityId: 'DOC-1042', ...ADMIN,
    before: { status: 'PENDING', approvedBy: null, remarks: null },
    after: { status: 'APPROVED', approvedBy: 'USR-001', remarks: 'Verified against original' },
  },
  { createdAt: '2026-09-30T19:06:00', action: 'entity-document.accessed', entityType: 'EntityDocumentEntity', entityId: 'DOC-1042', ...ADMIN },
  { createdAt: '2026-09-30T18:57:00', action: 'entity-document.accessed', entityType: 'EntityDocumentEntity', entityId: 'DOC-1042', ...STUDENT },
  {
    createdAt: '2026-09-30T18:56:00', action: 'entity-document.uploaded', entityType: 'EntityDocumentEntity', entityId: 'DOC-1042', ...STUDENT,
    after: { fileName: 'birth_certificate.pdf', sizeKb: 842, status: 'PENDING', ownerId: 'USR-214' },
  },
  {
    createdAt: '2026-09-30T18:50:00', action: 'school-document.created', entityType: 'SchoolDocumentEntity', entityId: 'SDOC-310', ...ADMIN,
    after: { title: 'Annual Calendar 2026-27', classification: 'PUBLIC', version: 1 },
  },
  { createdAt: '2026-09-30T18:48:00', action: 'school-document.classified-accessed', entityType: 'SchoolDocumentEntity', entityId: 'SDOC-309', ...ADMIN },
  {
    createdAt: '2026-09-30T18:48:00', action: 'school-document.created', entityType: 'SchoolDocumentEntity', entityId: 'SDOC-309', ...ADMIN,
    after: { title: 'Staff Salary Policy', classification: 'CONFIDENTIAL', version: 1 },
  },
];

type Template = {
  action: string;
  entityType: string;
  idPrefix: string;
  before?: AuditData;
  after?: AuditData;
};

const TEMPLATES: Template[] = [
  {
    action: 'student.profile.updated', entityType: 'StudentEntity', idPrefix: 'STU',
    before: { phone: '9876501234', address: '12 Park Street', bloodGroup: 'B+' },
    after: { phone: '9876505678', address: '48 Lake View Road', bloodGroup: 'B+' },
  },
  {
    action: 'fee.payment.created', entityType: 'FeePaymentEntity', idPrefix: 'PAY',
    after: { amount: 12500, mode: 'UPI', status: 'PAID', receiptNo: 'RCP-2026-0418' },
  },
  {
    action: 'admission.approved', entityType: 'AdmissionEntity', idPrefix: 'ADM',
    before: { status: 'PENDING', section: null },
    after: { status: 'APPROVED', section: 'A' },
  },
  { action: 'auth.login', entityType: 'UserEntity', idPrefix: 'USR' },
  {
    action: 'attendance.marked', entityType: 'AttendanceEntity', idPrefix: 'ATT',
    after: { class: '8-B', present: 36, absent: 4, date: '2026-09-28' },
  },
  {
    action: 'notice.created', entityType: 'NoticeEntity', idPrefix: 'NTC',
    after: { title: 'Parent-Teacher Meeting', audience: 'PARENTS', pinned: false },
  },
  {
    action: 'fee.structure.updated', entityType: 'FeeStructureEntity', idPrefix: 'FEE',
    before: { tuition: 42000, transport: 8000, active: true },
    after: { tuition: 45000, transport: 8000, active: true },
  },
  { action: 'auth.logout', entityType: 'UserEntity', idPrefix: 'USR' },
];

function buildLogs(): AuditLog[] {
  const all: Seed[] = [...FIXED];
  // Deterministic: walk backwards in time from 30 Sept 18:30 to 25 Sept.
  let minutes = 18 * 60 + 30;
  let day = 30;
  for (let i = 0; i < 36; i += 1) {
    minutes -= 37 + ((i * 53) % 190);
    while (minutes < 6 * 60) {
      minutes += 15 * 60;
      day -= 1;
    }
    if (day < 25) day = 25;
    const t = TEMPLATES[(i * 3 + 1) % TEMPLATES.length];
    const u = USERS[(i * 2 + (i % 3)) % USERS.length];
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    all.push({
      createdAt: `2026-09-${String(day).padStart(2, '0')}T${hh}:${mm}:00`,
      action: t.action,
      entityType: t.entityType,
      entityId: `${t.idPrefix}-${1000 + ((i * 37) % 900)}`,
      userId: u.userId,
      userName: u.userName,
      userRole: u.userRole,
      before: t.before,
      after: t.after,
    });
  }
  return all.map((s, i) => ({ ...s, id: `log-${i + 1}` }));
}

const ALL_LOGS: AuditLog[] = buildLogs();

export type AuditLogParams = AuditFilters & { search: string; page: number };

function contains(hay: string, needle: string): boolean {
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}

function applyFilters(p: AuditLogParams): AuditLog[] {
  const q = p.search.trim();
  const from = parseDMY(p.from);
  const to = parseDMY(p.to);
  return ALL_LOGS.filter((l) => {
    if (q && !(contains(l.action, q) || contains(l.entityType, q) || contains(l.userName, q))) return false;
    if (p.entityType.trim() && !contains(l.entityType, p.entityType)) return false;
    if (p.action.trim() && !contains(l.action, p.action)) return false;
    if (p.userId.trim() && !contains(l.userId, p.userId)) return false;
    const k = dayKey(l.createdAt);
    if (from !== null && k < from) return false;
    if (to !== null && k > to) return false;
    return true;
  });
}

/** Local-state stand-in for the future API hook. */
export function useAuditLogs(params: AuditLogParams) {
  const { search, entityType, action, userId, from, to, pageSize, page } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, [search, entityType, action, userId, from, to, pageSize, nonce]);

  const filtered = useMemo(
    () => applyFilters({ search, entityType, action, userId, from, to, pageSize, page: 1 }),
    [search, entityType, action, userId, from, to, pageSize],
  );
  const data = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);
  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, total: filtered.length, isLoading, refetch };
}

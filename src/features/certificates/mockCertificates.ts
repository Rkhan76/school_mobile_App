import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type RecipientType = 'Student' | 'Staff' | 'Teacher';
export type CertificateKind = 'Bonafide' | 'Transfer' | 'Character' | 'Merit' | 'Course Completion' | 'Custom';
export type CertificateStatus = 'Active' | 'Revoked';

export const RECIPIENT_TYPES: RecipientType[] = ['Student', 'Staff', 'Teacher'];
export const CERTIFICATE_KINDS: CertificateKind[] = ['Bonafide', 'Transfer', 'Character', 'Merit', 'Course Completion', 'Custom'];
export const STATUSES: CertificateStatus[] = ['Active', 'Revoked'];

export const KIND_LABEL: Record<CertificateKind, string> = {
  Bonafide: 'Bonafide',
  Transfer: 'Transfer',
  Character: 'Character',
  Merit: 'Merit / Appreciation',
  'Course Completion': 'Course Completion',
  Custom: 'Custom',
};

export const KIND_DEFAULT_TITLE: Record<CertificateKind, string> = {
  Bonafide: 'Bonafide Certificate',
  Transfer: 'Transfer Certificate',
  Character: 'Character Certificate',
  Merit: 'Certificate of Appreciation',
  'Course Completion': 'Course Completion Certificate',
  Custom: '',
};

/** "Today" for the mock data set. */
export const TODAY_ISO = '2026-10-02';

export interface Certificate {
  id: string;
  referenceNo: string;
  recipientName: string;
  recipientType: RecipientType;
  type: CertificateKind;
  title: string;
  /** ISO yyyy-mm-dd */
  issueDate: string;
  status: CertificateStatus;
  /** ISO yyyy-mm-dd */
  revokedAt?: string;
  revokeReason?: string;
  remarks?: string;
}

export interface Recipient {
  id: string;
  name: string;
  kind: 'Student' | 'Staff';
  /** Used as the recipientType on the certificate. */
  recipientType: RecipientType;
  detail: string;
}

export interface IssueInput {
  type: CertificateKind;
  recipientName: string;
  recipientType: RecipientType;
  title: string;
  issueDate: string;
  remarks?: string;
}

export interface CertificatesParams {
  search: string;
  recipientType: RecipientType | '';
  kind: CertificateKind | '';
  status: CertificateStatus | '';
  page: number;
  pageSize: number;
}

export const RECIPIENTS: Recipient[] = [
  { id: 'r1', name: 'Aadhya Nair', kind: 'Student', recipientType: 'Student', detail: 'Class 8-A' },
  { id: 'r2', name: 'Rohan Mehta', kind: 'Student', recipientType: 'Student', detail: 'Class 10-B' },
  { id: 'r3', name: 'Ananya Iyer', kind: 'Student', recipientType: 'Student', detail: 'Class 6-C' },
  { id: 'r4', name: 'Kabir Singh', kind: 'Student', recipientType: 'Student', detail: 'Class 9-A' },
  { id: 'r5', name: 'Diya Sharma', kind: 'Student', recipientType: 'Student', detail: 'Class 7-B' },
  { id: 'r6', name: 'Vihaan Gupta', kind: 'Student', recipientType: 'Student', detail: 'Class 5-A' },
  { id: 'r7', name: 'Meera Reddy', kind: 'Student', recipientType: 'Student', detail: 'Class 12-Sci' },
  { id: 'r8', name: 'Suresh Kulkarni', kind: 'Staff', recipientType: 'Teacher', detail: 'Mathematics' },
  { id: 'r9', name: 'Priya Menon', kind: 'Staff', recipientType: 'Teacher', detail: 'English' },
  { id: 'r10', name: 'Arjun Patel', kind: 'Staff', recipientType: 'Staff', detail: 'Accounts' },
  { id: 'r11', name: 'Lakshmi Rao', kind: 'Staff', recipientType: 'Staff', detail: 'Librarian' },
  { id: 'r12', name: 'Farah Khan', kind: 'Staff', recipientType: 'Teacher', detail: 'Science' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ISO -> "01 Oct 2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
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

export function makeReference(n: number): string {
  return `CERT-2026-${String(n).padStart(4, '0')}`;
}

type Seed = [
  name: string, rt: RecipientType, kind: CertificateKind, title: string, iso: string,
  revoked?: { at: string; reason: string },
];

const SEED: Seed[] = [
  ['Aadhya Nair', 'Student', 'Merit', 'best student', '2026-10-01'],
  ['Rohan Mehta', 'Student', 'Bonafide', 'Bonafide Certificate', '2026-09-28'],
  ['Suresh Kulkarni', 'Teacher', 'Merit', 'Excellence in Teaching 2026', '2026-09-25'],
  ['Ananya Iyer', 'Student', 'Character', 'Character Certificate', '2026-09-20'],
  ['Kabir Singh', 'Student', 'Transfer', 'Transfer Certificate', '2026-09-15',
    { at: '2026-09-18', reason: 'Issued with incorrect admission number.' }],
  ['Priya Menon', 'Teacher', 'Course Completion', 'Advanced Pedagogy Workshop', '2026-09-10'],
  ['Diya Sharma', 'Student', 'Merit', 'Science Fair Winner', '2026-09-05'],
  ['Arjun Patel', 'Staff', 'Custom', 'Five Years of Service', '2026-08-30'],
  ['Vihaan Gupta', 'Student', 'Course Completion', 'Coding Club Completion', '2026-08-22',
    { at: '2026-08-25', reason: 'Student did not complete the final project.' }],
  ['Meera Reddy', 'Student', 'Bonafide', 'Bonafide Certificate', '2026-08-14'],
  ['Lakshmi Rao', 'Staff', 'Character', 'Character Certificate', '2026-08-02'],
  ['Farah Khan', 'Teacher', 'Merit', 'Certificate of Appreciation', '2026-07-19',
    { at: '2026-07-21', reason: 'Duplicate issue, replaced by a new certificate.' }],
];

function buildMock(): Certificate[] {
  return SEED.map(([recipientName, recipientType, type, title, issueDate, revoked], i) => ({
    id: `c${i + 1}`,
    referenceNo: makeReference(i + 1),
    recipientName, recipientType, type, title, issueDate,
    status: revoked ? 'Revoked' : 'Active',
    revokedAt: revoked?.at,
    revokeReason: revoked?.reason,
  }));
}

export function useCertificates(params: CertificatesParams) {
  const [all, setAll] = useState<Certificate[]>(() => buildMock());
  const [isLoading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(SEED.length);

  const refetch = useCallback(() => {
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), 700);
  }, []);

  useEffect(() => {
    refetch();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refetch]);

  const stats = useMemo(() => {
    const revoked = all.filter((c) => c.status === 'Revoked').length;
    return { total: all.length, active: all.length - revoked, revoked };
  }, [all]);

  const filtered = useMemo(() => {
    const q = params.search.trim().toLowerCase();
    return all
      .filter((c) => {
        if (params.recipientType && c.recipientType !== params.recipientType) return false;
        if (params.kind && c.type !== params.kind) return false;
        if (params.status && c.status !== params.status) return false;
        return !q || c.title.toLowerCase().includes(q) || c.recipientName.toLowerCase().includes(q)
          || c.referenceNo.toLowerCase().includes(q);
      })
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : a.issueDate > b.issueDate ? -1 : b.referenceNo.localeCompare(a.referenceNo)));
  }, [all, params.search, params.recipientType, params.kind, params.status]);

  const data = useMemo(() => {
    const start = (params.page - 1) * params.pageSize;
    return filtered.slice(start, start + params.pageSize);
  }, [filtered, params.page, params.pageSize]);

  const issue = useCallback((input: IssueInput): Certificate => {
    counter.current += 1;
    const created: Certificate = {
      id: `c-${counter.current}`,
      referenceNo: makeReference(counter.current),
      recipientName: input.recipientName,
      recipientType: input.recipientType,
      type: input.type,
      title: input.title.trim(),
      issueDate: input.issueDate,
      status: 'Active',
      remarks: input.remarks?.trim() || undefined,
    };
    setAll((prev) => [created, ...prev]);
    return created;
  }, []);

  const revoke = useCallback((id: string, reason: string) => {
    setAll((prev) =>
      prev.map((c) =>
        c.id === id && c.status === 'Active'
          ? { ...c, status: 'Revoked', revokedAt: TODAY_ISO, revokeReason: reason.trim() }
          : c,
      ),
    );
  }, []);

  return { data, total: filtered.length, stats, isLoading, refetch, issue, revoke };
}

import { useCallback, useEffect, useState } from 'react';

import {
  changeEmployment as apiChangeEmployment,
  getTeacher,
  getTeacherBank,
  getTeacherEmploymentHistory,
  getTeacherPersonal,
  setTeacherStatus as apiSetTeacherStatus,
  toggleTeacherBlock as apiToggleTeacherBlock,
  updateTeacher as apiUpdateTeacher,
} from './api';

export type TeacherStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

export interface TeacherAddress {
  current: string;
  permanent: string;
}

export interface TeacherBankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export interface TeacherDocument {
  id: string;
  name: string;
  file?: string;
  verified: boolean;
}

export interface Assignment {
  id: string;
  className: string;
  section: string;
  subject: string;
  periodsPerWeek?: number;
}

/** -------- Raw API shapes (section 4 of MOBILE_API_DOCS.md) -------- */

export interface TeacherStaffInfo {
  id?: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  employeeType?: string;
  joiningDate?: string;
  contractType?: string;
  status?: TeacherStatus;
}

/** `GET /teachers/:id` — full entity with `staff` relation populated. */
export interface TeacherRaw {
  id: string;
  schoolId?: string;
  staffId?: string;
  fullName: string;
  gender?: string;
  dateOfBirth?: string;
  fathersName?: string;
  mothersName?: string;
  maritalStatus?: string;
  shift?: string;
  workLocation?: string;
  phone?: string;
  email?: string;
  experience?: string;
  qualification?: string;
  profileImage?: string;
  medicalDetails?: Record<string, unknown>;
  bankDetails?: Record<string, unknown>;
  documents?: RawDocument[];
  previousSchoolName?: string;
  previousSchoolAddress?: string;
  addressInfo?: Record<string, unknown>;
  additionalDetails?: string;
  socialLinks?: { facebook?: string; linkedin?: string; instagram?: string; youtube?: string };
  status?: TeacherStatus;
  staff?: TeacherStaffInfo | null;
  [key: string]: unknown;
}

export interface RawDocument {
  id?: string;
  documentName?: string;
  name?: string;
  file?: string;
  verified?: boolean;
}

export interface AssignmentSection {
  id?: string;
  name?: string;
  class?: { id?: string; name?: string };
}

export interface AssignmentSubject {
  id?: string;
  name?: string;
}

export interface RawAssignment {
  sectionId: string;
  section?: AssignmentSection | null;
  subjectId: string;
  subject?: AssignmentSubject | null;
  academicYearId?: string;
  assignedFrom?: string;
}

/** `GET /teachers/:id/personal` — the rich tab-shaped response. */
export interface TeacherPersonal {
  id: string;
  schoolUserId?: string | null;
  employeeCode?: string;
  fullName: string;
  gender?: string;
  dateOfBirth?: string;
  fathersName?: string;
  mothersName?: string;
  maritalStatus?: string;
  phone?: string;
  email?: string;
  profileImage?: string;
  currentAssignments: RawAssignment[];
  contractType?: string;
  shift?: string;
  workLocation?: string;
  joiningDate?: string;
  experience?: string;
  qualification?: string;
  previousSchoolName?: string;
  previousSchoolAddress?: string;
  socialLinks?: Record<string, string>;
  additionalDetails?: string;
  medicalDetails?: Record<string, unknown>;
  addressInfo?: Record<string, unknown>;
  documents?: RawDocument[];
}

/** `GET /teachers/:id/bank` */
export interface TeacherBankResponse {
  id: string;
  bankDetails?: Record<string, unknown>;
}

/** One row of `GET /teachers/:id/employment-history` — exact field names beyond
 * designation/department aren't pinned down by the docs, so this is read defensively. */
export interface EmploymentHistoryRow {
  id?: string;
  designation?: string;
  department?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  startDate?: string;
  endDate?: string | null;
  [key: string]: unknown;
}

export interface TeacherUpdatePayload {
  personalInfo?: Partial<{
    fullName: string;
    gender: string;
    dateOfBirth: string;
    phone: string;
    email: string;
    qualification: string;
    experience: string;
    workLocation: string;
    joiningDate: string;
    contractType: string;
    shift: string;
  }>;
  bankDetails?: Partial<{ accountNumber: string; bankName: string; ifscCode: string }>;
  address?: Partial<{ currentAddress: string; permanentAddress: string }>;
  [key: string]: unknown;
}

export interface EmploymentChangePayload {
  designation?: string;
  department?: string;
  effectiveDate?: string;
}

/** -------- Merged shape the existing tab components render -------- */

export interface TeacherDetail {
  id: string;
  staffId: string;
  fullName: string;
  status: TeacherStatus;
  blocked: boolean;
  subject: string;
  isClassTeacher: boolean;
  className: string;
  section: string;
  gender: string;
  dateOfBirth: string;
  fathersName: string;
  mothersName: string;
  maritalStatus: string;
  contractType: string;
  shift: string;
  workLocation: string;
  joiningDate: string;
  phone: string;
  email: string;
  experience: string;
  qualification: string;
  addressInfo: TeacherAddress;
  bankDetails: TeacherBankDetails;
  documents: TeacherDocument[];
  assignments: Assignment[];
  designation?: string;
  department?: string;
}

function str(v: unknown, fallback = '—'): string {
  if (typeof v === 'string' && v.trim()) return v;
  return fallback;
}

function pickAddress(raw?: Record<string, unknown>): TeacherAddress {
  const a = raw ?? {};
  const current = a.current ?? a.currentAddress;
  const permanent = a.permanent ?? a.permanentAddress;
  return { current: str(current, ''), permanent: str(permanent, '') };
}

function pickBank(raw?: Record<string, unknown>): TeacherBankDetails {
  const b = raw ?? {};
  return {
    bankName: str(b.bankName, ''),
    accountNumber: str(b.accountNumber, ''),
    ifscCode: str(b.ifscCode ?? b.ifsc, ''),
  };
}

function mapDocuments(docs?: RawDocument[]): TeacherDocument[] {
  if (!docs) return [];
  return docs.map((d, i) => ({
    id: d.id ?? `${i}`,
    name: d.documentName ?? d.name ?? 'Document',
    file: d.file,
    verified: d.verified ?? false,
  }));
}

function mapAssignments(assignments?: RawAssignment[]): Assignment[] {
  if (!assignments) return [];
  return assignments.map((a, i) => ({
    id: `${a.sectionId}-${a.subjectId}-${i}`,
    className: a.section?.class?.name ?? '—',
    section: a.section?.name ?? '—',
    subject: a.subject?.name ?? '—',
  }));
}

function merge(raw: TeacherRaw, personal: TeacherPersonal, bank: TeacherBankResponse): TeacherDetail {
  const assignments = mapAssignments(personal.currentAssignments);
  const first = assignments[0];
  return {
    id: raw.id,
    staffId: personal.employeeCode ?? raw.staff?.employeeCode ?? raw.staffId ?? raw.id,
    fullName: raw.fullName ?? personal.fullName,
    status: raw.status ?? raw.staff?.status ?? 'ACTIVE',
    blocked: false,
    subject: first?.subject ?? '—',
    // The API doesn't expose a "class teacher" flag anywhere in this controller — assignment
    // records are subject/section links only, so this can't be derived reliably.
    isClassTeacher: false,
    className: first?.className ?? '',
    section: first?.section ?? '',
    gender: str(raw.gender ?? personal.gender),
    dateOfBirth: str(raw.dateOfBirth ?? personal.dateOfBirth),
    fathersName: str(raw.fathersName ?? personal.fathersName),
    mothersName: str(raw.mothersName ?? personal.mothersName),
    maritalStatus: str(raw.maritalStatus ?? personal.maritalStatus),
    contractType: str(personal.contractType ?? raw.staff?.contractType),
    shift: str(raw.shift ?? personal.shift),
    workLocation: str(raw.workLocation ?? personal.workLocation),
    joiningDate: str(personal.joiningDate ?? raw.staff?.joiningDate),
    phone: str(raw.phone ?? personal.phone, ''),
    email: str(raw.email ?? personal.email, ''),
    experience: str(raw.experience ?? personal.experience),
    qualification: str(raw.qualification ?? personal.qualification),
    addressInfo: pickAddress((raw.addressInfo ?? personal.addressInfo) as Record<string, unknown> | undefined),
    bankDetails: pickBank((bank.bankDetails ?? raw.bankDetails) as Record<string, unknown> | undefined),
    documents: mapDocuments(personal.documents ?? raw.documents),
    assignments,
    designation: raw.staff?.designation,
    department: raw.staff?.department,
  };
}

export interface UseTeacherDetailResult {
  data: TeacherDetail | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  mutating: boolean;
  employmentHistory: EmploymentHistoryRow[] | null;
  employmentHistoryLoading: boolean;
  loadEmploymentHistory: () => void;
  updateProfile: (partial: TeacherUpdatePayload) => Promise<void>;
  changeEmployment: (payload: EmploymentChangePayload) => Promise<void>;
  setStatus: (status: TeacherStatus) => Promise<void>;
  toggleBlock: () => Promise<boolean>;
}

export function useTeacherDetail(id: string | undefined): UseTeacherDetailResult {
  const [data, setData] = useState<TeacherDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mutating, setMutating] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [employmentHistory, setEmploymentHistory] = useState<EmploymentHistoryRow[] | null>(null);
  const [employmentHistoryLoading, setEmploymentHistoryLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setData(null);
      setIsLoading(false);
      setError(new Error('Teacher not found'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setEmploymentHistory(null);
    Promise.all([getTeacher(id), getTeacherPersonal(id), getTeacherBank(id)])
      .then(([raw, personal, bank]) => {
        if (cancelled) return;
        setData(merge(raw, personal, bank));
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('Something went wrong.'));
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  const loadEmploymentHistory = useCallback(() => {
    if (!id || employmentHistoryLoading) return;
    setEmploymentHistoryLoading(true);
    getTeacherEmploymentHistory(id)
      .then((rows) => setEmploymentHistory(rows))
      .catch(() => setEmploymentHistory([]))
      .finally(() => setEmploymentHistoryLoading(false));
  }, [id, employmentHistoryLoading]);

  const updateProfile = useCallback(
    async (partial: TeacherUpdatePayload) => {
      if (!id) return;
      setMutating(true);
      try {
        await apiUpdateTeacher(id, partial);
        refetch();
      } finally {
        setMutating(false);
      }
    },
    [id, refetch]
  );

  const changeEmploymentFn = useCallback(
    async (payload: EmploymentChangePayload) => {
      if (!id) return;
      setMutating(true);
      try {
        await apiChangeEmployment(id, payload);
        refetch();
      } finally {
        setMutating(false);
      }
    },
    [id, refetch]
  );

  const setStatus = useCallback(
    async (status: TeacherStatus) => {
      if (!id) return;
      setMutating(true);
      try {
        await apiSetTeacherStatus(id, status);
        setData((prev) => (prev ? { ...prev, status } : prev));
      } finally {
        setMutating(false);
      }
    },
    [id]
  );

  const toggleBlock = useCallback(async (): Promise<boolean> => {
    if (!id) return false;
    setMutating(true);
    try {
      const result = await apiToggleTeacherBlock(id);
      setData((prev) => (prev ? { ...prev, blocked: result.blocked } : prev));
      return result.blocked;
    } finally {
      setMutating(false);
    }
  }, [id]);

  return {
    data,
    isLoading,
    error,
    refetch,
    mutating,
    employmentHistory,
    employmentHistoryLoading,
    loadEmploymentHistory,
    updateProfile,
    changeEmployment: changeEmploymentFn,
    setStatus,
    toggleBlock,
  };
}

/** Indian digit grouping (12,34,567), manual to avoid locale support issues. */
export function formatINR(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const s = String(Math.round(Math.abs(amount)));
  if (s.length <= 3) return `${sign}₹${s}`;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${sign}₹${parts.join(',')},${last3}`;
}

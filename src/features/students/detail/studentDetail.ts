import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../lib/apiClient';
import {
  getStudent,
  getStudentBank,
  getStudentEnrollments,
  getStudentHostel,
  getStudentParents,
  getStudentPersonal,
} from '../api';
import type {
  StudentBankResponse,
  StudentDetail as ApiStudentDetail,
  StudentEnrollmentRow,
  StudentHostelResponse,
  StudentParents,
  StudentPersonal,
} from '../types';

export type { StudentEnrollmentRow };

export interface StudentGuardian {
  name: string;
  relation: string;
  occupation: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

// --- The Attendance / Fees / Documents / Reports tabs are OUT OF SCOPE for this pass
// (they belong to other backend modules not yet wired up) — these shapes and the static
// data below are kept as-is so those tabs keep rendering unchanged.
export interface StudentAttendance {
  todayStatus: 'PRESENT' | 'ABSENT' | 'LATE';
  checkInTime: string;
  checkInPlace: string;
  checkInSource: string;
  monthDays: number;
  present: number;
  absent: number;
  late: number;
  punctualityPct: number;
  overallPct: number;
  recent: { date: string; status: 'Present' | 'Absent' | 'Late' }[];
}

export interface StudentInvoice {
  receiptNo: string;
  title: string;
  paidOn: string;
  mode: string;
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface StudentFees {
  totalDue: number;
  totalPaid: number;
  latestInvoice: StudentInvoice;
  history: StudentInvoice[];
}

export interface StudentDocument {
  id: string;
  name: string;
  verified: boolean;
  icon: 'document-text-outline' | 'medkit-outline' | 'id-card-outline';
}

export interface StudentReport {
  id: string;
  type: 'Attendance' | 'Academic' | 'Fees';
  range: string;
  generatedOn: string;
}

// --- Bank / Hostel: in scope, shaped off the real /bank and /hostel endpoints.
export interface StudentBankView {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;
}

export interface StudentHostelView {
  isResident: boolean;
  hostelName: string;
  room: string;
}

export type EnrollmentStatus = 'active' | 'graduated' | 'transferred' | 'withdrawn' | 'inactive';

export interface StudentDetail {
  id: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  class: string;
  section: string;
  year: string;
  status: EnrollmentStatus;
  /** Has a linked portal login (schoolUserId). */
  verified: boolean;
  bloodGroup: string;
  email: string;
  phone: string;
  dob: string;
  age: number;
  gender: string;
  category: string;
  subcategory: string;
  address: string;
  guardian: StudentGuardian;
  guardians: StudentGuardian[];
  attendance: StudentAttendance;
  fees: StudentFees;
  documents: StudentDocument[];
  bank: StudentBankView;
  hostel: StudentHostelView;
  reports: StudentReport[];
}

const mockInvoice: StudentInvoice = {
  receiptNo: 'REC-2026-8812',
  title: 'Term 1 Tuition & Lab Fee',
  paidOn: '15 Aug 2026',
  mode: 'UPI Netbanking',
  amount: 32500,
  status: 'SUCCESS',
};

const mockAttendance: StudentAttendance = {
  todayStatus: 'PRESENT',
  checkInTime: '08:14 AM',
  checkInPlace: 'Gate 2 (North)',
  checkInSource: 'RFID SmartCard Sync Verified',
  monthDays: 23,
  present: 22,
  absent: 1,
  late: 0,
  punctualityPct: 95.6,
  overallPct: 96.4,
  recent: [
    { date: '02 Oct 2026', status: 'Present' },
    { date: '01 Oct 2026', status: 'Present' },
    { date: '30 Sep 2026', status: 'Absent' },
    { date: '29 Sep 2026', status: 'Present' },
    { date: '28 Sep 2026', status: 'Present' },
  ],
};

const mockFees: StudentFees = {
  totalDue: 0,
  totalPaid: 65000,
  latestInvoice: mockInvoice,
  history: [
    mockInvoice,
    { ...mockInvoice, receiptNo: 'REC-2026-4120', title: 'Admission & Annual Fee', paidOn: '10 Jun 2026', mode: 'Card', amount: 32500 },
  ],
};

const mockDocuments: StudentDocument[] = [
  { id: 'd1', name: 'Official Birth Certificate', verified: true, icon: 'document-text-outline' },
  { id: 'd2', name: 'Medical Clearance & Vaccines', verified: true, icon: 'medkit-outline' },
  { id: 'd3', name: 'Previous School Transfer Certificate', verified: true, icon: 'id-card-outline' },
];

const mockReports: StudentReport[] = [
  { id: 'r1', type: 'Attendance', range: '01 Sep - 30 Sep 2026', generatedOn: '01 Oct 2026' },
  { id: 'r2', type: 'Academic', range: 'Term 1 2026-27', generatedOn: '28 Sep 2026' },
  { id: 'r3', type: 'Fees', range: 'Apr 2026 - Mar 2027', generatedOn: '15 Aug 2026' },
];

function calcAge(dob: string | null | undefined): number {
  if (!dob) return 0;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  const diffMs = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diffMs / (365.25 * 24 * 3600 * 1000)));
}

function formatDate(dob: string | null | undefined): string {
  if (!dob) return '—';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return dob;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildDetail(
  base: ApiStudentDetail,
  personal: StudentPersonal,
  parents: StudentParents,
  bank: StudentBankResponse,
  hostel: StudentHostelResponse,
): StudentDetail {
  const guardians: StudentGuardian[] = parents.guardians.map((g) => ({
    name: g.guardian.name,
    relation: g.relation,
    occupation: g.guardian.occupation ?? '—',
    email: g.guardian.email ?? '—',
    phone: g.guardian.phone ?? '—',
    isPrimary: g.isPrimaryContact,
  }));
  const primary: StudentGuardian = guardians.find((g) => g.isPrimary) ?? guardians[0] ?? {
    name: '—', relation: '—', occupation: '—', email: '—', phone: '—', isPrimary: true,
  };

  return {
    id: base.id,
    admissionNumber: base.admissionNumber,
    rollNumber: base.rollNumber ?? '—',
    fullName: base.fullName,
    class: base.class?.name ?? '—',
    section: base.section?.name ?? '—',
    year: base.academicYear?.label ?? '—',
    status: base.enrollmentStatus,
    verified: Boolean(base.schoolUserId),
    bloodGroup: personal.medicalDetails?.bloodGroup ?? '—',
    email: personal.email ?? '—',
    phone: personal.phone ?? '—',
    dob: formatDate(personal.dateOfBirth),
    age: calcAge(personal.dateOfBirth),
    gender: personal.gender ?? '—',
    category: personal.category ?? '—',
    subcategory: personal.subcategory ?? '—',
    address: personal.addressInfo?.currentAddress ?? '—',
    guardian: primary,
    guardians,
    attendance: mockAttendance,
    fees: mockFees,
    documents: mockDocuments,
    bank: {
      bankName: bank.bankDetails?.bankName ?? '—',
      accountNumber: bank.bankDetails?.accountNumber ?? '—',
      ifscCode: bank.bankDetails?.ifscCode ?? '—',
      bankBranch: bank.bankDetails?.bankBranch ?? '—',
    },
    hostel: {
      isResident: Boolean(hostel.hostelName),
      hostelName: hostel.hostelName ?? 'Not allotted',
      room: hostel.roomNumber ?? '-',
    },
    reports: mockReports,
  };
}

export interface UseStudentDetailResult {
  data: StudentDetail | null;
  isLoading: boolean;
  /** Not-found / failure shape: null when ok. */
  error: { code: 'NOT_FOUND' | 'UNKNOWN'; message: string } | null;
  enrollments: StudentEnrollmentRow[] | null;
  enrollmentsLoading: boolean;
  /** Fetches /students/:id/enrollments once, lazily (call when the history tab is opened). */
  loadEnrollments: () => void;
}

/** Fetches the real student detail (base + personal + parents + bank + hostel) in parallel. */
export function useStudentDetail(id: string | undefined): UseStudentDetailResult {
  const [state, setState] = useState<{
    data: StudentDetail | null;
    isLoading: boolean;
    error: UseStudentDetailResult['error'];
  }>({ data: null, isLoading: true, error: null });

  const [enrollments, setEnrollments] = useState<StudentEnrollmentRow[] | null>(null);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const enrollmentsFetched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, isLoading: true, error: null });
    setEnrollments(null);
    enrollmentsFetched.current = false;

    if (!id) {
      setState({ data: null, isLoading: false, error: { code: 'NOT_FOUND', message: 'Student not found' } });
      return;
    }

    (async () => {
      try {
        const [base, personal, parents, bank, hostel] = await Promise.all([
          getStudent(id),
          getStudentPersonal(id),
          getStudentParents(id),
          getStudentBank(id),
          getStudentHostel(id),
        ]);
        if (cancelled) return;
        setState({ data: buildDetail(base, personal, parents, bank, hostel), isLoading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        const isNotFound = err instanceof ApiError && err.statusCode === 404;
        setState({
          data: null,
          isLoading: false,
          error: {
            code: isNotFound ? 'NOT_FOUND' : 'UNKNOWN',
            message: err instanceof ApiError ? err.message : 'Something went wrong',
          },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const loadEnrollments = useCallback(() => {
    if (!id || enrollmentsFetched.current) return;
    enrollmentsFetched.current = true;
    setEnrollmentsLoading(true);
    getStudentEnrollments(id)
      .then((rows) => setEnrollments(rows))
      .catch(() => setEnrollments([]))
      .finally(() => setEnrollmentsLoading(false));
  }, [id]);

  return { ...state, enrollments, enrollmentsLoading, loadEnrollments };
}

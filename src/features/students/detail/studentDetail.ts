import { useEffect, useState } from 'react';

export interface StudentGuardian {
  name: string;
  relation: string;
  occupation: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

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

export interface StudentBank {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
}

export interface StudentHostel {
  isResident: boolean;
  hostelName: string;
  room: string;
  warden: string;
  wardenPhone: string;
  messPlan: string;
}

export interface StudentReport {
  id: string;
  type: 'Attendance' | 'Academic' | 'Fees';
  range: string;
  generatedOn: string;
}

export interface StudentDetail {
  id: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  class: string;
  section: string;
  year: string;
  status: 'ACTIVE' | 'INACTIVE';
  verified: boolean;
  bloodGroup: string;
  email: string;
  phone: string;
  phoneTag: string;
  dob: string;
  age: number;
  gender: string;
  category: string;
  religion: string;
  address: string;
  admissionDate: string;
  rank: string;
  rankNote: string;
  guardian: StudentGuardian;
  guardians: StudentGuardian[];
  attendance: StudentAttendance;
  fees: StudentFees;
  documents: StudentDocument[];
  bank: StudentBank;
  hostel: StudentHostel;
  reports: StudentReport[];
}

const invoice: StudentInvoice = {
  receiptNo: 'REC-2026-8812',
  title: 'Term 1 Tuition & Lab Fee',
  paidOn: '15 Aug 2026',
  mode: 'UPI Netbanking',
  amount: 32500,
  status: 'SUCCESS',
};

const father: StudentGuardian = {
  name: 'Rajesh Reddy',
  relation: 'Father',
  occupation: 'Senior Architect • Studio Vanya',
  email: 'rajesh.reddy@example.com',
  phone: '+919878765432',
  isPrimary: true,
};

const kabir: StudentDetail = {
  id: '1',
  admissionNumber: 'ADM-2026-0009',
  rollNumber: '12',
  fullName: 'Kabir Reddy',
  class: '5',
  section: 'A',
  year: '2026-27',
  status: 'ACTIVE',
  verified: true,
  bloodGroup: 'O+',
  email: 'kabir.reddy.9@verdant.test',
  phone: '+91 95782 42693',
  phoneTag: 'Self / SmartCard',
  dob: '24 Oct 2015',
  age: 11,
  gender: 'Male',
  category: 'General',
  religion: 'Hindu',
  address: '142 Palm Grove Colony, Green Hills, Hyderabad - 500034',
  admissionDate: '12 June 2021',
  rank: '3rd',
  rankNote: 'Top 5% Cohort',
  guardian: father,
  guardians: [
    father,
    {
      name: 'Meera Reddy',
      relation: 'Mother',
      occupation: 'Pediatrician • City Care Clinic',
      email: 'meera.reddy@example.com',
      phone: '+919878765433',
      isPrimary: false,
    },
  ],
  attendance: {
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
  },
  fees: {
    totalDue: 0,
    totalPaid: 65000,
    latestInvoice: invoice,
    history: [
      invoice,
      { ...invoice, receiptNo: 'REC-2026-4120', title: 'Admission & Annual Fee', paidOn: '10 Jun 2026', mode: 'Card', amount: 32500 },
    ],
  },
  documents: [
    { id: 'd1', name: 'Official Birth Certificate', verified: true, icon: 'document-text-outline' },
    { id: 'd2', name: 'Medical Clearance & Vaccines', verified: true, icon: 'medkit-outline' },
    { id: 'd3', name: 'Previous School Transfer Certificate', verified: true, icon: 'id-card-outline' },
  ],
  bank: {
    accountHolder: 'Rajesh Reddy',
    bankName: 'State Bank of India',
    accountNumber: 'XXXX XXXX 4821',
    ifsc: 'SBIN0001234',
    branch: 'Banjara Hills, Hyderabad',
  },
  hostel: {
    isResident: false,
    hostelName: 'Not allotted',
    room: '-',
    warden: 'Mr. S. Kumar',
    wardenPhone: '+919800000001',
    messPlan: 'Day scholar',
  },
  reports: [
    { id: 'r1', type: 'Attendance', range: '01 Sep - 30 Sep 2026', generatedOn: '01 Oct 2026' },
    { id: 'r2', type: 'Academic', range: 'Term 1 2026-27', generatedOn: '28 Sep 2026' },
    { id: 'r3', type: 'Fees', range: 'Apr 2026 - Mar 2027', generatedOn: '15 Aug 2026' },
  ],
};

export interface UseStudentDetailResult {
  data: StudentDetail | null;
  isLoading: boolean;
  /** Not-found / failure shape: null when ok. */
  error: { code: 'NOT_FOUND' | 'UNKNOWN'; message: string } | null;
}

/** Dummy hook; swap the body for the API call later. Returns Kabir for any non-empty id. */
export function useStudentDetail(id: string | undefined): UseStudentDetailResult {
  const [state, setState] = useState<UseStudentDetailResult>({ data: null, isLoading: true, error: null });

  useEffect(() => {
    setState({ data: null, isLoading: true, error: null });
    const t = setTimeout(() => {
      if (!id) {
        setState({ data: null, isLoading: false, error: { code: 'NOT_FOUND', message: 'Student not found' } });
      } else {
        setState({ data: { ...kabir, id }, isLoading: false, error: null });
      }
    }, 450);
    return () => clearTimeout(t);
  }, [id]);

  return state;
}

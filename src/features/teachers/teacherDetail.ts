import { useEffect, useState } from 'react';

export interface TeacherAddress {
  current: string;
  permanent: string;
}

export interface TeacherBankDetails {
  accountHolder: string;
  accountNumber: string;
  bankName: string;
  ifsc: string;
}

export interface TeacherDocument {
  id: string;
  name: string;
  verified: boolean;
}

export type ClassStatus = 'done' | 'live' | 'upcoming';

export interface TodaysClass {
  id: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  section: string;
  room: string;
  status: ClassStatus;
}

export interface Assignment {
  id: string;
  className: string;
  section: string;
  subject: string;
  periodsPerWeek: number;
}

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface TimetablePeriod {
  id: string;
  period: number;
  startTime: string;
  endTime: string;
  subject: string;
  classSection: string;
  room: string;
}

export type AttendanceDayStatus = 'P' | 'A' | 'L' | 'H';

export interface AttendanceSummary {
  monthLabel: string;
  present: number;
  absent: number;
  leave: number;
  percentage: number;
  days: AttendanceDayStatus[];
}

export interface Payslip {
  id: string;
  monthLabel: string;
  gross: number;
  deductions: number;
  net: number;
  status: 'Paid' | 'Pending';
  paidOn: string;
}

export interface TeacherReport {
  id: string;
  title: string;
  summary: string;
  icon: 'calendar-outline' | 'book-outline' | 'time-outline';
}

export interface TeacherDetail {
  id: string;
  staffId: string;
  fullName: string;
  status: 'ACTIVE' | 'INACTIVE';
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
  experienceYears: number;
  qualification: string;
  addressInfo: TeacherAddress;
  bankDetails: TeacherBankDetails;
  documents: TeacherDocument[];
  todaysClasses: TodaysClass[];
  assignments: Assignment[];
  timetable: Record<Weekday, TimetablePeriod[]>;
  attendance: AttendanceSummary;
  payslips: Payslip[];
  reports: TeacherReport[];
  reportRange: string;
}

const period = (
  d: string,
  n: number,
  start: string,
  end: string,
  subject: string,
  classSection: string,
  room: string,
): TimetablePeriod => ({ id: `${d}-${n}`, period: n, startTime: start, endTime: end, subject, classSection, room });

const slots: [string, string][] = [
  ['08:00', '08:45'],
  ['08:50', '09:35'],
  ['09:50', '10:35'],
  ['10:40', '11:25'],
  ['12:10', '12:55'],
];

const day = (d: string, rows: [string, string][]): TimetablePeriod[] =>
  rows.map(([cs, room], i) => period(d, i + 1, slots[i][0], slots[i][1], 'Mathematics', cs, room));

const SAMPLE: TeacherDetail = {
  id: 'sample',
  staffId: 'TCH-0012',
  fullName: 'Anita Sharma',
  status: 'ACTIVE',
  subject: 'Mathematics',
  isClassTeacher: true,
  className: '5',
  section: 'A',
  gender: 'Female',
  dateOfBirth: '14 Mar 1988',
  fathersName: 'Ramesh Sharma',
  mothersName: 'Sunita Sharma',
  maritalStatus: 'Married',
  contractType: 'Permanent',
  shift: 'Morning (8:00 - 2:30)',
  workLocation: 'Main Campus',
  joiningDate: '01 Jun 2018',
  phone: '+91 98765 43210',
  email: 'anita.sharma@verdant.test',
  experienceYears: 8,
  qualification: 'M.Sc Mathematics, B.Ed',
  addressInfo: {
    current: '24 Lotus Residency, Banjara Hills, Hyderabad - 500034',
    permanent: '12 Gandhi Nagar, Jaipur, Rajasthan - 302015',
  },
  bankDetails: {
    accountHolder: 'Anita Sharma',
    accountNumber: 'XXXXXXXX4821',
    bankName: 'State Bank of India',
    ifsc: 'SBIN0001234',
  },
  documents: [
    { id: 'd1', name: 'Aadhaar Card', verified: true },
    { id: 'd2', name: 'PAN Card', verified: true },
    { id: 'd3', name: 'B.Ed Degree Certificate', verified: true },
    { id: 'd4', name: 'Experience Letter', verified: false },
  ],
  todaysClasses: [
    { id: 'c1', startTime: '08:00', endTime: '08:45', subject: 'Mathematics', className: '5', section: 'A', room: 'Room 101', status: 'done' },
    { id: 'c2', startTime: '08:50', endTime: '09:35', subject: 'Mathematics', className: '6', section: 'B', room: 'Room 204', status: 'done' },
    { id: 'c3', startTime: '09:50', endTime: '10:35', subject: 'Mathematics', className: '7', section: 'A', room: 'Room 207', status: 'live' },
    { id: 'c4', startTime: '10:40', endTime: '11:25', subject: 'Mathematics', className: '8', section: 'C', room: 'Room 112', status: 'upcoming' },
    { id: 'c5', startTime: '12:10', endTime: '12:55', subject: 'Mathematics', className: '5', section: 'A', room: 'Room 101', status: 'upcoming' },
  ],
  assignments: [
    { id: 'a1', className: '5', section: 'A', subject: 'Mathematics', periodsPerWeek: 6 },
    { id: 'a2', className: '6', section: 'B', subject: 'Mathematics', periodsPerWeek: 5 },
    { id: 'a3', className: '7', section: 'A', subject: 'Mathematics', periodsPerWeek: 5 },
    { id: 'a4', className: '8', section: 'C', subject: 'Mathematics', periodsPerWeek: 5 },
    { id: 'a5', className: '5', section: 'B', subject: 'Mental Maths', periodsPerWeek: 2 },
  ],
  timetable: {
    Mon: day('Mon', [['5-A', 'Room 101'], ['6-B', 'Room 204'], ['7-A', 'Room 207'], ['8-C', 'Room 112'], ['5-A', 'Room 101']]),
    Tue: day('Tue', [['6-B', 'Room 204'], ['5-A', 'Room 101'], ['8-C', 'Room 112'], ['7-A', 'Room 207']]),
    Wed: day('Wed', [['7-A', 'Room 207'], ['8-C', 'Room 112'], ['5-A', 'Room 101'], ['6-B', 'Room 204']]),
    Thu: day('Thu', [['5-A', 'Room 101'], ['7-A', 'Room 207'], ['6-B', 'Room 204'], ['8-C', 'Room 112'], ['5-B', 'Room 103']]),
    Fri: day('Fri', [['8-C', 'Room 112'], ['6-B', 'Room 204'], ['5-A', 'Room 101'], ['7-A', 'Room 207']]),
    Sat: day('Sat', [['5-A', 'Room 101'], ['5-B', 'Room 103'], ['6-B', 'Room 204']]),
  },
  attendance: {
    monthLabel: 'October 2026',
    present: 21,
    absent: 1,
    leave: 1,
    percentage: 95.5,
    days: [
      'P', 'P', 'P', 'P', 'P', 'H',
      'P', 'P', 'A', 'P', 'P', 'P',
      'H', 'P', 'P', 'P', 'L', 'P',
      'P', 'H', 'P', 'P', 'P', 'P',
      'P', 'P', 'H', 'P', 'P', 'P',
    ],
  },
  payslips: [
    { id: 'p1', monthLabel: 'September 2026', gross: 62000, deductions: 7250, net: 54750, status: 'Paid', paidOn: '30 Sep 2026' },
    { id: 'p2', monthLabel: 'August 2026', gross: 62000, deductions: 7250, net: 54750, status: 'Paid', paidOn: '31 Aug 2026' },
    { id: 'p3', monthLabel: 'July 2026', gross: 61000, deductions: 7100, net: 53900, status: 'Paid', paidOn: '31 Jul 2026' },
  ],
  reports: [
    { id: 'r1', title: 'Attendance Report', summary: '95.5% average, 1 absence', icon: 'calendar-outline' },
    { id: 'r2', title: 'Homework Report', summary: '42 assigned, 96% reviewed on time', icon: 'book-outline' },
    { id: 'r3', title: 'Workload Report', summary: '23 periods per week across 4 classes', icon: 'time-outline' },
  ],
  reportRange: 'Last 30 days',
};

export interface UseTeacherDetailResult {
  data: TeacherDetail | null;
  isLoading: boolean;
  error: Error | null;
}

/** Dummy hook; swap the body for the real API call later. Same teacher for any id. */
export function useTeacherDetail(id: string | undefined): UseTeacherDetailResult {
  const [state, setState] = useState<UseTeacherDetailResult>({ data: null, isLoading: true, error: null });

  useEffect(() => {
    setState({ data: null, isLoading: true, error: null });
    const t = setTimeout(() => {
      if (!id) {
        setState({ data: null, isLoading: false, error: new Error('Teacher not found') });
        return;
      }
      setState({ data: { ...SAMPLE, id }, isLoading: false, error: null });
    }, 400);
    return () => clearTimeout(t);
  }, [id]);

  return state;
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

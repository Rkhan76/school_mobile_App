import { useCallback, useState } from 'react';

export type Tone = 'success' | 'danger' | 'warning' | 'neutral' | 'primary';

export interface HeroData {
  institution: string;
  subtitle: string;
  studentsPresent: number;
  studentsTotal: number;
  pendingLeaves: number;
}

export interface StatItem {
  id: string;
  icon: 'people' | 'school' | 'wallet' | 'checkmark-circle';
  value: string;
  label: string;
  caption: string;
  trend: string;
  trendUp: boolean;
  spark: number[];
}

export interface AttendanceData {
  enrolled: number;
  rate: number;
  status: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
}

export interface CashflowData {
  academicYear: string;
  avgCollectedPct: number;
  received: number;
  receivedStudents: number;
  pending: number;
  pendingInvoices: number;
  receivedBars: number[];
  pendingBars: number[];
}

export interface Notice {
  id: string;
  author: string;
  tag: string;
  tagTone: Tone;
  date: string;
  body: string;
}

export interface LeaveRequest {
  id: string;
  name: string;
  role: string;
  days: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Milestone {
  id: string;
  month: string;
  day: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeTone: Tone;
}

export interface DashboardData {
  academicYear: string;
  hasUnread: boolean;
  hero: HeroData;
  stats: StatItem[];
  attendance: AttendanceData;
  cashflow: CashflowData;
  activeNotices: number;
  notices: Notice[];
  pendingLeaveCount: number;
  leaves: LeaveRequest[];
  milestones: Milestone[];
}

export const mockDashboard: DashboardData = {
  academicYear: '26-27',
  hasUnread: true,
  hero: {
    institution: 'Oakwood Academy',
    subtitle: 'Campus Hub',
    studentsPresent: 470,
    studentsTotal: 500,
    pendingLeaves: 5,
  },
  stats: [
    { id: 'students', icon: 'people', value: '1,245', label: 'Total Students', caption: '+28 this month', trend: '+4.5%', trendUp: true, spark: [8, 9, 9, 11, 10, 12, 13, 15] },
    { id: 'teachers', icon: 'school', value: '56', label: 'Total Teachers', caption: '4 new semester', trend: '+2.1%', trendUp: true, spark: [10, 10, 11, 11, 12, 12, 13, 13] },
    { id: 'fees', icon: 'wallet', value: '₹5.31L', label: 'Fee Collection', caption: '₹4.2L collected', trend: '+8.2%', trendUp: true, spark: [4, 6, 5, 8, 9, 8, 12, 14] },
    { id: 'attendance', icon: 'checkmark-circle', value: '94%', label: 'Attendance Rate', caption: '470 present today', trend: '+1.2%', trendUp: true, spark: [12, 11, 13, 12, 14, 13, 14, 15] },
  ],
  attendance: { enrolled: 500, rate: 94, status: 'Optimal', present: 470, absent: 20, late: 8, halfDay: 2 },
  cashflow: {
    academicYear: '2026–27',
    avgCollectedPct: 72,
    received: 1250000,
    receivedStudents: 842,
    pending: 375000,
    pendingInvoices: 158,
    receivedBars: [4, 6, 5, 8, 7, 10, 9, 12],
    pendingBars: [9, 7, 8, 6, 7, 5, 6, 4],
  },
  activeNotices: 4,
  notices: [
    { id: 'n1', author: 'Admin Office', tag: 'Important', tagTone: 'warning', date: '25/01/2026', body: 'Annual sports day scheduled for 20 May. All student houses must finalize their relay rosters.' },
    { id: 'n2', author: 'Kathryn Murphy', tag: 'Meeting', tagTone: 'primary', date: '24/01/2026', body: 'Parent-teacher conference rescheduled to next Friday at 4:00 PM in the botanical auditorium.' },
  ],
  pendingLeaveCount: 5,
  leaves: [
    { id: 'l1', name: 'Darlene Robertson', role: 'English Teacher', days: 3, status: 'Pending' },
    { id: 'l2', name: 'Esther Howard', role: 'Math Teacher', days: 2, status: 'Approved' },
  ],
  milestones: [
    { id: 'm1', month: 'MAY', day: '18', title: 'Class X Board Exam', subtitle: 'Mathematics • Hall A & B', badge: '3d left', badgeTone: 'danger' },
    { id: 'm2', month: 'MAY', day: '20', title: 'Morning Assembly Kickoff', subtitle: '09:00 - 09:45 AM • All Faculty', badge: 'Upcoming', badgeTone: 'primary' },
  ],
};

/** Swap the body for a real API call (e.g. react-query) later; the return shape stays the same. */
export function useDashboardData(): {
  data: DashboardData;
  refreshing: boolean;
  refresh: () => void;
} {
  const [data] = useState<DashboardData>(mockDashboard);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);
  return { data, refreshing, refresh };
}

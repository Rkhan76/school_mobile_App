import type { ChartType, DomainKey, KpiFormat, ReportCapabilities } from './types';

export interface KpiSpec {
  label: string;
  series: number;
  agg: 'sum' | 'avg' | 'max' | 'last' | 'ratio';
  /** denominator series for ratio */
  den?: number;
  format: KpiFormat;
  lowerIsBetter?: boolean;
}

/** Declarative description the mock generator turns into a ReportResponse. */
export interface GenSpec {
  chart: ChartType;
  chartTitle: string;
  series: string[];
  colors?: string[];
  /** 'period' follows the Group by filter, otherwise fixed category labels */
  cats: 'period' | string[];
  /** [min,max] per series */
  ranges: [number, number][];
  unit: KpiFormat;
  kpis: KpiSpec[];
  /** show a total column in the table (stacked) */
  totalColumn?: boolean;
}

export interface ReportDef {
  key: string;
  title: string;
  description: string;
  caps: ReportCapabilities;
  spec: GenSpec;
}

export interface DomainDef { key: DomainKey; label: string; reports: ReportDef[] }

const TIME: ReportCapabilities = {
  dateRange: true, academicYear: true, classFilter: true, section: true, groupBy: true, compare: true,
};
const SNAP: ReportCapabilities = {
  dateRange: false, academicYear: true, classFilter: true, section: true, groupBy: false, compare: true,
};
const RANGE_ONLY: ReportCapabilities = {
  dateRange: true, academicYear: true, classFilter: false, section: false, groupBy: false, compare: true,
};

const CLASSES = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];

const sum = (label: string, series: number, format: KpiFormat, lowerIsBetter?: boolean): KpiSpec => ({ label, series, agg: 'sum', format, lowerIsBetter });
const agg = (label: string, series: number, a: KpiSpec['agg'], format: KpiFormat, lowerIsBetter?: boolean): KpiSpec => ({ label, series, agg: a, format, lowerIsBetter });
const ratio = (label: string, series: number, den: number, lowerIsBetter?: boolean): KpiSpec => ({ label, series, agg: 'ratio', den, format: 'percent', lowerIsBetter });

export const DOMAINS: DomainDef[] = [
  {
    key: 'admissions', label: 'Admissions',
    reports: [
      {
        key: 'admissions-trend', title: 'Admissions Trend', caps: TIME,
        description: 'Applications received versus students enrolled over time. Conversion rate = enrolled / applications.',
        spec: {
          chart: 'area', chartTitle: 'Applications vs enrolled', series: ['Applications', 'Enrolled'], cats: 'period',
          ranges: [[0, 75], [0, 0]], unit: 'number',
          kpis: [sum('Applications', 0, 'number'), sum('Enrolled', 1, 'number'), sum('Rejected', 1, 'number', true), ratio('Conversion rate', 1, 0)],
        },
      },
      {
        key: 'admission-funnel', title: 'Admission Funnel', caps: { ...TIME, groupBy: false },
        description: 'Number of applicants at each stage of the admission pipeline.',
        spec: {
          chart: 'hbar', chartTitle: 'Applicants per stage', series: ['Applicants'],
          cats: ['Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Enrolled'],
          ranges: [[20, 300]], unit: 'number',
          kpis: [agg('Applied', 0, 'max', 'number'), agg('Enrolled', 0, 'last', 'number'), sum('Total across stages', 0, 'number'), ratio('Share enrolled', 0, 0)],
        },
      },
      {
        key: 'class-wise-admissions', title: 'Class-wise Admissions', caps: { ...TIME, classFilter: false, section: false, groupBy: false },
        description: 'Admissions received for each class.',
        spec: {
          chart: 'bar', chartTitle: 'Admissions by class', series: ['Applications', 'Enrolled'], cats: CLASSES.slice(0, 9),
          ranges: [[8, 60], [2, 40]], unit: 'number',
          kpis: [sum('Applications', 0, 'number'), sum('Enrolled', 1, 'number'), agg('Top class', 0, 'max', 'number'), ratio('Conversion rate', 1, 0)],
        },
      },
      {
        key: 'admission-breakdown', title: 'Admission Breakdown', caps: { ...TIME, groupBy: false },
        description: 'Applications split by status.',
        spec: {
          chart: 'donut', chartTitle: 'By status', series: ['Applications'], cats: ['Pending', 'Approved', 'Enrolled', 'Rejected'],
          ranges: [[5, 80]], unit: 'number',
          kpis: [sum('Total', 0, 'number'), agg('Largest group', 0, 'max', 'number'), agg('Smallest group', 0, 'last', 'number'), ratio('Share pending', 0, 0)],
        },
      },
      {
        key: 'admissions-yoy', title: 'Admissions Year on Year', caps: { ...TIME, academicYear: false, groupBy: false },
        description: 'Monthly applications compared across the last two academic years.',
        spec: {
          chart: 'line', chartTitle: 'Applications by month', series: ['2025-26', '2026-27'],
          cats: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
          ranges: [[10, 90], [0, 75]], unit: 'number',
          kpis: [sum('2025-26', 0, 'number'), sum('2026-27', 1, 'number'), agg('Peak 2025-26', 0, 'max', 'number'), agg('Peak 2026-27', 1, 'max', 'number')],
        },
      },
    ],
  },
  {
    key: 'students', label: 'Students',
    reports: [
      {
        key: 'strength-by-class', title: 'Strength by Class', caps: SNAP,
        description: 'Current student strength for each class.',
        spec: {
          chart: 'bar', chartTitle: 'Students per class', series: ['Boys', 'Girls'], cats: CLASSES, ranges: [[14, 34], [12, 32]], unit: 'number', totalColumn: true,
          kpis: [sum('Boys', 0, 'number'), sum('Girls', 1, 'number'), agg('Largest class', 0, 'max', 'number'), ratio('Girls ratio', 1, 0)],
        },
      },
      {
        key: 'gender-mix', title: 'Gender Mix', caps: SNAP,
        description: 'Gender composition of the student body.',
        spec: {
          chart: 'donut', chartTitle: 'Gender mix', series: ['Students'], cats: ['Boys', 'Girls', 'Other'], ranges: [[2, 260]], unit: 'number',
          kpis: [sum('Total', 0, 'number'), agg('Largest group', 0, 'max', 'number'), agg('Smallest group', 0, 'last', 'number'), ratio('Boys share', 0, 0)],
        },
      },
      {
        key: 'new-vs-left', title: 'New vs Left', caps: TIME,
        description: 'New admissions versus students who left the school.',
        spec: {
          chart: 'bar', chartTitle: 'New vs left', series: ['New', 'Left'], colors: ['#16a34a', '#dc2626'], cats: 'period', ranges: [[4, 40], [0, 14]], unit: 'number',
          kpis: [sum('New students', 0, 'number'), sum('Left', 1, 'number', true), agg('Peak new', 0, 'max', 'number'), ratio('Attrition', 1, 0, true)],
        },
      },
    ],
  },
  {
    key: 'fees', label: 'Fees',
    reports: [
      {
        key: 'collection-trend', title: 'Collection Trend', caps: { ...TIME, threshold: 'Min amount' },
        description: 'Fee collected versus billed over time.',
        spec: {
          chart: 'area', chartTitle: 'Billed vs collected', series: ['Billed', 'Collected'], cats: 'period', ranges: [[380000, 620000], [250000, 560000]], unit: 'currency',
          kpis: [sum('Billed', 0, 'currency'), sum('Collected', 1, 'currency'), agg('Latest billed', 0, 'last', 'currency'), ratio('Collection rate', 1, 0)],
        },
      },
      {
        key: 'dues-aging', title: 'Dues Aging', caps: { ...SNAP, threshold: 'Min amount' },
        description: 'Outstanding dues grouped by how long they have been overdue.',
        spec: {
          chart: 'bar', chartTitle: 'Dues by age bucket', series: ['Dues'], colors: ['#d97706'], cats: ['0-30 days', '31-60 days', '61-90 days', '90+ days'], ranges: [[40000, 380000]], unit: 'currency',
          kpis: [sum('Total dues', 0, 'currency', true), agg('Largest bucket', 0, 'max', 'currency', true), agg('Average bucket', 0, 'avg', 'currency', true), ratio('Share 0-30 days', 0, 0, true)],
        },
      },
      {
        key: 'defaulters', title: 'Defaulters', caps: { ...SNAP, threshold: 'Min dues' },
        description: 'Classes with the highest outstanding fee balances.',
        spec: {
          chart: 'hbar', chartTitle: 'Dues by class', series: ['Dues'], colors: ['#dc2626'], cats: CLASSES.slice(0, 8), ranges: [[15000, 210000]], unit: 'currency',
          kpis: [sum('Total dues', 0, 'currency', true), agg('Highest class', 0, 'max', 'currency', true), agg('Average', 0, 'avg', 'currency', true), ratio('Share Nursery', 0, 0, true)],
        },
      },
      {
        key: 'fee-head-breakdown', title: 'Fee Head Breakdown', caps: { ...TIME, groupBy: false },
        description: 'Collection by fee head.',
        spec: {
          chart: 'donut', chartTitle: 'By fee head', series: ['Collected'], cats: ['Tuition', 'Transport', 'Admission', 'Exam', 'Activity'], ranges: [[40000, 900000]], unit: 'currency',
          kpis: [sum('Total collected', 0, 'currency'), agg('Top head', 0, 'max', 'currency'), agg('Average', 0, 'avg', 'currency'), ratio('Tuition share', 0, 0)],
        },
      },
    ],
  },
  {
    key: 'finance', label: 'Finance',
    reports: [
      {
        key: 'income-vs-expense', title: 'Income vs Expense', caps: { ...TIME, classFilter: false, section: false },
        description: 'Income and expense with net surplus.',
        spec: {
          chart: 'bar', chartTitle: 'Income vs expense', series: ['Income', 'Expense'], colors: ['#16a34a', '#f97316'], cats: 'period', ranges: [[450000, 780000], [300000, 640000]], unit: 'currency',
          kpis: [sum('Income', 0, 'currency'), sum('Expense', 1, 'currency', true), agg('Peak income', 0, 'max', 'currency'), ratio('Expense ratio', 1, 0, true)],
        },
      },
      {
        key: 'cash-book-summary', title: 'Cash Book Summary', caps: { ...RANGE_ONLY, groupBy: true },
        description: 'Cash receipts and payments from the cash book.',
        spec: {
          chart: 'line', chartTitle: 'Receipts and payments', series: ['Receipts', 'Payments'], cats: 'period', ranges: [[200000, 520000], [150000, 480000]], unit: 'currency',
          kpis: [sum('Receipts', 0, 'currency'), sum('Payments', 1, 'currency', true), agg('Latest receipts', 0, 'last', 'currency'), ratio('Payout ratio', 1, 0, true)],
        },
      },
    ],
  },
  {
    key: 'attendance', label: 'Attendance',
    reports: [
      {
        key: 'daily-attendance', title: 'Daily Attendance', caps: { ...TIME, groupBy: false },
        description: 'Student attendance percentage per day.',
        spec: {
          chart: 'line', chartTitle: 'Attendance %', series: ['Present %'], cats: 'period', ranges: [[84, 98]], unit: 'percent',
          kpis: [agg('Average', 0, 'avg', 'percent'), agg('Best day', 0, 'max', 'percent'), agg('Latest', 0, 'last', 'percent'), agg('Days counted', 0, 'sum', 'number')],
        },
      },
      {
        key: 'class-wise-attendance', title: 'Class-wise Attendance', caps: { ...TIME, classFilter: false, section: false, groupBy: false },
        description: 'Average attendance for every class.',
        spec: {
          chart: 'hbar', chartTitle: 'Attendance % by class', series: ['Present %'], cats: CLASSES.slice(0, 9), ranges: [[82, 98]], unit: 'percent',
          kpis: [agg('Average', 0, 'avg', 'percent'), agg('Best class', 0, 'max', 'percent'), agg('Lowest class', 0, 'last', 'percent'), agg('Classes', 0, 'sum', 'number')],
        },
      },
      {
        key: 'low-attendance', title: 'Low Attendance', caps: { ...SNAP, threshold: 'Below (%)' },
        description: 'Number of students below the attendance threshold, by class.',
        spec: {
          chart: 'bar', chartTitle: 'Students below threshold', series: ['Students'], colors: ['#dc2626'], cats: CLASSES.slice(0, 9), ranges: [[0, 12]], unit: 'number',
          kpis: [sum('Students flagged', 0, 'number', true), agg('Worst class', 0, 'max', 'number', true), agg('Average / class', 0, 'avg', 'number', true), ratio('Share Nursery', 0, 0, true)],
        },
      },
    ],
  },
  {
    key: 'hr', label: 'HR / Staff',
    reports: [
      {
        key: 'staff-attendance', title: 'Staff Attendance', caps: { ...RANGE_ONLY, groupBy: true },
        description: 'Present, absent and on-leave staff over time.',
        spec: {
          chart: 'stackedBar', chartTitle: 'Staff status', series: ['Present', 'On leave', 'Absent'], colors: ['#16a34a', '#d97706', '#dc2626'], cats: 'period', ranges: [[38, 48], [1, 6], [0, 4]], unit: 'number', totalColumn: true,
          kpis: [agg('Avg present', 0, 'avg', 'number'), agg('Avg on leave', 1, 'avg', 'number'), agg('Avg absent', 2, 'avg', 'number', true), ratio('Absence rate', 2, 0, true)],
        },
      },
      {
        key: 'leave-summary', title: 'Leave Summary', caps: RANGE_ONLY,
        description: 'Leave days taken by type.',
        spec: {
          chart: 'donut', chartTitle: 'Leave by type', series: ['Days'], cats: ['Casual', 'Sick', 'Earned', 'Maternity', 'Unpaid'], ranges: [[6, 120]], unit: 'number',
          kpis: [sum('Total days', 0, 'number'), agg('Top type', 0, 'max', 'number'), agg('Average', 0, 'avg', 'number'), ratio('Casual share', 0, 0)],
        },
      },
      {
        key: 'payroll-summary', title: 'Payroll Summary', caps: { ...RANGE_ONLY, groupBy: true, threshold: 'Min net pay' },
        description: 'Net pay and deductions.',
        spec: {
          chart: 'stackedBar', chartTitle: 'Net pay and deductions', series: ['Net pay', 'Deductions'], colors: ['#25a194', '#f97316'], cats: 'period', ranges: [[820000, 920000], [110000, 160000]], unit: 'currency', totalColumn: true,
          kpis: [sum('Net pay', 0, 'currency'), sum('Deductions', 1, 'currency', true), agg('Peak net pay', 0, 'max', 'currency'), ratio('Deduction rate', 1, 0, true)],
        },
      },
    ],
  },
  {
    key: 'academics', label: 'Academics',
    reports: [
      {
        key: 'exam-results', title: 'Exam Results', caps: SNAP,
        description: 'Pass and fail counts by class.',
        spec: {
          chart: 'stackedBar', chartTitle: 'Pass vs fail', series: ['Passed', 'Failed'], colors: ['#16a34a', '#dc2626'], cats: CLASSES.slice(3, 11), ranges: [[24, 36], [0, 6]], unit: 'number', totalColumn: true,
          kpis: [sum('Passed', 0, 'number'), sum('Failed', 1, 'number', true), agg('Best class', 0, 'max', 'number'), ratio('Fail rate', 1, 0, true)],
        },
      },
      {
        key: 'subject-performance', title: 'Subject Performance', caps: SNAP,
        description: 'Average marks percentage per subject.',
        spec: {
          chart: 'hbar', chartTitle: 'Average % by subject', series: ['Average %'], cats: ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer'], ranges: [[58, 88]], unit: 'percent',
          kpis: [agg('Overall average', 0, 'avg', 'percent'), agg('Best subject', 0, 'max', 'percent'), agg('Lowest subject', 0, 'last', 'percent'), agg('Subjects', 0, 'sum', 'number')],
        },
      },
      {
        key: 'grade-distribution', title: 'Grade Distribution', caps: SNAP,
        description: 'Students per grade band.',
        spec: {
          chart: 'donut', chartTitle: 'Grades', series: ['Students'], cats: ['A+', 'A', 'B', 'C', 'D'], ranges: [[10, 140]], unit: 'number',
          kpis: [sum('Students graded', 0, 'number'), agg('Largest band', 0, 'max', 'number'), agg('Average / band', 0, 'avg', 'number'), ratio('Share A+', 0, 0)],
        },
      },
    ],
  },
  {
    key: 'operations', label: 'Operations',
    reports: [
      {
        key: 'transport-utilisation', title: 'Transport Utilisation', caps: { ...SNAP, classFilter: false, section: false },
        description: 'Seats used versus capacity for each bus route.',
        spec: {
          chart: 'bar', chartTitle: 'Seats per route', series: ['Capacity', 'Used'], cats: ['Route 1', 'Route 2', 'Route 3', 'Route 4', 'Route 5', 'Route 6'], ranges: [[40, 50], [18, 46]], unit: 'number',
          kpis: [sum('Capacity', 0, 'number'), sum('Seats used', 1, 'number'), agg('Fullest route', 1, 'max', 'number'), ratio('Utilisation', 1, 0)],
        },
      },
      {
        key: 'document-compliance', title: 'Document Compliance', caps: { ...SNAP, compare: false },
        description: 'Document status for students and staff.',
        spec: {
          chart: 'donut', chartTitle: 'Document status', series: ['Records'], colors: ['#16a34a', '#d97706', '#dc2626', '#94a3a1'], cats: ['Complete', 'Pending', 'Expired', 'Missing'], ranges: [[8, 300]], unit: 'number',
          kpis: [sum('Records', 0, 'number'), agg('Largest group', 0, 'max', 'number'), agg('Smallest group', 0, 'last', 'number', true), ratio('Complete', 0, 0)],
        },
      },
    ],
  },
];

export function findDomain(key: DomainKey): DomainDef {
  return DOMAINS.find((d) => d.key === key) ?? DOMAINS[0];
}
export function findReport(domain: DomainKey, key: string): ReportDef {
  const d = findDomain(domain);
  return d.reports.find((r) => r.key === key) ?? d.reports[0];
}

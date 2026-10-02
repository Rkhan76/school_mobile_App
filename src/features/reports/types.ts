export type Granularity = 'day' | 'week' | 'month' | 'year';
export type RangePreset = 'any' | 'today' | 'week' | 'month' | 'year' | 'custom';
/** Matches the backend kpi/table `type` field 1:1 (`text|number|currency|percent|date`). */
export type KpiFormat = 'number' | 'percent' | 'currency' | 'text' | 'date';
export type ChartType = 'line' | 'area' | 'bar' | 'stackedBar' | 'hbar' | 'donut';
export type DomainKey =
  | 'admissions' | 'students' | 'fees' | 'finance' | 'attendance' | 'hr' | 'academics' | 'operations';

export interface ReportFilters {
  preset: RangePreset;
  /** dd/mm/yyyy, only used when preset is 'custom' */
  from: string;
  to: string;
  academicYear: string;
  classId: string;
  section: string;
  groupBy: Granularity;
  compare: boolean;
  /** min amount / threshold, free text number */
  minAmount: string;
}

export const DEFAULT_FILTERS: ReportFilters = {
  preset: 'any', from: '', to: '', academicYear: '', classId: '', section: '',
  groupBy: 'month', compare: false, minAmount: '',
};

export interface ReportCapabilities {
  dateRange: boolean;
  academicYear: boolean;
  classFilter: boolean;
  section: boolean;
  groupBy: boolean;
  compare: boolean;
  /** label of a min amount / threshold filter, when relevant */
  threshold?: string;
}

export interface ReportKpi {
  /** stable id from the backend, when present — falls back to `label` for list keys */
  key?: string;
  label: string;
  value: number | string;
  /** percent change (or percentage points for percent KPIs) vs previous period */
  delta?: number;
  deltaDirection?: 'up' | 'down' | 'flat';
  lowerIsBetter?: boolean;
  format: KpiFormat;
}

export interface ChartSeries { name: string; data: number[]; color?: string }

export interface ReportChart {
  type: ChartType;
  title: string;
  series: ChartSeries[];
  categories: string[];
}

export interface TableColumn { key: string; label: string; format?: KpiFormat; align?: 'left' | 'right' }
export interface ReportTable {
  columns: TableColumn[];
  rows: Record<string, string | number>[];
  /** real row count on the server; `rows` is capped (usually 100) — use export for the rest */
  totalRows?: number;
}

export interface ReportResponse {
  key: string;
  title: string;
  description: string;
  generatedAt: string;
  filters: ReportFilters;
  kpis: ReportKpi[];
  charts: ReportChart[];
  table?: ReportTable;
  insights?: string[];
}

export class ReportError extends Error {
  status: number;
  /** e.g. `FEATURE_NOT_IN_PLAN` — check this to show an upgrade prompt instead of a generic error */
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type MockMode = 'none' | 'empty' | 'error' | 'forbidden' | 'ratelimit';

// ---- Admin dashboard (GET /admin-dashboard/stats) — bespoke shape, not the report envelope ----

export interface AdminDashboardHeader {
  date: string;
  studentsPresentToday: number;
  totalStudents: number;
  pendingLeaveRequests: number;
}

export interface AdminDashboardOverview {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  feeCollectedThisMonth: number;
  pendingFeeTotal: number;
  attendanceRateToday: number;
}

export interface AdminDashboardAttendance {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export interface AdminDashboardIncomeExpensePoint {
  month: string;
  income: number;
  expense: number;
}

export interface AdminDashboardStats {
  header: AdminDashboardHeader;
  overview: AdminDashboardOverview;
  todaysAttendance: AdminDashboardAttendance;
  /** raw numbers, last 9 months — NOT pre-shaped like reports[].charts; build the chart yourself */
  incomeVsExpense: AdminDashboardIncomeExpensePoint[];
  classDistribution: Record<string, unknown>[];
  newAdmissions: { total: number; byClass: Record<string, unknown> };
  topStudents: unknown[];
  noticeBoard: unknown[];
  leaveRequests: unknown[];
  upcomingExams: unknown[];
  upcomingEvents: unknown[];
}

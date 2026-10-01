export type Granularity = 'day' | 'week' | 'month' | 'year';
export type RangePreset = 'any' | 'today' | 'week' | 'month' | 'year' | 'custom';
export type KpiFormat = 'number' | 'percent' | 'currency' | 'text';
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
export interface ReportTable { columns: TableColumn[]; rows: Record<string, string | number>[] }

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
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type MockMode = 'none' | 'empty' | 'error' | 'forbidden' | 'ratelimit';

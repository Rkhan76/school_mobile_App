import { API_BASE_URL } from '../../config';
import { ApiError, apiRequest, getAccessToken } from '../../lib/apiClient';
import { findReport } from './registry';
import {
  DEFAULT_FILTERS,
  ReportError,
  type AdminDashboardStats,
  type ChartSeries,
  type ChartType,
  type DomainKey,
  type Granularity,
  type KpiFormat,
  type ReportChart,
  type ReportFilters,
  type ReportKpi,
  type ReportResponse,
  type ReportTable,
} from './types';

// ---------------------------------------------------------------------------
// Backend envelope (MOBILE_API_DOCS.md §14) — row-oriented charts, `type`
// instead of `format`, `previousValue`/`changePercent` instead of delta.
// Adapted below into the existing column-oriented ReportResponse shape so
// ReportView.tsx / charts.tsx need no changes.
// ---------------------------------------------------------------------------

interface BackendKpi {
  key?: string;
  label: string;
  value: number | string;
  type: KpiFormat;
  previousValue?: number | string;
  changePercent?: number;
}

type BackendChartType = 'line' | 'area' | 'bar' | 'horizontal-bar' | 'stacked-bar' | 'pie' | 'donut';

interface BackendChart {
  key?: string;
  title: string;
  type: BackendChartType;
  xKey: string;
  series: { key: string; label: string }[];
  data: Record<string, string | number>[];
}

interface BackendTableColumn { key: string; label: string; type?: KpiFormat }
interface BackendTable { columns: BackendTableColumn[]; rows: Record<string, string | number>[]; totalRows?: number }

interface BackendReportEnvelope {
  key: string;
  title: string;
  description: string;
  generatedAt: string;
  filters?: Record<string, unknown>;
  kpis?: BackendKpi[];
  charts?: BackendChart[];
  table?: BackendTable;
  insights?: string[];
}

function mapChartType(t: BackendChartType): ChartType {
  switch (t) {
    case 'horizontal-bar': return 'hbar';
    case 'stacked-bar': return 'stackedBar';
    case 'pie': return 'donut';
    default: return t;
  }
}

function adaptKpi(k: BackendKpi): ReportKpi {
  const out: ReportKpi = { key: k.key, label: k.label, value: k.value, format: k.type ?? 'number' };
  if (typeof k.changePercent === 'number' && Number.isFinite(k.changePercent)) {
    out.delta = Math.round(k.changePercent * 10) / 10;
    out.deltaDirection = out.delta > 0.05 ? 'up' : out.delta < -0.05 ? 'down' : 'flat';
  }
  return out;
}

/** Donut/pie series are "one slice per category" in the UI (see mockReports.ts), not column series. */
function adaptChart(c: BackendChart): ReportChart {
  const type = mapChartType(c.type);
  const valueKey = c.series[0]?.key;
  if (type === 'donut') {
    const series: ChartSeries[] = c.data.map((row) => ({
      name: String(row[c.xKey] ?? ''),
      data: [Number(row[valueKey ?? ''] ?? 0) || 0],
    }));
    return { type, title: c.title, series, categories: [] };
  }
  const categories = c.data.map((row) => String(row[c.xKey] ?? ''));
  const series: ChartSeries[] = c.series.map((s) => ({
    name: s.label,
    data: c.data.map((row) => Number(row[s.key] ?? 0) || 0),
  }));
  return { type, title: c.title, series, categories };
}

function adaptTable(t: BackendTable | undefined): ReportTable | undefined {
  if (!t) return undefined;
  return {
    totalRows: t.totalRows,
    rows: t.rows,
    columns: t.columns.map((c) => ({
      key: c.key,
      label: c.label,
      format: c.type ?? 'text',
      align: c.type && c.type !== 'text' && c.type !== 'date' ? 'right' : 'left',
    })),
  };
}

function adaptReportResponse(raw: BackendReportEnvelope, filters: ReportFilters): ReportResponse {
  return {
    key: raw.key,
    title: raw.title,
    description: raw.description,
    generatedAt: raw.generatedAt,
    filters,
    kpis: (raw.kpis ?? []).map(adaptKpi),
    charts: (raw.charts ?? []).map(adaptChart),
    table: adaptTable(raw.table),
    insights: raw.insights,
  };
}

function toReportError(err: unknown): ReportError {
  if (err instanceof ReportError) return err;
  if (err instanceof ApiError) {
    const body = err.body as { code?: string; message?: string } | undefined;
    return new ReportError(err.statusCode, body?.message ?? err.message ?? 'Request failed', body?.code);
  }
  if (err instanceof Error) return new ReportError(0, err.message);
  return new ReportError(0, 'Something went wrong while generating the report.');
}

// ---------------------------------------------------------------------------
// Route table: frontend (domain, reportKey) -> backend (module, route[, extra
// query param]). The registry's report keys/domains were designed before the
// real backend routes were known, so names don't always match 1:1 — mapped
// here by closest description match against MOBILE_API_DOCS.md §14's route
// tables. A couple of notes:
//  - "staff-attendance" lives under the Attendance module server-side
//    (report.attendance permission), even though it's grouped under the HR
//    domain in this app's UI.
//  - "payroll-summary" maps to Finance's `salary-cost`.
//  - Only routes the docs list an extra param for (`low-attendance`,
//    `defaulters`) forward one — the backend validator rejects unknown
//    params, so a report's "Min amount" filter is intentionally NOT sent
//    when its mapped route doesn't accept it.
// ---------------------------------------------------------------------------

type ExtraParam = 'threshold' | 'minAmount';
interface RouteSpec { module: string; route: string; extraParam?: ExtraParam }

const ROUTES: Record<DomainKey, Record<string, RouteSpec>> = {
  admissions: {
    'admissions-trend': { module: 'admissions', route: 'trend' },
    'admission-funnel': { module: 'admissions', route: 'funnel' },
    'class-wise-admissions': { module: 'admissions', route: 'class-wise' },
    'admission-breakdown': { module: 'admissions', route: 'breakdown' },
    'admissions-yoy': { module: 'admissions', route: 'year-on-year' },
  },
  students: {
    'strength-by-class': { module: 'students', route: 'strength' },
    'gender-mix': { module: 'students', route: 'demographics' },
    'new-vs-left': { module: 'students', route: 'new-vs-continuing' },
  },
  fees: {
    'collection-trend': { module: 'fees', route: 'collection-trend' },
    'dues-aging': { module: 'fees', route: 'defaulters', extraParam: 'minAmount' },
    defaulters: { module: 'fees', route: 'class-wise' },
    'fee-head-breakdown': { module: 'fees', route: 'fee-heads' },
  },
  finance: {
    'income-vs-expense': { module: 'finance', route: 'income-expense' },
    'cash-book-summary': { module: 'finance', route: 'cash-flow' },
  },
  attendance: {
    'daily-attendance': { module: 'attendance', route: 'student-trend' },
    'class-wise-attendance': { module: 'attendance', route: 'class-wise' },
    'low-attendance': { module: 'attendance', route: 'low-attendance', extraParam: 'threshold' },
  },
  hr: {
    'staff-attendance': { module: 'attendance', route: 'staff' },
    'leave-summary': { module: 'hr', route: 'leave-utilisation' },
    'payroll-summary': { module: 'finance', route: 'salary-cost' },
  },
  academics: {
    'exam-results': { module: 'academics', route: 'class-performance' },
    'subject-performance': { module: 'academics', route: 'subject-average' },
    'grade-distribution': { module: 'academics', route: 'grade-distribution' },
  },
  operations: {
    'transport-utilisation': { module: 'operations', route: 'transport' },
    'document-compliance': { module: 'operations', route: 'documents' },
  },
};

function routeFor(domain: DomainKey, key: string): RouteSpec {
  const spec = ROUTES[domain]?.[key];
  if (!spec) throw new ReportError(400, `No backend route mapped for report ${domain}/${key}`);
  return spec;
}

// ---------------------------------------------------------------------------
// Date helpers — the UI only tracks a `preset` + optional dd/mm/yyyy custom
// range, but the backend wants concrete `from`/`to` in YYYY-MM-DD.
// ---------------------------------------------------------------------------

function pad2(n: number): string { return String(n).padStart(2, '0'); }
function toISODate(d: Date): string { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

function parseDDMMYYYY(s: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

function presetRange(f: ReportFilters): { from?: string; to?: string } {
  const now = new Date();
  switch (f.preset) {
    case 'today':
      return { from: toISODate(now), to: toISODate(now) };
    case 'week': {
      const dow = (now.getDay() + 6) % 7; // Monday = 0
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow);
      return { from: toISODate(start), to: toISODate(now) };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toISODate(start), to: toISODate(now) };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { from: toISODate(start), to: toISODate(now) };
    }
    case 'custom': {
      const from = parseDDMMYYYY(f.from);
      const to = parseDDMMYYYY(f.to);
      return { from: from ? toISODate(from) : undefined, to: to ? toISODate(to) : undefined };
    }
    default:
      return {};
  }
}

function buildQuery(spec: RouteSpec, filters: ReportFilters): string {
  const params = new URLSearchParams();
  const { from, to } = presetRange(filters);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  // filters.academicYear/classId/section now carry real uuids from common/api.ts
  // (FilterSheet.tsx fetches getAcademicYearsMaster()/getClassesMaster()), not
  // registry.ts's old placeholder display-string options.
  if (filters.academicYear) params.set('academicYearId', filters.academicYear);
  if (filters.classId) params.set('classId', filters.classId);
  if (filters.section) params.set('sectionId', filters.section);
  params.set('granularity', filters.groupBy);
  if (filters.compare) params.set('compare', 'true');
  if (filters.minAmount && spec.extraParam) params.set(spec.extraParam, filters.minAmount);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getReport(domain: DomainKey, key: string, filters: ReportFilters): Promise<ReportResponse> {
  const spec = routeFor(domain, key);
  try {
    const raw = await apiRequest<BackendReportEnvelope>(`/reports/${spec.module}/${spec.route}${buildQuery(spec, filters)}`);
    return adaptReportResponse(raw, filters);
  } catch (err) {
    throw toReportError(err);
  }
}

export async function exportReport(
  domain: DomainKey,
  key: string,
  filters: ReportFilters,
  format: 'xlsx' | 'pdf',
): Promise<{ blob: ArrayBuffer; fileName: string; mimeType: string }> {
  const spec = routeFor(domain, key);
  const params = new URLSearchParams(buildQuery(spec, filters).replace(/^\?/, ''));
  params.set('format', format);
  const url = `${API_BASE_URL}/reports/${spec.module}/${spec.route}/export?${params.toString()}`;
  const token = getAccessToken();

  // Deliberately not apiRequest: this is a binary file response, not JSON.
  const response = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let body: unknown;
    try { body = await response.json(); } catch { /* binary/empty error body */ }
    const parsed = body as { code?: string; message?: string } | undefined;
    throw new ReportError(response.status, parsed?.message ?? 'Could not export the report.', parsed?.code);
  }

  const mimeType = response.headers.get('content-type')
    ?? (format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
  const disposition = response.headers.get('content-disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fileName = match?.[1] ? decodeURIComponent(match[1]) : `${key}-report.${format}`;
  const blob = await response.arrayBuffer();
  return { blob, fileName, mimeType };
}

// ---------------------------------------------------------------------------
// Per-person profile reports — same envelope, no classId/compare (one person).
// ---------------------------------------------------------------------------

interface ProfileParams { academicYearId?: string; from?: string; to?: string; granularity?: Granularity }

function buildProfileQuery(params?: ProfileParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  if (params.academicYearId) sp.set('academicYearId', params.academicYearId);
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  if (params.granularity) sp.set('granularity', params.granularity);
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export async function getStudentProfileReport(
  kind: 'attendance' | 'homework' | 'exams',
  studentId?: string,
  params?: ProfileParams,
): Promise<ReportResponse> {
  const path = studentId ? `/reports/student-profile/${studentId}/${kind}` : `/reports/student-profile/me/${kind}`;
  try {
    const raw = await apiRequest<BackendReportEnvelope>(`${path}${buildProfileQuery(params)}`);
    return adaptReportResponse(raw, DEFAULT_FILTERS);
  } catch (err) {
    throw toReportError(err);
  }
}

export async function getTeacherProfileReport(
  kind: 'attendance' | 'workload' | 'homework' | 'exams',
  teacherId?: string,
  params?: ProfileParams,
): Promise<ReportResponse> {
  const path = teacherId ? `/reports/teacher-profile/${teacherId}/${kind}` : `/reports/teacher-profile/me/${kind}`;
  try {
    const raw = await apiRequest<BackendReportEnvelope>(`${path}${buildProfileQuery(params)}`);
    return adaptReportResponse(raw, DEFAULT_FILTERS);
  } catch (err) {
    throw toReportError(err);
  }
}

// ---------------------------------------------------------------------------
// Admin dashboard — bespoke shape, no plan gate, no query params.
// ---------------------------------------------------------------------------

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    return await apiRequest<AdminDashboardStats>('/admin-dashboard/stats');
  } catch (err) {
    throw toReportError(err);
  }
}

/** Re-exported so callers can build a registry-aware caller without reaching into ROUTES. */
export function isReportSupported(domain: DomainKey, key: string): boolean {
  return Boolean(ROUTES[domain]?.[key]) && Boolean(findReport(domain, key));
}

import { findReport, type GenSpec, type KpiSpec } from './registry';
import type {
  DomainKey, Granularity, ReportChart, ReportFilters, ReportKpi, ReportResponse, ReportTable,
} from './types';
import { colors } from '../../theme/tokens';
import { formatValue } from './format';

export const SERIES_COLORS = [colors.blue, colors.success, colors.orange, colors.purple, colors.indigo, colors.primary, '#ef4444', '#0ea5e9'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function periodLabels(g: Granularity): string[] {
  switch (g) {
    case 'day':
      return Array.from({ length: 14 }, (_, i) => `${String(i + 19 > 30 ? i - 11 : i + 19).padStart(2, '0')}/${i + 19 > 30 ? '10' : '09'}/2026`);
    case 'week':
      return Array.from({ length: 8 }, (_, i) => `W${33 + i}`);
    case 'year':
      return ['2022-23', '2023-24', '2024-25', '2025-26', '2026-27'];
    default:
      return [3, 4, 5, 6, 7, 8, 9].map((m) => `${MONTHS[m]} 2026`);
  }
}

function aggregate(spec: GenSpec, kpi: KpiSpec, series: number[][]): number {
  const data = series[kpi.series] ?? [];
  if (data.length === 0) return 0;
  const total = data.reduce((a, b) => a + b, 0);
  switch (kpi.agg) {
    case 'sum': return total;
    case 'avg': return total / data.length;
    case 'max': return Math.max(...data);
    case 'last': return data[data.length - 1];
    default: {
      const denIdx = kpi.den ?? 0;
      if (denIdx === kpi.series) return total === 0 ? 0 : (data[0] / total) * 100;
      const den = (series[denIdx] ?? []).reduce((a, b) => a + b, 0);
      return den === 0 ? 0 : (total / den) * 100;
    }
  }
}

function round(n: number, unit: string): number {
  return unit === 'percent' ? Math.round(n * 10) / 10 : Math.round(n);
}

function buildGeneric(domain: DomainKey, reportKey: string, filters: ReportFilters): ReportResponse {
  const def = findReport(domain, reportKey);
  const { spec } = def;
  const rand = rng(hash(`${reportKey}|${filters.classId}|${filters.section}|${filters.academicYear}|${filters.preset}|${filters.groupBy}|${filters.minAmount}`));
  const cats = spec.cats === 'period' ? periodLabels(filters.groupBy) : spec.cats;
  // A narrowed class/section selection shrinks absolute numbers.
  const factor = spec.unit === 'percent' ? 1 : filters.section ? 0.35 : filters.classId ? 0.6 : 1;
  const isSlice = spec.chart === 'donut';

  const values: number[][] = spec.series.map((_, si) => {
    const [lo, hi] = spec.ranges[si] ?? [0, 10];
    return cats.map(() => round((lo + rand() * (hi - lo)) * (spec.unit === 'percent' ? 1 : factor), spec.unit));
  });
  // Funnel narrows monotonically.
  if (reportKey === 'admission-funnel') values[0].sort((a, b) => b - a);
  if (reportKey === 'transport-utilisation') values[1] = values[1].map((v, i) => Math.min(v, values[0][i]));
  if (reportKey === 'defaulters') values[0].sort((a, b) => b - a);

  const seriesColor = (i: number): string => spec.colors?.[i] ?? SERIES_COLORS[i % SERIES_COLORS.length];

  const chartSeries = isSlice
    ? cats.map((c, i) => ({ name: c, data: [values[0][i]], color: spec.colors?.[i] ?? SERIES_COLORS[i % SERIES_COLORS.length] }))
    : spec.series.map((name, i) => ({ name, data: values[i], color: seriesColor(i) }));
  const chart: ReportChart = { type: spec.chart, title: spec.chartTitle, series: chartSeries, categories: isSlice ? [] : cats };

  const kpis: ReportKpi[] = spec.kpis.map((k, idx) => {
    const v = aggregate(spec, k, values);
    const out: ReportKpi = { label: k.label, value: round(v, k.format), format: k.format, lowerIsBetter: k.lowerIsBetter };
    if (filters.compare) {
      const r = rng(hash(`${reportKey}|d${idx}|${filters.groupBy}`));
      const mag = k.format === 'percent' ? r() * 4 : r() * 18;
      const signed = r() > 0.5 ? mag : -mag;
      out.delta = Math.round(signed * 10) / 10;
      out.deltaDirection = Math.abs(out.delta) < 0.05 ? 'flat' : out.delta > 0 ? 'up' : 'down';
    }
    return out;
  });

  const fmt = spec.unit;
  let table: ReportTable;
  if (isSlice) {
    const total = values[0].reduce((a, b) => a + b, 0) || 1;
    table = {
      columns: [
        { key: 'cat', label: 'Category' },
        { key: 'v', label: spec.series[0], format: fmt, align: 'right' },
        { key: 'share', label: 'Share', format: 'percent', align: 'right' },
      ],
      rows: cats.map((c, i) => ({ cat: c, v: values[0][i], share: (values[0][i] / total) * 100 })),
    };
  } else {
    const columns: ReportTable['columns'] = [
      { key: 'cat', label: spec.cats === 'period' ? 'Period' : 'Name' },
      ...spec.series.map((s, i) => ({ key: `s${i}`, label: s, format: fmt, align: 'right' as const })),
    ];
    if (spec.totalColumn) columns.push({ key: 'total', label: 'Total', format: fmt, align: 'right' });
    table = {
      columns,
      rows: cats.map((c, ci) => {
        const row: Record<string, string | number> = { cat: c };
        spec.series.forEach((_, si) => { row[`s${si}`] = values[si][ci]; });
        if (spec.totalColumn) row.total = spec.series.reduce((a, _, si) => a + values[si][ci], 0);
        return row;
      }),
    };
  }

  const first = values[0];
  const peakIdx = first.indexOf(Math.max(...first));
  const insights = [
    `${spec.series[0]} peaked at ${formatValue(first[peakIdx], fmt)} for ${cats[peakIdx]}.`,
    `${cats.length} ${isSlice ? 'categories' : 'entries'} shown${filters.classId ? ` for ${filters.classId}${filters.section ? `-${filters.section}` : ''}` : ''}.`,
  ];

  return {
    key: def.key, title: def.title, description: def.description, generatedAt: new Date().toISOString(), filters,
    kpis, charts: [chart], table, insights,
  };
}

/** Faithful copy of the web "Admissions Trend" report (Apr to Oct 2026, 75 applications in Sep). */
function buildAdmissionsTrend(filters: ReportFilters): ReportResponse {
  const def = findReport('admissions', 'admissions-trend');
  const cats = periodLabels('month');
  const apps = [0, 0, 0, 0, 0, 75, 0];
  const enrolled = [0, 0, 0, 0, 0, 0, 0];
  const compare = filters.compare;
  return {
    key: def.key, title: def.title, description: def.description, generatedAt: new Date().toISOString(), filters,
    kpis: [
      { label: 'Applications', value: 75, format: 'number', ...(compare ? { delta: 100, deltaDirection: 'up' as const } : {}) },
      { label: 'Enrolled', value: 0, format: 'number', ...(compare ? { delta: 0, deltaDirection: 'flat' as const } : {}) },
      { label: 'Rejected', value: 0, format: 'number', lowerIsBetter: true, ...(compare ? { delta: 0, deltaDirection: 'flat' as const } : {}) },
      { label: 'Conversion rate', value: 0, format: 'percent', ...(compare ? { delta: 0, deltaDirection: 'flat' as const } : {}) },
    ],
    insights: ['75 applications received, 0 enrolled (0% conversion).', 'Peak intake was 2026-09 with 75 applications.'],
    charts: [{
      type: 'area', title: 'Applications vs enrolled', categories: cats,
      series: [{ name: 'Applications', data: apps, color: colors.blue }, { name: 'Enrolled', data: enrolled, color: colors.success }],
    }],
    table: {
      columns: [
        { key: 'period', label: 'Period' },
        { key: 'apps', label: 'Applications', format: 'number', align: 'right' },
        { key: 'enrolled', label: 'Enrolled', format: 'number', align: 'right' },
        { key: 'conv', label: 'Conversion', format: 'percent', align: 'right' },
      ],
      rows: cats.map((c, i) => ({ period: c, apps: apps[i], enrolled: enrolled[i], conv: apps[i] ? (enrolled[i] / apps[i]) * 100 : 0 })),
    },
  };
}

export function buildMockReport(domain: DomainKey, reportKey: string, filters: ReportFilters): ReportResponse {
  if (reportKey === 'admissions-trend' && filters.groupBy === 'month' && !filters.classId && !filters.section) {
    return buildAdmissionsTrend(filters);
  }
  return buildGeneric(domain, reportKey, filters);
}

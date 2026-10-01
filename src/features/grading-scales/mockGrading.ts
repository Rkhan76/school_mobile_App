import { useCallback, useEffect, useRef, useState } from 'react';

export interface GradeBand {
  id: string;
  label: string;
  minPercent: number;
  maxPercent: number;
  gradePoint: number | null;
  isPass: boolean;
}

export interface GradingScale {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  passPercent: number;
  bands: GradeBand[];
}

/** Editable band (max is derived from neighbours on save). */
export interface BandInput {
  id: string;
  label: string;
  minPercent: number;
  gradePoint: number | null;
  isPass: boolean;
}

export interface GradingScaleInput {
  name: string;
  description: string;
  bands: BandInput[];
}

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(seq += 1)}`;

/** Sort bands high -> low and derive each band's max from the band above (top = 100). */
export function buildBands(bands: BandInput[]): GradeBand[] {
  const sorted = [...bands].sort((a, b) => b.minPercent - a.minPercent);
  return sorted.map((b, i) => ({
    id: b.id,
    label: b.label.trim(),
    minPercent: b.minPercent,
    maxPercent: i === 0 ? 100 : sorted[i - 1].minPercent - 1,
    gradePoint: b.gradePoint,
    isPass: b.isPass,
  }));
}

/** Lowest min % among pass bands (100 when no band passes). */
export function computePassPercent(bands: { minPercent: number; isPass: boolean }[]): number {
  const mins = bands.filter((b) => b.isPass).map((b) => b.minPercent);
  return mins.length ? Math.min(...mins) : 100;
}

/** Band that contains the given percentage, or null when out of range / uncovered. */
export function gradeFor(scale: GradingScale, percent: number): GradeBand | null {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null;
  const p = Math.floor(percent);
  return scale.bands.find((b) => p >= b.minPercent && p <= b.maxPercent) ?? null;
}

type Row = [label: string, min: number, gp: number | null, pass: boolean];

function mk(rows: Row[]): BandInput[] {
  return rows.map(([label, minPercent, gradePoint, isPass]) => ({
    id: uid('b'), label, minPercent, gradePoint, isPass,
  }));
}

function scaleOf(id: string, name: string, description: string, isDefault: boolean, rows: Row[]): GradingScale {
  const bands = buildBands(mk(rows));
  return { id, name, description, isDefault, passPercent: computePassPercent(bands), bands };
}

export interface ScaleTemplate {
  key: string;
  name: string;
  description: string;
  rows: Row[];
}

export const TEMPLATES: ScaleTemplate[] = [
  {
    key: 'percentage',
    name: 'Percentage (A-F)',
    description: 'Simple letter grades: A+ from 90%, pass from 40%',
    rows: [['A+', 90, 10, true], ['A', 80, 9, true], ['B+', 70, 8, true], ['B', 60, 7, true],
      ['C', 50, 6, true], ['D', 40, 5, true], ['F', 0, 0, false]],
  },
  {
    key: 'nine-point',
    name: '9-point scale (A1-E2)',
    description: 'Nine grades (A1 from 91%, pass from 33%) - the style many boards use for Classes 9-10',
    rows: [['A1', 91, 10, true], ['A2', 81, 9, true], ['B1', 71, 8, true], ['B2', 61, 7, true],
      ['C1', 51, 6, true], ['C2', 41, 5, true], ['D', 33, 4, true], ['E1', 21, 0, false], ['E2', 0, 0, false]],
  },
  {
    key: 'pass-fail',
    name: 'Pass / Fail',
    description: 'No letter grades - just pass (from 33%) or fail',
    rows: [['PASS', 33, null, true], ['FAIL', 0, null, false]],
  },
];

export function templateBands(t: ScaleTemplate): BandInput[] {
  return mk(t.rows);
}

const seed = (): GradingScale[] =>
  TEMPLATES.map((t, i) => scaleOf(`gs${i + 1}`, t.name, t.description, i === 0, t.rows));

export function useGradingScales() {
  const [data, setData] = useState<GradingScale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const store = useRef<GradingScale[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setIsLoading(true);
    timer.current = setTimeout(() => {
      if (!store.current) store.current = seed();
      setData(store.current);
      setIsLoading(false);
    }, 600);
  }, []);

  useEffect(() => {
    refetch();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [refetch]);

  const commit = useCallback((next: GradingScale[]) => {
    store.current = next;
    setData(next);
  }, []);

  const add = useCallback((input: GradingScaleInput) => {
    const prev = store.current ?? [];
    const bands = buildBands(input.bands);
    const scale: GradingScale = {
      id: uid('gs'), name: input.name.trim(), description: input.description.trim(),
      isDefault: prev.length === 0, passPercent: computePassPercent(bands), bands,
    };
    commit([...prev, scale]);
  }, [commit]);

  const update = useCallback((id: string, input: GradingScaleInput) => {
    const bands = buildBands(input.bands);
    commit((store.current ?? []).map((s) => (s.id === id
      ? { ...s, name: input.name.trim(), description: input.description.trim(), bands, passPercent: computePassPercent(bands) }
      : s)));
  }, [commit]);

  const remove = useCallback((id: string) => {
    commit((store.current ?? []).filter((s) => s.id !== id || s.isDefault));
  }, [commit]);

  const makeDefault = useCallback((id: string) => {
    commit((store.current ?? []).map((s) => ({ ...s, isDefault: s.id === id })));
  }, [commit]);

  return { data, isLoading, refetch, add, update, remove, makeDefault };
}

import type { KpiFormat } from './types';

function indian(n: number): string {
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(0).split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return `${neg ? '-' : ''}${grouped}${dec ? `.${dec}` : ''}`;
}

export function formatValue(v: number | string, format: KpiFormat): string {
  if (typeof v === 'string') return v;
  switch (format) {
    case 'percent': return `${v.toFixed(1)}%`;
    case 'currency': return `₹${indian(v)}`;
    case 'text': return String(v);
    default: return Number.isInteger(v) ? indian(v) : v.toFixed(1);
  }
}

export function compact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e7) return `${+(n / 1e7).toFixed(1)}Cr`;
  if (a >= 1e5) return `${+(n / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `${+(n / 1e3).toFixed(1)}k`;
  return `${+n.toFixed(1)}`;
}

export function niceScale(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 4, step: 1 };
  const rough = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const m = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  const step = m * mag;
  return { top: Math.ceil(max / step) * step, step };
}

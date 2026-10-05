/** Today as an ISO yyyy-mm-dd, in local time. */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export { formatDate } from '../../lib/date';

/** "10/10/2026" -> ISO, or null when malformed / not a real date. */
export function inputToIso(text: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const d = Number(match[1]);
  const m = Number(match[2]);
  const y = Number(match[3]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

/** Whole days from today to the ISO date (negative = past). */
export function daysFromToday(iso: string): number {
  return dayNumber(iso) - dayNumber(todayIso());
}

export function isOverdueRequest(r: { status: string; dueDate: string | null }): boolean {
  return r.status === 'OPEN' && !!r.dueDate && r.dueDate < todayIso();
}

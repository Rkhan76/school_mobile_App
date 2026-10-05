/** Dates are handled as ISO 'YYYY-MM-DD' strings; the UI shows DD/MM/YYYY. */
export const TODAY_ISO = '2026-10-02';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toUtc(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

export function addDays(iso: string, n: number): string {
  const d = toUtc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
}

export function isoToDmy(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Parses DD/MM/YYYY into ISO, or null when it is not a real calendar date. */
export function dmyToIso(text: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return fromUtc(dt);
}

export function isFuture(iso: string): boolean {
  return iso > TODAY_ISO;
}

export function weekdayIndex(iso: string): number {
  return toUtc(iso).getUTCDay();
}

export function formatLong(iso: string): string {
  const d = toUtc(iso);
  return `${DAYS[d.getUTCDay()]}, ${isoToDmy(iso)}`;
}

export function formatShort(iso: string): string {
  const d = toUtc(iso);
  return `${DAYS[d.getUTCDay()].slice(0, 3)}, ${isoToDmy(iso)}`;
}

export function monthLabel(iso: string): string {
  const d = toUtc(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function daysInMonth(iso: string): number {
  const d = toUtc(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

/** ISO of the 1st of the month containing `iso`. */
export function monthStart(iso: string): string {
  return `${iso.slice(0, 8)}01`;
}

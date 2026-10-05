/**
 * Shared date helpers. Display/entry format is dd/mm/yyyy; the API always uses ISO (yyyy-mm-dd).
 * Output is built manually (no Intl / toLocale*) so it is identical on every JS engine.
 */

const pad = (n: number) => String(n).padStart(2, '0');
const PLAIN_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isRealDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || y < 1) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** 'yyyy-mm-dd' (optionally followed by a time part) -> 'dd/mm/yyyy' without any timezone shift; '' if not parseable. */
export function toDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** 'dd/mm/yyyy' -> ISO 'yyyy-mm-dd', or null when not a real calendar date. */
export function parseDisplayDate(text: string | null | undefined): string | null {
  const m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(text ?? '');
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (!isRealDate(y, mo, d)) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
}

function toDate(input: string | Date | number | null | undefined): Date | null {
  if (input === null || input === undefined || input === '') return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'string') {
    const m = PLAIN_DATE.exec(input.trim());
    if (m) {
      const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
      return isRealDate(y, mo, d) ? new Date(y, mo - 1, d) : null;
    }
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/** -> 'dd/mm/yyyy' (local time for instants; plain yyyy-mm-dd strings are not shifted). '—' when empty/invalid. */
export function formatDate(input: string | Date | number | null | undefined): string {
  const d = toDate(input);
  if (!d) return '—';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** -> 'dd/mm/yyyy, h:mm AM'. A plain date-only string shows just the date. '—' when empty/invalid. */
export function formatDateTime(input: string | Date | number | null | undefined): string {
  const d = toDate(input);
  if (!d) return '—';
  if (typeof input === 'string' && PLAIN_DATE.test(input.trim())) return formatDate(d);
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${formatDate(d)}, ${h12}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Today as ISO yyyy-mm-dd in local time. */
export function todayIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

/** Input-mask helper for dd/mm/yyyy text fields: keeps digits and auto-inserts slashes (max 8 digits). */
export function maskDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

import { formatDate } from '../../lib/date';
import type { SchoolEvent } from './types';

/* ---------- date helpers ---------- */

const pad = (n: number) => String(n).padStart(2, '0');

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** `YYYY-MM-DD` key of a Date (local). */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Parses a server ISO 8601 datetime (`...Z` / with offset) into a `Date`. Per the ECMA-262
 * date-time string spec, a string with a `Z`/offset is interpreted in that zone and then
 * every `Date` getter below (`getHours`, `getFullYear`, ...) reports it in the device's local
 * time — exactly what we want for display. A zone-less `YYYY-MM-DDTHH:mm` (as produced by
 * `toInputText`/`parseInputText` round-trips) is treated as local time by the same spec.
 */
export function parseIso(s: string): Date {
  return new Date(s);
}

/** Date -> full ISO 8601 string (UTC), suitable for the API. */
export function toIso(d: Date): string {
  return d.toISOString();
}

/** Date -> `DD/MM/YYYY HH:mm` */
export function toInputText(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `DD/MM/YYYY HH:mm` -> Date, or null when invalid. */
export function parseInputText(text: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!m) return null;
  const [d, mo, y, h, mi] = m.slice(1).map(Number);
  const date = new Date(y, mo - 1, d, h, mi);
  if (
    date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d ||
    h > 23 || mi > 59
  ) return null;
  return date;
}

export function formatDay(d: Date): string {
  return formatDate(d);
}

export function formatTime(d: Date): string {
  const h = d.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(d.getMinutes())} ${suffix}`;
}

/** Human readable range, e.g. `08/10/2026, 10:00 AM - 04:00 PM` */
export function formatRange(startIso: string, endIso: string): string {
  const s = parseIso(startIso);
  const e = parseIso(endIso);
  if (dayKey(s) === dayKey(e)) return `${formatDay(s)}, ${formatTime(s)} - ${formatTime(e)}`;
  return `${formatDay(s)} ${formatTime(s)} - ${formatDay(e)} ${formatTime(e)}`;
}

/** Whether the event touches the given calendar day. */
export function eventOnDay(ev: SchoolEvent, key: string): boolean {
  return dayKey(parseIso(ev.startDate)) <= key && key <= dayKey(parseIso(ev.endDate));
}

/** Local calendar-month bounds (inclusive) as ISO strings, for `from`/`to` query params. */
export function monthBounds(year: number, month: number): { from: string; to: string } {
  const first = new Date(year, month, 1, 0, 0, 0, 0);
  const last = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { from: first.toISOString(), to: last.toISOString() };
}

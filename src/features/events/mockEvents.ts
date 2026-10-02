import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type EventAudience = 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS';

export const EVENT_STATUSES: EventStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
export const EVENT_AUDIENCES: EventAudience[] = ['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS'];

export type SchoolEvent = {
  id: string;
  title: string;
  description: string;
  /** local date-time, `YYYY-MM-DDTHH:mm` */
  startDate: string;
  endDate: string;
  location: string;
  status: EventStatus;
  audience: EventAudience;
  isHoliday: boolean;
};

export type EventInput = Omit<SchoolEvent, 'id'>;

export type EventFilters = {
  search: string;
  status: EventStatus | '';
  audience: EventAudience | '';
  holidaysOnly: boolean;
};

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

export function parseIso(s: string): Date {
  const [datePart, timePart = '00:00'] = s.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

export function toIso(d: Date): string {
  return `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  return `${pad(d.getDate())} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export function formatTime(d: Date): string {
  const h = d.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(d.getMinutes())} ${suffix}`;
}

/** Human readable range, e.g. `08 Oct 2026, 10:00 AM - 04:00 PM` */
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

/* ---------- mock data ---------- */

const mk = (
  id: string, title: string, startDate: string, endDate: string, location: string,
  status: EventStatus, audience: EventAudience, isHoliday: boolean, description: string,
): SchoolEvent => ({ id, title, description, startDate, endDate, location, status, audience, isHoliday });

function buildMock(): SchoolEvent[] {
  return [
    mk('e1', 'Science Exhibition', '2026-10-08T09:30', '2026-10-08T15:00', 'School Auditorium', 'UPCOMING', 'ALL', false,
      'Annual science exhibition with student projects, live experiments and guest judges.'),
    mk('e2', 'Parent-Teacher Meeting', '2026-10-20T10:00', '2026-10-20T13:00', 'Classrooms, Block B', 'UPCOMING', 'PARENTS', false,
      'Term progress discussion between class teachers and parents.'),
    mk('e3', 'Staff Training Workshop', '2026-10-14T14:00', '2026-10-14T16:30', 'Conference Room', 'UPCOMING', 'TEACHERS', false,
      'Workshop on digital classroom tools and assessment practices.'),
    mk('e4', 'Inter-House Football', '2026-10-27T15:00', '2026-10-27T17:30', 'Main Playground', 'UPCOMING', 'STUDENTS', false,
      'Inter-house football tournament finals.'),
    mk('e5', 'Annual Sports Day', '2026-10-02T08:00', '2026-10-02T14:00', 'Main Playground', 'ONGOING', 'ALL', false,
      'Track and field events, relay races and prize distribution.'),
    mk('e6', 'Gandhi Jayanti Assembly', '2026-09-30T08:30', '2026-09-30T09:30', 'School Auditorium', 'COMPLETED', 'ALL', false,
      'Special assembly commemorating Gandhi Jayanti.'),
    mk('e7', 'Diwali Break', '2026-11-04T00:00', '2026-11-07T23:59', 'School closed', 'UPCOMING', 'ALL', true,
      'School remains closed for Diwali celebrations. Classes resume on 9 November.'),
    mk('e8', 'Cultural Fest', '2026-10-16T11:00', '2026-10-16T17:00', 'Open Air Theatre', 'CANCELLED', 'ALL', false,
      'Cancelled due to scheduling conflict; a new date will be announced.'),
    mk('e9', 'Founders Day Holiday', '2026-10-31T00:00', '2026-10-31T23:59', 'School closed', 'UPCOMING', 'ALL', true,
      'Holiday on account of Founders Day.'),
  ];
}

/* ---------- hook ---------- */

export function useEvents(filters: EventFilters) {
  const [all, setAll] = useState<SchoolEvent[]>(() => buildMock());
  const [isLoading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1000);

  const refetch = useCallback(() => {
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), 700);
  }, []);

  useEffect(() => {
    refetch();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refetch]);

  const { search, status, audience, holidaysOnly } = filters;
  const data = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter((e) => {
        if (holidaysOnly && !e.isHoliday) return false;
        if (status && e.status !== status) return false;
        if (audience && e.audience !== audience) return false;
        return !q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q);
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [all, search, status, audience, holidaysOnly]);

  const add = useCallback((input: EventInput) => {
    nextId.current += 1;
    setAll((prev) => [...prev, { ...input, id: `e${nextId.current}` }]);
  }, []);
  const update = useCallback((id: string, input: EventInput) => {
    setAll((prev) => prev.map((e) => (e.id === id ? { ...input, id } : e)));
  }, []);
  const remove = useCallback((id: string) => {
    setAll((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { data, isLoading, refetch, add, update, remove };
}

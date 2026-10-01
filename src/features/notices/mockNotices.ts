import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type Audience = 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS';
export type NoticeStatus = 'Active' | 'Expired';

export const AUDIENCES: Audience[] = ['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS'];

/** "Today" for the mock data set. */
export const TODAY_ISO = '2026-10-02';

export interface Notice {
  id: string;
  title: string;
  content: string;
  audience: Audience;
  status: NoticeStatus;
  /** ISO yyyy-mm-dd */
  publishedAt: string;
  /** ISO yyyy-mm-dd or null = never expires */
  expiresAt: string | null;
  createdBy: string;
  pinned: boolean;
}

export interface NoticeInput {
  title: string;
  content: string;
  audience: Audience;
  publishedAt: string;
  expiresAt: string | null;
  pinned: boolean;
}

export interface NoticesParams {
  search: string;
  /** audience or '' for all */
  audience: Audience | '';
  page: number;
  pageSize: number;
}

export function deriveStatus(expiresAt: string | null): NoticeStatus {
  return expiresAt !== null && expiresAt < TODAY_ISO ? 'Expired' : 'Active';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

/** ISO -> "21 Aug 2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}

/** ISO -> "21/08/2026" */
export function isoToInput(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** "21/08/2026" -> ISO, or null when malformed / not a real date. */
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

type Seed = Omit<Notice, 'status'>;

const SEED: Seed[] = [
  {
    id: 'n1', title: 'Welcome to the 2026-2027 session', audience: 'ALL', publishedAt: '2026-08-21', expiresAt: null,
    createdBy: 'admin', pinned: true,
    content: 'Classes for the new session are in full swing. Please check your timetable and keep the school diary updated.',
  },
  {
    id: 'n2', title: 'Festival holiday schedule', audience: 'ALL', publishedAt: '2026-09-29', expiresAt: '2026-11-09',
    createdBy: 'admin', pinned: false,
    content: 'The school will remain closed for the festival break. Regular classes resume after the holiday.',
  },
  {
    id: 'n3', title: 'Staff meeting — Friday 4:30 PM', audience: 'TEACHERS', publishedAt: '2026-09-28', expiresAt: '2026-10-05',
    createdBy: 'admin', pinned: false,
    content: 'All teaching staff are requested to attend the monthly meeting in the conference room.',
  },
  {
    id: 'n4', title: 'Unit Test 1 results published', audience: 'STUDENTS', publishedAt: '2026-09-24', expiresAt: null,
    createdBy: 'admin', pinned: false,
    content: 'Unit Test 1 marks are now available in the Exams section. Contact your class teacher for any re-evaluation request.',
  },
  {
    id: 'n5', title: 'Parent-teacher meeting', audience: 'PARENTS', publishedAt: '2026-09-20', expiresAt: '2026-10-10',
    createdBy: 'admin', pinned: false,
    content: "The first parent-teacher meeting of the term will be held on Saturday from 9:00 AM to 12:00 PM. Please meet your ward's class teacher.",
  },
  {
    id: 'n6', title: 'Annual sports day registration', audience: 'STUDENTS', publishedAt: '2026-09-15', expiresAt: '2026-09-30',
    createdBy: 'admin', pinned: false,
    content: 'Students interested in participating in Annual Sports Day events must register with their PE teacher before the deadline.',
  },
  {
    id: 'n7', title: 'Fee payment reminder', audience: 'PARENTS', publishedAt: '2026-09-10', expiresAt: '2026-10-15',
    createdBy: 'accounts', pinned: false,
    content: 'The second instalment of the tuition fee is due by 15 October. Late fees will apply after the due date.',
  },
  {
    id: 'n8', title: 'Question paper submission', audience: 'TEACHERS', publishedAt: '2026-09-05', expiresAt: '2026-09-25',
    createdBy: 'admin', pinned: false,
    content: 'Subject teachers should submit mid-term question papers to the examination cell for moderation.',
  },
  {
    id: 'n9', title: 'Library week', audience: 'ALL', publishedAt: '2026-09-01', expiresAt: '2026-09-12',
    createdBy: 'librarian', pinned: false,
    content: 'Celebrate library week with book exhibitions, reading challenges and a book swap. All are welcome.',
  },
  {
    id: 'n10', title: 'Science exhibition', audience: 'STUDENTS', publishedAt: '2026-08-28', expiresAt: null,
    createdBy: 'admin', pinned: false,
    content: 'Projects for the inter-house science exhibition are to be submitted to your science teacher by the end of next month.',
  },
];

const buildMock = (): Notice[] => SEED.map((s) => ({ ...s, status: deriveStatus(s.expiresAt) }));

export function useNotices(params: NoticesParams) {
  const [all, setAll] = useState<Notice[]>(() => buildMock());
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

  const filtered = useMemo(() => {
    const q = params.search.trim().toLowerCase();
    return all
      .filter((n) => {
        if (params.audience && n.audience !== params.audience) return false;
        return !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0;
      });
  }, [all, params.search, params.audience]);

  const data = useMemo(() => {
    const start = (params.page - 1) * params.pageSize;
    return filtered.slice(start, start + params.pageSize);
  }, [filtered, params.page, params.pageSize]);

  const add = useCallback((input: NoticeInput) => {
    nextId.current += 1;
    const created: Notice = {
      ...input,
      id: `n-${nextId.current}`,
      title: input.title.trim(),
      content: input.content.trim(),
      createdBy: 'admin',
      status: deriveStatus(input.expiresAt),
    };
    setAll((prev) => [created, ...prev]);
  }, []);

  const update = useCallback((id: string, input: NoticeInput) => {
    setAll((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, ...input, title: input.title.trim(), content: input.content.trim(), status: deriveStatus(input.expiresAt) }
          : n,
      ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setAll((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { data, total: filtered.length, isLoading, refetch, add, update, remove };
}

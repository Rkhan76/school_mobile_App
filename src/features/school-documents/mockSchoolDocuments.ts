import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** "Today" for the mock data set. */
export const TODAY_ISO = '2026-10-02';

export type Confidentiality = 'all' | 'classified' | 'standard';
export type ExpiryFilter = 'any' | 'expired' | 'soon' | 'none';

export interface DocumentVersion {
  version: number;
  fileName: string;
  sizeLabel: string;
  /** ISO yyyy-mm-dd */
  uploadedAt: string;
  uploadedBy: string;
}

export interface SchoolDocument {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  classified: boolean;
  fileName: string;
  /** Upper-case extension, e.g. "PDF" */
  fileType: string;
  sizeLabel: string;
  /** ISO yyyy-mm-dd or null = no expiry */
  expiresAt: string | null;
  uploadedBy: string;
  uploadedAt: string;
  /** Current version number */
  version: number;
  versions: DocumentVersion[];
}

export interface DocumentCategory {
  id: string;
  name: string;
  count: number;
}

export interface DocumentInput {
  title: string;
  description: string;
  categoryId: string;
  classified: boolean;
  expiresAt: string | null;
  fileName: string;
  sizeLabel: string;
}

export interface SchoolDocumentsParams {
  search: string;
  /** category id or '' for all */
  categoryId: string;
  confidentiality: Confidentiality;
  expiry: ExpiryFilter;
}

export const ALL_CATEGORY_ID = '';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

/** ISO -> "30 Sept 2026" */
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

export function isExpired(expiresAt: string | null): boolean {
  return expiresAt !== null && expiresAt < TODAY_ISO;
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const SOON_LIMIT = addDaysIso(TODAY_ISO, 30);

export function fileTypeOf(fileName: string): string {
  const i = fileName.lastIndexOf('.');
  return i >= 0 && i < fileName.length - 1 ? fileName.slice(i + 1).toUpperCase() : 'FILE';
}

const ADMIN = 'School Admin';

export const DEFAULT_CATEGORIES: { id: string; name: string }[] = [
  { id: 'c-affiliation', name: 'Affiliation & Legal' },
  { id: 'c-finance', name: 'Finance & Audit' },
  { id: 'c-policies', name: 'Policies & Circulars' },
  { id: 'c-hr', name: 'HR & Staff Records' },
  { id: 'c-academic', name: 'Academic' },
  { id: 'c-safety', name: 'Safety & Infrastructure' },
  { id: 'c-other', name: 'Other' },
];

type Seed = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  classified: boolean;
  fileName: string;
  sizeLabel: string;
  expiresAt: string | null;
  uploadedAt: string;
  uploadedBy?: string;
  /** number of older versions (v1..vN-1) to generate */
  extraVersions?: number;
};

const SEED: Seed[] = [
  { id: 'd1', title: 'student x adhaar', description: 'adhar card of student x', categoryId: 'c-academic', classified: false,
    fileName: 'file.png', sizeLabel: '1.8 MB', expiresAt: null, uploadedAt: '2026-09-30' },
  { id: 'd2', title: 'school insurance', description: 'school insurance docs', categoryId: 'c-affiliation', classified: true,
    fileName: 'file.pdf', sizeLabel: '4 KB', expiresAt: null, uploadedAt: '2026-09-30' },
  { id: 'd3', title: 'CBSE affiliation certificate', description: 'Affiliation grant letter and renewal terms',
    categoryId: 'c-affiliation', classified: true, fileName: 'cbse-affiliation.pdf', sizeLabel: '2.4 MB',
    expiresAt: '2026-10-20', uploadedAt: '2026-08-12', extraVersions: 2 },
  { id: 'd4', title: 'Annual audit report 2025-26', description: 'Chartered accountant audited statements',
    categoryId: 'c-finance', classified: true, fileName: 'audit-2025-26.pdf', sizeLabel: '6.1 MB',
    expiresAt: null, uploadedAt: '2026-07-18', uploadedBy: 'Accounts Office' },
  { id: 'd5', title: 'Fire safety NOC', description: 'No-objection certificate from the fire department',
    categoryId: 'c-safety', classified: false, fileName: 'fire-noc.pdf', sizeLabel: '820 KB',
    expiresAt: '2026-09-15', uploadedAt: '2025-09-20', extraVersions: 1 },
  { id: 'd6', title: 'Staff leave policy', description: 'Updated leave rules for teaching and non-teaching staff',
    categoryId: 'c-hr', classified: false, fileName: 'leave-policy.docx', sizeLabel: '310 KB',
    expiresAt: null, uploadedAt: '2026-06-02', extraVersions: 1 },
  { id: 'd7', title: 'Circular - uniform guidelines', description: 'Circular regarding the revised uniform code',
    categoryId: 'c-policies', classified: false, fileName: 'uniform-circular.pdf', sizeLabel: '145 KB',
    expiresAt: '2027-03-31', uploadedAt: '2026-08-25' },
  { id: 'd8', title: 'Building stability certificate', description: 'Structural safety certificate from the engineer',
    categoryId: 'c-safety', classified: true, fileName: 'stability.pdf', sizeLabel: '1.2 MB',
    expiresAt: '2026-12-31', uploadedAt: '2026-05-10' },
];

function buildMock(): SchoolDocument[] {
  return SEED.map((s) => {
    const total = (s.extraVersions ?? 0) + 1;
    const uploadedBy = s.uploadedBy ?? ADMIN;
    const versions: DocumentVersion[] = [];
    for (let v = 1; v <= total; v += 1) {
      const last = v === total;
      versions.push({
        version: v,
        fileName: last ? s.fileName : s.fileName.replace(/(\.[^.]+)$/, `-v${v}$1`),
        sizeLabel: s.sizeLabel,
        uploadedAt: last ? s.uploadedAt : addDaysIso(s.uploadedAt, -30 * (total - v)),
        uploadedBy,
      });
    }
    return {
      id: s.id, title: s.title, description: s.description, categoryId: s.categoryId, classified: s.classified,
      fileName: s.fileName, fileType: fileTypeOf(s.fileName), sizeLabel: s.sizeLabel, expiresAt: s.expiresAt,
      uploadedBy, uploadedAt: s.uploadedAt, version: total, versions,
    };
  });
}

export function useSchoolDocuments(params: SchoolDocumentsParams) {
  const [all, setAll] = useState<SchoolDocument[]>(() => buildMock());
  const [categoryList, setCategoryList] = useState(DEFAULT_CATEGORIES);
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

  const categories = useMemo<DocumentCategory[]>(() => {
    const counts = new Map<string, number>();
    all.forEach((d) => counts.set(d.categoryId, (counts.get(d.categoryId) ?? 0) + 1));
    return [
      { id: ALL_CATEGORY_ID, name: 'All documents', count: all.length },
      ...categoryList.map((c) => ({ ...c, count: counts.get(c.id) ?? 0 })),
    ];
  }, [all, categoryList]);

  const data = useMemo(() => {
    const q = params.search.trim().toLowerCase();
    return all
      .filter((d) => {
        if (params.categoryId && d.categoryId !== params.categoryId) return false;
        if (params.confidentiality === 'classified' && !d.classified) return false;
        if (params.confidentiality === 'standard' && d.classified) return false;
        if (params.expiry === 'expired' && !isExpired(d.expiresAt)) return false;
        if (params.expiry === 'none' && d.expiresAt !== null) return false;
        if (params.expiry === 'soon' && !(d.expiresAt !== null && d.expiresAt >= TODAY_ISO && d.expiresAt <= SOON_LIMIT)) {
          return false;
        }
        return !q || d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
      })
      .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : a.uploadedAt > b.uploadedAt ? -1 : 0));
  }, [all, params.search, params.categoryId, params.confidentiality, params.expiry]);

  const add = useCallback((input: DocumentInput) => {
    nextId.current += 1;
    const fileName = input.fileName.trim();
    const sizeLabel = input.sizeLabel.trim();
    const created: SchoolDocument = {
      id: `d-${nextId.current}`,
      title: input.title.trim(),
      description: input.description.trim(),
      categoryId: input.categoryId,
      classified: input.classified,
      fileName,
      fileType: fileTypeOf(fileName),
      sizeLabel,
      expiresAt: input.expiresAt,
      uploadedBy: ADMIN,
      uploadedAt: TODAY_ISO,
      version: 1,
      versions: [{ version: 1, fileName, sizeLabel, uploadedAt: TODAY_ISO, uploadedBy: ADMIN }],
    };
    setAll((prev) => [created, ...prev]);
  }, []);

  /** Saving with a different file name bumps the version. */
  const update = useCallback((id: string, input: DocumentInput) => {
    setAll((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const fileName = input.fileName.trim();
        const sizeLabel = input.sizeLabel.trim();
        const bumped = fileName !== d.fileName;
        const version = bumped ? d.version + 1 : d.version;
        return {
          ...d,
          title: input.title.trim(),
          description: input.description.trim(),
          categoryId: input.categoryId,
          classified: input.classified,
          expiresAt: input.expiresAt,
          fileName,
          fileType: fileTypeOf(fileName),
          sizeLabel,
          version,
          uploadedAt: bumped ? TODAY_ISO : d.uploadedAt,
          versions: bumped
            ? [...d.versions, { version, fileName, sizeLabel, uploadedAt: TODAY_ISO, uploadedBy: ADMIN }]
            : d.versions,
        };
      }),
    );
  }, []);

  /** Restoring an old version publishes it again as a new version. */
  const restore = useCallback((id: string, version: number) => {
    setAll((prev) =>
      prev.map((d) => {
        const src = d.versions.find((v) => v.version === version);
        if (d.id !== id || !src) return d;
        const next = d.version + 1;
        return {
          ...d,
          fileName: src.fileName,
          fileType: fileTypeOf(src.fileName),
          sizeLabel: src.sizeLabel,
          version: next,
          uploadedAt: TODAY_ISO,
          versions: [...d.versions, { ...src, version: next, uploadedAt: TODAY_ISO, uploadedBy: ADMIN }],
        };
      }),
    );
  }, []);

  const remove = useCallback((id: string) => setAll((prev) => prev.filter((d) => d.id !== id)), []);

  /** Returns the new category id, or null when empty / duplicate. */
  const addCategory = useCallback(
    (name: string): string | null => {
      const trimmed = name.trim();
      if (!trimmed || categoryList.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return null;
      nextId.current += 1;
      const id = `c-${nextId.current}`;
      setCategoryList((prev) => [...prev, { id, name: trimmed }]);
      return id;
    },
    [categoryList],
  );

  return { data, total: data.length, categories, isLoading, refetch, add, update, remove, restore, addCategory };
}

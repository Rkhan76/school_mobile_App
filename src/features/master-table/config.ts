import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { Draft, MasterEntityMap, TabKey } from './types';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export type Tone = 'success' | 'danger' | 'warning' | 'neutral' | 'primary';
export type FormValues = Record<string, string | boolean>;
export type FieldKind = 'text' | 'multiline' | 'number' | 'date' | 'time' | 'toggle';

export interface FieldDef { key: string; label: string; kind: FieldKind; placeholder?: string }
export interface CardView { title: string; lines: string[]; badges: { label: string; tone: Tone }[] }

export interface TabConfig<K extends TabKey> {
  key: K;
  label: string;
  icon: IconName;
  singular: string;
  searchPlaceholder: string;
  fields: FieldDef[];
  emptyValues: FormValues;
  toValues: (e: MasterEntityMap[K]) => FormValues;
  validate: (v: FormValues) => Record<string, string>;
  /** Builds the create/update payload from form values; `existing` is set when editing. */
  toDraft: (v: FormValues, existing?: MasterEntityMap[K]) => Draft<K>;
  view: (e: MasterEntityMap[K]) => CardView;
  searchText: (e: MasterEntityMap[K]) => string;
  toggle?: { label: string; get: (e: MasterEntityMap[K]) => boolean; patch: (on: boolean) => Partial<Draft<K>> };
  canSetActive?: (e: MasterEntityMap[K]) => boolean;
  deleteBlock?: (e: MasterEntityMap[K]) => string | null;
  /** True for read-only catalogs (no create/update/delete endpoint exists server-side). */
  readOnly?: boolean;
}

const str = (v: FormValues, k: string): string => {
  const x = v[k];
  return typeof x === 'string' ? x.trim() : '';
};
const requireName = (v: FormValues): Record<string, string> => (str(v, 'name') ? {} : { name: 'Name is required.' });
const bool = (v: FormValues, k: string): boolean => v[k] === true;
/** Parses a number field, returning undefined for a blank string (an optional numeric field). */
const numOrUndef = (v: FormValues, k: string): number | undefined => {
  const s = str(v, k);
  return s === '' ? undefined : Number(s);
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parses an ISO YYYY-MM-DD date (the API's format) into a timestamp, or null when invalid. */
export function parseDate(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt.getTime();
}

/** YYYY-MM-DD -> "01 Apr 2026". */
export function formatDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? `${m[3]} ${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}` : s;
}

function parseTime(s: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  return h < 24 && mi < 60 ? h * 60 + mi : null;
}

const academicYears: TabConfig<'academicYears'> = {
  key: 'academicYears',
  label: 'Academic Years',
  icon: 'calendar-outline',
  singular: 'Academic Year',
  searchPlaceholder: 'Search Academic Year...',
  fields: [
    { key: 'label', label: 'Academic Year', kind: 'text', placeholder: 'e.g. 2027-2028' },
    { key: 'startDate', label: 'Start Date', kind: 'date', placeholder: 'YYYY-MM-DD' },
    { key: 'endDate', label: 'End Date', kind: 'date', placeholder: 'YYYY-MM-DD' },
  ],
  // No isActive field here on purpose — switching the active year is routed through the
  // dedicated "Set Active" action (canSetActive/setActive below), never a raw PATCH.
  emptyValues: { label: '', startDate: '', endDate: '' },
  toValues: (e) => ({ label: e.label, startDate: e.startDate, endDate: e.endDate }),
  validate: (v) => {
    const err: Record<string, string> = {};
    if (!/^\d{4}-\d{4}$/.test(str(v, 'label'))) err.label = 'Enter the academic year as YYYY-YYYY, e.g. 2027-2028.';
    const s = parseDate(str(v, 'startDate'));
    const e = parseDate(str(v, 'endDate'));
    if (s === null) err.startDate = 'Enter a valid date as YYYY-MM-DD.';
    if (e === null) err.endDate = 'Enter a valid date as YYYY-MM-DD.';
    if (s !== null && e !== null && e <= s) err.endDate = 'End date must be after start date.';
    return err;
  },
  toDraft: (v) => ({
    label: str(v, 'label'),
    startDate: str(v, 'startDate'),
    endDate: str(v, 'endDate'),
  }),
  view: (e) => ({
    title: e.label,
    lines: [`${formatDate(e.startDate)}  -  ${formatDate(e.endDate)}`],
    badges: [e.isActive ? { label: 'Active', tone: 'success' } : { label: 'Inactive', tone: 'neutral' }],
  }),
  searchText: (e) => `${e.label} ${e.startDate} ${e.endDate}`,
  canSetActive: (e) => !e.isActive,
  deleteBlock: (e) => (e.isActive ? 'The active academic year cannot be deleted. Set another year active first.' : null),
};

const examTypes: TabConfig<'examTypes'> = {
  key: 'examTypes',
  label: 'Exam Types',
  icon: 'create-outline',
  singular: 'Exam Type',
  searchPlaceholder: 'Search Exam Type...',
  fields: [
    { key: 'name', label: 'Name', kind: 'text', placeholder: 'e.g. Unit Test 2' },
    { key: 'description', label: 'Description', kind: 'multiline', placeholder: 'Short description' },
    { key: 'isSubjectScoped', label: 'One paper per subject', kind: 'toggle' },
    { key: 'isActive', label: 'Active', kind: 'toggle' },
  ],
  emptyValues: { name: '', description: '', isSubjectScoped: true, isActive: true },
  toValues: (e) => ({ name: e.name, description: e.description ?? '', isSubjectScoped: e.isSubjectScoped, isActive: e.isActive }),
  validate: requireName,
  toDraft: (v) => ({
    name: str(v, 'name'),
    description: str(v, 'description'),
    isSubjectScoped: bool(v, 'isSubjectScoped'),
    isActive: bool(v, 'isActive'),
  }),
  view: (e) => ({
    title: e.name,
    lines: [e.description, e.isSubjectScoped ? 'One paper per subject' : 'Full exam (spans every subject)'].filter(
      (l): l is string => !!l
    ),
    badges: [e.isActive ? { label: 'Active', tone: 'success' } : { label: 'Inactive', tone: 'neutral' }],
  }),
  searchText: (e) => `${e.name} ${e.description ?? ''}`,
  toggle: { label: 'Active', get: (e) => e.isActive, patch: (on) => ({ isActive: on }) },
};

const feeTypes: TabConfig<'feeTypes'> = {
  key: 'feeTypes',
  label: 'Fee Categories',
  icon: 'wallet-outline',
  singular: 'Fee Category',
  searchPlaceholder: 'Search Fee Category...',
  fields: [
    { key: 'name', label: 'Name', kind: 'text', placeholder: 'e.g. Tuition Fee' },
    { key: 'code', label: 'Code', kind: 'text', placeholder: 'e.g. TUITION' },
    { key: 'description', label: 'Description', kind: 'multiline', placeholder: 'Short description' },
  ],
  emptyValues: { name: '', code: '', description: '' },
  toValues: (e) => ({ name: e.name, code: e.code, description: e.description ?? '' }),
  validate: (v) => {
    const err: Record<string, string> = {};
    if (!str(v, 'name')) err.name = 'Name is required.';
    if (!str(v, 'code')) err.code = 'Code is required.';
    return err;
  },
  toDraft: (v) => ({ name: str(v, 'name'), code: str(v, 'code'), description: str(v, 'description') }),
  view: (e) => ({
    title: e.name,
    lines: [`Code: ${e.code}`, ...(e.description ? [e.description] : [])],
    badges: [e.isActive ? { label: 'Active', tone: 'success' } : { label: 'Inactive', tone: 'neutral' }],
  }),
  searchText: (e) => `${e.name} ${e.code} ${e.description ?? ''}`,
  toggle: { label: 'Active', get: (e) => e.isActive, patch: (on) => ({ isActive: on }) },
};

const leaveTypes: TabConfig<'leaveTypes'> = {
  key: 'leaveTypes',
  label: 'Leave Types',
  icon: 'airplane-outline',
  singular: 'Leave Type',
  searchPlaceholder: 'Search Leave Type...',
  fields: [
    { key: 'name', label: 'Name', kind: 'text', placeholder: 'e.g. Sick Leave' },
    { key: 'code', label: 'Code', kind: 'text', placeholder: 'e.g. SL' },
    { key: 'description', label: 'Description', kind: 'multiline', placeholder: 'Short description' },
    { key: 'isPaid', label: 'Paid leave', kind: 'toggle' },
    { key: 'defaultDays', label: 'Default Days', kind: 'number', placeholder: 'e.g. 12' },
    { key: 'maxDaysPerYear', label: 'Max Days Per Year', kind: 'number', placeholder: 'e.g. 12' },
  ],
  emptyValues: { name: '', code: '', description: '', isPaid: true, defaultDays: '', maxDaysPerYear: '' },
  toValues: (e) => ({
    name: e.name,
    code: e.code,
    description: e.description ?? '',
    isPaid: e.isPaid,
    defaultDays: e.defaultDays != null ? String(e.defaultDays) : '',
    maxDaysPerYear: e.maxDaysPerYear != null ? String(e.maxDaysPerYear) : '',
  }),
  validate: (v) => {
    const err: Record<string, string> = {};
    if (!str(v, 'name')) err.name = 'Name is required.';
    if (!str(v, 'code')) err.code = 'Code is required.';
    const defaultDays = numOrUndef(v, 'defaultDays');
    const maxDaysPerYear = numOrUndef(v, 'maxDaysPerYear');
    if (str(v, 'defaultDays') !== '' && (!Number.isFinite(defaultDays) || (defaultDays as number) < 0)) {
      err.defaultDays = 'Enter a whole number of days.';
    }
    if (str(v, 'maxDaysPerYear') !== '' && (!Number.isFinite(maxDaysPerYear) || (maxDaysPerYear as number) < 0)) {
      err.maxDaysPerYear = 'Enter a whole number of days.';
    }
    if (!err.defaultDays && !err.maxDaysPerYear && defaultDays !== undefined && maxDaysPerYear !== undefined && defaultDays > maxDaysPerYear) {
      err.defaultDays = "Default days can't exceed max days per year.";
    }
    return err;
  },
  toDraft: (v) => ({
    name: str(v, 'name'),
    code: str(v, 'code'),
    description: str(v, 'description'),
    isPaid: bool(v, 'isPaid'),
    defaultDays: numOrUndef(v, 'defaultDays'),
    maxDaysPerYear: numOrUndef(v, 'maxDaysPerYear'),
  }),
  view: (e) => ({
    title: e.name,
    lines: [
      `Code: ${e.code}${e.isPaid ? ' · Paid' : ' · Unpaid'}`,
      e.defaultDays != null || e.maxDaysPerYear != null
        ? `${e.defaultDays ?? '—'} default / ${e.maxDaysPerYear ?? '—'} max per year`
        : '',
    ].filter((l) => l !== ''),
    badges: [e.isActive ? { label: 'Active', tone: 'success' } : { label: 'Inactive', tone: 'neutral' }],
  }),
  searchText: (e) => `${e.name} ${e.code} ${e.description ?? ''}`,
  toggle: { label: 'Active', get: (e) => e.isActive, patch: (on) => ({ isActive: on }) },
};

const periods: TabConfig<'periods'> = {
  key: 'periods',
  label: 'Periods',
  icon: 'time-outline',
  singular: 'Period',
  searchPlaceholder: 'Search Period...',
  fields: [
    { key: 'name', label: 'Name', kind: 'text', placeholder: 'e.g. Period 4' },
    { key: 'startTime', label: 'Start Time', kind: 'time', placeholder: 'HH:MM (24h)' },
    { key: 'endTime', label: 'End Time', kind: 'time', placeholder: 'HH:MM (24h)' },
    { key: 'sortOrder', label: 'Sort Order', kind: 'number', placeholder: 'e.g. 1' },
    { key: 'isBreak', label: 'Break period', kind: 'toggle' },
    { key: 'isActive', label: 'Active', kind: 'toggle' },
  ],
  emptyValues: { name: '', startTime: '', endTime: '', sortOrder: '', isBreak: false, isActive: true },
  toValues: (e) => ({
    name: e.name,
    startTime: e.startTime,
    endTime: e.endTime,
    sortOrder: String(e.sortOrder),
    isBreak: e.isBreak,
    isActive: e.isActive,
  }),
  validate: (v) => {
    const err: Record<string, string> = {};
    if (!str(v, 'name')) err.name = 'Name is required.';
    const s = parseTime(str(v, 'startTime'));
    const e = parseTime(str(v, 'endTime'));
    if (s === null) err.startTime = 'Enter a valid time as HH:MM.';
    if (e === null) err.endTime = 'Enter a valid time as HH:MM.';
    if (s !== null && e !== null && e <= s) err.endTime = 'End time must be after start time.';
    const sortOrder = str(v, 'sortOrder');
    if (!/^\d+$/.test(sortOrder)) err.sortOrder = 'Enter a whole number.';
    return err;
  },
  toDraft: (v) => ({
    name: str(v, 'name'),
    startTime: str(v, 'startTime'),
    endTime: str(v, 'endTime'),
    sortOrder: Number(str(v, 'sortOrder')),
    isBreak: bool(v, 'isBreak'),
    isActive: bool(v, 'isActive'),
  }),
  view: (e) => ({
    title: e.name,
    lines: [`${e.startTime} - ${e.endTime}`, `Order ${e.sortOrder}`],
    badges: [
      ...(e.isBreak ? [{ label: 'Break', tone: 'warning' as Tone }] : []),
      e.isActive ? { label: 'Active', tone: 'success' as Tone } : { label: 'Inactive', tone: 'neutral' as Tone },
    ],
  }),
  searchText: (e) => `${e.name} ${e.startTime} ${e.endTime}`,
};

const documentCategories: TabConfig<'documentCategories'> = {
  key: 'documentCategories',
  label: 'Document Categories',
  icon: 'folder-open-outline',
  singular: 'Document Category',
  searchPlaceholder: 'Search Document Category...',
  readOnly: true,
  fields: [
    { key: 'name', label: 'Name', kind: 'text', placeholder: 'e.g. Address Proof' },
    { key: 'description', label: 'Description', kind: 'multiline', placeholder: 'Short description' },
  ],
  emptyValues: { name: '', description: '' },
  toValues: (e) => ({ name: e.name, description: e.description ?? '' }),
  validate: requireName,
  // Never actually sent — useMasterData.ts intercepts add/update/remove for this tab and
  // shows an explanatory alert instead, since no create/update/delete endpoint exists.
  toDraft: (v) => ({ name: str(v, 'name'), description: str(v, 'description') }),
  view: (e) => ({
    title: e.name,
    lines: [`${e.documentCount} document${e.documentCount === 1 ? '' : 's'}`, ...(e.description ? [e.description] : [])],
    badges: e.isActive === false ? [{ label: 'Inactive', tone: 'neutral' }] : [],
  }),
  searchText: (e) => `${e.name} ${e.description ?? ''}`,
  deleteBlock: () => "Categories are managed automatically and can't be edited here yet.",
};

export const CONFIGS = { academicYears, examTypes, feeTypes, leaveTypes, periods, documentCategories };

export const TAB_ORDER: TabKey[] = ['academicYears', 'examTypes', 'feeTypes', 'leaveTypes', 'periods', 'documentCategories'];

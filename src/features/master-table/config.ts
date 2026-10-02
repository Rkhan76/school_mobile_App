import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { Draft, MasterEntityMap, TabKey } from './mockMaster';

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
  /** Builds the stored record from form values; `existing` is set when editing. */
  toDraft: (v: FormValues, existing?: MasterEntityMap[K]) => Draft<K>;
  view: (e: MasterEntityMap[K]) => CardView;
  searchText: (e: MasterEntityMap[K]) => string;
  toggle?: { label: string; get: (e: MasterEntityMap[K]) => boolean; patch: (on: boolean) => Partial<Draft<K>> };
  canSetActive?: (e: MasterEntityMap[K]) => boolean;
  deleteBlock?: (e: MasterEntityMap[K]) => string | null;
}

const str = (v: FormValues, k: string): string => {
  const x = v[k];
  return typeof x === 'string' ? x.trim() : '';
};
const requireName = (v: FormValues): Record<string, string> => (str(v, 'name') ? {} : { name: 'Name is required.' });
const bool = (v: FormValues, k: string): boolean => v[k] === true;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parses DD/MM/YYYY into a timestamp, or null when not a real calendar date. */
export function parseDate(s: string): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt.getTime();
}

/** DD/MM/YYYY -> "01 Apr 2026". */
export function formatDate(s: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  return m ? `${m[1]} ${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[3]}` : s;
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
    { key: 'startDate', label: 'Start Date', kind: 'date', placeholder: 'DD/MM/YYYY' },
    { key: 'endDate', label: 'End Date', kind: 'date', placeholder: 'DD/MM/YYYY' },
  ],
  emptyValues: { label: '', startDate: '', endDate: '' },
  toValues: (e) => ({ label: e.label, startDate: e.startDate, endDate: e.endDate }),
  validate: (v) => {
    const err: Record<string, string> = {};
    if (!str(v, 'label')) err.label = 'Academic year is required.';
    const s = parseDate(str(v, 'startDate'));
    const e = parseDate(str(v, 'endDate'));
    if (s === null) err.startDate = 'Enter a valid date as DD/MM/YYYY.';
    if (e === null) err.endDate = 'Enter a valid date as DD/MM/YYYY.';
    if (s !== null && e !== null && e <= s) err.endDate = 'End date must be after start date.';
    return err;
  },
  toDraft: (v, existing) => ({
    label: str(v, 'label'),
    startDate: str(v, 'startDate'),
    endDate: str(v, 'endDate'),
    isActive: existing?.isActive ?? false,
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
    { key: 'isActive', label: 'Active', kind: 'toggle' },
  ],
  emptyValues: { name: '', description: '', isActive: true },
  toValues: (e) => ({ name: e.name, description: e.description, isActive: e.isActive }),
  validate: requireName,
  toDraft: (v) => ({ name: str(v, 'name'), description: str(v, 'description'), isActive: bool(v, 'isActive') }),
  view: (e) => ({
    title: e.name,
    lines: e.description ? [e.description] : [],
    badges: [e.isActive ? { label: 'Active', tone: 'success' } : { label: 'Inactive', tone: 'neutral' }],
  }),
  searchText: (e) => `${e.name} ${e.description}`,
  toggle: { label: 'Active', get: (e) => e.isActive, patch: (on) => ({ isActive: on }) },
};

const feeTypes: TabConfig<'feeTypes'> = {
  key: 'feeTypes',
  label: 'Fee Type',
  icon: 'wallet-outline',
  singular: 'Fee Type',
  searchPlaceholder: 'Search Fee Type...',
  fields: [
    { key: 'name', label: 'Name', kind: 'text', placeholder: 'e.g. Library' },
    { key: 'description', label: 'Description', kind: 'multiline', placeholder: 'Short description' },
  ],
  emptyValues: { name: '', description: '' },
  toValues: (e) => ({ name: e.name, description: e.description }),
  validate: requireName,
  toDraft: (v) => ({ name: str(v, 'name'), description: str(v, 'description') }),
  view: (e) => ({ title: e.name, lines: e.description ? [e.description] : [], badges: [] }),
  searchText: (e) => `${e.name} ${e.description}`,
};

const leaveTypes: TabConfig<'leaveTypes'> = {
  key: 'leaveTypes',
  label: 'Leave Type',
  icon: 'airplane-outline',
  singular: 'Leave Type',
  searchPlaceholder: 'Search Leave Type...',
  fields: [
    { key: 'name', label: 'Name', kind: 'text', placeholder: 'e.g. Maternity' },
    { key: 'daysAllowed', label: 'Days Allowed', kind: 'number', placeholder: 'e.g. 12' },
  ],
  emptyValues: { name: '', daysAllowed: '' },
  toValues: (e) => ({ name: e.name, daysAllowed: String(e.daysAllowed) }),
  validate: (v) => {
    const err: Record<string, string> = {};
    if (!str(v, 'name')) err.name = 'Name is required.';
    const d = str(v, 'daysAllowed');
    if (!/^\d+$/.test(d) || Number(d) < 1 || Number(d) > 365) err.daysAllowed = 'Enter a whole number between 1 and 365.';
    return err;
  },
  toDraft: (v) => ({ name: str(v, 'name'), daysAllowed: Number(str(v, 'daysAllowed')) }),
  view: (e) => ({ title: e.name, lines: [`${e.daysAllowed} days allowed`], badges: [] }),
  searchText: (e) => `${e.name} ${e.daysAllowed}`,
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
  ],
  emptyValues: { name: '', startTime: '', endTime: '' },
  toValues: (e) => ({ name: e.name, startTime: e.startTime, endTime: e.endTime }),
  validate: (v) => {
    const err: Record<string, string> = {};
    if (!str(v, 'name')) err.name = 'Name is required.';
    const s = parseTime(str(v, 'startTime'));
    const e = parseTime(str(v, 'endTime'));
    if (s === null) err.startTime = 'Enter a valid time as HH:MM.';
    if (e === null) err.endTime = 'Enter a valid time as HH:MM.';
    if (s !== null && e !== null && e <= s) err.endTime = 'End time must be after start time.';
    return err;
  },
  toDraft: (v) => ({ name: str(v, 'name'), startTime: str(v, 'startTime'), endTime: str(v, 'endTime') }),
  view: (e) => ({ title: e.name, lines: [`${e.startTime} - ${e.endTime}`], badges: [] }),
  searchText: (e) => `${e.name} ${e.startTime} ${e.endTime}`,
};

const documentCategories: TabConfig<'documentCategories'> = {
  key: 'documentCategories',
  label: 'Document Categories',
  icon: 'folder-open-outline',
  singular: 'Document Category',
  searchPlaceholder: 'Search Document Category...',
  fields: [
    { key: 'name', label: 'Name', kind: 'text', placeholder: 'e.g. Address Proof' },
    { key: 'isMandatory', label: 'Mandatory', kind: 'toggle' },
  ],
  emptyValues: { name: '', isMandatory: false },
  toValues: (e) => ({ name: e.name, isMandatory: e.isMandatory }),
  validate: requireName,
  toDraft: (v) => ({ name: str(v, 'name'), isMandatory: bool(v, 'isMandatory') }),
  view: (e) => ({
    title: e.name,
    lines: [],
    badges: [e.isMandatory ? { label: 'Mandatory', tone: 'warning' } : { label: 'Optional', tone: 'neutral' }],
  }),
  searchText: (e) => e.name,
  toggle: { label: 'Mandatory', get: (e) => e.isMandatory, patch: (on) => ({ isMandatory: on }) },
};

export const CONFIGS = { academicYears, examTypes, feeTypes, leaveTypes, periods, documentCategories };

export const TAB_ORDER: TabKey[] = ['academicYears', 'examTypes', 'feeTypes', 'leaveTypes', 'periods', 'documentCategories'];

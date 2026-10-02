import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import { hasPermission } from './permissions';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  active: boolean;
  /** ISO date yyyy-mm-dd */
  joinedAt: string;
};

export type MemberInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: string;
};

export type Role = {
  id: string;
  name: string;
  description: string;
  /** Permission codes, or ['*'] for everything. */
  permissions: string[];
  system: boolean;
  readOnly: boolean;
};

export type RoleInput = { name: string; description?: string; copyFromId?: string };
export type RolePatch = Partial<Pick<Role, 'name' | 'description' | 'permissions'>>;

export type Permission = { code: string; label: string };
export type PermissionGroup = { key: string; label: string; icon: IconName; permissions: Permission[] };

export type MemberParams = { search: string; roleId: string; page: number; pageSize: number };
export type MemberStats = { total: number; active: number; inactive: number; filtered: number };

export const TODAY_ISO = '2026-10-02';

export function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/* ------------------------------ catalog ------------------------------ */

const p = (code: string, label: string): Permission => ({ code, label });

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'students', label: 'Students', icon: 'school-outline',
    permissions: [
      p('student.list.read', 'View student list'), p('student.profile.read', 'View student profile'),
      p('student.profile.create', 'Admit students'), p('student.profile.update', 'Edit student profile'),
      p('student.profile.delete', 'Remove students'), p('student.attendance.read', 'View attendance'),
    ],
  },
  {
    key: 'teachers', label: 'Teachers', icon: 'person-outline',
    permissions: [
      p('teacher.list.read', 'View teacher list'), p('teacher.profile.read', 'View teacher profile'),
      p('teacher.profile.create', 'Add teachers'), p('teacher.profile.update', 'Edit teacher profile'),
      p('teacher.attendance.mark', 'Mark teacher attendance'),
    ],
  },
  {
    key: 'academics', label: 'Academics', icon: 'book-outline',
    permissions: [
      p('class.list.read', 'View classes'), p('class.manage.update', 'Manage classes'),
      p('subject.list.read', 'View subjects'), p('timetable.view.read', 'View timetable'),
      p('exam.schedule.create', 'Schedule exams'), p('exam.marks.update', 'Enter exam marks'),
    ],
  },
  {
    key: 'fees', label: 'Fees', icon: 'cash-outline',
    permissions: [
      p('fee.structure.read', 'View fee structure'), p('fee.structure.update', 'Edit fee structure'),
      p('fee.payment.read', 'View payments'), p('fee.payment.create', 'Collect payments'),
      p('fee.ledger.read', 'View ledgers'),
    ],
  },
  {
    key: 'reports', label: 'Reports', icon: 'bar-chart-outline',
    permissions: [
      p('report.academic.read', 'Academic reports'), p('report.fees.read', 'Fee reports'),
      p('report.fees.export', 'Export fee reports'), p('report.attendance.export', 'Export attendance'),
    ],
  },
  {
    key: 'communication', label: 'Communication', icon: 'chatbubbles-outline',
    permissions: [
      p('notice.board.read', 'Read notices'), p('notice.board.create', 'Post notices'),
      p('message.inbox.read', 'Read messages'), p('message.inbox.send', 'Send messages'),
      p('event.calendar.create', 'Create events'),
    ],
  },
  {
    key: 'settings', label: 'Settings', icon: 'settings-outline',
    permissions: [
      p('member.list.read', 'View members'), p('member.role.assign', 'Assign roles'),
      p('role.permission.update', 'Edit role permissions'), p('settings.school.update', 'Edit school settings'),
      p('audit.log.read', 'View audit logs'),
    ],
  },
];

export const ALL_PERMISSION_CODES: string[] = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((x) => x.code));

export function usePermissionCatalog() {
  return useMemo(() => ({ data: PERMISSION_GROUPS, codes: ALL_PERMISSION_CODES }), []);
}

/** Number of catalog permissions a role effectively holds. */
export function permissionCount(role: Role): number {
  return ALL_PERMISSION_CODES.filter((c) => hasPermission(c, role.permissions)).length;
}

/* ------------------------------ seed data ------------------------------ */

const SEED_ROLES: Role[] = [
  { id: 'admin', name: 'Admin', description: 'Full access to everything. Cannot be edited.', permissions: ['*'], system: true, readOnly: true },
  {
    id: 'teacher', name: 'Teacher', description: 'Classes, marks and communication with students.', system: true, readOnly: false,
    permissions: [
      'student.list.read', 'student.profile.read', 'student.attendance.read', 'class.list.read', 'subject.list.read',
      'timetable.view.read', 'exam.marks.update', 'report.academic.read', 'notice.board.read', 'message.inbox.read', 'message.inbox.send',
    ],
  },
  {
    id: 'student', name: 'Student', description: 'Own timetable, notices and fee status.', system: true, readOnly: false,
    permissions: ['subject.list.read', 'timetable.view.read', 'fee.payment.read', 'notice.board.read', 'message.inbox.read'],
  },
  {
    id: 'parent', name: 'Parent', description: 'Child profile, fees and messages.', system: true, readOnly: false,
    permissions: ['student.profile.read', 'fee.payment.read', 'fee.payment.create', 'notice.board.read', 'message.inbox.read', 'message.inbox.send'],
  },
  {
    id: 'driver', name: 'Driver', description: 'Transport notices and messages.', system: true, readOnly: false,
    permissions: ['notice.board.read', 'message.inbox.read'],
  },
  {
    id: 'staff', name: 'Staff', description: 'Front-office and accounts support.', system: true, readOnly: false,
    permissions: [
      'student.list.read', 'teacher.list.read', 'fee.payment.read', 'fee.payment.create', 'fee.ledger.read',
      'notice.board.read', 'notice.board.create', 'message.inbox.read',
    ],
  },
];

const FIRST = ['Aarav', 'Diya', 'Kabir', 'Ananya', 'Vihaan', 'Ishita', 'Arjun', 'Saanvi', 'Rohan', 'Meera', 'Aditya', 'Kiara', 'Reyansh', 'Myra', 'Ishaan', 'Navya'];
const LAST = ['Sharma', 'Verma', 'Singh', 'Iyer', 'Patel', 'Nair', 'Reddy', 'Joshi', 'Gupta', 'Mehta', 'Kapoor', 'Das', 'Rao', 'Khan', 'Bose'];
const ROLE_CYCLE = ['student', 'parent', 'student', 'staff', 'student', 'parent', 'driver', 'student', 'admin', 'teacher'];

function buildMembers(count: number): Member[] {
  const seen = new Set<string>();
  const out: Member[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = FIRST[i % FIRST.length];
    const lastName = i < 8 ? LAST[i] : LAST[(i * 7 + Math.floor(i / FIRST.length)) % LAST.length];
    let slug = `${firstName}.${lastName}`.toLowerCase();
    if (seen.has(slug)) slug = `${slug}${i + 1}`;
    seen.add(slug);
    const month = i < 12 ? 9 : 8 - (i % 3);
    const day = i < 12 ? 29 : 28 - (i % 5) * 3;
    out.push({
      id: `m-${i + 1}`,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: `${slug}@verdant.test`,
      phone: `98000000${String(i + 1).padStart(2, '0')}`,
      roleId: i < 12 ? 'teacher' : ROLE_CYCLE[i % ROLE_CYCLE.length],
      active: i % 11 !== 7,
      joinedAt: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    });
  }
  return out;
}

/* ------------------------------ shared store ------------------------------ */

let membersState: Member[] = buildMembers(60);
let rolesState: Role[] = SEED_ROLES;
let seq = 100;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
const getMembers = () => membersState;
const getRoles = () => rolesState;

/** Fake network latency: true on mount and after each refetch. */
function useFakeLoading(ms = 450) {
  const [isLoading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setLoading(true);
    timer.current = setTimeout(() => setLoading(false), ms);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [tick, ms]);
  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { isLoading, refetch };
}

/* ------------------------------ hooks ------------------------------ */

export function useMembers(params: MemberParams) {
  const all = useSyncExternalStore(subscribe, getMembers);
  const { isLoading, refetch } = useFakeLoading();
  const { search, roleId, page, pageSize } = params;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((m) => {
      if (roleId && m.roleId !== roleId) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.phone.includes(q);
    });
  }, [all, search, roleId]);

  const data = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const stats = useMemo<MemberStats>(() => {
    const active = all.filter((m) => m.active).length;
    return { total: all.length, active, inactive: all.length - active, filtered: filtered.length };
  }, [all, filtered]);

  const add = useCallback((input: MemberInput): Member => {
    const first = input.firstName.trim();
    const last = input.lastName.trim();
    const m: Member = {
      id: `m-${++seq}`,
      firstName: first,
      lastName: last,
      name: `${first} ${last}`,
      email: input.email.trim().toLowerCase(),
      phone: input.phone,
      roleId: input.roleId,
      active: true,
      joinedAt: TODAY_ISO,
    };
    membersState = [m, ...membersState];
    emit();
    return m;
  }, []);

  const assignRole = useCallback((id: string, newRoleId: string) => {
    membersState = membersState.map((m) => (m.id === id ? { ...m, roleId: newRoleId } : m));
    emit();
  }, []);

  const setActive = useCallback((id: string, active: boolean) => {
    membersState = membersState.map((m) => (m.id === id ? { ...m, active } : m));
    emit();
  }, []);

  return { data, total: filtered.length, stats, isLoading, refetch, add, assignRole, setActive };
}

export function useRoles() {
  const data = useSyncExternalStore(subscribe, getRoles);
  const { isLoading } = useFakeLoading(300);

  const add = useCallback((input: RoleInput): Role => {
    const src = input.copyFromId ? rolesState.find((r) => r.id === input.copyFromId) : undefined;
    const role: Role = {
      id: `role-${++seq}`,
      name: input.name.trim(),
      description: input.description?.trim() || 'Custom role',
      permissions: src ? (src.permissions.includes('*') ? [...ALL_PERMISSION_CODES] : [...src.permissions]) : [],
      system: false,
      readOnly: false,
    };
    rolesState = [...rolesState, role];
    emit();
    return role;
  }, []);

  const update = useCallback((id: string, patch: RolePatch) => {
    rolesState = rolesState.map((r) => (r.id === id && !r.readOnly ? { ...r, ...patch } : r));
    emit();
  }, []);

  const remove = useCallback((id: string) => {
    rolesState = rolesState.filter((r) => r.id !== id || r.system);
    emit();
  }, []);

  return { data, isLoading, add, update, remove };
}

/** Member count per role id (shared store, so it stays in sync with assignments). */
export function useRoleMemberCounts(): Record<string, number> {
  const all = useSyncExternalStore(subscribe, getMembers);
  return useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of all) out[m.roleId] = (out[m.roleId] ?? 0) + 1;
    return out;
  }, [all]);
}

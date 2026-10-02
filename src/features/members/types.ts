// Types modeled directly off MOBILE_API_DOCS.md sections "12. Members / portal
// accounts (school-users)" and "13. Roles & Permissions (school-rbac)".

export type SchoolUserBaseRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'DRIVER' | 'STAFF' | 'CUSTOM';
export type SchoolUserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

/** GET /school-users row — the flat "all portal accounts" list. */
export interface SchoolUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: SchoolUserBaseRole;
  /** Dynamic role display name, or null (no custom role assigned — base role default applies). */
  roleName: string | null;
  status: SchoolUserStatus;
  createdAt: string;
}

export type ListSchoolUsersParams = {
  page?: number;
  limit?: number;
  role?: SchoolUserBaseRole;
  search?: string;
};

/** GET /rbac/permissions row — fixed, global catalog. */
export interface PermissionCode {
  id: string;
  code: string;
  description: string;
  module: string;
  createdAt: string;
}

export type ListPermissionCatalogParams = {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
};

/** GET /rbac/roles row — this school's roles (list shape omits baseRole/permissions). */
export interface RoleSummary {
  id: string;
  schoolId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type ListRolesParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export interface RolePermissionEntry {
  id: string;
  createdAt: string;
  permission: {
    id: string;
    code: string;
    description: string;
    module: string;
    createdAt: string;
  };
}

/** GET /rbac/roles/:id and POST/PATCH responses — full shape, used to populate an edit screen. */
export interface RoleDetail extends RoleSummary {
  baseRole: SchoolUserBaseRole;
  rolePermissions: RolePermissionEntry[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface AssignUserRoleResult {
  schoolRoleId: string | null;
  baseRole: SchoolUserBaseRole;
}

/**
 * Relative rank used by the backend to decide who may act on whose credentials
 * (resend-invite / reset-password[-plaintext] / toggle-block): only a strictly
 * higher-ranked actor may act, and never on themselves.
 * ADMIN(100) > TEACHER/STAFF(50) > PARENT(30) > STUDENT/DRIVER/CUSTOM(10).
 */
export const SCHOOL_USER_RANK: Record<SchoolUserBaseRole, number> = {
  ADMIN: 100,
  TEACHER: 50,
  STAFF: 50,
  PARENT: 30,
  STUDENT: 10,
  DRIVER: 10,
  CUSTOM: 10,
};

/** Mirrors the backend's self/rank check client-side so we can pre-emptively hide actions. */
export function canActOnCredentials(
  actorId: string | undefined,
  actorRole: string | undefined,
  target: SchoolUser
): boolean {
  if (!actorId || !actorRole) return false;
  if (target.id === actorId) return false;
  const actorRank = SCHOOL_USER_RANK[actorRole as SchoolUserBaseRole] ?? 0;
  const targetRank = SCHOOL_USER_RANK[target.role] ?? 0;
  return actorRank > targetRank;
}

export const ROLE_FILTER_OPTIONS: { value: SchoolUserBaseRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'CUSTOM', label: 'Custom' },
];

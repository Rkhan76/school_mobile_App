import { apiRequest } from '../../lib/apiClient';
import type { PaginatedResult } from '../common/types';
import type {
  AssignUserRoleResult,
  CreateRolePayload,
  ListPermissionCatalogParams,
  ListRolesParams,
  ListSchoolUsersParams,
  PermissionCode,
  RoleDetail,
  RoleSummary,
  SchoolUser,
  UpdateRolePayload,
} from './types';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

/* ------------------------------ school-users (Members tab) ------------------------------ */

export async function listSchoolUsers(params: ListSchoolUsersParams): Promise<PaginatedResult<SchoolUser>> {
  return apiRequest<PaginatedResult<SchoolUser>>(`/school-users${buildQuery(params)}`);
}

export async function resendInvite(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/school-users/${id}/resend-invite`, { method: 'POST' });
}

export async function resetPassword(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/school-users/${id}/reset-password`, { method: 'PATCH' });
}

/** Only works if the account has no email on file — sets & returns a one-time-shown password. */
export async function resetPasswordPlaintext(
  id: string
): Promise<{ message: string; username: string; temporaryPassword: string }> {
  return apiRequest<{ message: string; username: string; temporaryPassword: string }>(
    `/school-users/${id}/reset-password-plaintext`,
    { method: 'PATCH' }
  );
}

export async function toggleSchoolUserBlock(id: string): Promise<{ id: string; blocked: boolean }> {
  return apiRequest<{ id: string; blocked: boolean }>(`/school-users/${id}/toggle-block`, { method: 'PATCH' });
}

/* ------------------------------ rbac (Roles + Permissions tabs) ------------------------------ */

export async function listPermissionCatalog(
  params: ListPermissionCatalogParams
): Promise<PaginatedResult<PermissionCode>> {
  return apiRequest<PaginatedResult<PermissionCode>>(`/rbac/permissions${buildQuery(params)}`);
}

export async function listRoles(params: ListRolesParams): Promise<PaginatedResult<RoleSummary>> {
  return apiRequest<PaginatedResult<RoleSummary>>(`/rbac/roles${buildQuery(params)}`);
}

/** Full shape w/ nested rolePermissions — use this, not listRoles, to populate an edit screen. */
export async function getRole(id: string): Promise<RoleDetail> {
  return apiRequest<RoleDetail>(`/rbac/roles/${id}`);
}

/** 403 if you try to grant a permission code you don't hold yourself. */
export async function createRole(payload: CreateRolePayload): Promise<RoleDetail> {
  return apiRequest<RoleDetail>('/rbac/roles', { method: 'POST', body: payload });
}

/** 400 if targeting the default ADMIN role's permissions specifically (name/description still editable on it). */
export async function updateRole(id: string, payload: UpdateRolePayload): Promise<RoleDetail> {
  return apiRequest<RoleDetail>(`/rbac/roles/${id}`, { method: 'PATCH', body: payload });
}

/** 400 if default role or still has members assigned. */
export async function deleteRole(id: string): Promise<void> {
  await apiRequest<void>(`/rbac/roles/${id}`, { method: 'DELETE' });
}

/** Pass schoolRoleId: null to reset the user back to their base role's default role. */
export async function assignUserRole(
  schoolUserId: string,
  schoolRoleId: string | null
): Promise<AssignUserRoleResult> {
  return apiRequest<AssignUserRoleResult>(`/rbac/users/${schoolUserId}/role`, {
    method: 'PATCH',
    body: { schoolRoleId },
  });
}

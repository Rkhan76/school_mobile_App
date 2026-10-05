import { useCallback } from 'react';
import { useSession } from './session';

/**
 * Who may see a navigation entry / dashboard block.
 * - `anyOf`: the user needs at least one of these permissions (omit = no permission needed).
 * - `hideForRoles`: hardcoded UI defaults - these roles never see the entry even if the permission list
 *   would allow it (or when we don't know the exact permission name for an admin-only screen).
 */
export type Access = {
  anyOf?: string[];
  hideForRoles?: string[];
};

export function isAllowed(access: Access | undefined, role: string | null | undefined, permissions: string[]): boolean {
  if (!access) return true;
  if (role && access.hideForRoles?.some((r) => r.toUpperCase() === role.toUpperCase())) return false;
  if (access.anyOf && access.anyOf.length > 0) return access.anyOf.some((p) => permissions.includes(p));
  return true;
}

/** Returns `can(access)` bound to the signed-in user's role and permissions. */
export function useAccess(): (access?: Access) => boolean {
  const role = useSession((s) => s.user?.role);
  const permissions = useSession((s) => s.permissions);
  return useCallback((access?: Access) => isAllowed(access, role, permissions), [role, permissions]);
}

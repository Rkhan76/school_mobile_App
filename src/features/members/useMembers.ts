import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../../lib/apiClient';
import {
  assignUserRole,
  createRole,
  deleteRole,
  getRole,
  listPermissionCatalog,
  listRoles,
  listSchoolUsers,
  resendInvite as apiResendInvite,
  resetPassword as apiResetPassword,
  resetPasswordPlaintext as apiResetPasswordPlaintext,
  toggleSchoolUserBlock,
  updateRole,
} from './api';
import type {
  AssignUserRoleResult,
  CreateRolePayload,
  PermissionCode,
  RoleDetail,
  RoleSummary,
  SchoolUser,
  SchoolUserBaseRole,
  UpdateRolePayload,
} from './types';

export const PAGE_SIZE = 20;

export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong.';
}

/* =============================== Members (school-users) =============================== */

export type UseMembersParams = { search?: string; role?: SchoolUserBaseRole | '' };

export interface UseMembersResult {
  data: SchoolUser[];
  total: number;
  stats: { total: number; activeLoaded: number; blockedLoaded: number };
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
  resendInvite: (id: string) => Promise<boolean>;
  resetPassword: (id: string) => Promise<boolean>;
  resetPasswordPlaintext: (id: string) => Promise<{ username: string; temporaryPassword: string } | null>;
  toggleBlock: (id: string) => Promise<boolean>;
  assignRole: (id: string, schoolRoleId: string | null) => Promise<AssignUserRoleResult | null>;
}

/**
 * Infinite-scroll school-user list backed by GET /school-users. Resets to page 1
 * whenever search/role changes. No stats endpoint exists for this list — `stats.total`
 * comes from the paginated response's true total, active/blocked counts are over
 * whatever has been loaded so far only.
 */
export function useMembers(params: UseMembersParams): UseMembersResult {
  const { search, role } = params;
  const [data, setData] = useState<SchoolUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      const myRequest = ++requestId.current;
      if (replace) setIsLoading(true);
      else setIsLoadingMore(true);
      try {
        const result = await listSchoolUsers({
          page: pageToLoad,
          limit: PAGE_SIZE,
          role: role || undefined,
          search: search || undefined,
        });
        if (myRequest !== requestId.current) return;
        setData((prev) => (replace ? result.data : [...prev, ...result.data]));
        setTotal(result.total);
        setTotalPages(Math.max(1, result.totalPages));
        setPage(result.page);
      } catch (err) {
        if (myRequest !== requestId.current) return;
        if (replace) {
          setData([]);
          setTotal(0);
          setTotalPages(1);
        }
        Alert.alert('Error', errorMessage(err));
      } finally {
        if (myRequest === requestId.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [role, search]
  );

  useEffect(() => {
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role]);

  const refetch = useCallback(() => fetchPage(1, true), [fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || page >= totalPages) return;
    fetchPage(page + 1, false);
  }, [fetchPage, isLoading, isLoadingMore, page, totalPages]);

  const stats = useMemo(
    () => ({
      total,
      activeLoaded: data.filter((m) => m.status === 'ACTIVE').length,
      blockedLoaded: data.filter((m) => m.status !== 'ACTIVE').length,
    }),
    [data, total]
  );

  const resendInvite = useCallback(async (id: string) => {
    try {
      const res = await apiResendInvite(id);
      Alert.alert('Invite sent', res.message);
      return true;
    } catch (err) {
      Alert.alert('Could not resend invite', errorMessage(err));
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (id: string) => {
    try {
      const res = await apiResetPassword(id);
      Alert.alert('Password reset', res.message);
      return true;
    } catch (err) {
      Alert.alert('Could not reset password', errorMessage(err));
      return false;
    }
  }, []);

  const resetPasswordPlaintext = useCallback(async (id: string) => {
    try {
      const res = await apiResetPasswordPlaintext(id);
      return { username: res.username, temporaryPassword: res.temporaryPassword };
    } catch (err) {
      Alert.alert('Could not reset password', errorMessage(err));
      return null;
    }
  }, []);

  const toggleBlock = useCallback(async (id: string) => {
    try {
      const res = await toggleSchoolUserBlock(id);
      setData((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: res.blocked ? 'INACTIVE' : 'ACTIVE' } : m))
      );
      return true;
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
      return false;
    }
  }, []);

  const assignRole = useCallback(
    async (id: string, schoolRoleId: string | null) => {
      try {
        const res = await assignUserRole(id, schoolRoleId);
        // The response only carries {schoolRoleId, baseRole} — not the dynamic role's
        // display name — so refetch to pick up the fresh role/roleName from the server.
        fetchPage(1, true);
        return res;
      } catch (err) {
        Alert.alert('Could not assign role', errorMessage(err));
        return null;
      }
    },
    [fetchPage]
  );

  return {
    data,
    total,
    stats,
    isLoading,
    isLoadingMore,
    hasMore: page < totalPages,
    loadMore,
    refetch,
    resendInvite,
    resetPassword,
    resetPasswordPlaintext,
    toggleBlock,
    assignRole,
  };
}

/* =============================== Roles (rbac) =============================== */

export interface UseRolesResult {
  data: RoleSummary[];
  isLoading: boolean;
  refetch: () => void;
  add: (payload: CreateRolePayload) => Promise<RoleDetail | null>;
  update: (id: string, payload: UpdateRolePayload) => Promise<RoleDetail | null>;
  remove: (id: string) => Promise<boolean>;
}

/** Roles are usually few per school — fetch one big page rather than paginate the UI. */
export function useRoles(): UseRolesResult {
  const [data, setData] = useState<RoleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  const fetchAll = useCallback(async () => {
    const id = ++requestId.current;
    setIsLoading(true);
    try {
      const result = await listRoles({ page: 1, limit: 100 });
      if (requestId.current !== id) return;
      setData(result.data);
    } catch (err) {
      if (requestId.current !== id) return;
      Alert.alert('Error', errorMessage(err));
    } finally {
      if (requestId.current === id) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const add = useCallback(
    async (payload: CreateRolePayload) => {
      try {
        const role = await createRole(payload);
        fetchAll();
        return role;
      } catch (err) {
        Alert.alert('Could not create role', errorMessage(err));
        return null;
      }
    },
    [fetchAll]
  );

  const update = useCallback(
    async (id: string, payload: UpdateRolePayload) => {
      try {
        const role = await updateRole(id, payload);
        fetchAll();
        return role;
      } catch (err) {
        Alert.alert('Could not save role', errorMessage(err));
        return null;
      }
    },
    [fetchAll]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteRole(id);
        fetchAll();
        return true;
      } catch (err) {
        Alert.alert('Cannot delete role', errorMessage(err));
        return false;
      }
    },
    [fetchAll]
  );

  return { data, isLoading, refetch: fetchAll, add, update, remove };
}

/** Fetches one role's full detail (incl. rolePermissions) on demand, e.g. to populate an editor. */
export function useRoleDetail(id: string | null) {
  const [detail, setDetail] = useState<RoleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!id) {
      setDetail(null);
      return;
    }
    const myRequest = ++requestId.current;
    setIsLoading(true);
    setDetail(null);
    getRole(id)
      .then((d) => {
        if (myRequest === requestId.current) setDetail(d);
      })
      .catch((err) => {
        if (myRequest === requestId.current) Alert.alert('Error', errorMessage(err));
      })
      .finally(() => {
        if (myRequest === requestId.current) setIsLoading(false);
      });
  }, [id]);

  return { detail, isLoading };
}

/* =============================== Permission catalog (rbac) =============================== */

export interface PermissionCatalogGroup {
  module: string;
  permissions: PermissionCode[];
}

/**
 * Fetches the full, fixed permission catalog (a few hundred rows, static reference
 * data) a page at a time, and groups it by `module` for the checkbox UI.
 */
export function usePermissionCatalog() {
  const [data, setData] = useState<PermissionCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let page = 1;
        let all: PermissionCode[] = [];
        for (;;) {
          const result = await listPermissionCatalog({ page, limit: 100 });
          all = all.concat(result.data);
          if (page >= result.totalPages) break;
          page += 1;
        }
        if (!cancelled) setData(all);
      } catch (err) {
        if (!cancelled) Alert.alert('Error', errorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo<PermissionCatalogGroup[]>(() => {
    const byModule = new Map<string, PermissionCode[]>();
    data.forEach((p) => {
      const arr = byModule.get(p.module) ?? [];
      arr.push(p);
      byModule.set(p.module, arr);
    });
    return Array.from(byModule.entries())
      .map(([module, permissions]) => ({ module, permissions }))
      .sort((a, b) => a.module.localeCompare(b.module));
  }, [data]);

  return { data, groups, isLoading };
}

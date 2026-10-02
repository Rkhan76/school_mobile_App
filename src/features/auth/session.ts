import { create } from 'zustand';

import { setAccessToken, configureAuthHooks, ApiError } from '../../lib/apiClient';
import { getRefreshToken, setRefreshToken, clearRefreshToken } from '../../lib/secureStorage';
import { login as apiLogin, refreshSession as apiRefreshSession, logoutRequest } from './api';
import { isRequiresSchoolSelection } from './types';
import type { User, SchoolOption } from './types';

type Status = 'idle' | 'bootstrapping' | 'authed' | 'unauthed';

type SessionState = {
  status: Status;
  user: User | null;
  school: { name: string } | null;
  permissions: string[];
  pendingSchools: SchoolOption[] | null;
  loading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (username: string, password: string, schoolId?: string) => Promise<void>;
  clearPendingSchools: () => void;
  clearError: () => void;
  logout: () => Promise<void>;
};

export const useSession = create<SessionState>((set) => ({
  status: 'idle',
  user: null,
  school: null,
  permissions: [],
  pendingSchools: null,
  loading: false,
  error: null,

  bootstrap: async () => {
    set({ status: 'bootstrapping' });
    const token = await getRefreshToken();
    if (!token) {
      set({ status: 'unauthed' });
      return;
    }
    try {
      const result = await apiRefreshSession(token);
      setAccessToken(result.accessToken);
      await setRefreshToken(result.refreshToken);
      set({
        user: result.user,
        permissions: result.permissions,
        school: null,
        status: 'authed',
      });
    } catch {
      await clearRefreshToken();
      setAccessToken(null);
      set({ status: 'unauthed' });
    }
  },

  login: async (username, password, schoolId) => {
    set({ loading: true, error: null });
    try {
      const result = await apiLogin({ username, password, schoolId });
      if (isRequiresSchoolSelection(result)) {
        set({ pendingSchools: result.schools, loading: false });
        return;
      }
      setAccessToken(result.accessToken);
      await setRefreshToken(result.refreshToken);
      set({
        user: result.user,
        school: result.school,
        permissions: result.permissions,
        pendingSchools: null,
        status: 'authed',
        loading: false,
      });
    } catch (err) {
      let message = 'Something went wrong. Please try again.';
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          message = 'Invalid email or password.';
        } else if (err.statusCode === 429) {
          message = 'Too many attempts. Please wait a minute and try again.';
        }
      }
      set({ error: message, loading: false });
    }
  },

  clearPendingSchools: () => set({ pendingSchools: null }),

  clearError: () => set({ error: null }),

  logout: async () => {
    const token = await getRefreshToken();
    if (token) {
      try {
        await logoutRequest(token);
      } catch {
        // Ignore: session is cleared locally regardless.
      }
    }
    await clearRefreshToken();
    setAccessToken(null);
    set({
      user: null,
      school: null,
      permissions: [],
      pendingSchools: null,
      status: 'unauthed',
    });
  },
}));

configureAuthHooks({
  refresh: async () => {
    const token = await getRefreshToken();
    if (!token) {
      throw new Error('No refresh token available');
    }
    const result = await apiRefreshSession(token);
    await setRefreshToken(result.refreshToken);
    setAccessToken(result.accessToken);
    useSession.setState({
      user: result.user,
      permissions: result.permissions,
    });
    return result.accessToken;
  },
  onAuthExpired: () => {
    void clearRefreshToken();
    setAccessToken(null);
    useSession.setState({
      status: 'unauthed',
      user: null,
      school: null,
      permissions: [],
      pendingSchools: null,
    });
  },
});

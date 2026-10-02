import { apiRequest } from '../../lib/apiClient';
import type { LoginResult, RefreshResult } from './types';

export async function login(params: {
  username: string;
  password: string;
  schoolId?: string;
}): Promise<LoginResult> {
  return apiRequest<LoginResult>('/auth/login', {
    method: 'POST',
    headers: { 'X-Client-Type': 'mobile' },
    body: params,
    skipAuth: true,
  });
}

export async function refreshSession(refreshToken: string): Promise<RefreshResult> {
  return apiRequest<RefreshResult>('/auth/refresh', {
    method: 'POST',
    headers: { 'X-Client-Type': 'mobile' },
    body: { refreshToken },
    skipAuth: true,
  });
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  try {
    await apiRequest<void>('/auth/logout', {
      method: 'POST',
      headers: { 'X-Client-Type': 'mobile' },
      body: { refreshToken },
      skipAuth: true,
    });
  } catch {
    // Logout must always succeed from the client's perspective per the API doc.
  }
}

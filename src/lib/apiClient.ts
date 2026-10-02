import { API_BASE_URL } from '../config';

export class ApiError extends Error {
  statusCode: number;
  body: unknown;

  constructor(statusCode: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

type AuthHooks = {
  refresh: () => Promise<string>;
  onAuthExpired: () => void;
};

let accessToken: string | null = null;
let authHooks: AuthHooks | null = null;
let inFlightRefresh: Promise<string> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function configureAuthHooks(hooks: AuthHooks): void {
  authHooks = hooks;
}

function extractMessage(body: unknown): string | undefined {
  if (
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof (body as { message?: unknown }).message === 'string'
  ) {
    return (body as { message: string }).message;
  }
  return undefined;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function getSharedRefreshPromise(): Promise<string> {
  if (!authHooks) {
    return Promise.reject(new Error('Auth hooks not configured'));
  }
  if (!inFlightRefresh) {
    inFlightRefresh = authHooks.refresh();
    // Prevent an unhandled-rejection warning on the cleanup chain; the
    // original promise returned below still carries the rejection to callers.
    inFlightRefresh.catch(() => {}).finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

async function performRequest<T>(
  path: string,
  options: ApiRequestOptions,
  isRetry: boolean
): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const requestHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...headers,
  };

  if (!skipAuth && accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const url = `${API_BASE_URL}${path}`;
  if (__DEV__) {
    console.log(`[api] → ${method} ${url}`);
    console.log('[api]   headers:', requestHeaders);
    console.log('[api]   body:', isFormData ? '(multipart form data)' : body ?? '(none)');
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const parsedBody = await parseResponseBody(response);

  if (__DEV__) {
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log(`[api] ← ${response.status} ${method} ${url}`);
    console.log('[api]   headers:', responseHeaders);
    console.log('[api]   body:', parsedBody ?? '(none)');
  }

  if (response.ok) {
    return parsedBody as T;
  }

  if (response.status === 401 && !skipAuth && !isRetry) {
    if (!authHooks) {
      throw new ApiError(401, extractMessage(parsedBody) ?? 'Session expired', parsedBody);
    }

    try {
      const newToken = await getSharedRefreshPromise();
      setAccessToken(newToken);
    } catch {
      authHooks.onAuthExpired();
      throw new ApiError(401, extractMessage(parsedBody) ?? 'Session expired', parsedBody);
    }

    try {
      return await performRequest<T>(path, options, true);
    } catch (retryError) {
      authHooks.onAuthExpired();
      if (retryError instanceof ApiError) {
        throw new ApiError(
          401,
          extractMessage(retryError.body) ?? 'Session expired',
          retryError.body
        );
      }
      throw new ApiError(401, 'Session expired');
    }
  }

  throw new ApiError(response.status, extractMessage(parsedBody) ?? 'Request failed', parsedBody);
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return performRequest<T>(path, options, false);
}

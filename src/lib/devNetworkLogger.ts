// Dev-only: wraps global fetch and forwards every call to the local viewer
// (`npm run network` -> http://localhost:9090). No-op in production builds.
import Constants from 'expo-constants';
import { API_BASE_URL } from '../config';

const VIEWER_PORT = 9090;
const MAX_BODY = 200_000;

function viewerUrl(): string {
  // The Metro host is the dev PC, so this works on any machine without config.
  const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
  const host = metroHost || new URL(API_BASE_URL).hostname;
  return `http://${host}:${VIEWER_PORT}/log`;
}

function headersToObject(h: Headers | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  h?.forEach((v, k) => { out[k] = v; });
  return out;
}

function describeBody(body: unknown): string | undefined {
  if (body == null) return undefined;
  if (typeof body === 'string') return body.slice(0, MAX_BODY);
  if (typeof FormData !== 'undefined' && body instanceof FormData) return '(multipart form data)';
  return '(binary body)';
}

if (__DEV__) {
  // Fast Refresh re-evaluates this module; always wrap the real fetch, never our own wrapper,
  // otherwise every call gets logged once per reload.
  const g = globalThis as typeof globalThis & { __realFetch?: typeof fetch };
  const originalFetch = (g.__realFetch ??= globalThis.fetch);
  const endpoint = viewerUrl();
  let seq = 0;
  let warned = false;

  const send = (entry: object) => {
    // Use the original fetch so the logger never logs itself.
    originalFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch((e) => {
      if (!warned) {
        warned = true;
        console.warn(`[network-viewer] cannot reach ${endpoint} (${e}). Is "npm run network" running and port ${VIEWER_PORT} open in the firewall?`);
      }
    });
  };

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url === endpoint) return originalFetch(input, init);

    const id = `${Date.now()}-${++seq}`;
    const started = Date.now();
    const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
    const base = {
      id,
      method,
      url,
      startedAt: started,
      requestHeaders: headersToObject(new Headers(init?.headers)),
      requestBody: describeBody(init?.body),
    };

    // Show the request immediately so hanging/never-answered calls are visible.
    send({ ...base, pending: true });

    try {
      const response = await originalFetch(input, init);
      const contentType = response.headers.get('content-type') ?? '';
      let responseBody: string | undefined;
      if (/json|text|xml|html/i.test(contentType)) {
        responseBody = (await response.clone().text()).slice(0, MAX_BODY);
      } else {
        responseBody = `(${contentType || 'unknown type'})`;
      }
      send({
        ...base,
        status: response.status,
        statusText: response.statusText,
        durationMs: Date.now() - started,
        responseHeaders: headersToObject(response.headers),
        responseBody,
      });
      return response;
    } catch (e) {
      send({ ...base, status: 0, durationMs: Date.now() - started, error: String(e) });
      throw e;
    }
  };
}

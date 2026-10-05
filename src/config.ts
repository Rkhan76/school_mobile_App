import Constants from 'expo-constants';

const API_PORT = 5001;

// In dev the backend runs on the same machine as Metro, so reuse Metro's host
// instead of hardcoding a LAN IP that changes per network / per PC.
// Override with EXPO_PUBLIC_API_URL (e.g. for a deployed backend).
function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${metroHost ?? 'localhost'}:${API_PORT}/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl();

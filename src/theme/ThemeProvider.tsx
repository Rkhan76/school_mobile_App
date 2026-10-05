import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { setThemeName, type ThemeName } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme_mode';

interface ThemeContextValue {
  /** What the user picked. */
  mode: ThemeMode;
  /** What is actually showing (system resolved to light/dark). */
  resolved: ThemeName;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ mode: 'system', resolved: 'light', setMode: () => {} });

export const useTheme = () => useContext(ThemeContext);

/**
 * Styles read `colors` / `themed(...)` from tokens.ts, so a theme change has to rebuild the tree:
 * the children are remounted (keyed by the resolved theme) once the palette is switched.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((v) => {
        if (v === 'system' || v === 'light' || v === 'dark') setModeState(v);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const resolved: ThemeName = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  // Must happen before any child renders; idempotent, so safe to do during render.
  setThemeName(resolved);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  if (!ready) return null;
  return (
    <ThemeContext.Provider value={value}>
      <Fragment key={resolved}>{children}</Fragment>
    </ThemeContext.Provider>
  );
}

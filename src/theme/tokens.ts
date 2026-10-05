const lightColors = {
  primary: '#25a194',
  primaryDark: '#1d9589',
  primaryDeep: '#0f6b60',
  primaryDarkest: '#0a3330',
  mint: '#dff5f1',
  mintSoft: '#eefaf8',
  background: '#f1fbf9',
  backgroundGlass: 'rgba(241,251,249,0.96)',
  topTint: '#e6f8f4',
  bottomTint: '#f7fffd',
  card: 'rgba(255,255,255,0.92)',
  cardSolid: '#ffffff',
  border: '#e3efed',
  neutralBg: '#eef2f1',
  text: '#0f1f1d',
  textSecondary: '#5b6b69',
  textHint: '#94a3a1',
  success: '#16a34a',
  successBg: '#dcfce7',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  dangerBorder: '#fecaca',
  warning: '#d97706',
  warningBg: '#fef3c7',
  blue: '#3b82f6',
  indigo: '#6366f1',
  purple: '#a855f7',
  orange: '#f97316',
  white: '#ffffff',
};

export type Palette = { [K in keyof typeof lightColors]: string };

const darkColors: Palette = {
  ...lightColors,
  primaryDeep: '#5fd4c6',
  mint: '#17332f',
  mintSoft: '#122825',
  background: '#0c1514',
  backgroundGlass: 'rgba(12,21,20,0.96)',
  topTint: '#10211f',
  bottomTint: '#0c1514',
  card: 'rgba(22,35,33,0.92)',
  cardSolid: '#162321',
  border: '#26393a',
  neutralBg: '#1f2d2b',
  text: '#e8f2f0',
  textSecondary: '#9db1ae',
  textHint: '#6f8683',
  success: '#4ade80',
  successBg: 'rgba(74,222,128,0.16)',
  danger: '#f87171',
  dangerBg: 'rgba(248,113,113,0.16)',
  dangerBorder: 'rgba(248,113,113,0.35)',
  warning: '#fbbf24',
  warningBg: 'rgba(251,191,36,0.16)',
};

export type ThemeName = 'light' | 'dark';

const palettes: Record<ThemeName, Palette> = { light: lightColors, dark: darkColors };
let currentName: ThemeName = 'light';

/** Switches the palette read by `colors` / `themed`. The ThemeProvider remounts the tree after calling this. */
export function setThemeName(name: ThemeName) {
  currentName = name;
}

/** Live view of the active palette: read it during render (or inside `themed`), never cache it at module level. */
export const colors: Palette = new Proxy({} as Palette, {
  get: (_, key) => palettes[currentName][key as keyof Palette],
  ownKeys: () => Reflect.ownKeys(palettes[currentName]),
  getOwnPropertyDescriptor: (_, key) => ({
    enumerable: true,
    configurable: true,
    value: palettes[currentName][key as keyof Palette],
  }),
});

/**
 * Lazy, per-theme version of a style sheet: `const styles = themed(() => StyleSheet.create({...}))`.
 * The factory re-runs once per theme so `colors.*` inside it resolve to the active palette.
 */
export function themed<T extends object>(factory: () => T): T {
  const cache: Partial<Record<ThemeName, T>> = {};
  const resolve = (): T => (cache[currentName] ??= factory());
  return new Proxy({} as T, {
    get: (_, key) => resolve()[key as keyof T],
    has: (_, key) => key in resolve(),
    ownKeys: () => Reflect.ownKeys(resolve()),
    getOwnPropertyDescriptor: (_, key) => ({
      enumerable: true,
      configurable: true,
      value: resolve()[key as keyof T],
    }),
  });
}

export const fonts = {
  heading: 'PlusJakartaSans_700Bold',
  headingExtra: 'PlusJakartaSans_800ExtraBold',
  headingSemi: 'PlusJakartaSans_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 } as const;

export const shadow = {
  card: {
    shadowColor: '#0a3330',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

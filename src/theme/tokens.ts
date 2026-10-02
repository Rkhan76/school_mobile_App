export const colors = {
  primary: '#25a194',
  primaryDark: '#1d9589',
  primaryDeep: '#0f6b60',
  primaryDarkest: '#0a3330',
  mint: '#dff5f1',
  mintSoft: '#eefaf8',
  background: '#f1fbf9',
  card: 'rgba(255,255,255,0.92)',
  cardSolid: '#ffffff',
  border: '#e3efed',
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
} as const;

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

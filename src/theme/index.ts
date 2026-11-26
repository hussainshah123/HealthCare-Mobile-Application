export const colors = {
  // Water-blue medical palette. `primary` keeps 5:1 contrast with white text.
  primary: '#0369A1',
  primaryDark: '#024873',
  primaryLight: '#D6EEFA',
  /** Lighter aqua used as the second gradient stop and for highlights. */
  aqua: '#0EA5E9',
  accent: '#0891B2',
  /**
   * Screen roots stay transparent so the floating-capsule MedicalBackdrop
   * (painted in `canvas`) shows behind every screen. Cards use `surface`.
   */
  background: 'transparent',
  canvas: '#E3F2FA',
  canvasDeep: '#C9E6F5',
  surface: '#FFFFFF',
  text: '#0B2135',
  textMuted: '#4A6275',
  border: '#C3DDEC',
  // Capsule colours for the background animation (kept soft so they sit behind content).
  pillRed: '#F2777A',
  pillBlue: '#38BDF8',
  pillYellow: '#FACC15',
  pillPurple: '#A78BFA',
  pillPink: '#F9A8D4',
  pillGreen: '#34D399',
  success: '#2E9E5B',
  warning: '#E0A100',
  danger: '#D64545',
  info: '#2F80ED',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
  small: { fontSize: 11, color: colors.textMuted },
};

export const theme = { colors, spacing, radius, typography };
export type Theme = typeof theme;

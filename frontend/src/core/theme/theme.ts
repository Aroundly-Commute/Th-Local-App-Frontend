export const verdexColors = {
  g900: '#0A1628',
  g800: '#0F2240',
  g700: '#142E58',
  g600: '#1A4070',
  g500: '#00B5A0',
  g400: '#00D4BC',
  g300: '#4DE8D8',
  g200: '#99F0E8',
  g100: '#CCF7F3',
  g50:  '#E8FBF9',
  lime: '#00E5CC',
  lime2:'#55EEE0',
  surf: '#FFFFFF',
  surf3:'#E8FBF9',
  warn: '#F59E0B',
  red:  '#EF4444',
  txt:  '#0A1628',
  txt2: '#1A4060',
  txt3: '#6AA8C0',
};

export const lightTheme = {
  primary:         verdexColors.g800,
  primaryContrast: verdexColors.lime,
  secondary:       verdexColors.g600,
  background:      verdexColors.surf,
  surface:         verdexColors.surf,
  surfaceElevated: verdexColors.g50,
  muted:           verdexColors.surf3,
  textPrimary:     verdexColors.g900,
  textSecondary:   verdexColors.g600,
  textTertiary:    '#6AA8C0',
  border:          verdexColors.g200,
  success:         verdexColors.g500,
  successBg:       verdexColors.g50,
  error:           verdexColors.red,
  errorBg:         '#FEE2E2',
  warning:         verdexColors.warn,
  warningBg:       '#FEF9C3',
  accent:          verdexColors.g400,
  accentBg:        verdexColors.g100,
  mint:            verdexColors.g400,
  mintBg:          verdexColors.g50,
  shimmerBase:     verdexColors.g100,
  shimmerHighlight:verdexColors.g50,
  isDark: false,
};

export const darkTheme = {
  ...lightTheme,
  isDark: false,
};

export type Theme = typeof lightTheme;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 18, xl: 24, xxl: 40 };
export const radius  = { sm: 8, md: 12, lg: 16, xl: 24, pill: 9999 };

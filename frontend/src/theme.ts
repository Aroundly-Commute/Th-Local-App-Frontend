export const lightTheme = {
  primary: '#1B5E20',
  primaryContrast: '#FFFFFF',
  secondary: '#81C784',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#0A120D',
  textSecondary: '#4A5D52',
  border: '#E0E8E2',
  success: '#4CAF50',
  error: '#E53935',
  shimmerBase: '#E0E8E2',
  shimmerHighlight: '#F5F5F5',
  isDark: false,
};

export const darkTheme = {
  primary: '#81C784',
  primaryContrast: '#0B1411',
  secondary: '#1B5E20',
  background: '#0B1411',
  surface: '#121F1A',
  surfaceElevated: '#182A23',
  textPrimary: '#E8F0EB',
  textSecondary: '#8FA89A',
  border: '#21362C',
  success: '#81C784',
  error: '#EF5350',
  shimmerBase: '#182A23',
  shimmerHighlight: '#21362C',
  isDark: true,
};

export type Theme = typeof lightTheme;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 8, md: 16, lg: 24, xl: 32, pill: 9999 };

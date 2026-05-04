import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const COLORS = {
  // Light Theme (Clean Professional)
  light: {
    primary: '#2563eb',      // Blue 600
    background: '#f8fafc',   // Slate 50
    surface: '#ffffff',      // White
    surfaceLight: '#f1f5f9', // Slate 100
    text: '#0f172a',         // Slate 900
    textMuted: '#475569',    // Slate 600
    textDim: '#94a3b8',      // Slate 400
    accent: '#3b82f6',       // Blue 500
    danger: '#ef4444',       // Red 500
    success: '#22c55e',      // Green 500
    info: '#0ea5e9',         // Sky 500
    warning: '#f59e0b',      // Amber 500
  },
  // Dark Theme (Deep Onyx)
  dark: {
    primary: '#60a5fa',      // Blue 400 (Brighter for OLED)
    background: '#000000',   // Pure Black for OLED
    surface: '#0a0a0a',      // Deep Obsidian
    surfaceLight: '#171717', // Dark Graphite
    text: '#f8fafc',         // Slate 50
    textMuted: '#cbd5e1',    // Slate 300
    textDim: '#64748b',      // Slate 500
    accent: '#3b82f6',       // Blue 500
    danger: '#f87171',       // Red 400
    success: '#4ade80',      // Green 400
    info: '#38bdf8',         // Sky 400
    warning: '#fbbf24',      // Amber 400
  }
};

export const paperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.light.primary,
    background: COLORS.light.background,
    surface: COLORS.light.surface,
  },
};

export const paperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.dark.primary,
    background: COLORS.dark.background,
    surface: COLORS.dark.surface,
    onSurface: COLORS.dark.text,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const FONTS = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
};

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f87171',          // Red
  Transport: '#60a5fa',     // Blue
  Shopping: '#fbbf24',      // Amber
  Bills: '#c084fc',         // Purple
  Entertainment: '#4ade80', // Green
  Health: '#fb7185',        // Rose
  Other: '#94a3b8',         // Slate
};

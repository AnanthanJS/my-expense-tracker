import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const COLORS = {
  // Light Theme — Vibrant Indigo/Violet
  light: {
    primary: '#7C3AED',         // Violet 600
    primaryLight: '#A78BFA',    // Violet 400
    primaryDark: '#5B21B6',     // Violet 800
    secondary: '#EC4899',       // Pink 500
    background: '#F5F3FF',      // Violet 50
    surface: '#FFFFFF',
    surfaceLight: '#EDE9FE',    // Violet 100
    surfaceElevated: '#F8F7FF', // Light elevated
    text: '#1E1B4B',            // Violet 950
    textMuted: '#6D6B8D',       // Muted violet-gray
    textDim: '#A8A0C0',         // Dim violet-gray
    accent: '#8B5CF6',          // Violet 500
    danger: '#EF4444',          // Red 500
    success: '#10B981',         // Emerald 500
    info: '#3B82F6',            // Blue 500
    warning: '#F59E0B',         // Amber 500
    border: '#DDD6FE',          // Violet 200
    divider: '#EDE9FE',         // Violet 100
    cardShadow: 'rgba(124, 58, 237, 0.12)',
    overlay: 'rgba(30, 27, 75, 0.5)',
  },
  // Dark Theme — Deep Navy + Violet Glow
  dark: {
    primary: '#A78BFA',         // Violet 400 (bright for OLED)
    primaryLight: '#C4B5FD',    // Violet 300
    primaryDark: '#7C3AED',     // Violet 600
    secondary: '#F472B6',       // Pink 400
    background: '#0A0A18',      // Ultra-deep navy-black
    surface: '#12122A',         // Dark navy
    surfaceLight: '#1C1C3A',    // Slightly lighter navy
    surfaceElevated: '#26264A', // Elevated surface
    text: '#F0EEFF',            // Light violet-white
    textMuted: '#A89EC8',       // Muted violet
    textDim: '#5A5480',         // Dim violet
    accent: '#C4B5FD',          // Violet 300
    danger: '#F87171',          // Red 400
    success: '#34D399',         // Emerald 400
    info: '#60A5FA',            // Blue 400
    warning: '#FBBF24',         // Amber 400
    border: '#2D2B5A',          // Dark violet border
    divider: '#1C1C3A',         // Dark divider
    cardShadow: 'rgba(167, 139, 250, 0.08)',
    overlay: 'rgba(10, 10, 24, 0.7)',
  },
};

export const GRADIENTS = {
  primary: ['#7C3AED', '#5B21B6'],
  primaryVivid: ['#8B5CF6', '#EC4899'],
  hero: ['#6D28D9', '#7C3AED', '#8B5CF6'],
  success: ['#059669', '#10B981'],
  danger: ['#DC2626', '#EF4444'],
  warning: ['#D97706', '#F59E0B'],
  savings: ['#0891B2', '#06B6D4'],
  dark: ['#12122A', '#1C1C3A'],
};

export const paperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.light.primary,
    background: COLORS.light.background,
    surface: COLORS.light.surface,
    onSurface: COLORS.light.text,
    secondary: COLORS.light.secondary,
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
    secondary: COLORS.dark.secondary,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const FONTS = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
};

export const SHADOWS = {
  sm: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#F87171',           // Red 400
  Transport: '#60A5FA',      // Blue 400
  Shopping: '#FBBF24',       // Amber 400
  Bills: '#C084FC',          // Purple 400
  Entertainment: '#34D399',  // Emerald 400
  Health: '#FB7185',         // Rose 400
  Other: '#94A3B8',          // Slate 400
  Education: '#F59E0B',      // Amber 500
  Travel: '#38BDF8',         // Sky 400
  Fitness: '#4ADE80',        // Green 400
  Beauty: '#F472B6',         // Pink 400
  Rent: '#A78BFA',           // Violet 400
  Utilities: '#67E8F9',      // Cyan 300
  Insurance: '#FCD34D',      // Yellow 300
};

export const SAVINGS_GOAL_COLORS = [
  '#7C3AED', '#EC4899', '#10B981', '#3B82F6',
  '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6',
];

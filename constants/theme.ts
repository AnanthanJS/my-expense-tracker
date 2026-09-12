import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const COLORS = {
  // Light Theme (Clean Professional)
  light: {
    primary: '#2563eb',       // Blue 600
    background: '#f8fafc',    // Slate 50
    surface: '#ffffff',       // White
    surfaceLight: '#f1f5f9',  // Slate 100
    text: '#0f172a',          // Slate 900
    textMuted: '#475569',     // Slate 600
    textDim: '#64748b',       // Slate 500 — was #94a3b8 (Slate 400), failed WCAG AA (#12)
    accent: '#3b82f6',        // Blue 500
    danger: '#ef4444',        // Red 500
    success: '#22c55e',       // Green 500
    info: '#0ea5e9',          // Sky 500
    warning: '#f59e0b',       // Amber 500
    // Foreground-on-filled tokens (#9)
    onPrimary: '#ffffff',
    onDanger: '#ffffff',
    onSurface: '#0f172a',
  },
  // Dark Theme (Deep Onyx)
  dark: {
    primary: '#60a5fa',       // Blue 400 (Brighter for OLED)
    background: '#000000',    // Pure Black for OLED
    surface: '#141414',       // was #0a0a0a — lifted for visible layering (#10)
    surfaceLight: '#1f1f1f',  // was #171717 — lifted for visible layering (#10)
    text: '#f8fafc',          // Slate 50
    textMuted: '#cbd5e1',     // Slate 300
    textDim: '#8b98a9',       // was #64748b (Slate 500), failed WCAG AA on #0a0a0a (#12)
    accent: '#3b82f6',        // Blue 500
    danger: '#f87171',        // Red 400
    success: '#4ade80',       // Green 400
    info: '#38bdf8',          // Sky 400
    warning: '#fbbf24',       // Amber 400
    // Foreground-on-filled tokens (#9)
    onPrimary: '#000000',
    onDanger: '#ffffff',
    onSurface: '#f8fafc',
  },
};

// ---------------------------------------------------------------------------
// Paper bridge
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Spacing (#6 — canonical source of truth)
// ---------------------------------------------------------------------------

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/**
 * GUTTER — unified horizontal screen padding used by all four screens and
 * MainHeader so card edges align while swiping between tabs. (#3)
 */
export const GUTTER = 20;

// ---------------------------------------------------------------------------
// Radius scale (#7)
// ---------------------------------------------------------------------------

export const RADII = {
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
};

// ---------------------------------------------------------------------------
// Type scale (#8)
// ---------------------------------------------------------------------------

export const TYPE = {
  display: { fontSize: 28, lineHeight: 34 },
  title:   { fontSize: 22, lineHeight: 28 },
  body:    { fontSize: 15, lineHeight: 22 },
  label:   { fontSize: 13, lineHeight: 18 },
  overline:{ fontSize: 10, lineHeight: 14, letterSpacing: 1.5 },
  caption: { fontSize: 11, lineHeight: 16 },
};

// ---------------------------------------------------------------------------
// Elevation (#11) — cross-platform shadow tokens
// ---------------------------------------------------------------------------

type ElevationLevel = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export const ELEVATION: Record<'sm' | 'md' | 'lg', ElevationLevel> = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
};

// ---------------------------------------------------------------------------
// Modal scrim (#13)
// ---------------------------------------------------------------------------

/** Standard scrim opacity for all modal overlays (was 0.8–0.95). */
export const SCRIM = 0.5;

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

export const FONTS = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_700Bold',
};

// ---------------------------------------------------------------------------
// Category colors
// ---------------------------------------------------------------------------

export const CATEGORY_COLORS: Record<string, string> = {
  Food:          '#f87171',
  Transport:     '#60a5fa',
  Shopping:      '#fbbf24',
  Bills:         '#c084fc',
  Entertainment: '#4ade80',
  Health:        '#fb7185',
  Other:         '#94a3b8',
};

/**
 * Stable color for custom categories not in CATEGORY_COLORS.
 * Hashes the name into the built-in palette so the color is always the same
 * for the same name. (#24)
 */
const PALETTE = Object.values(CATEGORY_COLORS);

export function getCategoryColor(name: string, fallback?: string): string {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return fallback ?? PALETTE[hash % PALETTE.length];
}

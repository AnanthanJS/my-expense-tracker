export const COLORS = {
  background: '#0f172a', // slate-900
  surface: '#1e293b',    // slate-800
  surfaceLight: '#334155', // slate-700
  primary: '#f59e0b',    // amber-500
  primaryHover: '#d97706', // amber-600
  text: '#f1f5f9',       // slate-100
  textMuted: '#94a3b8',  // slate-400
  textDim: '#64748b',    // slate-500
  accent: '#10b981',     // emerald-500
  danger: '#ef4444',     // red-500
  warning: '#f97316',    // orange-500
  info: '#3b82f6',       // blue-500
  secondary: '#8b5cf6',   // violet-500
  pink: '#ec4899',       // pink-500
};

export const CATEGORY_COLORS: Record<string, string> = {
  Food: COLORS.primary,
  Transport: COLORS.info,
  Shopping: COLORS.pink,
  Bills: COLORS.danger,
  Entertainment: COLORS.secondary,
  Health: COLORS.accent,
  Other: COLORS.textDim,
};

export const FONTS = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
};

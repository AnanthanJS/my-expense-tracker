import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { TextStyle, ViewStyle } from 'react-native';

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

/**
 * The original four steps covered 17 distinct literal radii in the codebase,
 * which is why nothing adopted them. These steps absorb the real usage:
 * 10 and 12 -> sm, 14 and 16 -> md, 18 and 20 -> lg, 24 -> xl, 32 -> xxl.
 * Anything meant to read as fully round (dots, FABs, the nav pill) uses
 * `pill` rather than a literal half-of-height number that silently breaks
 * when the element is resized.
 */
export const RADII = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  pill: 999,
};

// ---------------------------------------------------------------------------
// Typography — Sora (display) + Inter (text)
// ---------------------------------------------------------------------------

/**
 * A two-family pairing: one "speaker" and one "workhorse".
 *
 * - **Sora** (display) carries the moments that should feel authored: screen
 *   titles and the hero numbers. Its wide, confident numerals hold up at
 *   large sizes where a UI face looks flat.
 * - **Inter** (text) does every piece of actual reading. It was drawn for
 *   screens, stays legible at 11px, and ships real tabular figures.
 *
 * Never mix the two within one line. Sora stops at 18px; below that Inter
 * is always correct.
 */
const SORA = {
  regular:   'Sora_400Regular',
  medium:    'Sora_500Medium',
  semibold:  'Sora_600SemiBold',
  bold:      'Sora_700Bold',
  extrabold: 'Sora_800ExtraBold',
};

const INTER = {
  regular:   'Inter_400Regular',
  medium:    'Inter_500Medium',
  semibold:  'Inter_600SemiBold',
  bold:      'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

export const FONTS = {
  display: SORA,
  text: INTER,
};

/**
 * Semantic text roles. Each bundles family + size + weight + leading +
 * tracking, so a call site declares *what the text is*, not how to draw it.
 *
 * ## Weight ladder (priority, not decoration)
 *
 * | Weight | Role                                    |
 * |--------|-----------------------------------------|
 * | 800    | the single hero number on a screen      |
 * | 700    | screen titles, totals                   |
 * | 600    | section headings, buttons, status       |
 * | 500    | primary row content, labels             |
 * | 400    | secondary + meta text                   |
 *
 * ## Colour pairing (applied at the call site, since it is theme-dependent)
 *
 * | Tone             | Use                                        |
 * |------------------|--------------------------------------------|
 * | `text`           | hero numbers, titles, primary row content  |
 * | `textMuted`      | section headings, supporting copy          |
 * | `textDim`        | meta, overlines, captions, placeholders    |
 * | `accent`/`danger`| status only — never for neutral content    |
 *
 * Depth comes from this ladder plus the elevation and border behind the text.
 * Deliberately no `textShadow` anywhere: it softens edges below ~16px and is
 * invisible against the pure-black dark theme.
 */
export const TEXT = {
  // ── Display (Sora) — titles and hero moments ─────────────────────────────
  hero:       { fontFamily: SORA.extrabold, fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
  display:    { fontFamily: SORA.bold,      fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  title:      { fontFamily: SORA.bold,      fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  heading:    { fontFamily: SORA.semibold,  fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  subheading: { fontFamily: SORA.semibold,  fontSize: 18, lineHeight: 24, letterSpacing: -0.1 },

  // ── Text (Inter) — everything that gets read ─────────────────────────────
  bodyLg:     { fontFamily: INTER.regular,  fontSize: 16, lineHeight: 24 },
  body:       { fontFamily: INTER.regular,  fontSize: 15, lineHeight: 22 },
  bodySm:     { fontFamily: INTER.regular,  fontSize: 14, lineHeight: 20 },

  /** Primary content inside a row — the thing you scan for. */
  rowTitle:   { fontFamily: INTER.medium,   fontSize: 14, lineHeight: 20, letterSpacing: -0.1 },
  /** Field labels and chips. */
  label:      { fontFamily: INTER.medium,   fontSize: 13, lineHeight: 18 },
  labelSm:    { fontFamily: INTER.medium,   fontSize: 12, lineHeight: 16 },
  /** Meta: dates, counts, helper text. */
  caption:    { fontFamily: INTER.regular,  fontSize: 11, lineHeight: 15 },
  /**
   * Nav pill only — the one documented sub-11px exception. Five tabs share
   * ~54px each on a 320dp screen, so 11px would auto-shrink below 10 anyway.
   */
  tabLabel:   { fontFamily: INTER.medium,   fontSize: 10, lineHeight: 13, letterSpacing: 0.2 },

  // ── Buttons ──────────────────────────────────────────────────────────────
  button:     { fontFamily: INTER.semibold, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  buttonSm:   { fontFamily: INTER.semibold, fontSize: 14, lineHeight: 20 },

  // ── Money (tabular figures) ──────────────────────────────────────────────
  /**
   * `tabular-nums` forces every digit to the same advance width. Without it a
   * column of amounts will not align — a `1` is narrower than an `8` — which
   * is the detail that separates a financial UI from a generic one.
   */
  moneyHero:  { fontFamily: SORA.extrabold, fontSize: 30, lineHeight: 36, letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  /** Chart centre labels — display weight, but sized to fit a donut hole. */
  moneyTitle: { fontFamily: SORA.bold,      fontSize: 22, lineHeight: 28, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  moneyLg:    { fontFamily: INTER.bold,     fontSize: 16, lineHeight: 22, letterSpacing: -0.2, fontVariant: ['tabular-nums'] },
  money:      { fontFamily: INTER.semibold, fontSize: 14, lineHeight: 20, letterSpacing: -0.1, fontVariant: ['tabular-nums'] },
  moneySm:    { fontFamily: INTER.medium,   fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
  /** Percentage inside the progress ring. */
  moneyRing:  { fontFamily: SORA.bold,      fontSize: 18, lineHeight: 22, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },

  // ── Prose — wrapping paragraphs ──────────────────────────────────────────
  proseLg:    { fontFamily: INTER.regular,  fontSize: 16, lineHeight: 25 },
  prose:      { fontFamily: INTER.regular,  fontSize: 14, lineHeight: 21 },
  proseSm:    { fontFamily: INTER.regular,  fontSize: 13, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

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

/** Ready-made scrim fill, so call sites stop rebuilding the rgba() string. */
export const SCRIM_COLOR = `rgba(0, 0, 0, ${SCRIM})`;

/**
 * Near-opaque backdrop for the full-screen receipt viewer. A photo wants the
 * UI behind it gone, not dimmed.
 */
export const SCRIM_COLOR_OPAQUE = 'rgba(0, 0, 0, 0.94)';

// ---------------------------------------------------------------------------
// Glass tokens — iOS-style frosted glass surfaces
// ---------------------------------------------------------------------------

/**
 * Two distinct surface roles — they were previously conflated into one `card`
 * token, which is why in-flow cards were invisible:
 *
 * - `card`     — a card sitting IN the scroll flow. There is nothing behind it
 *                but `background`, so translucency buys nothing and costs all
 *                the contrast. Near-opaque; the *border* draws the edge.
 * - `floating` — a surface that overlays scrolling content inside a real
 *                `BlurView` (nav pill, sheets). Here translucency is the point.
 *
 * Light-mode borders must be DARKER than the surface they sit on. The old
 * `rgba(255,255,255,0.55)` border was lighter than the page background, so it
 * erased the card edge instead of drawing it — cards read at ~1.03:1 against
 * the page, i.e. not at all.
 */
export const GLASS = {
  light: {
    /** In-flow card fill — near-opaque white over the Slate-50 page */
    card: 'rgba(255, 255, 255, 0.94)',
    /** Hairline edge — slate ink, darker than the surface so it is visible */
    border: 'rgba(15, 23, 42, 0.09)',
    /** Translucent fill for BlurView surfaces that overlay content */
    floating: 'rgba(255, 255, 255, 0.72)',
    /** Inner highlight for depth (badges, insets) */
    shine: 'rgba(255, 255, 255, 0.60)',
    /** BlurView intensity */
    blur: 45,
    /** Shadow for raised surfaces — slate-tinted, not blue-violet */
    shadow: 'rgba(15, 23, 42, 0.10)',
  },
  dark: {
    card: 'rgba(255, 255, 255, 0.055)',
    border: 'rgba(255, 255, 255, 0.13)',
    floating: 'rgba(20, 20, 30, 0.60)',
    shine: 'rgba(255, 255, 255, 0.07)',
    blur: 65,
    shadow: 'rgba(0, 0, 0, 0.55)',
  },
};

// ---------------------------------------------------------------------------
// Budget status tone
// ---------------------------------------------------------------------------

type ThemeColors = typeof COLORS.light;

/**
 * One ramp for "how is this budget doing", so the same ratio reads the same
 * colour everywhere — the progress ring, the summary status, the category
 * bars and the assignment meters.
 *
 * Deliberately only three states. Colour here is a signal, not decoration:
 * anything under 90% stays on the neutral brand colour rather than going
 * green, so that amber and red still mean something when they appear.
 */
export function getBudgetTone(spent: number, budget: number, colors: ThemeColors): string {
  if (budget <= 0) return colors.textDim;
  const ratio = spent / budget;
  if (ratio > 1) return colors.danger;
  if (ratio >= 0.9) return colors.warning;
  return colors.primary;
}

/** Low-alpha version of a tone, for tinted pills and tracks. */
export function tint(color: string, alpha = '1A'): string {
  return color.length === 7 ? `${color}${alpha}` : color;
}

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

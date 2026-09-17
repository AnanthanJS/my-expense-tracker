/**
 * Generates the app icon set from a single vector source.
 *
 * The mark reuses the app's own visual language rather than inventing one:
 *   · the open ring is the budget gauge from `ProgressCircle`, the hero of the
 *     Home screen, drawn at the same 75% sweep with the same round caps
 *   · the ascending bars echo `CategoryBreakdown` and the Analytics chart
 *   · the blue is `COLORS.light.primary` (#2563eb) graded into accent/deep blue
 *
 * Run with: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const BRAND = {
  light: '#3b82f6', // accent  — Blue 500
  base: '#2563eb', // primary — Blue 600
  deep: '#1d4ed8', // Blue 700
};

/** Splash backgrounds — must match the `splash` block in app.json. */
const SPLASH_LIGHT = '#f8fafc';
const SPLASH_DARK = '#000000';

const SIZE = 1024;
const CENTER = SIZE / 2;

// ── Ring: same geometry language as ProgressCircle (75% sweep, round caps) ──
const RING_RADIUS = 300;
const RING_STROKE = 88;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SWEEP = 0.75;
const DASH = `${CIRCUMFERENCE * SWEEP} ${CIRCUMFERENCE * (1 - SWEEP)}`;

// ── Bars: three ascending, centred as a group inside the ring's hole ────────
const BAR_W = 70;
const BAR_GAP = 38;
const BAR_HEIGHTS = [110, 170, 230];
const BAR_BASELINE = CENTER + BAR_HEIGHTS[2] / 2; // group centred on CENTER
const BAR_X0 = CENTER - (BAR_W * 3 + BAR_GAP * 2) / 2;

const bars = BAR_HEIGHTS.map((h, i) => {
  const x = BAR_X0 + i * (BAR_W + BAR_GAP);
  // Leading bar is fully opaque; the shorter two sit back slightly so the
  // group reads as a progression rather than a solid block.
  const opacity = [0.72, 0.86, 1].at(i);
  return `<rect x="${x}" y="${BAR_BASELINE - h}" width="${BAR_W}" height="${h}" rx="26" fill="#ffffff" fill-opacity="${opacity}"/>`;
}).join('\n      ');

/** The mark itself, optionally scaled about the centre (for the Android safe zone). */
const mark = (scale = 1) => `
    <g transform="translate(${CENTER} ${CENTER}) scale(${scale}) translate(${-CENTER} ${-CENTER})">
      <circle
        cx="${CENTER}" cy="${CENTER}" r="${RING_RADIUS}"
        fill="none" stroke="#ffffff" stroke-opacity="0.30"
        stroke-width="${RING_STROKE}"
      />
      <circle
        cx="${CENTER}" cy="${CENTER}" r="${RING_RADIUS}"
        fill="none" stroke="#ffffff"
        stroke-width="${RING_STROKE}" stroke-linecap="round"
        stroke-dasharray="${DASH}"
        transform="rotate(-90 ${CENTER} ${CENTER})"
      />
      ${bars}
    </g>`;

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${BRAND.light}"/>
      <stop offset="55%"  stop-color="${BRAND.base}"/>
      <stop offset="100%" stop-color="${BRAND.deep}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="62%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>`;

/** Full-bleed square. iOS and Android launchers apply their own corner mask. */
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${defs}
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#sheen)"/>
  ${mark()}
</svg>`;

/** Rounded tile that has to stand on its own over a light or dark backdrop. */
const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${defs}
  <rect width="${SIZE}" height="${SIZE}" rx="232" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" rx="232" fill="url(#sheen)"/>
  ${mark()}
</svg>`;

/**
 * Android adaptive foreground: transparent, with the mark inside the guaranteed
 * safe zone. The launcher crops the outer ~33% to whatever shape the device
 * uses, so anything beyond the middle 66% can be cut off.
 *
 * Launchers display only the centre 72 of the 108dp canvas, so whatever is
 * drawn here is magnified by 1/0.666. Drawing the mark at 0.66 lands the ring
 * at ~67% of the window the user actually sees, matching its share of the iOS
 * tile — so the two platforms read as the same icon rather than one looking
 * zoomed in.
 */
const ADAPTIVE_SCALE = 0.66;

const adaptiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${mark(ADAPTIVE_SCALE)}
</svg>`;

/**
 * Android adaptive background layer. Expo's `adaptiveIcon.backgroundColor` can
 * only be a flat fill, which would drop the gradient on Android and make the
 * two platforms look like different icons. A background *image* keeps parity.
 */
const adaptiveBgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${defs}
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#sheen)"/>
</svg>`;

const targets = [
  { file: 'icon.png', svg: iconSvg, size: 1024, flatten: true },
  { file: 'adaptive-icon.png', svg: adaptiveSvg, size: 1024, flatten: false },
  { file: 'adaptive-icon-background.png', svg: adaptiveBgSvg, size: 1024, flatten: true },
  { file: 'splash-icon.png', svg: tileSvg, size: 1024, flatten: false },
  { file: 'favicon.png', svg: tileSvg, size: 96, flatten: false },
];

for (const { file, svg, size, flatten } of targets) {
  let pipeline = sharp(Buffer.from(svg)).resize(size, size);
  // iOS rejects an app icon with an alpha channel.
  if (flatten) pipeline = pipeline.flatten({ background: BRAND.base });
  const out = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  await writeFile(join(ASSETS, file), out);
  console.log(`${file.padEnd(20)} ${size}x${size}  ${(out.length / 1024).toFixed(1)} kB`);
}

// Keep the vector source alongside the raster output so the icon can be redrawn.
await writeFile(join(ASSETS, 'icon.svg'), iconSvg);
console.log('icon.svg            vector source');

/**
 * ── Native Android launcher resources ──────────────────────────────────────
 *
 * This project has a prebuilt, git-ignored `android/` directory. In that setup
 * the launcher icon is a NATIVE resource baked into the APK at build time, and
 * `app.json`'s icon config only reaches it when `expo prebuild` regenerates
 * `res/mipmap-*`. Editing `assets/*.png` alone changes nothing, and an
 * over-the-air update can never change an app icon.
 *
 * A full `expo prebuild --clean` would fix it but also rewrite `gradle.properties`
 * and `local.properties`, which carry hand-set values here (JDK path, SDK path)
 * and are not in git — so the icons are written directly instead.
 *
 * Skipped automatically when there is no prebuilt android/ directory (e.g. an
 * EAS cloud build, which runs its own prebuild from app.json).
 */
const ANDROID_RES = join(dirname(fileURLToPath(import.meta.url)), '..', 'android', 'app', 'src', 'main', 'res');

if (existsSync(ANDROID_RES)) {
  console.log('\nandroid/ detected — writing native launcher resources');

  // Legacy icons are 48dp, adaptive layers 108dp, across five densities.
  const DENSITIES = [
    { dir: 'mdpi', legacy: 48, adaptive: 108 },
    { dir: 'hdpi', legacy: 72, adaptive: 162 },
    { dir: 'xhdpi', legacy: 96, adaptive: 216 },
    { dir: 'xxhdpi', legacy: 144, adaptive: 324 },
    { dir: 'xxxhdpi', legacy: 192, adaptive: 432 },
  ];

  const roundMask = (px) =>
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}"><circle cx="${px / 2}" cy="${px / 2}" r="${px / 2}" fill="#fff"/></svg>`);

  const toWebp = (buf) => sharp(buf).webp({ lossless: true }).toBuffer();

  for (const { dir, legacy, adaptive } of DENSITIES) {
    const out = join(ANDROID_RES, `mipmap-${dir}`);

    const square = await sharp(Buffer.from(iconSvg)).resize(legacy, legacy).png().toBuffer();
    await writeFile(join(out, 'ic_launcher.webp'), await toWebp(square));

    // Round variant for launchers that request it.
    const round = await sharp(square)
      .composite([{ input: roundMask(legacy), blend: 'dest-in' }])
      .png()
      .toBuffer();
    await writeFile(join(out, 'ic_launcher_round.webp'), await toWebp(round));

    const fg = await sharp(Buffer.from(adaptiveSvg)).resize(adaptive, adaptive).png().toBuffer();
    await writeFile(join(out, 'ic_launcher_foreground.webp'), await toWebp(fg));

    const bg = await sharp(Buffer.from(adaptiveBgSvg)).resize(adaptive, adaptive).png().toBuffer();
    await writeFile(join(out, 'ic_launcher_background.webp'), await toWebp(bg));

    console.log(`  mipmap-${dir.padEnd(8)} legacy ${legacy}px · adaptive ${adaptive}px`);
  }

  // Point the adaptive icon at the gradient layer instead of the flat colour.
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  for (const f of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
    await writeFile(join(ANDROID_RES, 'mipmap-anydpi-v26', f), adaptiveXml);
  }
  console.log('  mipmap-anydpi-v26  background -> @mipmap/ic_launcher_background');

  // ── Native splash ────────────────────────────────────────────────────────
  // Same story as the launcher icon: the splash logo and its background colour
  // are native resources, so the `splash` block in app.json only reaches them
  // through prebuild.
  const SPLASH_DENSITIES = [
    { dir: 'mdpi', size: 288 },
    { dir: 'hdpi', size: 432 },
    { dir: 'xhdpi', size: 576 },
    { dir: 'xxhdpi', size: 864 },
    { dir: 'xxxhdpi', size: 1152 },
  ];
  for (const { dir, size } of SPLASH_DENSITIES) {
    // Rendered from the vector at each density rather than upscaled from the
    // 1024px PNG, so the largest bucket stays crisp.
    const logo = await sharp(Buffer.from(tileSvg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
    await writeFile(join(ANDROID_RES, `drawable-${dir}`, 'splashscreen_logo.png'), logo);
  }
  console.log('  drawable-*/        splashscreen_logo 288 -> 1152px');

  const colorsPath = join(ANDROID_RES, 'values', 'colors.xml');
  const colors = await readFile(colorsPath, 'utf8');
  await writeFile(
    colorsPath,
    colors
      // Fallback colour for launchers that ignore the background drawable.
      .replace(/(<color name="iconBackground">)#[0-9a-fA-F]{3,8}(<\/color>)/, `$1${BRAND.base}$2`)
      // Light splash: was #000000, which flashed black before a light-theme app.
      .replace(/(<color name="splashscreen_background">)#[0-9a-fA-F]{3,8}(<\/color>)/, `$1${SPLASH_LIGHT}$2`),
  );
  console.log(`  values/colors.xml  iconBackground -> ${BRAND.base}, splash -> ${SPLASH_LIGHT}`);

  // Dark-theme splash lives in values-night, which the template leaves empty.
  const nightPath = join(ANDROID_RES, 'values-night', 'colors.xml');
  await writeFile(
    nightPath,
    `<resources>
  <color name="splashscreen_background">${SPLASH_DARK}</color>
</resources>
`,
  );
  console.log(`  values-night/      splash -> ${SPLASH_DARK}`);
}

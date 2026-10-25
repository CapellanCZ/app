/**
 * HD CampusCare launcher / adaptive icons.
 *
 * Visual source: assets/favicon.png (blue tile + light frame + white mark).
 * Geometry: assets/icons/PlainLogo.svg (same mark, vector-sharp at 1024).
 *
 * Adaptive layers stay square + transparent FG so Android/iOS masks apply;
 * light border is only on the full launcher icon (matches favicon look).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets');

/** Dominant fill from favicon.png */
const BRAND = '#2970FF';
/** Light frame from favicon.png */
const BORDER = '#84ADFF';
const SIZE = 1024;

/**
 * PlainLogo viewBox 68×52, but the drawn mark is ~40.5×22.
 * Scale 15.5 → ~61% canvas width — reads large on launchers while staying
 * inside Android adaptive safe zone (~66% diameter).
 */
function logoSvg(fill = '#FFFFFF', scale = 15.5) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(512 512) scale(${scale}) translate(-34 -26)">
    <path d="M33.3056 13.681C35.1472 13.2414 37.031 14.3931 37.0776 16.2858C37.13 18.4154 36.7812 20.5463 36.0387 22.561C34.8985 25.6548 32.881 28.3355 30.2415 30.2642C27.6019 32.1929 24.4587 33.283 21.2095 33.3965C19.0955 33.4704 16.9985 33.1288 15.03 32.4019C13.2619 31.7491 12.7751 29.6097 13.7563 28.0004C14.7576 26.3582 16.9213 25.9277 18.8082 26.3004C19.5181 26.4407 20.2449 26.4999 20.9752 26.4744C22.8771 26.4079 24.7169 25.7699 26.2619 24.6409C27.8069 23.512 28.9878 21.9429 29.6552 20.132C29.9298 19.3868 30.1124 18.6145 30.2019 17.8324C30.415 15.9702 31.4825 14.1162 33.3056 13.681Z" fill="${fill}"/>
    <path d="M34.683 13.681C32.8414 13.2414 30.9576 14.3931 30.9111 16.2858C30.8587 18.4154 31.2075 20.5463 31.95 22.561C33.0902 25.6548 35.1076 28.3355 37.7472 30.2642C40.3868 32.1929 43.5299 33.283 46.7792 33.3965C48.8931 33.4704 50.9902 33.1288 52.9586 32.4019C54.7267 31.7491 55.2136 29.6097 54.2323 28.0004C53.2311 26.3582 51.0673 25.9277 49.1804 26.3004C48.4705 26.4407 47.7437 26.4999 47.0135 26.4744C45.1116 26.4079 43.2718 25.7699 41.7267 24.6409C40.1817 23.512 39.0008 21.9429 38.3334 20.132C38.0588 19.3868 37.8762 18.6145 37.7867 17.8324C37.5736 15.9702 36.5062 14.1162 34.683 13.681Z" fill="${fill}"/>
    <ellipse cx="47.4438" cy="16.8044" rx="5.3798" ry="5.4665" fill="${fill}"/>
    <ellipse cx="19.3493" cy="16.8044" rx="5.3798" ry="5.4665" fill="${fill}"/>
  </g>
</svg>`;
}

/** Favicon-style light frame inset on the square launcher asset. */
function borderSvg() {
  const m = Math.round(SIZE * 0.05);
  const stroke = Math.max(8, Math.round(SIZE * 0.028));
  const r = Math.round(SIZE * 0.18);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${m}" y="${m}" width="${SIZE - m * 2}" height="${SIZE - m * 2}"
    rx="${r}" ry="${r}" fill="none" stroke="${BORDER}" stroke-width="${stroke}"/>
</svg>`;
}

async function writePng(file, buffer) {
  const out = path.join(assets, file);
  await fs.promises.mkdir(path.dirname(out), { recursive: true });
  await fs.promises.writeFile(out, buffer);
  console.log('wrote', out);
}

async function main() {
  // Preserve the user-supplied design reference
  const sourceFav = path.join(assets, 'favicon.png');
  const backup = path.join(assets, 'favicon.source.png');
  if (fs.existsSync(sourceFav) && !fs.existsSync(backup)) {
    await fs.promises.copyFile(sourceFav, backup);
    console.log('backed up original favicon → assets/favicon.source.png');
  }

  const whiteLogo = Buffer.from(logoSvg('#FFFFFF'));
  const blackLogo = Buffer.from(logoSvg('#000000'));
  const whiteLogoPng = await sharp(whiteLogo).png().toBuffer();
  const borderPng = await sharp(Buffer.from(borderSvg())).png().toBuffer();

  // Full launcher: brand fill + white mark + light frame (favicon look, HD)
  const icon = await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: BRAND },
  })
    .composite([
      { input: whiteLogoPng, gravity: 'centre' },
      { input: borderPng, gravity: 'centre' },
    ])
    .png()
    .toBuffer();
  await writePng('icon.png', icon);
  await writePng(path.join('images', 'icon.png'), icon);

  const bg = await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: BRAND },
  })
    .png()
    .toBuffer();
  await writePng('android-icon-background.png', bg);

  // Adaptive FG: transparent + larger white mark only (OS applies mask)
  const fg = await sharp(whiteLogoPng).resize(SIZE, SIZE).png().toBuffer();
  await writePng('android-icon-foreground.png', fg);

  const adaptive = await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: BRAND },
  })
    .composite([{ input: fg, gravity: 'centre' }])
    .png()
    .toBuffer();
  await writePng('adaptive-icon.png', adaptive);

  const mono = await sharp(blackLogo).resize(SIZE, SIZE).png().toBuffer();
  await writePng('android-icon-monochrome.png', mono);

  // Web favicon: crisp downscale of launcher
  await writePng('favicon.png', await sharp(icon).resize(48, 48).png().toBuffer());
  await writePng('favicon-192.png', await sharp(icon).resize(192, 192).png().toBuffer());

  console.log('done — brand', BRAND, 'border', BORDER);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

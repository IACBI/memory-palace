/**
 * Regenerates the installed-app icons in `public/`.
 *
 * Run by hand when the mark or the palette changes:
 *
 *     node scripts/generate-pwa-icons.mjs
 *
 * Not part of the build. The PNGs are committed, so neither CI nor a fresh
 * clone depends on this script or on `sharp` being installed. A manifest icon
 * has to be a real raster file at a known size — Chrome's install criteria are
 * not met by the SVG the rest of the interface uses.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public");

/**
 * The same doorway glyph as `app/icon.tsx`, in an unlit room.
 *
 * These two colours are `--palace-base` and `--palace-accent` from the dark
 * theme, written literally because a PNG cannot resolve a custom property.
 * When the palette is re-hued, this file and `app/icon.tsx` have to be
 * re-hued with it and the PNGs regenerated — nothing enforces that.
 */
function markSvg(size, { padding }) {
  const glyph = size - padding * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0f0f11"/>
  <g transform="translate(${padding} ${padding}) scale(${glyph / 24})"
     fill="none" stroke="#f0b775" stroke-width="1.6"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 4h3a2 2 0 0 1 2 2v14"/>
    <path d="M2 20h3"/>
    <path d="M13 20h9"/>
    <path d="M10 12v.01"/>
    <path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/>
  </g>
</svg>`;
}

const ICONS = [
  // Padded for platforms that crop to a circle or a squircle.
  { file: "icon-192.png", size: 192, padding: 40 },
  { file: "icon-512.png", size: 512, padding: 106 },
];

await mkdir(OUT, { recursive: true });

for (const { file, size, padding } of ICONS) {
  const png = await sharp(Buffer.from(markSvg(size, { padding })))
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(join(OUT, file), png);
  console.log(`wrote public/${file} (${size}×${size}, ${png.length} B)`);
}

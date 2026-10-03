import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const iconDir = path.join(root, 'public', 'icons');
const masterPath = path.join(iconDir, 'icon-master.png');
const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512];
const master = await readFile(masterPath);
const faviconSvg = await readFile(path.join(iconDir, 'favicon.svg'));
const metadata = await sharp(master).metadata();

if (metadata.width !== metadata.height || metadata.width < 512) {
  throw new Error('icon-master.png must be a square image of at least 512 pixels.');
}
if (metadata.hasAlpha) {
  throw new Error('icon-master.png must be opaque for installed app icons.');
}

await mkdir(iconDir, { recursive: true });

for (const size of sizes) {
  // Use one clear flower at browser-tab sizes; larger app icons retain the cloth.
  const png = await sharp(size <= 48 ? faviconSvg : master)
    .resize(size, size, { kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .png()
    .toBuffer();
  await writeFile(path.join(iconDir, `icon-${size}x${size}.png`), png);
}

// A full-bleed textile pattern has no outer logo to preserve. Both large flower
// centers remain inside the central safe circle, even when the OS masks edges.
for (const size of [192, 512]) {
  const png = await sharp(master)
    .resize(size, size, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  await writeFile(path.join(iconDir, `icon-maskable-${size}x${size}.png`), png);
}

for (const name of ['shortcut-add', 'shortcut-list']) {
  const png = await sharp(await readFile(path.join(iconDir, `${name}.svg`)))
    .resize(96, 96)
    .removeAlpha()
    .png()
    .toBuffer();
  await writeFile(path.join(iconDir, `${name}.png`), png);
}

// Use the simple SVG flower for the tiny browser favicon, where the woven
// pattern would be too detailed. PNG-backed ICO entries support each scale.
const faviconSizes = [16, 32, 48];
const faviconImages = [];
for (const size of faviconSizes) {
  faviconImages.push(await sharp(faviconSvg).resize(size, size).ensureAlpha().png().toBuffer());
}
const headerSize = 6 + 16 * faviconImages.length;
const header = Buffer.alloc(headerSize);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(faviconImages.length, 4);
let offset = headerSize;
for (const [index, png] of faviconImages.entries()) {
  const entry = 6 + index * 16;
  header.writeUInt8(faviconSizes[index], entry);
  header.writeUInt8(faviconSizes[index], entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
}
await writeFile(path.join(iconDir, 'favicon.ico'), Buffer.concat([header, ...faviconImages]));

console.log(`Generated ${sizes.length} app icons, 2 maskable icons, 2 shortcuts and favicon.ico.`);

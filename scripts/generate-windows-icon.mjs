import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WINDOWS_ICON_SIZES = Object.freeze([256, 128, 64, 48, 32, 16]);

const COLORS = Object.freeze({
  navy: [6, 17, 29, 255],
  gold: [216, 162, 43, 255],
  silver: [216, 219, 224, 255]
});

const GLYPHS = Object.freeze({
  G: ['01110', '10000', '10000', '10111', '10001', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110']
});

function setPixel(pixels, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = color[3];
}

function fillRect(pixels, size, x, y, width, height, color) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(size, Math.ceil(x + width));
  const y1 = Math.min(size, Math.ceil(y + height));
  for (let py = y0; py < y1; py += 1) {
    for (let px = x0; px < x1; px += 1) setPixel(pixels, size, px, py, color);
  }
}

function drawGlyph(pixels, size, glyph, x, y, cell, color) {
  GLYPHS[glyph].forEach((row, rowIndex) => {
    [...row].forEach((bit, columnIndex) => {
      if (bit === '1') {
        fillRect(pixels, size, x + columnIndex * cell, y + rowIndex * cell, cell, cell, color);
      }
    });
  });
}

function drawCarSignature(pixels, size) {
  const left = Math.round(size * 0.14);
  const right = Math.round(size * 0.90);
  const thickness = Math.max(1, Math.round(size * 0.025));
  for (let x = left; x <= right; x += 1) {
    const t = (x - left) / Math.max(1, right - left);
    const y = Math.round(size * (0.34 - 0.09 * Math.sin(Math.PI * t)));
    fillRect(pixels, size, x, y, thickness, thickness, COLORS.gold);
  }
}

function renderIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) setPixel(pixels, size, x, y, COLORS.navy);
  }

  drawCarSignature(pixels, size);

  const cell = Math.max(1, Math.floor(size * 0.065));
  const glyphWidth = cell * 5;
  const totalWidth = glyphWidth * 2 + cell;
  const startX = Math.floor((size - totalWidth) / 2);
  const startY = Math.floor(size * 0.43);
  drawGlyph(pixels, size, 'G', startX, startY, cell, COLORS.gold);
  drawGlyph(pixels, size, 'D', startX + glyphWidth + cell, startY, cell, COLORS.silver);

  return pixels;
}

function writeUInt16LE(value) {
  const out = Buffer.alloc(2);
  out.writeUInt16LE(value);
  return out;
}

function writeUInt32LE(value) {
  const out = Buffer.alloc(4);
  out.writeUInt32LE(value);
  return out;
}

function buildDib(size, pixels) {
  const xor = Buffer.alloc(size * size * 4);
  let cursor = 0;
  for (let y = size - 1; y >= 0; y -= 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      xor[cursor] = pixels[i + 2];
      xor[cursor + 1] = pixels[i + 1];
      xor[cursor + 2] = pixels[i];
      xor[cursor + 3] = pixels[i + 3];
      cursor += 4;
    }
  }

  const maskRowBytes = Math.ceil(size / 32) * 4;
  const andMask = Buffer.alloc(maskRowBytes * size, 0);
  const header = Buffer.concat([
    writeUInt32LE(40),
    writeUInt32LE(size),
    writeUInt32LE(size * 2),
    writeUInt16LE(1),
    writeUInt16LE(32),
    writeUInt32LE(0),
    writeUInt32LE(xor.length + andMask.length),
    writeUInt32LE(0),
    writeUInt32LE(0),
    writeUInt32LE(0),
    writeUInt32LE(0)
  ]);

  return Buffer.concat([header, xor, andMask]);
}

export function buildWindowsIcon() {
  const images = WINDOWS_ICON_SIZES.map((size) => ({ size, data: buildDib(size, renderIcon(size)) }));
  const directorySize = 6 + images.length * 16;
  let imageOffset = directorySize;

  const header = Buffer.concat([writeUInt16LE(0), writeUInt16LE(1), writeUInt16LE(images.length)]);
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry[0] = size === 256 ? 0 : size;
    entry[1] = size === 256 ? 0 : size;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(imageOffset, 12);
    imageOffset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
}

export function generateWindowsIcon(outputPath = path.resolve('build/gd-icon.ico')) {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  const icon = buildWindowsIcon();
  writeFileSync(outputPath, icon);
  return { outputPath, bytes: icon.length, sizes: WINDOWS_ICON_SIZES };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = generateWindowsIcon();
  console.log(`ICO GD gerado em ${result.outputPath} (${result.bytes} bytes; ${result.sizes.join(', ')}px).`);
}

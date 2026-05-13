import { existsSync, readFileSync, statSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const cleanerPath = 'tools/clean_tianjian_assets.ps1';
const portraitPath = 'public/assets/portraits/mecha/tianjian.png';
const sheetPath = 'public/assets/sprites/mecha/tianjian/spritesheet.png';

const failures = [];

function readUInt32(buffer, offset) {
  return buffer.readUInt32BE(offset);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(path) {
  const file = readFileSync(path);
  const signature = file.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    throw new Error(`${path} is not a PNG file`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (offset < file.length) {
    const length = readUInt32(file, offset);
    const type = file.subarray(offset + 4, offset + 8).toString('ascii');
    const data = file.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = readUInt32(data, 0);
      height = readUInt32(data, 4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`${path} must be 8-bit RGBA PNG, got bitDepth=${bitDepth}, colorType=${colorType}`);
  }

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(width * height * bytesPerPixel);
  let src = 0;

  for (let y = 0; y < height; y++) {
    const filter = inflated[src++];
    const row = Buffer.alloc(stride);

    for (let x = 0; x < stride; x++) {
      const raw = inflated[src++];
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upLeft = x >= bytesPerPixel && y > 0 ? pixels[(y - 1) * stride + x - bytesPerPixel] : 0;

      switch (filter) {
        case 0:
          row[x] = raw;
          break;
        case 1:
          row[x] = (raw + left) & 0xff;
          break;
        case 2:
          row[x] = (raw + up) & 0xff;
          break;
        case 3:
          row[x] = (raw + Math.floor((left + up) / 2)) & 0xff;
          break;
        case 4:
          row[x] = (raw + paeth(left, up, upLeft)) & 0xff;
          break;
        default:
          throw new Error(`${path} uses unsupported PNG filter ${filter}`);
      }
    }

    row.copy(pixels, y * stride);
  }

  return { width, height, pixels };
}

function alphaAt(image, x, y) {
  return image.pixels[(y * image.width + x) * 4 + 3];
}

function sampleTransparentBorders(image, label, frameWidth = image.width, frameHeight = image.height) {
  const bad = [];
  for (let top = 0; top < image.height; top += frameHeight) {
    for (let left = 0; left < image.width; left += frameWidth) {
      const right = Math.min(left + frameWidth - 1, image.width - 1);
      const bottom = Math.min(top + frameHeight - 1, image.height - 1);
      const points = [
        [left, top],
        [right, top],
        [left, bottom],
        [right, bottom],
        [Math.floor((left + right) / 2), top],
        [Math.floor((left + right) / 2), bottom],
      ];

      for (const [x, y] of points) {
        if (alphaAt(image, x, y) > 8) bad.push(`${label}@${x},${y}`);
      }
    }
  }
  return bad;
}

if (!existsSync(cleanerPath)) {
  failures.push(`${cleanerPath} is missing.`);
} else {
  const cleaner = readFileSync(cleanerPath, 'utf8');
  if (!cleaner.includes('LockBits(')) failures.push('Cleaner should use Bitmap.LockBits().');
  if (/\.GetPixel\(|\.SetPixel\(/.test(cleaner)) failures.push('Cleaner should not use slow GetPixel/SetPixel calls.');
}

for (const path of [portraitPath, sheetPath]) {
  if (!existsSync(path)) failures.push(`${path} is missing.`);
}

if (failures.length === 0) {
  const cleanerMtime = statSync(cleanerPath).mtimeMs;
  for (const path of [portraitPath, sheetPath]) {
    if (statSync(path).mtimeMs <= cleanerMtime) {
      failures.push(`${path} has not been regenerated since the cleaner was updated.`);
    }
  }

  const portrait = decodePng(portraitPath);
  const sheet = decodePng(sheetPath);
  const badPortrait = sampleTransparentBorders(portrait, 'portrait');
  const badSheet = sampleTransparentBorders(sheet, 'sheet', 320, 360);

  if (badPortrait.length > 0) failures.push(`Portrait border still has opaque samples: ${badPortrait.slice(0, 6).join(', ')}`);
  if (badSheet.length > 0) failures.push(`Spritesheet frame borders still have opaque samples: ${badSheet.slice(0, 8).join(', ')}`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Tianjian cleaned PNG assets are transparent at sampled borders.');

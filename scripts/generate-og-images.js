const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'og-images');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Minimal PNG encoder - creates valid PNG files without external deps
function createPNG(width, height, pixels) {
  function crc32(buf) {
    let c = 0xffffffff;
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let cc = n;
      for (let k = 0; k < 8; k++) cc = (cc & 1) ? (0xedb88320 ^ (cc >>> 1)) : (cc >>> 1);
      table[n] = cc;
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function adler32(buf) {
    let a = 1, b = 0;
    for (let i = 0; i < buf.length; i++) {
      a = (a + buf[i]) % 65521;
      b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crcVal = crc32(typeData);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal);
    return Buffer.concat([len, typeData, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw pixel data with filter byte
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      row[1 + x * 3] = pixels[idx];
      row[1 + x * 3 + 1] = pixels[idx + 1];
      row[1 + x * 3 + 2] = pixels[idx + 2];
    }
    rawRows.push(row);
  }
  const raw = Buffer.concat(rawRows);

  // Deflate (store mode - no compression, split into max 65535 byte blocks)
  const blocks = [];
  const maxBlock = 65535;
  for (let i = 0; i < raw.length; i += maxBlock) {
    const end = Math.min(i + maxBlock, raw.length);
    const isLast = end === raw.length;
    const blockData = raw.slice(i, end);
    const header = Buffer.alloc(5);
    header[0] = isLast ? 1 : 0;
    header.writeUInt16LE(blockData.length, 1);
    header.writeUInt16LE(~blockData.length & 0xffff, 3);
    blocks.push(header, blockData);
  }

  const zlibHeader = Buffer.from([0x78, 0x01]);
  const deflated = Buffer.concat(blocks);
  const adlerVal = adler32(raw);
  const adlerBuf = Buffer.alloc(4);
  adlerBuf.writeUInt32BE(adlerVal);
  const compressed = Buffer.concat([zlibHeader, deflated, adlerBuf]);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), iend]);
}

function drawGradientBG(pixels, w, h) {
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const r = Math.round(10 + t * 16);
    const g = Math.round(10 + t * 16);
    const b = Math.round(10 + t * 36);
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
    }
  }
}

function drawRect(pixels, w, h, x1, y1, x2, y2, r, g, b) {
  for (let y = y1; y < y2 && y < h; y++) {
    for (let x = x1; x < x2 && x < w; x++) {
      if (x >= 0 && y >= 0) {
        const idx = (y * w + x) * 3;
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
      }
    }
  }
}

function drawBorder(pixels, w, h, thickness, r, g, b) {
  drawRect(pixels, w, h, 0, 0, w, thickness, r, g, b);
  drawRect(pixels, w, h, 0, h - thickness, w, h, r, g, b);
  drawRect(pixels, w, h, 0, 0, thickness, h, r, g, b);
  drawRect(pixels, w, h, w - thickness, 0, w, h, r, g, b);
}

function drawCrown(pixels, w, h, cx, cy, size) {
  const gold = [201, 169, 110];
  const points = [
    [-5, 3], [-3, -2], [-1.5, 1], [0, -4], [1.5, 1], [3, -2], [5, 3]
  ];
  const scale = size / 10;
  // Fill crown shape using scanline
  for (let dy = -4; dy <= 4; dy++) {
    const yy = Math.round(cy + dy * scale);
    if (yy < 0 || yy >= h) continue;
    // Find left and right bounds at this y
    let minX = cx + 5 * scale, maxX = cx - 5 * scale;
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[i + 1];
      if ((y1 <= dy && y2 >= dy) || (y2 <= dy && y1 >= dy)) {
        const t = (dy - y1) / (y2 - y1 || 0.001);
        const xx = cx + (x1 + t * (x2 - x1)) * scale;
        minX = Math.min(minX, xx);
        maxX = Math.max(maxX, xx);
      }
    }
    for (let xx = Math.round(minX); xx <= Math.round(maxX); xx++) {
      if (xx >= 0 && xx < w) {
        const idx = (yy * w + xx) * 3;
        pixels[idx] = gold[0]; pixels[idx + 1] = gold[1]; pixels[idx + 2] = gold[2];
      }
    }
  }
  // Crown base bar
  drawRect(pixels, w, h,
    Math.round(cx - 5 * scale), Math.round(cy + 3 * scale),
    Math.round(cx + 5 * scale), Math.round(cy + 5 * scale),
    gold[0], gold[1], gold[2]);
}

function drawTextBar(pixels, w, h, cy, barH, r, g, b, alpha) {
  for (let y = cy; y < cy + barH && y < h; y++) {
    for (let x = 100; x < w - 100; x++) {
      const idx = (y * w + x) * 3;
      pixels[idx] = Math.round(pixels[idx] * (1 - alpha) + r * alpha);
      pixels[idx + 1] = Math.round(pixels[idx + 1] * (1 - alpha) + g * alpha);
      pixels[idx + 2] = Math.round(pixels[idx + 2] * (1 - alpha) + b * alpha);
    }
  }
}

const pages = [
  { slug: 'main', title: '울산챔피언나이트 블로그' },
  { slug: 'first-time', title: '처음 가본 후기' },
  { slug: 'weekend', title: '금요일 vs 토요일' },
  { slug: 'over40', title: '40대도 즐긴다' },
  { slug: 'couple', title: '커플 방문 후기' },
  { slug: 'alone', title: '혼자 가도 되나' },
  { slug: 'summer', title: '여름밤 체험기' },
  { slug: 'event', title: '이벤트 후기' },
  { slug: 'vs', title: '나이트 비교' },
  { slug: 'food', title: '맛집 코스' },
  { slug: 'safety', title: '안전 가이드' },
];

const W = 1200, H = 630;

for (const page of pages) {
  const pixels = new Uint8Array(W * H * 3);

  // Background gradient
  drawGradientBG(pixels, W, H);

  // Gold border
  drawBorder(pixels, W, H, 4, 201, 169, 110);
  drawBorder(pixels, W, H, 5, 201, 169, 110);

  // Crown
  drawCrown(pixels, W, H, W / 2, 160, 60);

  // Title area - gold bar
  drawTextBar(pixels, W, H, 260, 80, 201, 169, 110, 0.25);

  // Branding area bottom
  drawTextBar(pixels, W, H, 500, 50, 201, 169, 110, 0.12);

  // Decorative horizontal lines
  for (let x = 200; x < W - 200; x++) {
    const topLine = 240 * W + x;
    const botLine = 360 * W + x;
    if (topLine * 3 + 2 < pixels.length) {
      pixels[topLine * 3] = 201; pixels[topLine * 3 + 1] = 169; pixels[topLine * 3 + 2] = 110;
    }
    if (botLine * 3 + 2 < pixels.length) {
      pixels[botLine * 3] = 201; pixels[botLine * 3 + 1] = 169; pixels[botLine * 3 + 2] = 110;
    }
  }

  const png = createPNG(W, H, pixels);
  const outPath = path.join(outDir, `${page.slug}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`✓ ${page.slug}.png (${(png.length / 1024).toFixed(0)}KB)`);
}

console.log('Done!');

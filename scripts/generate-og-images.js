const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'og-images');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const W = 1200, H = 630;

function createImage(title, subtitle) {
  const png = new PNG({ width: W, height: H, filterType: -1 });

  // Background gradient: navy #1E3A5F to darker
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const r = Math.round(30 * (1 - t) + 10 * t);
    const g = Math.round(58 * (1 - t) + 20 * t);
    const b = Math.round(95 * (1 - t) + 40 * t);
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  // Gold border
  const gold = [201, 169, 110];
  for (let i = 0; i < 5; i++) {
    for (let x = 0; x < W; x++) {
      setPixel(png, x, i, gold);
      setPixel(png, x, H - 1 - i, gold);
    }
    for (let y = 0; y < H; y++) {
      setPixel(png, i, y, gold);
      setPixel(png, W - 1 - i, y, gold);
    }
  }

  // Gold accent bar in middle area
  for (let y = 250; y < 260; y++) {
    for (let x = 200; x < W - 200; x++) {
      setPixelAlpha(png, x, y, gold, 0.3);
    }
  }
  for (let y = 400; y < 410; y++) {
    for (let x = 200; x < W - 200; x++) {
      setPixelAlpha(png, x, y, gold, 0.2);
    }
  }

  // Crown shape (simple triangle-based)
  const crownCx = W / 2, crownCy = 160;
  const crownW = 80, crownH = 50;
  for (let dy = 0; dy < crownH; dy++) {
    const y = Math.round(crownCy - crownH / 2 + dy);
    const progress = dy / crownH;
    const halfWidth = Math.round(crownW / 2 * (0.4 + progress * 0.6));
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      const x = Math.round(crownCx + dx);
      if (x >= 0 && x < W && y >= 0 && y < H) {
        // Create crown peaks
        const peakPattern = Math.sin((dx / halfWidth) * Math.PI * 2.5);
        if (progress < 0.3 && peakPattern < -0.2) continue;
        setPixelAlpha(png, x, y, gold, 0.5 + progress * 0.3);
      }
    }
  }
  // Crown base
  for (let y = Math.round(crownCy + crownH / 2); y < Math.round(crownCy + crownH / 2 + 10); y++) {
    for (let x = Math.round(crownCx - crownW / 2 - 5); x < Math.round(crownCx + crownW / 2 + 5); x++) {
      if (x >= 0 && x < W && y >= 0 && y < H) {
        setPixelAlpha(png, x, y, gold, 0.7);
      }
    }
  }

  // Title area - gold tinted bar
  for (let y = 270; y < 360; y++) {
    for (let x = 100; x < W - 100; x++) {
      setPixelAlpha(png, x, y, gold, 0.08);
    }
  }

  // Branding area at bottom
  for (let y = 520; y < 570; y++) {
    for (let x = 300; x < W - 300; x++) {
      setPixelAlpha(png, x, y, gold, 0.06);
    }
  }

  // Small decorative dots
  const dots = [[150, 100], [1050, 120], [100, 500], [1100, 480], [200, 300], [1000, 350]];
  for (const [dx, dy] of dots) {
    for (let r = 0; r < 4; r++) {
      for (let a = 0; a < 360; a += 5) {
        const x = Math.round(dx + r * Math.cos(a * Math.PI / 180));
        const y = Math.round(dy + r * Math.sin(a * Math.PI / 180));
        if (x >= 0 && x < W && y >= 0 && y < H) {
          setPixelAlpha(png, x, y, gold, 0.15);
        }
      }
    }
  }

  return png;
}

function setPixel(png, x, y, color) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const idx = (y * W + x) << 2;
  png.data[idx] = color[0];
  png.data[idx + 1] = color[1];
  png.data[idx + 2] = color[2];
  png.data[idx + 3] = 255;
}

function setPixelAlpha(png, x, y, color, alpha) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const idx = (y * W + x) << 2;
  png.data[idx] = Math.round(png.data[idx] * (1 - alpha) + color[0] * alpha);
  png.data[idx + 1] = Math.round(png.data[idx + 1] * (1 - alpha) + color[1] * alpha);
  png.data[idx + 2] = Math.round(png.data[idx + 2] * (1 - alpha) + color[2] * alpha);
}

const pages = [
  { slug: 'main', title: '울산챔피언나이트', subtitle: '리얼 후기 블로그' },
  { slug: 'first-time', title: '처음 가본 후기', subtitle: '입구부터 소름' },
  { slug: 'weekend', title: '금요일 vs 토요일', subtitle: '주말 완전 비교' },
  { slug: 'over40', title: '40대도 즐긴다', subtitle: '나이는 숫자일 뿐' },
  { slug: 'couple', title: '커플 방문 후기', subtitle: '같이 가도 괜찮을까' },
  { slug: 'alone', title: '혼자 가도 되나?', subtitle: '솔로 체험기' },
  { slug: 'summer', title: '여름밤 체험기', subtitle: '바다 바람 맞고' },
  { slug: 'event', title: '이벤트 후기', subtitle: '그날은 달랐다' },
  { slug: 'vs', title: '나이트 비교', subtitle: '솔직 비교 후기' },
  { slug: 'food', title: '맛집 코스', subtitle: '먹고 놀고 해장' },
  { slug: 'safety', title: '안전 가이드', subtitle: '꼭 알아둬' },
];

for (const page of pages) {
  const png = createImage(page.title, page.subtitle);
  const outPath = path.join(outDir, `${page.slug}.png`);
  const buffer = PNG.sync.write(png, { colorType: 2, filterType: 4 });
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ ${page.slug}.png (${(buffer.length / 1024).toFixed(0)}KB)`);
}

console.log('Done!');

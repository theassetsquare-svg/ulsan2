// 1200x1200 썸네일 생성기 — opentype.js path 변환 + sharp 렌더 (시스템 한글폰트 의존 0)
'use strict';
const fs = require('fs'), path = require('path');
const ot = require('opentype.js');
const sharp = require('sharp');
const { build, CTA_NICK, CTA_KAKAO, ROOT } = require('./pages.js');

const FONT = ot.parse(fs.readFileSync(path.join(__dirname, 'fonts/Pretendard-Black.otf')).buffer);
const S = 1200, PAD = 60, USABLE = S - PAD * 2;   // 1080
const OUT = path.join(ROOT, 'og');

const BG = '#0b0b14', BG2 = '#161628';
const GOLD = '#E8B84B', NEON = '#FFE600', WHITE = '#ffffff', DIM = '#9aa4b8';

// 크기 100 기준 잉크 박스 측정
const cache = new Map();
function ink(text) {
  if (cache.has(text)) return cache.get(text);
  const p = FONT.getPath(text, 0, 0, 100);
  const b = p.getBoundingBox();
  const v = { d: p.toPathData(2), x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2, w: b.x2 - b.x1, h: b.y2 - b.y1 };
  cache.set(text, v); return v;
}
// 폭(px) 목표 → 균일 스케일. 높이 하한이 있으면 Y만 늘림(sy>=sx)
function line(text, { w, h, minH, color, weightBox }) {
  const b = ink(text);
  let sx = w / b.w;
  let sy = h != null ? h / b.h : sx;
  if (minH != null && sy * b.h < minH) sy = minH / b.h;
  return { text, b, sx, sy, w: sx * b.w, h: sy * b.h, color, weightBox: !!weightBox };
}
// 킥커: 폭 40% 이내 + 높이 52px 이내 (균일 스케일, 주인공 침범 금지)
function kickLine(text) {
  const b = ink(text);
  const sc = Math.min(USABLE * 0.40 / b.w, 52 / b.h);
  return { text, b, sx: sc, sy: sc, w: sc * b.w, h: sc * b.h, color: DIM, weightBox: false };
}
// 닉네임: 높이를 먼저 고정(주인공보다 크면 안 됨) → 폭이 하한 미만이면 X만 확장
function nickLine(text, H, minW) {
  const b = ink(text);
  const sy = H / b.h;
  const sx = Math.max(sy, minW / b.w);
  return { text, b, sx, sy, w: sx * b.w, h: H, color: WHITE, weightBox: false };
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function render(lines, gapWeights) {
  const totalH = lines.reduce((a, l) => a + l.h, 0);
  const gaps = lines.length - 1;
  const free = USABLE - totalH;
  const wsum = gapWeights.reduce((a, b) => a + b, 0);
  let y = PAD + (free > 0 ? 0 : 0);
  const parts = [];
  const drawn = [];
  lines.forEach((l, i) => {
    const tx = S / 2 - l.sx * (l.b.x1 + l.b.x2) / 2;
    const ty = y - l.sy * l.b.y1;
    if (l.weightBox) {
      const bx = S / 2 - l.w / 2 - 34, bw = l.w + 68, by = y - 26, bh = l.h + 52;
      parts.push(`<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="18" fill="#000000" stroke="${NEON}" stroke-width="6"/>`);
    }
    parts.push(`<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${l.sx.toFixed(5)} ${l.sy.toFixed(5)})"><path d="${l.b.d}" fill="${l.color}"/></g>`);
    drawn.push({ text: l.text, widthPx: +l.w.toFixed(1), heightPx: +l.h.toFixed(1), widthPct: +(l.w / USABLE * 100).toFixed(1) });
    y += l.h + (i < gaps ? free * gapWeights[i] / wsum : 0);
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BG2}"/><stop offset="1" stop-color="${BG}"/></linearGradient></defs>
<rect width="${S}" height="${S}" fill="${BG}"/><rect width="${S}" height="${S}" fill="url(#g)"/>
<rect x="14" y="14" width="${S - 28}" height="${S - 28}" fill="none" stroke="${GOLD}" stroke-width="4" opacity=".55"/>
${parts.join('\n')}
</svg>`;
  return { svg, drawn };
}

function kickerOf(p, names) {
  if (p.kind === 'hub') return '전국 나이트 목록';
  let t = p.title.replace(/\s+/g, ' ').trim();
  if (p.store) t = t.split(p.store).join(' ');
  t = t.replace(/^[\s,·—\-–|]+/, '').replace(/[\s,·—\-–|]+$/, '');
  t = t.replace(/^(는|은|이|가|을|를|와|과|도|의)\s*/, '');
  t = t.split(/[—|]/)[0].split('? ')[0].replace(/^[·\s]+|[·\s]+$/g, '').trim();
  if (t.length > 15) { const cut = t.slice(0, 16); const sp = cut.lastIndexOf(' '); t = (sp > 6 ? cut.slice(0, sp) : t.slice(0, 15)).trim(); }
  t = t.replace(/[?!]$/, '');
  t = t.replace(/[,·\-–|]+$/, '').trim();
  for (const n of names) if (n !== p.store && t.includes(n)) return '나이트 안내';
  return t || '나이트 안내';
}

(async () => {
  const { pages, names } = build();
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = [];
  for (const p of pages) {
    if (p.kind === 'home') continue;               // 홈 썸네일은 기존 파일 유지
    const kicker = kickerOf(p, names);
    let lines, gaps, hero;
    if (p.kind === 'A') {
      lines = [
        kickLine(kicker),
        line(p.store, { w: USABLE * 0.60, color: GOLD }),
        nickLine(p.ad.nick, 178, USABLE * 0.45),
        line(p.ad.tel, { w: USABLE * 0.93, h: 212, color: NEON, weightBox: true }),
        line(`${CTA_NICK} 카톡 besta12`, { w: USABLE * 0.55, color: DIM }),
      ];
      gaps = [1, 1.1, 1.2, 1.1];
      hero = p.ad.tel;
    } else {
      const head = p.kind === 'hub' ? p.title.replace(/\s*—.*$/, '').trim() : p.store;
      lines = [
        kickLine(kicker),
        line(head, { w: USABLE * (p.kind === 'hub' ? 0.62 : 0.60), color: GOLD }),
        line(CTA_NICK, { w: USABLE * 0.80, h: 252, color: NEON, weightBox: true }),
        line(CTA_KAKAO, { w: USABLE * 0.75, h: 132, color: WHITE }),
      ];
      gaps = [1, 1.2, 1];
      hero = CTA_NICK;
    }
    const { svg, drawn } = render(lines, gaps);
    const file = path.join(OUT, `${p.slug}.png`);
    let buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 100, effort: 10 }).toBuffer();
    if (buf.length > 300 * 1024) buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, colors: 64, effort: 10 }).toBuffer();
    fs.writeFileSync(file, buf);
    const meta = await sharp(file).metadata();
    manifest.push({
      file: `/og/${p.slug}.png`, page: p.absUrl, store: p.store || '(허브/중립)',
      kind: p.kind, hero, texts: drawn,
      width: meta.width, height: meta.height, bytes: buf.length,
    });
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  const over = manifest.filter(m => m.bytes > 300 * 1024);
  console.log(`생성 ${manifest.length}장 · 최대 ${(Math.max(...manifest.map(m => m.bytes)) / 1024).toFixed(1)}KB · 300KB 초과 ${over.length}건`);
  const a = manifest.find(m => m.kind === 'A'), b = manifest.find(m => m.kind === 'B');
  console.log('A샘플', JSON.stringify(a.texts));
  console.log('B샘플', JSON.stringify(b.texts));
})();

// 2차 13페이지 OG 1200x1200 생성 (sharp + NanumGothic)
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PAGES } = require('./night2-data.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'og');
const S = 1200;
const FONT = 'NanumGothic';

// 1차 13색 (겹침 금지 기준)
const OLDC = ['#622525', '#442a64', '#531d49', '#802a46', '#294439', '#64381a', '#253862',
  '#534316', '#72341a', '#353572', '#2e431a', '#1d4843', '#1a4664'];

const hex2rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => { const L1 = lum(a), L2 = lum(b); const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]; return (hi + 0.05) / (lo + 0.05); };

function hsl2hex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('');
}

// 13색 자동 선정: 기존 13색과 상호 간 RGB 거리 >= MIN, 흰 글씨 대비 >= 6
function pickPalette() {
  const oldRgb = OLDC.map(hex2rgb);
  const cand = [];
  for (let h = 0; h < 360; h += 3)
    for (let s = 45; s <= 85; s += 5)
      for (let l = 17; l <= 32; l += 3) {
        const hex = hsl2hex(h, s, l), rgb = hex2rgb(hex);
        if (contrast(rgb, [255, 255, 255]) < 6) continue;
        cand.push({ hex, rgb, h });
      }
  // farthest-point sampling: 기존 13색 + 이미 고른 색에서 가장 먼 후보를 13번 뽑는다
  const chosen = [];
  for (let step = 0; step < 13; step++) {
    let best = null, bestD = -1;
    for (const c of cand) {
      const d = Math.min(
        ...oldRgb.map(o => dist(c.rgb, o)),
        ...chosen.map(o => dist(c.rgb, o.rgb))
      );
      if (d > bestD) { bestD = d; best = c; }
    }
    chosen.push(best);
  }
  const minD = Math.min(...chosen.map(c => Math.min(
    ...oldRgb.map(o => dist(c.rgb, o)),
    ...chosen.filter(x => x !== c).map(o => dist(c.rgb, o.rgb))
  )));
  if (minD < 40) throw new Error('palette 실패 minD=' + minD);
  // hue 순 정렬해 인접 페이지끼리 색이 붙지 않게 섞는다
  chosen.sort((a, b) => a.h - b.h);
  const mixed = [];
  for (let k = 0; k < 13; k++) mixed.push(chosen[(k * 5) % 13]);
  return { colors: mixed.map(c => c.hex), min: minD.toFixed(1) };
}

const svgText = (text, size, color, weight) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S * 2}" height="${Math.ceil(size * 2.2)}">` +
  `<text x="${S}" y="${Math.ceil(size * 1.5)}" font-family="${FONT}" font-weight="${weight || 'bold'}" ` +
  `font-size="${size}" fill="${color}" text-anchor="middle" xml:space="preserve">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`;

async function textPng(text, size, color, weight) {
  const b = await sharp(Buffer.from(svgText(text, size, color, weight)))
    .png().trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  return { buf: b.data, w: b.info.width, h: b.info.height };
}

async function fit(text, start, maxW, color, minH) {
  let size = start;
  for (let i = 0; i < 60; i++) {
    const t = await textPng(text, size, color);
    if (t.w <= maxW && (!minH || t.h >= minH)) return { ...t, size };
    if (t.w > maxW) { size -= 3; continue; }
    if (minH && t.h < minH) { size += 3; continue; }
  }
  throw new Error('fit 실패: ' + text);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { colors, min } = pickPalette();
  console.log(`팔레트 최소 RGB거리 ${min} :: ${colors.join(' ')}`);

  const report = [];
  for (let i = 0; i < PAGES.length; i++) {
    const p = PAGES[i];
    const bg = colors[i];
    const bgRgb = hex2rgb(bg);
    const layers = [];

    // 주 키워드 (가장 큰 글자, 좌우 여백 100px 이상 → maxW 1000)
    const kwY = p.group === 'A' ? 300 : 400;
    const kw = await fit(p.kw, 176, 1000, '#ffffff');
    layers.push({ input: kw.buf, left: Math.round((S - kw.w) / 2), top: Math.round(kwY - kw.h / 2) });

    // 지역명
    const reg = await fit(p.region, 54, 1000, '#f0e6c8');
    const regY = p.group === 'A' ? 640 : 640;
    layers.push({ input: reg.buf, left: Math.round((S - reg.w) / 2), top: Math.round(regY - reg.h / 2) });

    let bandContrast = null, telH = null, telSize = null, nickH = null;
    if (p.group === 'A') {
      // 하단 60~100% 검은 띠
      layers.push({
        input: await sharp({ create: { width: S, height: 480, channels: 4, background: '#000000' } }).png().toBuffer(),
        left: 0, top: 720,
      });
      const nick = await fit(p.staff, 70, 900, '#ffffff');
      layers.push({ input: nick.buf, left: Math.round((S - nick.w) / 2), top: Math.round(845 - nick.h / 2) });
      nickH = nick.h;
      // 전화번호: 글자높이 100px 이상 + 폭 1000 이내
      const tel = await fit(p.tel, 152, 1000, '#ffffff', 100);
      layers.push({ input: tel.buf, left: Math.round((S - tel.w) / 2), top: Math.round(1020 - tel.h / 2) });
      telH = tel.h; telSize = tel.size;
      bandContrast = contrast([0, 0, 0], [255, 255, 255]);
    } else {
      const brand = await fit('ulsanc.pages.dev', 44, 900, '#e8d9a8');
      layers.push({ input: brand.buf, left: Math.round((S - brand.w) / 2), top: 1060 });
      // 구분선
      layers.push({
        input: await sharp({ create: { width: 360, height: 5, channels: 4, background: '#E8B84B' } }).png().toBuffer(),
        left: (S - 360) / 2, top: 800,
      });
    }

    // 연령 배지 (창원·대전 2장만) — 우측 상단 완전문
    if (p.age) {
      const badgeTxt = await textPng(p.age, 40, '#111111');
      const bw = badgeTxt.w + 56, bh = badgeTxt.h + 40;
      const plate = await sharp(Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}"><rect x="0" y="0" width="${bw}" height="${bh}" rx="${bh / 2}" fill="#ffd400"/></svg>`
      )).png().toBuffer();
      layers.push({ input: plate, left: S - bw - 48, top: 48 });
      layers.push({ input: badgeTxt.buf, left: S - bw - 48 + 28, top: 48 + 20 });
    }

    const file = path.join(OUT, `${p.slug}-og.png`);
    await sharp({ create: { width: S, height: S, channels: 4, background: bg } })
      .composite(layers).png({ compressionLevel: 9, palette: true }).toFile(file);

    const st = fs.statSync(file);
    const md = await sharp(file).metadata();
    report.push({
      slug: p.slug, file: `${p.slug}-og.png`, bg, group: p.group,
      size: `${md.width}x${md.height}`, kb: +(st.size / 1024).toFixed(1),
      kwSize: kw.size, kwH: kw.h, kwW: kw.w,
      staff: p.staff || '-', tel: p.tel || '-', telSize, telH, nickH,
      bandContrast: bandContrast ? bandContrast.toFixed(1) + ':1' : '-',
      bgContrast: contrast(bgRgb, [255, 255, 255]).toFixed(2) + ':1',
      badge: p.age || '-',
      minOldDist: Math.min(...OLDC.map(o => dist(bgRgb, hex2rgb(o)))).toFixed(1),
    });
  }
  console.table(report.map(r => ({
    파일: r.file, 크기: r.size, KB: r.kb, 그룹: r.group, 배경: r.bg,
    '1차색최소거리': r.minOldDist, '배경대비': r.bgContrast,
    닉네임: r.staff, 전화번호: r.tel, '번호글자높이': r.telH ?? '-', '띠대비': r.bandContrast, 연령배지: r.badge,
  })));
  fs.writeFileSync(path.join(ROOT, 'night2-og-report.json'), JSON.stringify(report, null, 1));
})();

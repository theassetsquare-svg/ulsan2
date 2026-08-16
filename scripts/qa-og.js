// 나이트 문답 사전 OG 1:1 (1200x1200) — 배경 단색 옐로/블랙 조합
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { VENUES } = require('./qa-data.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'og-qa');
const S = 1200;
const FONT = 'NanumGothic';
const YELLOW = '#ffd400';
const BLACK = '#111111';

const hex2rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => { const L1 = lum(a), L2 = lum(b); const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]; return (hi + 0.05) / (lo + 0.05); };

const svgText = (text, size, color, weight) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S * 2}" height="${Math.ceil(size * 2.4)}">` +
  `<text x="${S}" y="${Math.ceil(size * 1.6)}" font-family="${FONT}" font-weight="${weight || 'bold'}" ` +
  `font-size="${size}" fill="${color}" text-anchor="middle" xml:space="preserve">` +
  `${String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`;

async function textPng(text, size, color, weight) {
  const b = await sharp(Buffer.from(svgText(text, size, color, weight)))
    .png().trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  return { buf: b.data, w: b.info.width, h: b.info.height };
}

async function fit(text, start, maxW, color, minH, weight) {
  let size = start;
  for (let i = 0; i < 80; i++) {
    const t = await textPng(text, size, color, weight);
    if (t.w <= maxW && (!minH || t.h >= minH)) return { ...t, size };
    if (t.w > maxW) { size -= 3; continue; }
    if (minH && t.h < minH) { size += 3; continue; }
  }
  throw new Error('fit 실패: ' + text);
}

// 훅 질문을 두 줄로 쪼갠다 (공백 기준, 균형 분할)
function wrap2(text) {
  const w = text.split(' ');
  if (w.length < 3) return [text];
  let best = 1, diff = Infinity;
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(' ').length, b = w.slice(i).join(' ').length;
    if (Math.abs(a - b) < diff) { diff = Math.abs(a - b); best = i; }
  }
  return [w.slice(0, best).join(' '), w.slice(best).join(' ')];
}

async function card({ file, bg, name, region, hook, footL, footR, badge }) {
  const dark = bg === BLACK;
  const fg = dark ? YELLOW : BLACK;
  const sub = dark ? '#ffffff' : BLACK;
  const layers = [];

  // 상단 라벨
  const label = await textPng('나이트 문답 사전', 40, sub);
  layers.push({ input: label.buf, left: Math.round((S - label.w) / 2), top: 96 });

  // 구분선
  layers.push({
    input: await sharp({ create: { width: 220, height: 6, channels: 4, background: fg } }).png().toBuffer(),
    left: (S - 220) / 2, top: 176,
  });

  // 업소명 (가장 큰 글자, 좌우 여백 100px 이상)
  const kw = await fit(name, 150, 1000, fg);
  layers.push({ input: kw.buf, left: Math.round((S - kw.w) / 2), top: Math.round(330 - kw.h / 2) });

  // 지역
  const reg = await fit(region, 46, 1000, sub);
  layers.push({ input: reg.buf, left: Math.round((S - reg.w) / 2), top: Math.round(440 - reg.h / 2) });

  // 훅 질문 (Q 마크 + 최대 2줄)
  const qm = await textPng('Q.', 62, fg);
  layers.push({ input: qm.buf, left: Math.round((S - qm.w) / 2), top: 540 });

  const lines = wrap2(hook + '?');
  let y = 650;
  for (const ln of lines) {
    const t = await fit(ln, 72, 1000, sub);
    layers.push({ input: t.buf, left: Math.round((S - t.w) / 2), top: y });
    y += t.h + 26;
  }

  // 하단 띠 (반전 색) + 연락 정보
  const bandBg = dark ? YELLOW : BLACK;
  const bandFg = dark ? BLACK : YELLOW;
  layers.push({
    input: await sharp({ create: { width: S, height: 300, channels: 4, background: bandBg } }).png().toBuffer(),
    left: 0, top: 900,
  });
  const l1 = await fit(footL, 62, 1000, bandFg);
  layers.push({ input: l1.buf, left: Math.round((S - l1.w) / 2), top: Math.round(985 - l1.h / 2) });
  const l2 = await fit(footR, 110, 1000, bandFg, 78);
  layers.push({ input: l2.buf, left: Math.round((S - l2.w) / 2), top: Math.round(1090 - l2.h / 2) });

  // 연령 배지 (우측 상단, 완전문)
  if (badge) {
    const bt = await textPng(badge, 38, dark ? BLACK : YELLOW);
    const bw = bt.w + 52, bh = bt.h + 38;
    const plate = await sharp(Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}"><rect width="${bw}" height="${bh}" rx="${bh / 2}" fill="${dark ? YELLOW : BLACK}"/></svg>`
    )).png().toBuffer();
    layers.push({ input: plate, left: S - bw - 44, top: 44 });
    layers.push({ input: bt.buf, left: S - bw - 44 + 26, top: 44 + 19 });
  }

  await sharp({ create: { width: S, height: S, channels: 4, background: bg } })
    .composite(layers).png({ compressionLevel: 9, palette: true }).toFile(file);

  const st = fs.statSync(file);
  const md = await sharp(file).metadata();
  return {
    file: path.basename(file), size: `${md.width}x${md.height}`, kb: +(st.size / 1024).toFixed(1),
    bg, 대비: contrast(hex2rgb(bg), hex2rgb(fg)).toFixed(1) + ':1',
    띠대비: contrast(hex2rgb(bandBg), hex2rgb(bandFg)).toFixed(1) + ':1',
    업소명크기: kw.size, 하단글자높이: l2.h,
  };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const report = [];

  for (const v of VENUES) {
    const bg = v.ogBg === 'black' ? BLACK : YELLOW;
    const age = (v.facts.find(f => f[0] === '출입 연령') || [])[1];
    report.push(await card({
      file: path.join(OUT, `${v.slug}-og.png`),
      bg, name: v.name, region: v.region, hook: v.hook,
      footL: v.adv ? `예약·문의 ${v.adv.staff}` : '광고·제휴 문의 카카오톡',
      footR: v.adv ? v.adv.tel : 'besta12',
      badge: age && age !== '확인 불가' ? age : null,
    }));
  }

  // 허브
  report.push(await card({
    file: path.join(OUT, 'hub-og.png'), bg: BLACK,
    name: '전국 나이트 문답집', region: '40개 업소 · 문답 304개',
    hook: '어느 업소가 궁금한가',
    footL: '광고·제휴 문의 카카오톡', footR: 'besta12',
  }));

  // 홈
  report.push(await card({
    file: path.join(OUT, 'home-og.png'), bg: YELLOW,
    name: '울산챔피언나이트', region: '울산 남구 삼산동 · 20문 20답',
    hook: '주소와 규모가 어떻게 되나',
    footL: '예약·문의 춘자', footR: '010-5653-0069',
  }));

  console.table(report);
  fs.writeFileSync(path.join(ROOT, 'qa-og-report.json'), JSON.stringify(report, null, 1));
  console.log(`OG ${report.length}장 생성 → /og-qa/`);
})();

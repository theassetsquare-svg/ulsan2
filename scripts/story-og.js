// 홈(성공스토리) OG 1:1 (1200x1200)
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'og-qa');
const S = 1200;
const FONT = 'NotoSansKR, NanumGothic, sans-serif';
const YELLOW = '#ffd400';
const BLACK = '#111111';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svgText = (text, size, color, weight) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S * 2}" height="${Math.ceil(size * 2.6)}">` +
  `<text x="${S}" y="${Math.ceil(size * 1.7)}" font-family="${FONT}" font-weight="${weight || 'bold'}" ` +
  `font-size="${size}" fill="${color}" text-anchor="middle" xml:space="preserve">${esc(text)}</text></svg>`;

async function textPng(text, size, color, weight) {
  const b = await sharp(Buffer.from(svgText(text, size, color, weight)))
    .png().trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  return { buf: b.data, w: b.info.width, h: b.info.height };
}
async function fit(text, start, maxW, color, weight) {
  let size = start;
  for (let i = 0; i < 120; i++) {
    const t = await textPng(text, size, color, weight);
    if (t.w <= maxW) return { ...t, size };
    size -= 4;
  }
  throw new Error('fit 실패: ' + text);
}

(async () => {
  const MAXW = S - 130;
  const layers = [];

  // 상단 옐로 바
  layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="14"><rect width="${S}" height="14" fill="${YELLOW}"/></svg>`), top: 0, left: 0 });

  const kicker = await fit('1,000일의  기록', 46, MAXW - 200, YELLOW, '900');
  const num    = await fit('4,300원', 300, MAXW, YELLOW, '900');
  const l1     = await fit('통장에 이것만 남은 날', 92, MAXW, '#ffffff', 'bold');
  const l2     = await fit('나는 벽에 종이 한 장을 붙였다', 92, MAXW, '#ffffff', 'bold');
  const foot   = await fit('끝까지  읽게  되는  글', 50, MAXW - 120, BLACK, '900');

  let y = 190;
  layers.push({ input: kicker.buf, top: y, left: Math.round((S - kicker.w) / 2) });
  y += kicker.h + 90;
  layers.push({ input: num.buf, top: y, left: Math.round((S - num.w) / 2) });
  y += num.h + 96;
  layers.push({ input: l1.buf, top: y, left: Math.round((S - l1.w) / 2) });
  y += l1.h + 42;
  layers.push({ input: l2.buf, top: y, left: Math.round((S - l2.w) / 2) });

  // 하단 옐로 밴드 + 문구
  const bandH = 132;
  layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${bandH}"><rect width="${S}" height="${bandH}" fill="${YELLOW}"/></svg>`), top: S - bandH, left: 0 });
  layers.push({ input: foot.buf, top: S - bandH + Math.round((bandH - foot.h) / 2), left: Math.round((S - foot.w) / 2) });

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, 'story-og.png');
  await sharp({ create: { width: S, height: S, channels: 3, background: BLACK } })
    .composite(layers).png({ compressionLevel: 9 }).toFile(file);

  const st = fs.statSync(file);
  const meta = await sharp(file).metadata();
  console.log(`✅ ${path.relative(ROOT, file)}  ${meta.width}x${meta.height}  ${(st.size / 1024).toFixed(1)}KB`);
  console.log(`   글자높이 kicker=${kicker.h} num=${num.h} l1=${l1.h} l2=${l2.h} foot=${foot.h}`);
  console.log(`   마지막 텍스트 하단 y=${y + l2.h} (밴드 시작 ${S - bandH})`);
})();

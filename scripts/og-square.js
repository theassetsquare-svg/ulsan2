// /og-images/*.png 를 1200x1200 정사각으로 재생성.
// 내용 규칙 변경 금지: 네이비 그라데이션 + 골드 테두리/모서리 + 왕관 + 브랜드/담당자/주제/훅/전화 5줄 구성 그대로.
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'og-images');
const S = 1200;
const FONT = 'NotoSansKR, NanumGothic, sans-serif';
const GOLD = '#c9a96e';
const NAVY_T = '#1e3a5f', NAVY_B = '#0a1428';

// 기존 1200x630 썸네일에서 실측한 문구 그대로 (변경 금지)
const PAGES = [
  { slug: 'main',       brand: '울산챔피언나이트', staff: '춘 자', topic: '리얼 후기 블로그', hook: '직접 가보고 썼다',   tel: '010-5653-0069' },
  { slug: 'first-time', brand: '울산챔피언나이트', staff: '춘 자', topic: '첫 방문 후기',     hook: '문 열고 3초',        tel: '010-5653-0069' },
  { slug: 'weekend',    brand: '울산챔피언나이트', staff: '춘 자', topic: '주말 후기',        hook: '금토 완전 다름',      tel: '010-5653-0069' },
  { slug: 'over40',     brand: '울산챔피언나이트', staff: '춘 자', topic: '40대 후기',        hook: '나이는 숫자일 뿐',    tel: '010-5653-0069' },
  { slug: 'couple',     brand: '울산챔피언나이트', staff: '춘 자', topic: '커플 후기',        hook: '둘이 가면 다르다',    tel: '010-5653-0069' },
  { slug: 'alone',      brand: '울산챔피언나이트', staff: '춘 자', topic: '혼자 후기',        hook: '오히려 더 편했다',    tel: '010-5653-0069' },
  { slug: 'summer',     brand: '울산챔피언나이트', staff: '춘 자', topic: '여름 후기',        hook: '시원하게 놀자',      tel: '010-5653-0069' },
  { slug: 'event',      brand: '울산챔피언나이트', staff: '춘 자', topic: '이벤트 후기',      hook: '기대 이상이었다',    tel: '010-5653-0069' },
  { slug: 'vs',         brand: '울산챔피언나이트', staff: '춘 자', topic: '비교 후기',        hook: '어디가 나을까',      tel: '010-5653-0069' },
  { slug: 'food',       brand: '울산챔피언나이트', staff: '춘 자', topic: '먹거리 후기',      hook: '안주가 달랐다',      tel: '010-5653-0069' },
  { slug: 'safety',     brand: '울산챔피언나이트', staff: '춘 자', topic: '안전 후기',        hook: '걱정 뚝',            tel: '010-5653-0069' },
  // 불광동호박나이트는 담당자 허용표에 따라 손흥민 010-2221-1937
  { slug: 'bulgwang',   brand: '불광동호박나이트', staff: '손흥민', topic: '예약 안내',        hook: '은평구 불광동',      tel: '010-2221-1937' },
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function svg(p) {
  const cx = S / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${NAVY_T}"/><stop offset="100%" stop-color="${NAVY_B}"/></linearGradient></defs>
<rect width="${S}" height="${S}" fill="url(#bg)"/>
<rect x="2.5" y="2.5" width="${S - 5}" height="${S - 5}" fill="none" stroke="${GOLD}" stroke-width="5"/>
<g stroke="${GOLD}" stroke-width="6" fill="none">
<path d="M70 130 L70 70 L130 70"/><path d="M${S - 130} 70 L${S - 70} 70 L${S - 70} 130"/>
<path d="M70 ${S - 130} L70 ${S - 70} L130 ${S - 70}"/><path d="M${S - 130} ${S - 70} L${S - 70} ${S - 70} L${S - 70} ${S - 130}"/>
</g>
<g fill="${GOLD}" opacity=".55">
<circle cx="200" cy="250" r="5"/><circle cx="1000" cy="200" r="5"/>
<circle cx="150" cy="820" r="5"/><circle cx="1050" cy="900" r="5"/><circle cx="100" cy="1010" r="5"/>
</g>
<path d="M525 300 L560 215 L580 275 L600 205 L620 275 L640 215 L675 300 Z" fill="${GOLD}"/>
<rect x="525" y="300" width="150" height="26" fill="${GOLD}"/>
<line x1="300" y1="400" x2="900" y2="400" stroke="${GOLD}" stroke-width="2" opacity=".75"/>
<text x="${cx}" y="510" font-family="${FONT}" font-size="86" font-weight="bold" fill="${GOLD}" text-anchor="middle" letter-spacing="2">${esc(p.brand)}</text>
<text x="${cx}" y="605" font-family="${FONT}" font-size="52" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="10">${esc(p.staff)}</text>
<line x1="345" y1="678" x2="855" y2="678" stroke="#8fa3bd" stroke-width="2" opacity=".65"/>
<text x="${cx}" y="790" font-family="${FONT}" font-size="62" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">${esc(p.topic)}</text>
<text x="${cx}" y="875" font-family="${FONT}" font-size="38" fill="#b9c6d6" text-anchor="middle" letter-spacing="6">${esc(p.hook)}</text>
<text x="${cx}" y="1010" font-family="${FONT}" font-size="42" fill="${GOLD}" text-anchor="middle" letter-spacing="3">${esc(p.tel)}</text>
</svg>`;
}

(async () => {
  for (const p of PAGES) {
    const file = path.join(OUT, `${p.slug}.png`);
    await sharp(Buffer.from(svg(p))).png({ compressionLevel: 9 }).toFile(file + '.tmp');
    fs.renameSync(file + '.tmp', file);
    const m = await sharp(file).metadata();
    const kb = (fs.statSync(file).size / 1024).toFixed(1);
    console.log(`✓ ${p.slug}.png  ${m.width}x${m.height}  ${kb}KB`);
  }
})();

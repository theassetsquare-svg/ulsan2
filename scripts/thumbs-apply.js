// 전 페이지: OG 메타 9종 완비 + 본문 썸네일 img 삽입 (중복 삽입 방지)
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE = 'https://baeyong.pages.dev';

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(e.name) || e.name.startsWith('.')) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name === 'index.html') out.push(p);
  }
  return out;
}
const getMeta = (h, n) => {
  const m = h.match(new RegExp(`<meta\\s+[^>]*(?:name|property)=["']${n}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i'));
  return m ? m[1] : null;
};
const hasMeta = (h, n) => new RegExp(`(?:name|property)=["']${n}["']`, 'i').test(h);

// 여는 태그 위치에서 짝 맞는 닫는 태그 끝 인덱스를 찾는다
function matchClose(html, openIdx, tag) {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'gi');
  re.lastIndex = openIdx;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') { depth--; if (depth === 0) return m.index + m[0].length; }
    else depth++;
  }
  return -1;
}

const files = walk(ROOT).sort();
const report = [];
let metaAdded = 0, imgAdded = 0;

for (const f of files) {
  let h = fs.readFileSync(f, 'utf8');
  const before = h;
  const slug = path.relative(ROOT, f).replace(/\/?index\.html$/, '') || '/';
  const ogImage = getMeta(h, 'og:image');
  if (!ogImage) { report.push({ slug, err: 'og:image 없음' }); continue; }
  const relPath = ogImage.replace(/^https?:\/\/[^/]+/, '');
  const absUrl = BASE + relPath;
  const alt = getMeta(h, 'og:image:alt') || '';

  /* ── 1) 메타 9종 ── */
  const add = [];
  // og:image 를 절대 URL 로 정규화
  if (ogImage !== absUrl) h = h.replace(new RegExp(`(property=["']og:image["'][^>]*content=["'])${ogImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `$1${absUrl}`);
  if (!hasMeta(h, 'og:image:secure_url')) add.push(`<meta property="og:image:secure_url" content="${absUrl}">`);
  if (!hasMeta(h, 'og:image:type')) add.push(`<meta property="og:image:type" content="image/png">`);
  if (!hasMeta(h, 'twitter:image')) add.push(`<meta name="twitter:image" content="${absUrl}">`);
  if (!hasMeta(h, 'thumbnail')) add.push(`<meta name="thumbnail" content="${absUrl}">`);
  // width/height 1200 강제
  h = h.replace(/(<meta property="og:image:width" content=")[^"]*(")/i, `$11200$2`);
  h = h.replace(/(<meta property="og:image:height" content=")[^"]*(")/i, `$11200$2`);
  if (!hasMeta(h, 'og:image:width')) add.push(`<meta property="og:image:width" content="1200">`);
  if (!hasMeta(h, 'og:image:height')) add.push(`<meta property="og:image:height" content="1200">`);
  // twitter:card = summary
  h = h.replace(/(<meta name="twitter:card" content=")[^"]*(")/i, `$1summary$2`);
  if (!hasMeta(h, 'twitter:card')) add.push(`<meta name="twitter:card" content="summary">`);
  // twitter:image 를 og:image 와 동일 파일로 정렬
  h = h.replace(/(<meta name="twitter:image" content=")[^"]*(")/i, `$1${absUrl}$2`);

  if (add.length) {
    h = h.replace('</head>', add.join('\n') + '\n</head>');
    metaAdded += add.length;
  }

  /* ── 2) 본문 img ── */
  const bodyStart = h.search(/<body[^>]*>/i);
  const bodyHtml = h.slice(bodyStart);
  const already = new RegExp(`<img[^>]*src=["'](?:${BASE})?${relPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(bodyHtml);
  let where = null;
  if (!already) {
    const imgTag = `\n<img src="${relPath}" alt="${alt.replace(/"/g, '&quot;')}" width="1200" height="1200" style="max-width:100%;height:auto" loading="eager">`;
    // 직답박스 우선
    let ins = -1;
    let m = h.slice(bodyStart).match(/<(div|section)\s+class="direct"/i);
    if (m) { const oi = bodyStart + m.index; ins = matchClose(h, oi, m[1]); where = 'direct'; }
    if (ins < 0) {
      m = h.slice(bodyStart).match(/<(div|section|aside)\s+[^>]*class="[^"]*\banswer-box\b/i);
      if (m) { const oi = bodyStart + m.index; ins = matchClose(h, oi, m[1]); where = 'answer-box'; }
    }
    if (ins < 0) {
      const hm = h.slice(bodyStart).match(/<\/h1>/i);
      if (hm) { ins = bodyStart + hm.index + hm[0].length; where = 'h1'; }
    }
    if (ins > 0) { h = h.slice(0, ins) + imgTag + h.slice(ins); imgAdded++; }
    else where = '삽입실패';
  } else where = '이미 있음';

  if (h !== before) fs.writeFileSync(f, h);
  report.push({ slug, thumb: relPath, alt, metaAdded: add.length, imgAt: where });
}
fs.writeFileSync(path.join(ROOT, 'thumbs-report.json'), JSON.stringify(report, null, 1));
console.log(`페이지 ${report.length}개 · 메타 ${metaAdded}건 추가 · 본문 img ${imgAdded}건 삽입`);
console.log('삽입 위치 분포:', JSON.stringify(report.reduce((a, r) => { a[r.imgAt] = (a[r.imgAt] || 0) + 1; return a; }, {})));

// 기존 파일 append 전용: night/index.html · sitemap.xml · llms.txt · robots.txt
'use strict';
const fs = require('fs');
const path = require('path');
const { PAGES } = require('./night2-data.js');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://b.nolcool.com';
const TODAY = '2026-08-15';

// ── 1) night/index.html : 지역 키워드 섹션 append (기존 줄 삭제 0)
{
  const f = path.join(ROOT, 'night', 'index.html');
  let h = fs.readFileSync(f, 'utf8');
  if (!h.includes('id="region-list"')) {
    const items = PAGES.map(p =>
      `<li><a href="/night/${p.slug}/"><strong>${p.kw}</strong> — ${p.title.slice(p.kw.length + 1)}</a><span>${p.region}</span></li>`
    ).join('\n');
    const block = `<section id="region-list">
<h2>지역 키워드로 보기 13곳</h2>
<ul class="night-list">
${items}
</ul>
</section>
`;
    const anchor = '</section>\n</article>';
    if (!h.includes(anchor)) throw new Error('night/index.html anchor 없음');
    h = h.replace(anchor, '</section>\n' + block + '</article>');
    fs.writeFileSync(f, h);
    console.log('night/index.html: 지역 목록 섹션 append');
  } else console.log('night/index.html: 이미 존재 — 건너뜀');
}

// ── 2) sitemap.xml : 13 URL append (기존 항목 무수정)
{
  const f = path.join(ROOT, 'sitemap.xml');
  let x = fs.readFileSync(f, 'utf8');
  const add = PAGES.filter(p => !x.includes(`/night/${p.slug}/`)).map(p => `  <url>
    <loc>${SITE}/night/${p.slug}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${SITE}/og/${p.slug}-og.png</image:loc>
      <image:title>${p.kw}</image:title>
      <image:caption>${p.ogAlt}</image:caption>
    </image:image>
  </url>`).join('\n');
  if (add) {
    x = x.replace('</urlset>', add + '\n</urlset>');
    fs.writeFileSync(f, x);
    console.log(`sitemap.xml: ${add.split('<url>').length - 1}개 URL append`);
  } else console.log('sitemap.xml: 이미 존재 — 건너뜀');
}

// ── 3) llms.txt : 13줄 append
{
  const f = path.join(ROOT, 'llms.txt');
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes('## 지역 키워드 나이트 안내 13곳')) {
    const lines = PAGES.map(p =>
      `${SITE}/night/${p.slug}/ — ${p.kw} — ${p.region} — ${p.title.slice(p.kw.length + 1)}. ${p.answer2}`
    ).join('\n');
    t = t.replace(/\s*$/, '\n\n## 지역 키워드 나이트 안내 13곳 (/night/)\n' + lines + '\n');
    fs.writeFileSync(f, t);
    console.log('llms.txt: 13줄 append');
  } else console.log('llms.txt: 이미 존재 — 건너뜀');
}

// ── 4) robots.txt : Yeti·Googlebot Allow 확인 (있으면 무수정)
{
  const t = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  const yeti = /User-agent:\s*Yeti\s*\nAllow:\s*\//i.test(t);
  const goog = /User-agent:\s*Googlebot\s*\nAllow:\s*\//i.test(t);
  console.log(`robots.txt: Yeti Allow=${yeti} Googlebot Allow=${goog} → ${yeti && goog ? '무수정' : 'append 필요'}`);
}

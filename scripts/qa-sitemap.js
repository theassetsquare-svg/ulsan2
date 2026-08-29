// sitemap.xml 전체 재생성 + llms.txt에 /qa/ 섹션 반영
'use strict';
const fs = require('fs');
const path = require('path');
const { VENUES } = require('./qa-data.js');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://b.nolcool.com';
const TODAY = '2026-08-16';

const exists = p => fs.existsSync(path.join(ROOT, p));
const dirs = d => exists(d) ? fs.readdirSync(path.join(ROOT, d))
  .filter(f => fs.statSync(path.join(ROOT, d, f)).isDirectory() && exists(`${d}/${f}/index.html`)).sort() : [];

const urls = [];
const add = (loc, pri, freq) => urls.push({ loc, pri, freq });

add(`${SITE}/`, '1.0', 'daily');
add(`${SITE}/qa/`, '0.95', 'daily');
for (const v of VENUES) add(`${SITE}/qa/${v.slug}/`, '0.9', 'weekly');
add(`${SITE}/night/`, '0.8', 'weekly');
for (const d of dirs('night')) add(`${SITE}/night/${d}/`, '0.7', 'weekly');
for (const d of dirs('blog')) add(`${SITE}/blog/${d}/`, '0.6', 'monthly');
if (exists('bulgwang-hobak/index.html')) add(`${SITE}/bulgwang-hobak-guide/`, '0.6', 'monthly');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);

/* ─── llms.txt: /qa/ 섹션 교체 ─── */
const MARK = '## 나이트 문답 사전 (/area/qa/) — 전국 40곳';
let llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
const cut = llms.indexOf(MARK);
if (cut !== -1) llms = llms.slice(0, cut).trimEnd() + '\n\n';

const facts = v => v.facts.filter(([k]) => k !== '확인일').map(([k, val]) => `${k}: ${val}`).join(' / ');
const section = `${MARK}
개요: 업소 하나에 문답 6~8개씩 40곳을 같은 형식으로 정리한 사전. 확인된 항목만 적고 나머지는 "확인 불가"로 표기.
허브: ${SITE}/qa/
확인일: 2026년 8월 16일
표기 원칙: "확인 불가"는 정보가 없다는 뜻이며 그런 것이 없다는 뜻이 아님. "해당 없음"은 대상 자체가 없다는 뜻(예: 도시철도 미개통 지역의 역).
광고·제휴 문의: 카카오톡 besta12
담당자 연락처가 확인되는 업소는 4곳뿐: 울산챔피언나이트(춘자 010-5653-0069) / 불광동호박나이트(손흥민 010-2221-1937) / 창원룰루랄라나이트(로또 010-7528-4936) / 청담나이트(펩시맨 010-5655-4866)

${VENUES.map(v => `${SITE}/qa/${v.slug}/ — ${v.name}${v.alt ? ` (${v.alt} 표기 포함)` : ''} — ${v.region} — Q. ${v.hook}? — ${facts(v)}`).join('\n')}
`;
fs.writeFileSync(path.join(ROOT, 'llms.txt'), llms + section);

console.log(`sitemap.xml: ${urls.length} URL (qa ${VENUES.length + 1})`);
console.log(`llms.txt: /qa/ 섹션 ${VENUES.length}줄 반영`);

// 2차 지역 키워드 13페이지 HTML 생성기
'use strict';
const fs = require('fs');
const path = require('path');
const { PAGES } = require('./night2-data.js');

const SITE = 'https://ulsanc.pages.dev';
const TODAY = '2026-08-15';
const TODAY_KO = '2026년 8월 15일';
const NAVER1 = '9cfec1c56761bf02cd39fa5e2de5cb58af4b5cfc';
const NAVER2 = '008f62b10b97d3f60b8493009bb7d50e10aea521';
const GOOGLE = 'HJjm7MRxykCQ7d_9L7glaTeeaWrmJIzAKY0BcNcfm88';
const ROOT = path.join(__dirname, '..');

const CSS = `*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{background:#f4f4f4;color:#333;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif;line-height:1.8;font-size:16px;padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))}
a{color:#6b4a1f;text-decoration:none}
a:hover{text-decoration:underline}
.skip{position:absolute;left:-9999px}
.skip:focus{left:8px;top:8px;background:#fff;padding:8px;z-index:100000}
header.site{background:linear-gradient(135deg,#22163a,#4a2c5e);padding:14px 16px;text-align:center}
header.site .brand{color:#E8B84B;font-size:1.05em;font-weight:800}
header.site p{color:rgba(255,255,255,.75);font-size:.78em;margin-top:2px}
nav.crumb{max-width:720px;margin:0 auto;padding:12px 16px 0;font-size:.8em;color:#555}
nav.crumb a{color:#4a2c5e}
main{max-width:720px;margin:0 auto;padding:0 16px}
article{background:#fff;border-radius:16px;padding:26px 20px;margin:12px 0 16px;box-shadow:0 1px 6px rgba(0,0,0,.06)}
article h1{color:#22163a;font-size:1.4em;line-height:1.45;margin-bottom:6px;font-weight:800;word-break:keep-all}
.meta{font-size:.8em;color:#5a5a5a;margin-bottom:18px}
.answer-box{background:linear-gradient(135deg,#f3f7ff,#fdf6f0);border:1px solid #ccd7ea;border-radius:14px;padding:18px 16px;margin:16px 0}
.answer-box p{font-size:.99em;color:#2f2f2f;word-break:keep-all;margin:0}
.lead{font-size:1.02em;color:#222;margin:18px 0;word-break:keep-all;font-weight:500}
table{width:100%;border-collapse:collapse;margin:18px 0;font-size:.92em}
caption{text-align:left;font-weight:700;color:#22163a;padding-bottom:8px}
th,td{border:1px solid #e6e6e6;padding:9px 10px;text-align:left;word-break:keep-all}
th{background:#f4f1fa;color:#3b2d55;width:34%;font-weight:700}
section{margin-top:26px}
section h2{color:#22163a;font-size:1.13em;margin:0 0 10px;padding-left:12px;border-left:3px solid #E8B84B;font-weight:700;word-break:keep-all;line-height:1.5}
section p{margin-bottom:14px;color:#3a3a3a;word-break:keep-all}
section p.bridge{color:#22163a;font-weight:600}
section ul{margin:0 0 14px 20px}
section li{margin-bottom:6px;color:#3a3a3a;word-break:keep-all}
strong{color:#22163a}
h3{color:#22163a;font-size:1.03em;margin:24px 0 8px;font-weight:700}
.wrapup{background:#f6f3fb;border:1px solid #ded4ee;border-radius:12px;padding:16px;margin:24px 0}
.wrapup ul{margin:0 0 0 18px}
.wrapup li{margin-bottom:6px;color:#3a3a3a}
details{border-top:1px solid #eee;padding:12px 0}
summary{cursor:pointer;color:#22163a;font-weight:700;font-size:.95em}
details p{color:#4a4a4a;font-size:.93em;margin:9px 0 0}
aside.related{background:#fff;border-radius:16px;padding:20px;margin:0 0 16px;box-shadow:0 1px 6px rgba(0,0,0,.06)}
aside.related h2{color:#22163a;font-size:1.05em;margin-bottom:8px;padding-left:12px;border-left:3px solid #E8B84B}
aside.related a{display:block;padding:10px 0;border-top:1px solid #f0f0f0;color:#4a2c5e;font-size:.94em}
.site-footer{background:#fff;border-radius:16px;padding:20px 16px;margin:0 0 16px;text-align:center;box-shadow:0 1px 6px rgba(0,0,0,.06)}
.ad-inquiry{background:#ffd400;color:#111;font-weight:900;font-size:18px;padding:16px;text-align:center;border-radius:10px;margin:24px auto;max-width:720px;}
.footer-note{color:#4a4a4a;font-size:.84em;margin-bottom:6px}
/* 하단 고정 전화바 */
.callbar{
  position:fixed; left:0; right:0; bottom:0; z-index:99999;
  display:flex; align-items:center; justify-content:center; gap:12px;
  height:64px; box-sizing:content-box;
  padding-bottom:env(safe-area-inset-bottom,0px);
  background:#111; color:#fff; font-weight:800; font-size:18px;
  box-shadow:0 -2px 14px rgba(0,0,0,.35);
  transform:translateZ(0); backface-visibility:hidden;
}
.callbar a{color:#fff; text-decoration:none; display:flex; align-items:center; height:100%;}
@media(max-width:480px){
  .callbar{height:60px; font-size:16px;}
  body{ padding-bottom:calc(80px + env(safe-area-inset-bottom,0px)); }
}
@media print{.callbar{display:none!important}}`;

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function strip(s) { return String(s).replace(/<[^>]*>/g, ''); }

function build(p, all) {
  const url = `${SITE}/night/${p.slug}/`;
  const og = `${SITE}/og/${p.slug}-og.png`;
  const i = p.n - 1;
  const sib = [all[(i + 1) % 13], all[(i + 5) % 13]];

  const article = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: p.title, description: p.desc,
    inLanguage: 'ko-KR',
    datePublished: TODAY, dateModified: TODAY,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: og,
    about: { '@type': 'Place', name: p.region },
    mentions: [{ '@type': 'NightClub', name: p.shop, url: SITE + p.shopUrl }],
  };
  if (p.age) article.typicalAgeRange = p.age;

  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: p.faq.map(([q, a]) => ({
      '@type': 'Question', name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
  const crumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: '나이트', item: `${SITE}/night/` },
      { '@type': 'ListItem', position: 3, name: p.kw, item: url },
    ],
  };

  const callbar = p.group === 'A'
    ? `<div class="callbar" role="complementary" aria-label="전화 연결">\n  <a href="tel:${p.telRaw}">📞 ${p.staff} ${p.tel}</a>\n</div>`
    : `<div class="callbar" role="complementary" aria-label="광고 제휴 문의">\n  <span>광고·제휴 입점 문의 카톡 <b>besta12</b></span>\n</div>`;

  const rows = p.table.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('\n');

  const sections = p.sections.map(s =>
    `<section>\n<h2>${esc(s.h2)}</h2>\n${s.body}\n<p class="bridge">${s.bridge}</p>\n</section>`).join('\n\n');

  const faqHtml = p.faq.map(([q, a]) =>
    `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n');

  const asideLinks = [
    `<a href="${p.shopUrl}">${p.shop} 안내 보기</a>`,
    ...sib.map(s => `<a href="/night/${s.slug}/">${s.kw} — ${s.title.split(' ').slice(1, 4).join(' ')}</a>`),
  ].join('\n');

  const staffTail = p.group === 'A'
    ? `<p class="footer-note">${p.shop} 예약·문의 <strong>${p.staff} <a href="tel:${p.telRaw}">${p.tel}</a></strong></p>\n  `
    : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="ko_KR">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="${esc(p.ogAlt)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.desc)}">
<meta name="twitter:image" content="${og}">
<meta name="naver-site-verification" content="${NAVER1}">
<meta name="naver-site-verification" content="${NAVER2}">
<meta name="google-site-verification" content="${GOOGLE}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">
${JSON.stringify(article)}
</script>
<script type="application/ld+json">
${JSON.stringify(faqLd)}
</script>
<script type="application/ld+json">
${JSON.stringify(crumbLd)}
</script>
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#main">본문 바로가기</a>

<header class="site">
  <span class="brand">${esc(p.kw)}</span>
  <p>${esc(p.region)} · ${esc(p.angleName)}</p>
</header>

<nav class="crumb" aria-label="현재 위치">
  <a href="/">홈</a> › <a href="/night/">나이트</a> › <span>${esc(p.kw)}</span>
</nav>

<main id="main">
<article>
<h1>${esc(p.kw)}</h1>
<p class="meta"><time datetime="${TODAY}">${TODAY_KO}</time> · ${esc(p.region)} 밤 안내</p>

<div class="answer-box">
  <p><strong>${esc(p.kw)}</strong>는 ${esc(p.region)}의 나이트클럽 밤 문화를 뜻합니다. ${esc(p.answer2)}</p>
</div>

<p class="lead">${p.lead}</p>

<table>
<caption>${esc(p.tableCap)}</caption>
<tbody>
${rows}
</tbody>
</table>

${sections}

<div class="wrapup">
<h3>세 줄 요약</h3>
<ul>
${p.wrap.map(w => `<li>${esc(w)}</li>`).join('\n')}
</ul>
</div>

<h3>${esc(p.kw)} 자주 묻는 질문</h3>
${faqHtml}
</article>

<aside class="related">
<h2>같이 보면 좋은 페이지</h2>
${asideLinks}
</aside>

<footer class="site-footer">
  <div class="ad-inquiry">
    광고·제휴 입점 문의 &nbsp;|&nbsp; 카카오톡 ID <strong>besta12</strong>
  </div>
  ${staffTail}<p class="footer-note">본 페이지는 업소 정보 제공 페이지입니다. 출입 연령 및 이용 규정은 각 업소 방침을 따릅니다.</p>
  <p class="footer-note">최종 수정 <time datetime="${TODAY}">${TODAY_KO}</time> · 공개된 웹 정보를 정리했으며 실제와 다를 수 있습니다.</p>
</footer>
</main>

${callbar}
</body>
</html>
`;
}

let out = [];
for (const p of PAGES) {
  const dir = path.join(ROOT, 'night', p.slug);
  fs.mkdirSync(dir, { recursive: true });
  const html = build(p, PAGES);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  out.push(`${p.slug} ${html.length}B`);
}
console.log(out.join('\n'));
console.log('13 pages written');

// 나이트 문답 사전 — /qa/ 40페이지 + 허브 HTML 생성기
// 콘셉트: 모든 글이 질문→답. 화이트+블랙·옐로 포인트, 큰 타이포, 미니멀.
'use strict';
const fs = require('fs');
const path = require('path');
const { VENUES } = require('./qa-data.js');

const SITE = 'https://ulsanc.pages.dev';
const TODAY = '2026-08-16';
const TODAY_KO = '2026년 8월 16일';
const NAVER1 = '9cfec1c56761bf02cd39fa5e2de5cb58af4b5cfc';
const NAVER2 = '008f62b10b97d3f60b8493009bb7d50e10aea521';
const GOOGLE = 'HJjm7MRxykCQ7d_9L7glaTeeaWrmJIzAKY0BcNcfm88';
const ROOT = path.join(__dirname, '..');
const KAKAO = 'besta12';

const CSS = `*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{background:#fff;color:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif;line-height:1.85;font-size:17px;padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))}
a{color:#111;text-decoration:underline;text-underline-offset:3px}
.skip{position:absolute;left:-9999px}
.skip:focus{left:8px;top:8px;background:#ffd400;padding:8px;z-index:100000}
header.site{border-bottom:3px solid #111;padding:16px 20px}
header.site .brand{font-size:1.02em;font-weight:900;letter-spacing:-.02em}
header.site .brand a{text-decoration:none}
header.site .tag{display:inline-block;background:#ffd400;color:#111;font-size:.72em;font-weight:900;padding:2px 8px;margin-left:6px;vertical-align:2px}
nav.crumb{max-width:760px;margin:0 auto;padding:16px 20px 0;font-size:.8em;color:#555}
main{max-width:760px;margin:0 auto;padding:0 20px}
article h1{font-size:2.05em;line-height:1.3;letter-spacing:-.03em;font-weight:900;margin:14px 0 10px;word-break:keep-all}
.meta{font-size:.78em;color:#666;letter-spacing:.02em;margin-bottom:26px}
.lead{font-size:1.06em;margin:0 0 30px;word-break:keep-all;color:#222}
.lead strong{background:linear-gradient(transparent 62%,#ffd400 62%);font-weight:800}
.direct{background:#111;color:#fff;padding:26px 22px;margin:0 0 32px}
.direct h2{font-size:.76em;letter-spacing:.22em;color:#ffd400;font-weight:900;margin-bottom:14px}
.direct ol{margin:0;padding-left:0;list-style:none;counter-reset:d}
.direct li{counter-increment:d;position:relative;padding-left:34px;margin-bottom:11px;word-break:keep-all;font-size:.99em;line-height:1.7}
.direct li:last-child{margin-bottom:0}
.direct li::before{content:counter(d);position:absolute;left:0;top:2px;width:22px;height:22px;background:#ffd400;color:#111;font-weight:900;font-size:.72em;line-height:22px;text-align:center}
table{width:100%;border-collapse:collapse;margin:0 0 34px;font-size:.93em}
caption{text-align:left;font-weight:900;font-size:1.02em;letter-spacing:-.02em;padding-bottom:12px;border-bottom:3px solid #111;margin-bottom:0}
th,td{border-bottom:1px solid #e2e2e2;padding:13px 4px;text-align:left;word-break:keep-all;vertical-align:top}
th{width:31%;font-weight:800;color:#111}
td{color:#333}
td .unk{color:#8a8a8a}
section.qa{margin:0 0 34px}
section.qa>h2.sechead{font-size:.76em;letter-spacing:.22em;font-weight:900;margin-bottom:4px;color:#111}
details{border-top:2px solid #111}
details:last-of-type{border-bottom:2px solid #111}
summary{cursor:pointer;list-style:none;padding:20px 40px 20px 0;position:relative}
summary::-webkit-details-marker{display:none}
summary h2{font-size:1.16em;line-height:1.5;font-weight:800;letter-spacing:-.02em;word-break:keep-all;display:inline}
summary::after{content:"+";position:absolute;right:6px;top:18px;font-size:1.5em;font-weight:400;line-height:1;color:#111}
details[open]>summary::after{content:"–"}
details[open]>summary{padding-bottom:8px}
.ans{padding:0 0 24px}
.ans p{margin-bottom:13px;word-break:keep-all;color:#333}
.ans p:last-child{margin-bottom:0}
.ans strong{font-weight:800;color:#111;background:linear-gradient(transparent 64%,#ffd400 64%)}
.wrapline{border-left:8px solid #ffd400;padding:6px 0 6px 18px;margin:0 0 34px;font-size:1.08em;font-weight:800;letter-spacing:-.02em;word-break:keep-all}
aside.related{border-top:3px solid #111;padding:22px 0 0;margin:0 0 34px}
aside.related h2{font-size:.76em;letter-spacing:.22em;font-weight:900;margin-bottom:12px}
aside.related a{display:block;padding:12px 0;border-bottom:1px solid #e2e2e2;font-size:.94em;text-decoration:none}
aside.related a b{font-weight:800}
aside.related a span{color:#666;font-size:.88em}
.ad-inquiry{background:#ffd400;color:#111;font-weight:900;font-size:18px;padding:18px;text-align:center;margin:0 0 22px;word-break:keep-all}
.site-footer{padding:0 0 26px}
.footer-note{color:#666;font-size:.82em;margin-bottom:6px;word-break:keep-all}
.callbar{position:fixed;left:0;right:0;bottom:0;z-index:99999;display:flex;align-items:center;justify-content:center;gap:12px;height:64px;box-sizing:content-box;padding-bottom:env(safe-area-inset-bottom,0px);background:#111;color:#ffd400;font-weight:900;font-size:18px;box-shadow:0 -2px 14px rgba(0,0,0,.3)}
.callbar a{color:#ffd400;text-decoration:none;display:flex;align-items:center;height:100%}
.callbar b{color:#fff}
.callbar .cb-l{font-size:.72em;font-weight:800;opacity:.85;letter-spacing:.04em}
.callbar .cb-t{letter-spacing:.01em}
.callbar a{gap:9px}
@media(max-width:480px){
  body{font-size:16px;padding-bottom:calc(80px + env(safe-area-inset-bottom,0px))}
  article h1{font-size:1.62em}
  .callbar{height:60px;font-size:16px}
}
@media print{.callbar{display:none!important}}`;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const unk = v => v === '확인 불가' ? '<span class="unk">확인 불가</span>' : esc(v);

function callbar(v) {
  return v.adv
    ? `<div class="callbar" role="complementary" aria-label="전화 연결">\n  <a href="tel:${v.adv.tel.replace(/-/g, '')}"><span class="cb-l">예약·문의</span> <b>${esc(v.adv.staff)}</b> <span class="cb-t">${esc(v.adv.tel)}</span></a>\n</div>`
    : `<div class="callbar" role="complementary" aria-label="광고 제휴 문의">\n  <span>광고·제휴 입점 문의 카톡 <b>${KAKAO}</b></span>\n</div>`;
}

function build(v, all) {
  const url = `${SITE}/qa/${v.slug}/`;
  const og = `${SITE}/og-qa/${v.slug}-og.png`;
  const i = v.n - 1;
  const L = all.length;
  const sibs = [...new Set([(i + 1) % L, (i + 7) % L, (i + 19) % L])].filter(x => x !== i).map(x => all[x]);

  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: v.faq.map(([qi, a]) => ({
      '@type': 'Question', name: v.qa[qi][0],
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
  const articleLd = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: v.title, description: v.desc, inLanguage: 'ko-KR',
    datePublished: TODAY, dateModified: TODAY,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: og,
    about: { '@type': 'NightClub', name: v.name, address: { '@type': 'PostalAddress', addressCountry: 'KR', addressLocality: v.region } },
    isPartOf: { '@type': 'CollectionPage', name: '전국 나이트 문답집 40', '@id': `${SITE}/qa/` },
    publisher: { '@type': 'Organization', name: '나이트 문답 사전', url: `${SITE}/qa/` },
  };
  if (v.alt) articleLd.about.alternateName = v.alt;
  if (v.adv) articleLd.about.telephone = v.adv.tel;
  const crumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: '나이트 문답 사전', item: `${SITE}/qa/` },
      { '@type': 'ListItem', position: 3, name: v.name, item: url },
    ],
  };

  const rows = v.facts.map(([k, val]) => `<tr><th scope="row">${esc(k)}</th><td>${unk(val)}</td></tr>`).join('\n');

  const qaHtml = v.qa.map(([q, a], k) =>
    `<details${k < 2 ? ' open' : ''}>\n<summary><h2>${esc(q)}</h2></summary>\n<div class="ans">\n${a}\n</div>\n</details>`
  ).join('\n');

  const related = [
    `<a href="/qa/"><b>전국 나이트 문답집 40</b> <span>— 40개 업소 문답 전체 목록</span></a>`,
    ...(v.nightUrl ? [`<a href="${v.nightUrl}"><b>${esc(v.name)} 안내 페이지</b> <span>— 지역 키워드 정리본</span></a>`] : []),
    ...sibs.map(s => `<a href="/qa/${s.slug}/"><b>${esc(s.name)}</b> <span>— ${esc(s.hook)}</span></a>`),
  ].join('\n');

  const advTail = v.adv
    ? `<p class="footer-note">${esc(v.name)} 예약·문의 <strong>${esc(v.adv.staff)} <a href="tel:${v.adv.tel.replace(/-/g, '')}">${esc(v.adv.tel)}</a></strong></p>\n  `
    : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(v.title)}</title>
<meta name="description" content="${esc(v.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:title" content="${esc(v.title)}">
<meta property="og:description" content="${esc(v.desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="나이트 문답 사전">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="${esc(v.name)} 문답 카드 — ${esc(v.region)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(v.title)}">
<meta name="twitter:description" content="${esc(v.desc)}">
<meta name="twitter:image" content="${og}">
<meta name="naver-site-verification" content="${NAVER1}">
<meta name="naver-site-verification" content="${NAVER2}">
<meta name="google-site-verification" content="${GOOGLE}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">
${JSON.stringify(articleLd)}
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
  <span class="brand"><a href="/qa/">나이트 문답 사전</a><span class="tag">Q&amp;A</span></span>
</header>

<nav class="crumb" aria-label="현재 위치">
  <a href="/">홈</a> › <a href="/qa/">나이트 문답 사전</a> › <span>${esc(v.name)}</span>
</nav>

<main id="main">
<article>
<h1>${esc(v.title)}</h1>
<p class="meta">${esc(v.region)} · 확인일 <time datetime="${TODAY}">${TODAY_KO}</time> · 문답 ${v.qa.length}개</p>

<p class="lead">${v.lead}</p>

<div class="direct">
<h2>핵심 3줄 직답</h2>
<ol>
${v.direct.map(d => `<li>${esc(d)}</li>`).join('\n')}
</ol>
</div>

<table>
<caption>${esc(v.name)} 확인된 사실</caption>
<tbody>
${rows}
</tbody>
</table>

<section class="qa">
<h2 class="sechead">문답 ${v.qa.length}</h2>
${qaHtml}
</section>

<p class="wrapline">${esc(v.wrap)}</p>
</article>

<aside class="related">
<h2>이어서 볼 문답</h2>
${related}
</aside>

<footer class="site-footer">
  <div class="ad-inquiry">광고·제휴 입점 문의 &nbsp;|&nbsp; 카카오톡 ID ${KAKAO}</div>
  ${advTail}<p class="footer-note">본 문서는 공개된 웹 정보를 정리한 업소 정보 페이지입니다. 확인되지 않은 항목은 "확인 불가"로 남겼으며, 출입 연령·영업 여부는 각 업소 방침과 현재 상황에 따라 달라질 수 있습니다.</p>
  <p class="footer-note">최종 확인 <time datetime="${TODAY}">${TODAY_KO}</time> · 문답 사전 · <a href="/qa/">전국 40개 목록</a></p>
</footer>
</main>

${callbar(v)}
</body>
</html>
`;
}

/* ─────────── 허브 /qa/ ─────────── */
function buildHub(all) {
  const url = `${SITE}/qa/`;
  const title = '전국 나이트 문답집 40 — 업소별 질문과 답 한 곳에';
  const desc = '전국 나이트 40곳을 업소마다 문답 7개로 정리한 사전이다. 주소·가까운 역·층·연령을 확인된 것만 적고 나머지는 확인 불가로 남겼다.';
  const og = `${SITE}/og-qa/hub-og.png`;

  const listLd = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: '전국 나이트 문답집 40', description: desc, url, inLanguage: 'ko-KR',
    dateModified: TODAY,
    mainEntity: {
      '@type': 'ItemList', numberOfItems: all.length,
      itemListElement: all.map((v, k) => ({
        '@type': 'ListItem', position: k + 1, name: v.name, url: `${SITE}/qa/${v.slug}/`,
      })),
    },
  };
  const crumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: '나이트 문답 사전', item: url },
    ],
  };

  const groups = {};
  for (const v of all) (groups[v.area] = groups[v.area] || []).push(v);
  const order = ['서울', '경기·인천', '충청', '경상', '전라·제주'];
  const listHtml = order.filter(g => groups[g]).map(g =>
    `<h2 class="grp">${g} <em>${groups[g].length}</em></h2>\n<ol class="vlist">\n` +
    groups[g].map(v =>
      `<li><a href="/qa/${v.slug}/"><b>${esc(v.name)}</b><span>${esc(v.hook)}</span><em>${esc(v.region)}</em></a></li>`
    ).join('\n') + `\n</ol>`
  ).join('\n\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="나이트 문답 사전">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="전국 나이트 문답집 40 표지">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${og}">
<meta name="naver-site-verification" content="${NAVER1}">
<meta name="naver-site-verification" content="${NAVER2}">
<meta name="google-site-verification" content="${GOOGLE}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">
${JSON.stringify(listLd)}
</script>
<script type="application/ld+json">
${JSON.stringify(crumbLd)}
</script>
<style>${CSS}
.grp{font-size:.76em;letter-spacing:.22em;font-weight:900;margin:34px 0 10px;padding-bottom:8px;border-bottom:3px solid #111}
.grp em{font-style:normal;background:#ffd400;padding:1px 7px;margin-left:6px;letter-spacing:0}
ol.vlist{list-style:none;margin:0 0 8px;padding:0;counter-reset:v}
ol.vlist li{border-bottom:1px solid #e2e2e2}
ol.vlist a{display:block;padding:15px 0;text-decoration:none}
ol.vlist b{display:block;font-size:1.06em;font-weight:800;letter-spacing:-.02em}
ol.vlist span{display:block;color:#444;font-size:.9em;word-break:keep-all}
ol.vlist em{display:block;font-style:normal;color:#888;font-size:.8em;margin-top:2px}
</style>
</head>
<body>
<a class="skip" href="#main">본문 바로가기</a>

<header class="site">
  <span class="brand"><a href="/qa/">나이트 문답 사전</a><span class="tag">Q&amp;A</span></span>
</header>

<nav class="crumb" aria-label="현재 위치">
  <a href="/">홈</a> › <span>나이트 문답 사전</span>
</nav>

<main id="main">
<article>
<h1>전국 나이트 문답집 40</h1>
<p class="meta">40개 업소 · 문답 ${all.reduce((s, v) => s + v.qa.length, 0)}개 · 확인일 <time datetime="${TODAY}">${TODAY_KO}</time></p>

<p class="lead">업소 하나에 <strong>문답 6~8개</strong>씩, 40곳을 같은 형식으로 맞췄다. 주소·가까운 역·층·출입 연령을 확인된 것만 적고, 확인되지 않은 항목은 지어내지 않고 "확인 불가"로 남겼다.</p>

<div class="direct">
<h2>이 사전을 읽는 법</h2>
<ol>
<li>업소마다 첫 문답이 기본 정보, 마지막 문답이 제목으로 던진 질문의 답이다.</li>
<li>표의 "확인 불가"는 정보가 없다는 뜻이지 그런 것이 없다는 뜻이 아니다.</li>
<li>주소·층은 공개 웹 정보 기준이라 실제 현장과 다를 수 있다. 확인일을 함께 봐라.</li>
</ol>
</div>

${listHtml}

<p class="wrapline">40곳 전부 같은 질문 틀로 맞췄으니, 궁금한 업소부터 열어 보면 된다.</p>
</article>

<footer class="site-footer">
  <div class="ad-inquiry">광고·제휴 입점 문의 &nbsp;|&nbsp; 카카오톡 ID ${KAKAO}</div>
  <p class="footer-note">본 목록은 공개된 웹 정보를 정리한 업소 정보 페이지입니다. 확인되지 않은 항목은 "확인 불가"로 표기했습니다.</p>
  <p class="footer-note">최종 확인 <time datetime="${TODAY}">${TODAY_KO}</time> · <a href="/">울산챔피언나이트 20문 20답</a></p>
</footer>
</main>

<div class="callbar" role="complementary" aria-label="광고 제휴 문의">
  <span>광고·제휴 입점 문의 카톡 <b>${KAKAO}</b></span>
</div>
</body>
</html>
`;
}

if (require.main === module) {
  const out = [];
  for (const v of VENUES) {
    const dir = path.join(ROOT, 'qa', v.slug);
    fs.mkdirSync(dir, { recursive: true });
    const html = build(v, VENUES);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    out.push(`${v.slug} ${html.length}B`);
  }
  fs.writeFileSync(path.join(ROOT, 'qa', 'index.html'), buildHub(VENUES));
  console.log(out.join('\n'));
  console.log(`${VENUES.length} pages + hub written`);
}

module.exports = { build, buildHub, CSS, SITE, TODAY, TODAY_KO, NAVER1, NAVER2, GOOGLE, KAKAO, esc };

// 홈(/) — 울산챔피언나이트 20문 20답 랜딩 생성기
'use strict';
const fs = require('fs');
const path = require('path');
const { CSS, SITE, TODAY, TODAY_KO, NAVER1, NAVER2, GOOGLE, KAKAO, esc } = require('./qa-build.js');
const { VENUES } = require('./qa-data.js');

const ROOT = path.join(__dirname, '..');
const GOOGLE2 = 'PmfRK32sSB__iyGIVTwupgP_R45SPUo7QPPtmYJHXIc';
const STAFF = '춘자';
const TEL = '010-5653-0069';
const TELRAW = '01056530069';
const OG = `${SITE}/og-qa/home-og.png`;

const TITLE = '울산챔피언나이트 20문 20답 — 주소·규모·예약까지 한 번에';
const DESC = '울산챔피언나이트를 스무 개 문답으로 정리했다. 삼산동 주소와 등록 영업면적 784.5평, 개업 시점, 예약 문의까지 확인된 것만 적었다.';

/* ─── 20문 20답 ─── */
const QA = [
  ['울산챔피언나이트는 어디에 있나요?',
    `<p>지번 <strong>울산 남구 삼산동 1559-17</strong>, 도로명 정동로 75로 확인된다. 두 표기가 같은 지점을 가리킨다.</p>
<p>삼산동은 울산 남구의 중심 상권이다. 백화점과 시외버스터미널이 이 구역에 모여 있어 울산에서 사람이 가장 많이 오가는 축에 든다.</p>`],
  ['주소가 지번과 도로명 둘 다 나오는 이유가 뭔가요?',
    `<p>등록 정보에 두 체계가 함께 남아 있기 때문이다. 지번은 옛 주소 체계, 도로명은 현행 체계다.</p>
<p>두 표기가 다르게 보여도 같은 건물을 가리킨다. 어느 쪽으로 검색해도 같은 곳이 나온다.</p>`],
  ['규모는 어느 정도인가요?',
    `<p>등록 영업면적이 <strong>784.5평, 제곱미터로는 2,588.97㎡</strong>로 공개돼 있다.</p>
<p>이 사이트가 정리한 전국 40곳 가운데 면적이 숫자로 확인되는 곳은 여기 하나다. 나머지는 "아담하다" 같은 서술만 남아 있다.</p>`],
  ['784.5평이 곧 홀 크기인가요?',
    `<p>아니다. 영업면적은 등록상의 전체 면적이고, 손님이 실제로 쓰는 홀 면적과는 다르다.</p>
<p>주방·통로·창고·화장실이 모두 포함될 수 있다. 홀 면적만 따로 밝힌 자료는 확인되지 않아 그 값은 <strong>확인 불가</strong>다.</p>`],
  ['언제 문을 연 곳인가요?',
    `<p>개업 시점은 <strong>2003년 12월</strong>로 등록돼 있다. 개업 연월까지 확인되는 사례는 흔치 않다.</p>
<p>다만 그 뒤로 상호나 운영 주체가 바뀌었는지는 확인되지 않는다. 등록된 시작 시점까지만 사실로 둔다.</p>`],
  ['가까운 지하철역은 어디인가요?',
    `<p>없다. 울산에는 도시철도 노선이 운행되지 않는다. 그래서 "몇 번 출구 도보 몇 분" 형태의 표기가 애초에 생기지 않는다.</p>
<p>울산역은 KTX가 서는 역이지만 도심에서 떨어진 울주군 쪽에 있어 생활 이동 축과는 다르다.</p>`],
  ['그러면 위치는 무엇으로 찾나요?',
    `<p>주소 두 줄이 기준이 된다. 삼산동 1559-17 또는 정동로 75로 검색하면 지점이 특정된다.</p>
<p>삼산동은 울산 남구에서 가장 밀도가 높은 상권이라, 동 이름만으로도 대략의 방향은 잡힌다.</p>`],
  ['예약이나 문의는 어디로 하나요?',
    `<p>예약·문의는 <strong>${STAFF} <a href="tel:${TELRAW}">${TEL}</a></strong>로 안내된다. 이 사이트에서 연락처를 안내하는 곳은 여기다.</p>
<p>날짜와 도착 시각, 인원 세 가지를 함께 말하면 안내가 빨라진다.</p>`],
  ['전화할 때 무엇부터 말해야 하나요?',
    `<p>날짜·시각·인원 순서면 충분하다. 원하는 좌석 종류까지 말해 두면 배정이 정확해진다.</p>
<p>인원이 유동적이면 최소 인원으로 먼저 잡고 늘리는 편이 낫다. 줄이는 것보다 늘리는 쪽이 언제나 쉽다.</p>`],
  ['단체도 가능한가요?',
    `<p>인원이 많을수록 사전 연락이 중요해진다. 자리를 붙이는 작업이 필요하기 때문이다.</p>
<p>다만 최대 수용 인원이나 단체 조건을 명시한 공개 자료는 확인되지 않는다. 조건은 업소 안내가 기준이 된다.</p>`],
  ['출입 연령 제한이 있나요?',
    `<p>공개 자료에서는 <strong>확인 불가</strong>다. 연령 하한을 명시한 표기를 찾지 못했다.</p>
<p>전국 40곳을 훑어도 연령이 확인되는 곳은 두 곳뿐이다. 표기 자체가 드문 항목이라, 필요하면 직접 확인하는 편이 정확하다.</p>`],
  ['영업시간은 어떻게 되나요?',
    `<p>시작·종료 시각을 명시한 공개 자료는 확인되지 않아 <strong>확인 불가</strong>다.</p>
<p>주소와 면적, 개업 시점은 등록 정보로 남아 있는데 운영 시간은 그 경로로 공개되지 않는다. 두 정보의 출처가 다르기 때문이다.</p>`],
  ['몇 층에 있나요?',
    `<p>층 표기는 <strong>확인 불가</strong>다. 주소와 면적은 확인되는데 층만 비어 있다.</p>
<p>층은 등록 정보의 공개 범위에 따라 갈리는 항목이라, 주소가 확인된다고 자동으로 따라오지 않는다.</p>`],
  ['주차는 되나요?',
    `<p>주차 조건을 명시한 자료는 확인되지 않는다. 그래서 <strong>확인 불가</strong>다.</p>
<p>삼산동 일대는 상업 시설이 밀집한 구역이라 주변 주차 여건이 시간대에 따라 크게 달라진다.</p>`],
  ['울산에 다른 나이트도 있나요?',
    `<p>같은 삼산동에 <a href="/ulsan-newworld/">울산뉴월드나이트</a>가 있다. 주소는 삼산로 375, 지번은 삼산동 220-6이다.</p>
<p>같은 동이지만 지번과 도로명이 달라 붙어 있는 위치는 아니다. 두 업소의 관계는 확인되지 않는다.</p>`],
  ['춘자는 누구인가요?',
    `<p>예약과 문의를 받는 담당자다. 전화할 때 <strong>${STAFF}</strong>를 찾으면 안내가 이어진다.</p>
<p>이 사이트가 정리한 40곳 가운데 담당자 연락처가 확인되는 곳은 네 곳뿐이고, 울산챔피언나이트가 그중 하나다.</p>`],
  ['이 사이트는 무엇을 하는 곳인가요?',
    `<p>전국 나이트를 <a href="/qa/">업소별 문답</a>으로 정리하는 사전이다. 업소 하나에 문답 예닐곱 개씩, 모두 40곳을 같은 형식으로 맞췄다.</p>
<p>주소·가까운 역·층·출입 연령을 확인된 것만 적고, 확인되지 않은 항목은 지어내지 않고 "확인 불가"로 남긴다.</p>`],
  ['"확인 불가"라는 표기는 무슨 뜻인가요?',
    `<p>그런 것이 없다는 뜻이 아니라, <strong>공개된 자료에서 확인되지 않았다</strong>는 뜻이다.</p>
<p>없다고 적으려면 그것대로 근거가 필요하다. 근거 없이 빈칸을 채우지 않는 것이 이 사이트의 기준이다.</p>`],
  ['정보는 얼마나 믿을 수 있나요?',
    `<p>공개된 웹 정보를 정리한 것이고 확인일은 <time datetime="${TODAY}">${TODAY_KO}</time>이다. 실제 현장과 다를 수 있다.</p>
<p>업소 정보는 바뀐다. 방문을 전제로 한다면 주소와 운영 여부를 한 번 더 확인하는 편이 안전하다.</p>`],
  ['그래서 울산챔피언나이트를 한 줄로 정리하면?',
    `<p>울산 남구 삼산동 1559-17, 도로명 정동로 75에 있고 등록 영업면적 784.5평, 개업 2003년 12월로 확인되는 나이트클럽이다.</p>
<p>층·영업시간·출입 연령은 공개 자료로 확인되지 않는다. 예약·문의는 <strong>${STAFF} <a href="tel:${TELRAW}">${TEL}</a></strong>다.</p>`],
];

const FACTS = [
  ['주소', '울산 남구 삼산동 1559-17 (정동로 75)'],
  ['등록 면적', '영업면적 784.5평 (2,588.97㎡)'],
  ['개업', '2003년 12월'],
  ['가까운 역', '해당 없음 (울산 도시철도 미개통)'],
  ['층 · 영업시간 · 출입 연령', '확인 불가'],
  ['예약·문의', `${STAFF} ${TEL}`],
  ['확인일', TODAY_KO],
];

/* ─── JSON-LD ─── */
const clubLd = {
  '@context': 'https://schema.org', '@type': 'NightClub',
  name: '울산챔피언나이트', alternateName: '챔피언나이트',
  url: `${SITE}/`, image: OG, telephone: TEL,
  address: { '@type': 'PostalAddress', streetAddress: '삼산동 1559-17 (정동로 75)', addressLocality: '남구', addressRegion: '울산광역시', addressCountry: 'KR' },
  foundingDate: '2003-12',
};
const siteLd = {
  '@context': 'https://schema.org', '@type': 'WebSite',
  name: '나이트 문답 사전', alternateName: ['울산챔피언나이트', '전국 나이트 문답집 40'],
  url: `${SITE}/`, inLanguage: 'ko-KR', dateModified: TODAY,
  publisher: { '@type': 'Organization', name: '나이트 문답 사전', url: `${SITE}/qa/` },
};
const faqLd = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: [
    ['울산챔피언나이트는 어디에 있나요?', '지번 울산 남구 삼산동 1559-17, 도로명 정동로 75로 확인됩니다.'],
    ['규모는 어느 정도인가요?', '등록 영업면적이 784.5평, 2,588.97㎡로 공개돼 있습니다. 홀 면적과는 다른 값입니다.'],
    ['예약이나 문의는 어디로 하나요?', `예약·문의는 ${STAFF} ${TEL}입니다. 날짜와 도착 시각, 인원을 함께 말하면 빠릅니다.`],
    ['가까운 지하철역은 어디인가요?', '없습니다. 울산에는 도시철도 노선이 운행되지 않아 역 기준 거리 표기가 생기지 않습니다.'],
  ].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
};
const crumbLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [{ '@type': 'ListItem', position: 1, name: '울산챔피언나이트', item: `${SITE}/` }],
};

const qaHtml = QA.map(([q, a], i) =>
  `<details${i < 2 ? ' open' : ''}>\n<summary><h2>${esc(q)}</h2></summary>\n<div class="ans">\n${a}\n</div>\n</details>`).join('\n');

const rows = FACTS.map(([k, v]) =>
  `<tr><th scope="row">${esc(k)}</th><td>${v === '확인 불가' ? '<span class="unk">확인 불가</span>' : esc(v)}</td></tr>`).join('\n');

const pick = ['ulsan-newworld', 'busan-asiad', 'changwon-lululala', 'daegu-hobak', 'cheongdam', 'bulgwang-hobak']
  .map(s => VENUES.find(v => v.slug === s));

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(TITLE)}</title>
<meta name="description" content="${esc(DESC)}">
<link rel="canonical" href="${SITE}/">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="keywords" content="울산챔피언나이트,울산챔피언나이트 ${STAFF},울산 나이트,울산 나이트클럽,챔피언나이트,전국 나이트 문답집">
<meta property="og:title" content="${esc(TITLE)}">
<meta property="og:description" content="${esc(DESC)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}/">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="나이트 문답 사전">
<meta property="og:image" content="${OG}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="울산챔피언나이트 ${STAFF} ${TEL} 안내 카드">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(TITLE)}">
<meta name="twitter:description" content="${esc(DESC)}">
<meta name="twitter:image" content="${OG}">
<meta name="naver-site-verification" content="${NAVER1}">
<meta name="naver-site-verification" content="${NAVER2}">
<meta name="google-site-verification" content="${GOOGLE}">
<meta name="google-site-verification" content="${GOOGLE2}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="나이트 문답 사전 RSS" href="${SITE}/rss.xml">
<script type="application/ld+json">
${JSON.stringify(clubLd)}
</script>
<script type="application/ld+json">
${JSON.stringify(siteLd)}
</script>
<script type="application/ld+json">
${JSON.stringify(faqLd)}
</script>
<script type="application/ld+json">
${JSON.stringify(crumbLd)}
</script>
<style>${CSS}
.hero{border-bottom:3px solid #111;padding:0 0 26px;margin-bottom:26px}
.hero .kicker{display:inline-block;background:#ffd400;color:#111;font-size:.72em;font-weight:900;letter-spacing:.14em;padding:3px 10px;margin-bottom:14px}
.navrow{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 34px}
.navrow a{flex:1 1 160px;border:2px solid #111;padding:14px 12px;text-decoration:none;font-weight:800;font-size:.92em}
.navrow a span{display:block;font-weight:500;font-size:.82em;color:#555;margin-top:2px}
</style>
</head>
<body>
<a class="skip" href="#main">본문 바로가기</a>

<header class="site">
  <span class="brand"><a href="/">나이트 문답 사전</a><span class="tag">Q&amp;A</span></span>
</header>

<nav class="crumb" aria-label="현재 위치">
  <span>홈</span> › <a href="/qa/">전국 나이트 문답집 40</a>
</nav>

<main id="main">
<article>
<div class="hero">
<span class="kicker">20문 20답</span>
<h1>울산챔피언나이트</h1>
<p class="meta">울산 남구 삼산동 · 확인일 <time datetime="${TODAY}">${TODAY_KO}</time> · 문답 ${QA.length}개</p>
<p class="lead"><strong>울산챔피언나이트</strong>에 대해 사람들이 실제로 묻는 스무 가지를 문답으로 정리했다. 주소·규모·개업 시점은 등록 정보로 확인되고, 층과 영업시간·출입 연령은 확인되지 않아 그대로 비워 뒀다.</p>
</div>

<div class="direct">
<h2>핵심 3줄 직답</h2>
<ol>
<li>울산 남구 삼산동 1559-17, 도로명으로는 정동로 75다.</li>
<li>등록 영업면적은 784.5평(2,588.97㎡), 개업은 2003년 12월로 확인된다.</li>
<li>예약·문의는 ${STAFF} ${TEL}, 광고·제휴 문의는 카카오톡 ${KAKAO}다.</li>
</ol>
</div>

<table>
<caption>울산챔피언나이트 확인된 사실</caption>
<tbody>
${rows}
</tbody>
</table>

<section class="qa">
<h2 class="sechead">문답 ${QA.length}</h2>
${qaHtml}
</section>

<p class="wrapline">주소와 면적·개업은 확인되고, 층과 시간·연령은 확인 불가로 남는다.</p>
</article>

<aside class="related">
<h2>사이트 안내</h2>
<div class="navrow">
  <a href="/qa/">전국 나이트 문답집 40<span>업소별 문답 7개씩, 40곳 전체</span></a>
  <a href="/night/">지역 키워드 안내<span>지역별 나이트 정리 페이지</span></a>
  <a href="/first-time/">방문 전 읽을거리<span>상황별 안내 글 모음</span></a>
</div>
<h2>업소별 문답 바로 가기</h2>
${pick.map(v => `<a href="/qa/${v.slug}/"><b>${esc(v.name)}</b> <span>— ${esc(v.hook)}</span></a>`).join('\n')}
</aside>

<footer class="site-footer">
  <div class="ad-inquiry">광고·제휴 입점 문의 &nbsp;|&nbsp; 카카오톡 ID ${KAKAO}</div>
  <p class="footer-note">울산챔피언나이트 예약·문의 <strong>${STAFF} <a href="tel:${TELRAW}">${TEL}</a></strong></p>
  <p class="footer-note">본 사이트는 공개된 웹 정보를 정리한 업소 정보 페이지입니다. 확인되지 않은 항목은 "확인 불가"로 남겼으며, 출입 연령·영업 여부는 각 업소 방침과 현재 상황에 따라 달라질 수 있습니다.</p>
  <p class="footer-note">최종 확인 <time datetime="${TODAY}">${TODAY_KO}</time> · <a href="/qa/">전국 40개 문답 목록</a> · <a href="/llms.txt">llms.txt</a></p>
</footer>
</main>

<div class="callbar" role="complementary" aria-label="전화 연결">
  <a href="tel:${TELRAW}"><span class="cb-l">예약·문의</span> <b>${STAFF}</b> <span class="cb-t">${TEL}</span></a>
</div>
</body>
</html>
`;

// 홈(/)은 독립 성공스토리 단독 페이지로 교체됨 — 이 빌더가 덮어쓰지 않도록 가드.
// 되살리려면 ALLOW_HOME_OVERWRITE=1 로 실행.
if (!process.env.ALLOW_HOME_OVERWRITE) {
  console.error('SKIP: index.html 은 독립 스토리 페이지입니다. 덮어쓰려면 ALLOW_HOME_OVERWRITE=1');
  process.exit(0);
}
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log(`home written ${html.length}B · 문답 ${QA.length}개`);

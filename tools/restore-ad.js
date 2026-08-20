// 지역 키워드 페이지 4곳: 연결된 광고주의 닉네임·전화번호 복구
// (타 가게이름은 넣지 않는다 — 1페이지 1가게이름 유지, 가게 페이지로 가는 <a> 링크만 유지)
'use strict';
const fs = require('fs'), path = require('path');
const { build, AD_PAGES, ADS, BASE, ROOT } = require('./pages.js');

const log = [];
const { pages } = build();

for (const p of pages) {
  if (!AD_PAGES[p.url]) continue;
  const { nick, tel } = p.ad, d = tel.replace(/-/g, '');
  let h = fs.readFileSync(p.file, 'utf8');
  const before = h;
  const hit = (what, ok) => log.push(`${p.rel} :: ${what} ${ok ? '✓' : '✗ 미적용'}`);

  // 1) 기본 정보 표
  let s = h;
  h = h.replace('<tr><th scope="row">광고·제휴</th><td>카카오톡 besta12</td></tr>',
    `<tr><th scope="row">예약·문의</th><td>${nick} ${tel}</td></tr>`);
  hit('표 예약·문의 행', h !== s);

  // 2) 본문 문의 문단
  s = h;
  h = h.replace('<p>광고·제휴 입점 문의는 <strong>카카오톡 besta12</strong>.',
    `<p>예약·문의는 <strong>${nick} <a href="tel:${d}">${tel}</a></strong>. 광고·제휴 입점 문의는 카카오톡 besta12.`);
  hit('본문 예약·문의 문단', h !== s);

  // 3) 세 줄 요약 마지막 줄
  s = h;
  h = h.replace(/(<div class="wrapup">[\s\S]*<li>)([\s\S]*?)(<\/li>\s*<\/ul>)/,
    (m, a, b, c) => a + b.replace(/\.\s*$/, '') + ` · 예약 문의 ${nick} ${tel}.` + c);
  hit('세 줄 요약 li', h !== s);

  // 4) 푸터
  s = h;
  h = h.replace('<p class="footer-note">광고·제휴 입점 문의 <strong>카카오톡 besta12</strong></p>',
    `<p class="footer-note">예약·문의 <strong>${nick} <a href="tel:${d}">${tel}</a></strong></p>`);
  hit('footer-note', h !== s);

  // 5) 고정 전화바 — 바 전체가 tel: 링크
  s = h;
  h = h.replace(/<div class="callbar"[\s\S]*?<\/div>/,
    `<div class="callbar" role="complementary" aria-label="전화 연결">\n  <a href="tel:${d}" aria-label="${p.store} ${nick} ${tel} 전화">📞 ${p.store} ${nick} ${tel}</a>\n</div>`);
  hit('고정 전화바', h !== s);

  // 6) og:image:alt / 본문 img alt 에 담당자 표기
  s = h;
  h = h.replace(/(<meta property="og:image:alt" content=")([^"]*)(">)/, (m, a, t, c) =>
    t.includes(nick) ? m : a + t + ` — 담당 ${nick}` + c);
  h = h.replace(/(<img src="\/og\/[^"]*" alt=")([^"]*)(")/, (m, a, t, c) =>
    t.includes(nick) ? m : a + t + ` — 담당 ${nick}` + c);
  hit('alt 담당자 표기', h !== s);

  // 7) JSON-LD 예약 연락처 (자기 키워드 이름만 사용)
  if (!h.includes(`"telephone":"${tel}"`)) {
    const node = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Organization',
      name: `${p.store} 예약·문의`, url: p.absUrl, telephone: tel,
      contactPoint: { '@type': 'ContactPoint', telephone: tel, contactType: 'reservations', name: nick, availableLanguage: 'ko' },
    });
    h = h.replace('</head>', `<script type="application/ld+json">\n${node}\n</script>\n</head>`);
    hit('JSON-LD telephone', true);
  }

  if (h !== before) fs.writeFileSync(p.file, h);
}
console.log(log.join('\n'));
console.log(`\n복구 대상 ${Object.keys(AD_PAGES).length}페이지 · 미적용 ${log.filter(x => x.includes('✗')).length}건`);

// 전 페이지 일괄 수정: 오염 제거 · 홈 단독화 · 광고주 정정 · 메타 9종 · 본문 img
'use strict';
const fs = require('fs'), path = require('path');
const { build, ADS, BASE, ROOT } = require('./pages.js');
const REWRITES = require('./rewrites.js');

const KAKAO = '광고·제휴 입점 문의 카카오톡 besta12';
/* ★ 2026-08-24 — 예전에는 이 두 줄을 손으로 적어 뒀다. 광고주를 새로 넣을 때
   여기를 빠뜨리면 새 번호·닉네임이 "오염"으로 지워질 수 있다.
   이미 위에서 ADS 를 읽고 있으므로 거기서 뽑는다. 표는 한 곳(pages.js ADS)뿐이다. */
const ALL_TELS = Object.values(ADS).map(a => a.tel);
const ALL_NICKS = Object.values(ADS).map(a => a.nick);

const log = { contam: [], homelinks: [], meta: 0, img: 0, promo: [], notApplied: [] };
const rxq = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function stripHomeLinks(h, rel) {
  const hit = m => log.homelinks.push(`${rel} :: ${m.replace(/\s+/g, ' ').trim()}`);
  // 1) 빵부스러기 홈 항목
  h = h.replace(/\s*<a href="\/">홈<\/a>\s*›\s*/g, m => { hit('crumb ' + m); return '\n  '; });
  // 2) 로고/사이트명 링크 → 글자만 남김
  h = h.replace(/<a href="\/" class="site-brand">([\s\S]*?)<\/a>/g, (m, t) => { hit('site-brand ' + m); return `<span class="site-brand">${t}</span>`; });
  // 3) "← 목록/메인으로" 되돌아가기 버튼 제거
  h = h.replace(/\s*<a href="\/" class="back">[\s\S]*?<\/a>\s*/g, m => { hit('back ' + m); return '\n'; });
  // 4) 푸터 홈 링크 → 링크만 제거
  h = h.replace(/\s*·\s*<a href="\/">[^<]*<\/a>/g, m => { hit('footer ' + m); return ''; });
  h = h.replace(/<a href="\/">([^<]*)<\/a>/g, (m, t) => { hit('inline ' + m); return t; });
  // 5) 블로그 체류 시스템의 홈 이동
  h = h.replace(/ data-next-url="\/"/g, m => { hit('data-next-url="/"'); return ' data-next-url="/blog/first-time/"'; });
  return h;
}

function dropBreadcrumbHome(h, rel) {
  return h.replace(/\{"@context":"https:\/\/schema\.org","@type":"BreadcrumbList","itemListElement":\[([\s\S]*?)\]\}/g, (m, inner) => {
    let items;
    try { items = JSON.parse('[' + inner + ']'); } catch (e) { return m; }
    const kept = items.filter(it => {
      const isHome = it.item === BASE + '/' || it.item === BASE || it.name === '홈' || it.name === '울산챔피언나이트' && it.item === BASE;
      if (isHome) log.homelinks.push(`${rel} :: JSON-LD BreadcrumbList "${it.name}"`);
      return !isHome;
    }).map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.item }));
    if (!kept.length) { log.homelinks.push(`${rel} :: JSON-LD BreadcrumbList 전체 제거`); return ''; }
    return JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: kept });
  }).replace(/<script type="application\/ld\+json">\s*<\/script>/g, '');
}

// 남의 광고주 정보 제거 (닉네임 + 번호) → 광고문의로 대체
function scrubForeignAd(h, p, rel) {
  const mineTel = p.ad ? p.ad.tel : null, mineNick = p.ad ? p.ad.nick : null;
  for (const tel of ALL_TELS) {
    if (tel === mineTel) continue;
    const digits = tel.replace(/-/g, '');
    if (!h.includes(tel) && !h.includes(digits)) continue;
    log.contam.push(`${rel} :: 타 광고주 번호 ${tel} 제거`);
    // 표 행
    h = h.replace(new RegExp(`<tr><th scope="row">예약·문의</th><td>[^<]*${rxq(tel)}[^<]*</td></tr>`, 'g'),
      `<tr><th scope="row">광고·제휴</th><td>카카오톡 besta12</td></tr>`);
    // 본문 문장 (…예약·문의는 <strong>닉 <a href="tel:…">번호</a></strong>)
    h = h.replace(new RegExp(`[^<]*예약·문의는\\s*<strong>[^<]*<a href="tel:${digits}">${rxq(tel)}</a></strong>`, 'g'),
      `광고·제휴 입점 문의는 <strong>카카오톡 besta12</strong>`);
    h = h.replace(new RegExp(`<p class="footer-note">[^<]*예약·문의\\s*<strong>[^<]*<a href="tel:${digits}">${rxq(tel)}</a></strong></p>`, 'g'),
      `<p class="footer-note">광고·제휴 입점 문의 <strong>카카오톡 besta12</strong></p>`);
    // 요약 li
    h = h.replace(new RegExp(`\\s*·\\s*(?:예약\\s*)?문의 [^<·]*${rxq(tel)}\\.`, 'g'), '.');
    // 고정 전화바
    h = h.replace(new RegExp(`<div class="callbar"[^>]*>[\\s\\S]*?</div>`, 'g'), m =>
      m.includes(tel) || m.includes(digits)
        ? `<div class="callbar" role="complementary" aria-label="광고 제휴 문의">\n  <span>광고·제휴 입점 문의 카톡 <b>besta12</b></span>\n</div>`
        : m);
    // JSON-LD telephone
    h = h.replace(new RegExp(`,?"telephone":"${rxq(tel)}"`, 'g'), '');
    // 잔여 텍스트
    h = h.replace(new RegExp(rxq(tel), 'g'), '카카오톡 besta12').replace(new RegExp(rxq(digits), 'g'), '');
  }
  for (const nick of ALL_NICKS) {
    if (nick === mineNick) continue;
    if (!h.includes(nick)) continue;
    log.contam.push(`${rel} :: 타 광고주 닉네임 ${nick} 제거`);
    h = h.replace(new RegExp(`\\s*—\\s*담당 ${rxq(nick)}`, 'g'), '');
    h = h.replace(new RegExp(`담당 ${rxq(nick)}`, 'g'), '광고문의 besta12');
    h = h.replace(new RegExp(`\\s*${rxq(nick)} 카카오톡 besta12`, 'g'), ' 카카오톡 besta12');
    h = h.replace(new RegExp(`<b>${rxq(nick)}</b>\\s*`, 'g'), '');
    h = h.replace(new RegExp(`"name":"${rxq(nick)}",?`, 'g'), '');
    h = h.replace(new RegExp(rxq(nick), 'g'), '담당자');
  }
  return h;
}

// 자기 광고주 페이지: 전화바를 "📞 {가게이름} {닉} {번호}" 로 통일 + JSON-LD telephone 보장
function promoteOwnAd(h, p, rel) {
  const { nick, tel } = p.ad, digits = tel.replace(/-/g, '');
  const bar = `<div class="callbar" role="complementary" aria-label="전화 연결">\n  <a href="tel:${digits}" aria-label="${p.store} ${nick} ${tel} 전화">📞 ${p.store} ${nick} ${tel}</a>\n</div>`;
  const before = h;
  h = h.replace(/<div class="callbar"[\s\S]*?<\/div>/, bar);
  h = h.replace(/<div class="cta"><a href="tel:[^"]*">[^<]*<\/a><\/div>/,
    `<div class="cta"><a href="tel:${digits}">📞 ${p.store} ${nick} ${tel}</a></div>`);
  if (h !== before) log.promo.push(`${rel} :: 전화바 → 📞 ${p.store} ${nick} ${tel}`);
  // JSON-LD telephone 보장 (NightClub 노드에)
  if (!h.includes(`"telephone":"${tel}"`)) {
    const fixed = h.replace(/("@type":"NightClub","name":"[^"]*")/, `$1,"telephone":"${tel}"`);
    if (fixed !== h) { h = fixed; log.promo.push(`${rel} :: JSON-LD telephone ${tel} 추가`); }
  }
  return h;
}

// 밤 지역 페이지: 타 가게이름(연결 업소) 중립화
function scrubNightRegion(h, p, names, rel) {
  for (const n of names) {
    if (n === p.store || !h.includes(n)) continue;
    // JSON-LD mentions 제거
    h = h.replace(new RegExp(`,"mentions":\\[\\{"@type":"NightClub","name":"${rxq(n)}"[^\\]]*\\]`, 'g'), '');
    // 표: 연결 업소 셀에서 상호 제거, 주소만 남김
    h = h.replace(new RegExp(`(<th scope="row">연결 업소</th><td>)${rxq(n)}\\s*\\(([^)]*)\\)(</td>)`, 'g'), '$1$2$3');
    // h2 "…추천 — N"
    h = h.replace(new RegExp(`(<h2>[^<]*?) 추천 — ${rxq(n)}(</h2>)`, 'g'), '$1 추천 홀$2');
    // 앵커 밖 산문/FAQ: 조사별 중립화
    h = neutralize(h, n, '이 업소');
  }
  return h;
}

// 앵커(<a>…</a>) 안은 건드리지 않고 이름을 조사에 맞춰 치환
function neutralize(h, name, repl) {
  const parts = h.split(/(<a\b[\s\S]*?<\/a>)/i);
  for (let i = 0; i < parts.length; i += 2) {
    let s = parts[i];
    if (!s.includes(name)) continue;
    s = s.replace(new RegExp(rxq(name) + '(는|은)', 'g'), repl + '는')
         .replace(new RegExp(rxq(name) + '(가|이)(?![가-힣])', 'g'), repl + '가')
         .replace(new RegExp(rxq(name) + '(를|을)', 'g'), repl + '를')
         .replace(new RegExp(rxq(name) + '(와|과)', 'g'), repl + '와')
         .replace(new RegExp(rxq(name) + '도(?![가-힣])', 'g'), repl + '도')
         .replace(new RegExp(rxq(name) + '의', 'g'), repl + '의')
         .replace(new RegExp(rxq(name) + '에서', 'g'), repl + '에서')
         .replace(new RegExp(rxq(name), 'g'), repl);
    parts[i] = s;
  }
  return parts.join('');
}

function setMeta(h, kind, name, content) {
  const attr = kind === 'p' ? 'property' : 'name';
  const re = new RegExp(`<meta\\s+${attr}=["']${rxq(name)}["']\\s+content=["'][^"']*["']\\s*/?>`, 'i');
  const tag = `<meta ${attr}="${name}" content="${content}">`;
  if (re.test(h)) return h.replace(re, tag);
  log.meta++;
  return h.replace('</head>', tag + '\n</head>');
}

function dedupeMeta(h) {
  const seen = new Set();
  return h.replace(/<meta\s+(property|name)=["']((?:og:image[^"']*|twitter:image|twitter:card|thumbnail))["'][^>]*>\n?/gi, (m, a, n) => {
    const k = a + ':' + n;
    if (seen.has(k)) return '';
    seen.add(k); return m;
  });
}

(async () => {
  const { pages, names } = build();
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'og/manifest.json'), 'utf8'));
  const byFile = Object.fromEntries(manifest.map(m => [m.file, m]));

  for (const p of pages) {
    let h = fs.readFileSync(p.file, 'utf8');
    const orig = h;
    const rel = p.rel;

    /* 0) 타 가게이름의 <strong> 래핑 해제 (문장 치환 매칭용) */
    for (const n of names) if (n !== p.store) h = h.split(`<strong>${n}</strong>`).join(n);

    /* 1) 문장 단위 오염 제거 */
    for (const [from, to] of (REWRITES[p.url] || [])) {
      if (h.includes(from)) { const c = h.split(from).length - 1; h = h.split(from).join(to); log.contam.push(`${rel} :: 문장 ${c}건 «${from.slice(0, 34)}…» → 중립화`); }
      else log.notApplied.push(`${rel} :: 미적용 «${from.slice(0, 40)}…»`);
    }

    /* 2) 밤 지역 페이지 연결 업소 중립화 */
    if (p.url.startsWith('/night/') && p.kind === 'B') h = scrubNightRegion(h, p, names, rel);

    /* 3) 광고주 정보 정정 */
    h = scrubForeignAd(h, p, rel);
    if (p.ad) h = promoteOwnAd(h, p, rel);

    /* 4) 홈 단독화 */
    h = stripHomeLinks(h, rel);
    h = dropBreadcrumbHome(h, rel);

    /* 5) 썸네일 메타 9종 + 본문 img */
    if (p.kind === 'home') {
      // H1 홈 본문 이미지 0
      h = h.replace(/\n?<img[^>]*>/g, m => { log.img--; log.contam.push(`${rel} :: 홈 본문 이미지 제거 ${m.slice(0, 60)}`); return ''; });
      const abs = BASE + '/og/home.png';
      h = setMeta(h, 'p', 'og:image', abs);
      h = setMeta(h, 'p', 'og:image:secure_url', abs);
      h = setMeta(h, 'p', 'og:image:width', '1200');
      h = setMeta(h, 'p', 'og:image:height', '1200');
      h = setMeta(h, 'p', 'og:image:type', 'image/png');
      h = setMeta(h, 'p', 'og:image:alt', '통장에 4,300원 남은 날 붙인 종이 한 장 — 1,000일의 기록');
      h = setMeta(h, 'n', 'twitter:card', 'summary');
      h = setMeta(h, 'n', 'twitter:image', abs);
      h = setMeta(h, 'n', 'thumbnail', abs);
      h = h.replace(/"image":"[^"]*og-qa\/story-og\.png"/g, `"image":"${abs}"`);
    } else {
      const m = byFile[`/og/${p.slug}.png`];
      const abs = `${BASE}/og/${p.slug}.png`;
      const topic = m.texts[0].text;
      const head = p.store || m.texts[1].text;
      const alt = `${head} ${topic}`.replace(/\s+/g, ' ').trim();
      h = setMeta(h, 'p', 'og:image', abs);
      h = setMeta(h, 'p', 'og:image:secure_url', abs);
      h = setMeta(h, 'p', 'og:image:width', '1200');
      h = setMeta(h, 'p', 'og:image:height', '1200');
      h = setMeta(h, 'p', 'og:image:type', 'image/png');
      h = setMeta(h, 'p', 'og:image:alt', alt);
      h = setMeta(h, 'n', 'twitter:card', 'summary');
      h = setMeta(h, 'n', 'twitter:image', abs);
      h = setMeta(h, 'n', 'thumbnail', abs);
      h = h.replace(/(https:\/\/ulsang\.pages\.dev)?\/og(-qa|-images)?\/[a-z0-9-]+\.png/g, v =>
        v.startsWith('http') ? abs : `/og/${p.slug}.png`);
      // 본문 img 교체/삽입
      const tag = `<img src="/og/${p.slug}.png" alt="${alt.replace(/"/g, '&quot;')}" width="1200" height="1200" style="max-width:100%;height:auto" loading="eager">`;
      if (/<img[^>]*src="\/og\//.test(h)) h = h.replace(/<img[^>]*src="\/og\/[^"]*"[^>]*>/, tag);
      else {
        const bodyAt = h.search(/<body[^>]*>/i);
        let ins = -1;
        const am = h.slice(bodyAt).match(/<\/(div|section|aside)>(?=[\s\S]{0,40}<p class="lead")/i);
        const h1m = h.slice(bodyAt).match(/<\/h1>/i);
        const box = h.slice(bodyAt).match(/<div class="(?:answer-box|direct)"[\s\S]*?<\/div>/i);
        if (box) ins = bodyAt + box.index + box[0].length;
        else if (h1m) ins = bodyAt + h1m.index + h1m[0].length;
        if (ins > 0) { h = h.slice(0, ins) + '\n' + tag + h.slice(ins); log.img++; }
        else log.notApplied.push(`${rel} :: 본문 img 삽입 위치 못 찾음`);
      }
    }
    h = dedupeMeta(h);

    if (h !== orig) fs.writeFileSync(p.file, h);
  }

  fs.writeFileSync(path.join(ROOT, 'apply-report.json'), JSON.stringify(log, null, 1));
  console.log(`오염 제거 ${log.contam.length}건 · 홈링크 제거 ${log.homelinks.length}건 · 메타 추가 ${log.meta}건 · 본문img ${log.img}건 · 광고주 정정 ${log.promo.length}건`);
  if (log.notApplied.length) { console.log('⚠ 미적용 ' + log.notApplied.length + '건:'); log.notApplied.forEach(x => console.log('   ' + x)); }
})();

// 배포 전 게이트: G9+ / G10 / G13 / G14 / G15 / G16
'use strict';
const fs = require('fs'), path = require('path');
const sharp = require('sharp');
const { build, ADS, AD_PAGES, BASE, ROOT } = require('./pages.js');

/* ★ 2026-08-24 — 예전에는 이 두 표를 손으로 적어 뒀다. 광고주를 새로 넣으면
   여기에 없어 "미등록 번호"로 막혔다(창원b·울산 저장소에서 실제로 막혀 있었다).
   이미 위에서 ADS 를 읽고 있으므로 거기서 만든다. 표는 pages.js ADS 한 곳뿐이다. */
const TEL_OWNER = Object.fromEntries(
  Object.entries(ADS).map(([name, a]) => [a.tel, name])
);
const NICKS = Object.fromEntries(
  Object.entries(ADS).map(([name, a]) => [a.nick, name])
);
const META9 = [
  ['property', 'og:image'], ['property', 'og:image:secure_url'], ['property', 'og:image:width'],
  ['property', 'og:image:height'], ['property', 'og:image:type'], ['property', 'og:image:alt'],
  ['name', 'twitter:card'], ['name', 'twitter:image'], ['name', 'thumbnail'],
];
const fail = [], rows = [];

(async () => {
  const { pages, names } = build();
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'og/manifest.json'), 'utf8'));
  const byFile = Object.fromEntries(manifest.map(m => [m.file, m]));

  for (const p of pages) {
    const h = fs.readFileSync(p.file, 'utf8');
    const row = { page: p.url, store: p.store || '(중립)', kind: p.kind };
    const F = m => { fail.push(`${p.url} :: ${m}`); return false; };

    /* ── 메타 9종 (중복 금지) ── */
    let meta9 = true;
    for (const [attr, n] of META9) {
      const c = (h.match(new RegExp(`<meta ${attr}="${n.replace(/[:]/g, ':')}" content=`, 'g')) || []).length;
      if (c !== 1) { meta9 = F(`메타 ${n} ${c}개 (1개여야 함)`); }
    }
    row.meta9 = meta9 ? 'PASS' : 'FAIL';

    /* ── G16 홈 단독화 ── */
    const homeHrefs = (h.match(/<a\b[^>]*href="(\/|\.\/|index\.html|\/index\.html|https?:\/\/ulsang\.pages\.dev\/?(?:index\.html)?)"/g) || []);
    if (homeHrefs.length) F(`G16 홈 링크 ${homeHrefs.length}건: ${homeHrefs.join(' ')}`);
    if (/"@type":"BreadcrumbList"[\s\S]*?"item":"https:\/\/ulsang\.pages\.dev\/?"/.test(h)) F('G16 JSON-LD BreadcrumbList 홈 항목 잔존');
    if (/ data-next-url="\/"/.test(h)) F('G16 data-next-url="/" 잔존');
    row.homelink = homeHrefs.length ? 'FAIL' : '0건';

    /* ── G10 번호 위치 ── */
    const found = [];
    for (const [tel, owner] of Object.entries(TEL_OWNER)) {
      const d = tel.replace(/-/g, '');
      const allowed = p.store === owner || AD_PAGES[p.url] === owner;
      if (h.includes(tel) || h.includes(d)) { found.push(tel); if (!allowed) F(`G10 ${tel}(${owner}) 가 허용되지 않은 페이지에 있음`); }
    }
    const other010 = [...new Set((h.match(/01[016-9][-\s]?\d{3,4}[-\s]?\d{4}/g) || []))].filter(t => !Object.keys(TEL_OWNER).includes(t.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')) && !Object.keys(TEL_OWNER).includes(t));
    if (other010.length) F(`G10 미등록 010 패턴: ${other010.join(', ')}`);
    if (found.length > 1) F(`G10 한 페이지 번호 ${found.length}개`);
    if (p.ad && found[0] !== p.ad.tel) F(`G10 자기 번호 ${p.ad.tel} 없음`);
    row.tel = found.join(',') || '없음';

    /* ── 닉네임 위치 ── */
    for (const [nick, owner] of Object.entries(NICKS)) {
      if (h.includes(nick) && p.store !== owner && AD_PAGES[p.url] !== owner) F(`닉네임 ${nick}(${owner}) 오염`);
    }

    /* ── G13 가게이름 오염 (alt/캡션/파일명/메타는 예외 없음, 본문은 앵커 예외) ── */
    const hard = [];
    const g = (re, i = 1) => [...h.matchAll(re)].map(m => m[i]);
    hard.push(...g(/<title>([^<]*)</g), ...g(/name="description" content="([^"]*)"/g),
      ...g(/og:image:alt" content="([^"]*)"/g), ...g(/<img[^>]*alt="([^"]*)"/g),
      ...g(/<img[^>]*src="([^"]*)"/g), ...g(/<caption[^>]*>([\s\S]*?)<\/caption>/g),
      ...g(/og:image" content="([^"]*)"/g));
    let body = h.replace(/<a\b[\s\S]*?<\/a>/gi, ' ');   // head+body 전체, 앵커(예외 b)만 제외
    const g13 = [];
    for (const n of names) {
      if (n === p.store) continue;
      if (p.store === '인천아라비안나이트' && n.startsWith('인천아라비아')) continue;
      for (const t of hard) if (t && t.includes(n)) g13.push(`hard:${n}`);
      if (p.kind !== 'hub' && body.includes(n)) g13.push(`body:${n}`);
    }
    if (g13.length) F(`G13 가게이름 오염 ${[...new Set(g13)].join(', ')}`);
    row.contam = g13.length ? 'FAIL' : '0건';

    /* ── G9+ 본문 img / og:image 일치 / 실측 / 용량 / alt ── */
    if (p.kind === 'home') {
      if (/<img\b/i.test(h.slice(h.search(/<body/i)))) F('G16 홈 본문 <img> 잔존');
      if (/background-image\s*:\s*url\(/i.test(h)) F('G16 홈 background-image 파일 참조 잔존');
      row.img = '없음(정상)'; row.size = '-'; row.dim = '-'; row.alt = '-';
    } else {
      const want = `/og/${p.slug}.png`;
      const img = (h.match(/<img[^>]*src="([^"]*)"[^>]*>/) || []);
      const ogImg = (h.match(/og:image" content="([^"]*)"/) || [])[1] || '';
      if (!img[0]) F('G9+ 본문 img 없음');
      else if (img[1] !== want) F(`G9+ 본문 img ${img[1]} ≠ ${want}`);
      if (ogImg !== BASE + want) F(`G9+ og:image ${ogImg} ≠ ${BASE + want}`);
      const alt = (img[0] || '').match(/alt="([^"]*)"/);
      const head = p.store || byFile[want].texts[1].text;
      if (!alt || !alt[1].includes(head)) F(`G9+ alt에 «${head}» 없음`);
      const f = path.join(ROOT, want.slice(1));
      if (!fs.existsSync(f)) F('G9+ 썸네일 파일 없음');
      else {
        const md = await sharp(f).metadata(), sz = fs.statSync(f).size;
        if (md.width !== 1200 || md.height !== 1200) F(`G9+ 실측 ${md.width}x${md.height}`);
        if (sz > 300 * 1024) F(`G9+ 용량 ${(sz / 1024).toFixed(1)}KB > 300KB`);
        row.dim = `${md.width}x${md.height}`; row.size = (sz / 1024).toFixed(1) + 'KB';
      }
      row.img = want; row.alt = alt ? alt[1] : '';
    }

    /* ── G14/G15 썸네일 텍스트 ── */
    if (p.kind !== 'home') {
      const m = byFile[`/og/${p.slug}.png`];
      for (const t of m.texts) for (const n of names) {
        if (n === p.store) continue;
        if (t.text.includes(n)) F(`G14 썸네일 텍스트 오염 «${t.text}» ⊃ ${n}`);
      }
      const hero = m.texts.find(t => t.text === m.hero);
      const maxH = Math.max(...m.texts.map(t => t.heightPx));
      if (hero.heightPx < maxH - 0.01) F(`G15 주인공(${m.hero}) 보다 큰 글자 존재`);
      if (p.kind === 'A' && hero.widthPx < 972) F(`G15 전화번호 폭 ${hero.widthPx} < 972`);
      if (p.kind !== 'A' && hero.heightPx < 240) F(`G15 «광고문의» 높이 ${hero.heightPx} < 240`);
      row.hero = `${m.hero} ${hero.widthPx}x${hero.heightPx}`;
    } else row.hero = '-';
    rows.push(row);
  }

  /* robots / sitemap */
  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  if (/Disallow:\s*\/og/i.test(robots)) fail.push('robots.txt :: /og/ 차단됨');
  if (!/^User-agent: \*\nAllow: \//m.test(robots)) fail.push('robots.txt :: 전체 허용 아님');
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  if (!sm.includes(`<loc>${BASE}/</loc>`)) fail.push('sitemap.xml :: 홈 없음');

  fs.writeFileSync(path.join(ROOT, 'gate-report.json'), JSON.stringify({ fail, rows }, null, 1));
  console.log(`페이지 ${rows.length} · 실패 ${fail.length}건`);
  fail.slice(0, 60).forEach(f => console.log('  ✗ ' + f));
  if (!fail.length) console.log('✅ G9+ · G10 · G13 · G14 · G15 · G16 전부 통과');
  process.exit(fail.length ? 1 : 0);
})();

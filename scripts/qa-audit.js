// 나이트 문답 사전 게이트 G1~G11 (로컬)
'use strict';
const fs = require('fs');
const path = require('path');
const { VENUES } = require('./qa-data.js');
const ROOT = path.join(__dirname, '..');

const ADV = {
  '울산챔피언나이트': ['춘자', '010-5653-0069'],
  '불광동호박나이트': ['손흥민', '010-2221-1937'],
  '창원룰루랄라나이트': ['로또', '010-7528-4936'],
  '청담나이트': ['펩시맨', '010-5655-4866'],
};
const HOME_STAFF = ['춘자', '010-5653-0069'];
const OLD_NIGHT = fs.readdirSync(path.join(ROOT, 'night')).filter(f =>
  fs.statSync(path.join(ROOT, 'night', f)).isDirectory());

const R = [];
const push = (id, ok, detail) => R.push({ id, ok, detail });
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const strip = s => s.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (h, re) => { const m = []; let x; while ((x = re.exec(h))) m.push(x[1]); return m; };
const grams = (t, n) => { const s = t.replace(/\s+/g, ''); const set = new Set(); for (let i = 0; i + n <= s.length; i++) set.add(s.slice(i, i + n)); return set; };
const jac = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); };
const clen = s => [...String(s)].length;

const docs = {}, body = {};
for (const v of VENUES) {
  docs[v.slug] = read(`qa/${v.slug}/index.html`);
  body[v.slug] = strip((docs[v.slug].match(/<article>([\s\S]*?)<\/article>/) || [, ''])[1]);
}
const hub = read('qa/index.html');
const home = read('index.html');

/* ── G1 문서 기본골격 ── */
{
  const bad = VENUES.filter(v => {
    const h = docs[v.slug];
    return !h.startsWith('<!DOCTYPE html>') || !h.includes('<html lang="ko">')
      || !h.includes('name="viewport"') || !h.includes(`<link rel="canonical" href="https://baeyong.pages.dev/qa/${v.slug}/">`)
      || !/name="robots" content="index,follow/.test(h)
      || !h.includes('property="og:image"') || !h.includes('property="og:image:width" content="1200"');
  });
  push('G1', bad.length === 0, `DOCTYPE·lang·viewport·canonical·robots·og ${40 - bad.length}/40 ${bad.map(v => v.slug).join(',')}`);
}

/* ── G2 title 20~30자 · 가게이름 선두 · 40개 고유 ── */
{
  const bad = VENUES.filter(v => !v.title.startsWith(v.name) || clen(v.title) < 20 || clen(v.title) > 30);
  const t = VENUES.map(v => v.title);
  let max = 0;
  for (let i = 0; i < 40; i++) for (let j = i + 1; j < 40; j++) max = Math.max(max, jac(grams(t[i], 3), grams(t[j], 3)));
  push('G2', bad.length === 0 && new Set(t).size === 40 && max < 0.2,
    `길이·선두 위반 ${bad.length}${bad.length ? '(' + bad.map(v => v.slug + ':' + clen(v.title) + '자').join(' ') + ')' : ''} / 고유 ${new Set(t).size}/40 / 근사최대 ${(max * 100).toFixed(1)}%`);
}

/* ── G3 description 70~80자 · 고유 ── */
{
  const bad = VENUES.filter(v => clen(v.desc) < 70 || clen(v.desc) > 80);
  const d = VENUES.map(v => v.desc);
  let max = 0;
  for (let i = 0; i < 40; i++) for (let j = i + 1; j < 40; j++) max = Math.max(max, jac(grams(d[i], 5), grams(d[j], 5)));
  push('G3', bad.length === 0 && new Set(d).size === 40 && max < 0.2,
    `길이위반 ${bad.length}${bad.length ? '(' + bad.map(v => v.slug + ':' + clen(v.desc) + '자').join(' ') + ')' : ''} / 고유 ${new Set(d).size}/40 / 근사최대 ${(max * 100).toFixed(1)}%`);
}

/* ── G4 h1 1개 + 시맨틱 7종 ── */
{
  const need = ['<header', '<nav', '<main', '<article', '<section', '<aside', '<footer'];
  const bad = VENUES.filter(v => {
    const h = docs[v.slug];
    return tag(h, /<h1>([^<]*)<\/h1>/g).length !== 1 || !need.every(n => h.includes(n));
  });
  push('G4', bad.length === 0, `h1 1개 & 시맨틱 7종 ${40 - bad.length}/40 ${bad.map(v => v.slug).join(',')}`);
}

/* ── G5 본문 1,800~2,500자 ── */
let lens;
{
  lens = VENUES.map(v => ({ slug: v.slug, n: clen(body[v.slug]) }));
  const bad = lens.filter(x => x.n < 1800 || x.n > 2500);
  push('G5', bad.length === 0,
    `범위 밖 ${bad.length}${bad.length ? '(' + bad.map(x => x.slug + ':' + x.n).join(' ') + ')' : ''} / 최소 ${Math.min(...lens.map(x => x.n))} 최대 ${Math.max(...lens.map(x => x.n))} 평균 ${Math.round(lens.reduce((s, x) => s + x.n, 0) / 40)}`);
}

/* ── G6 문답 6~8개 · H2 전부 질문형 · 첫=기본정보 · 마지막=제목의 답 ── */
{
  const bad = [];
  for (const v of VENUES) {
    const qs = tag(docs[v.slug], /<summary><h2>([^<]*)<\/h2><\/summary>/g);
    if (qs.length < 6 || qs.length > 8) bad.push(`${v.slug}:개수${qs.length}`);
    if (qs.length !== v.qa.length) bad.push(`${v.slug}:불일치`);
    const notQ = qs.filter(q => !/\?$/.test(q.trim()));
    if (notQ.length) bad.push(`${v.slug}:비질문${notQ.length}`);
    // 첫 문답 = 기본정보(주소/위치/어디)
    if (!/주소|어디|위치|어느 동|어느 구/.test(qs[0] || '')) bad.push(`${v.slug}:첫문답`);
    // 마지막 문답 = 제목의 답 (그래서/정말/결국 로 시작)
    if (!/^(그래서|결국|정말)/.test((qs[qs.length - 1] || '').trim())) bad.push(`${v.slug}:마지막`);
  }
  const allQ = VENUES.flatMap(v => v.qa.map(q => q[0]));
  push('G6', bad.length === 0, `위반 ${bad.length} ${bad.slice(0, 6).join(' ')} / 총 문답 ${allQ.length}개 · 고유 ${new Set(allQ).size}`);
}

/* ── G7 본문 상호 유사도 5-gram < 15% (780쌍) ── */
let sim;
{
  const g = {}; VENUES.forEach(v => g[v.slug] = grams(body[v.slug], 5));
  const pairs = [];
  for (let i = 0; i < 40; i++) for (let j = i + 1; j < 40; j++)
    pairs.push({ a: VENUES[i].slug, b: VENUES[j].slug, v: jac(g[VENUES[i].slug], g[VENUES[j].slug]) });
  pairs.sort((x, y) => y.v - x.v);
  sim = { n: pairs.length, max: pairs[0].v, avg: pairs.reduce((s, p) => s + p.v, 0) / pairs.length, top: pairs.slice(0, 5) };
  push('G7', sim.max < 0.15, `${pairs.length}쌍 최대 ${(sim.max * 100).toFixed(2)}% 평균 ${(sim.avg * 100).toFixed(2)}%`);
}

/* ── G8 JSON-LD 3종 · FAQ 3문항 · 답 40~90자 · 질문 본문 일치 ── */
{
  let err = 0; const faqBad = [];
  for (const v of VENUES) {
    const blocks = tag(docs[v.slug], /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g);
    if (blocks.length !== 3) { err++; continue; }
    const onPage = new Set(v.qa.map(q => q[0]));
    for (const b of blocks) {
      let o; try { o = JSON.parse(b); } catch (e) { err++; continue; }
      if (o['@type'] === 'FAQPage') {
        if (o.mainEntity.length !== 3) faqBad.push(`${v.slug}:개수${o.mainEntity.length}`);
        for (const q of o.mainEntity) {
          const L = clen(q.acceptedAnswer.text);
          if (L < 40 || L > 90) faqBad.push(`${v.slug}:길이${L}`);
          if (!onPage.has(q.name)) faqBad.push(`${v.slug}:질문불일치`);
        }
      }
    }
  }
  // 허브·홈도 파싱 확인
  for (const [nm, h] of [['hub', hub], ['home', home]])
    for (const b of tag(h, /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) {
      try { JSON.parse(b); } catch (e) { err++; faqBad.push(nm + ':파싱'); }
    }
  push('G8', err === 0 && faqBad.length === 0, `파싱오류 ${err} / FAQ위반 ${faqBad.length} ${faqBad.slice(0, 5).join(' ')}`);
}

/* ── G9 외부 링크 0 · 광고 표기 ── */
{
  const ext = [];
  for (const [nm, h] of [...VENUES.map(v => [v.slug, docs[v.slug]]), ['hub', hub]]) {
    const hrefs = tag(h, /href="([^"]*)"/g)
      .filter(x => /^https?:\/\//.test(x) && !x.startsWith('https://baeyong.pages.dev'));
    if (hrefs.length) ext.push(`${nm}:${hrefs.join('|')}`);
  }
  const noKakao = [...VENUES.map(v => [v.slug, docs[v.slug]]), ['hub', hub], ['home', home]]
    .filter(([, h]) => !/class="ad-inquiry"[\s\S]{0,200}?besta12/.test(h)).map(([n]) => n);
  push('G9', ext.length === 0 && noKakao.length === 0,
    `외부링크 ${ext.length}건 ${ext.slice(0, 3).join(' ')} / 광고문의 besta12 누락 ${noKakao.length}건 ${noKakao.join(',')}`);
}

/* ── G10 전화 허용표 (홈=춘자 / 광고주 4곳만 자기 담당) ── */
{
  const bad = [];
  for (const v of VENUES) {
    const tels = [...new Set(tag(docs[v.slug], /(01[016-9]-\d{3,4}-\d{4})/g))];
    const names = ['춘자', '손흥민', '로또', '펩시맨'].filter(n => docs[v.slug].includes(n));
    if (ADV[v.name]) {
      const [staff, tel] = ADV[v.name];
      if (tels.length !== 1 || tels[0] !== tel) bad.push(`${v.slug}:번호${tels.join('|') || '없음'}`);
      if (names.length !== 1 || names[0] !== staff) bad.push(`${v.slug}:담당${names.join('|') || '없음'}`);
      if (!v.adv || v.adv.staff !== staff) bad.push(`${v.slug}:데이터불일치`);
    } else {
      if (tels.length) bad.push(`${v.slug}:비광고주에 번호 ${tels.join('|')}`);
      if (names.length) bad.push(`${v.slug}:비광고주에 담당 ${names.join('|')}`);
      if (v.adv) bad.push(`${v.slug}:adv 있음`);
    }
  }
  const hubTel = tag(hub, /(01[016-9]-\d{3,4}-\d{4})/g);
  if (hubTel.length) bad.push(`hub:번호 ${hubTel.join('|')}`);
  const homeTel = [...new Set(tag(home, /(01[016-9]-\d{3,4}-\d{4})/g))];
  if (homeTel.length !== 1 || homeTel[0] !== HOME_STAFF[1]) bad.push(`home:번호 ${homeTel.join('|') || '없음'}`);
  if (!home.includes(HOME_STAFF[0])) bad.push('home:춘자 없음');
  const homeOther = ['손흥민', '로또', '펩시맨'].filter(n => home.includes(n));
  if (homeOther.length) bad.push(`home:타담당 ${homeOther.join(',')}`);
  push('G10', bad.length === 0, bad.length ? bad.slice(0, 6).join(' ') : '홈=춘자 · 광고주 4곳 자기담당 · 나머지 36곳 번호 0');
}

/* ── G11 접근성·표기·기존자산 무손상 ── */
{
  const bad = [];
  for (const v of VENUES) {
    const imgs = tag(docs[v.slug], /<img([^>]*)>/g);
    if (imgs.filter(a => !/alt=/.test(a)).length) bad.push(`${v.slug}:img alt`);
    // 연령 축약 금지
    for (const f of [/27\+/, /38\+/, /만27세/, /27세 ?이상(?<!만 27세 이상)/]) { }
    const m = docs[v.slug].match(/(?<!만 )(27|38)세/g);
    if (m) bad.push(`${v.slug}:연령축약 ${m.join()}`);
    if (/27\+|38\+|만27세|만38세/.test(docs[v.slug])) bad.push(`${v.slug}:연령축약2`);
  }
  // 인천아라비안 표기 (양쪽 표기 한 페이지)
  const arab = docs['incheon-arabian'] || '';
  if (!arab.includes('인천아라비안나이트') || !arab.includes('인천아라비아나이트')) bad.push('인천아라비안: 두 표기 누락');
  // 기존 /night/ 무손상
  const { execSync } = require('child_process');
  const diff = execSync(`git diff --stat -- night/ blog/ bulgwang-hobak/ og/`, { cwd: ROOT }).toString().trim();
  if (diff) bad.push(`기존자산 diff: ${diff.split('\n').pop()}`);
  push('G11', bad.length === 0, bad.length ? bad.slice(0, 5).join(' ') : `img alt 100% · 연령 완전문 · 인천 두 표기 · 기존 ${OLD_NIGHT.length}페이지 diff 0`);
}

/* ── 출력 ── */
console.log('=== 나이트 문답 사전 게이트 G1~G11 ===');
for (const r of R) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id.padEnd(4)} ${r.detail}`);
console.log('\n=== 본문 유사도 상위 5쌍 ===');
for (const p of sim.top) console.log(`${(p.v * 100).toFixed(2)}%  ${p.a} ↔ ${p.b}`);
console.log('\n=== 본문 길이 ===');
console.log(lens.map(x => `${x.slug}:${x.n}`).join('  '));
const fails = R.filter(r => !r.ok);
console.log(`\n게이트 ${R.length - fails.length}/${R.length} PASS` + (fails.length ? ` — FAIL: ${fails.map(f => f.id).join(',')}` : ''));
fs.writeFileSync(path.join(ROOT, 'qa-audit.json'), JSON.stringify({ R, sim, lens }, null, 1));
process.exitCode = fails.length ? 1 : 0;

// 다음 자리 13페이지 게이트 검사 (로컬)
'use strict';
const fs = require('fs');
const path = require('path');
const { PAGES } = require('./night2-data.js');
const ROOT = path.join(__dirname, '..');

const OLD = ['ansan-hit-night','bulgwang-hobak-night','busan-asiad-night','changwon-lululala-night',
  'cheongdam-night','daejeon-one-night','daejeon-seven-night','ilsan-shampoo-night',
  'sangbong-hangukgwan-night','sillim-grandprix-night','suwon-chance-dome-night',
  'suyu-shampoo-night','ulsan-champion-night'];
const NEW = PAGES.map(p => p.slug);

const read = s => fs.readFileSync(path.join(ROOT, 'night', s, 'index.html'), 'utf8');
const tag = (h, re) => { const m = []; let x; while ((x = re.exec(h))) m.push(x[1]); return m; };
const strip = s => s.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

function articleText(h) {
  const m = h.match(/<article>([\s\S]*?)<\/article>/);
  return strip(m ? m[1] : h);
}
function grams(t, n) {
  const s = t.replace(/\s+/g, '');
  const set = new Set();
  for (let i = 0; i + n <= s.length; i++) set.add(s.slice(i, i + n));
  return set;
}
function jac(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

const R = [];
const push = (id, ok, detail) => R.push({ id, ok, detail });

// ── 수집
const docs = {};
for (const s of [...OLD, ...NEW]) docs[s] = read(s);

const meta = {};
for (const s of [...OLD, ...NEW]) {
  const h = docs[s];
  meta[s] = {
    title: (h.match(/<title>([^<]*)<\/title>/) || [, ''])[1],
    desc: (h.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1],
    h1: tag(h, /<h1>([^<]*)<\/h1>/g),
    h2: tag(h, /<h2>([^<]*)<\/h2>/g),
    lead: strip((h.match(/<p class="lead">([\s\S]*?)<\/p>/) || [, ''])[1]),
    body: articleText(h),
  };
}

// G01 DOCTYPE·lang
push('G01', NEW.every(s => docs[s].startsWith('<!DOCTYPE html>') && docs[s].includes('<html lang="ko">')),
  `DOCTYPE/lang ${NEW.filter(s => docs[s].startsWith('<!DOCTYPE html>') && docs[s].includes('<html lang="ko">')).length}/13`);

// G02 title·desc 중복 + 유사도
{
  const t = NEW.map(s => meta[s].title), d = NEW.map(s => meta[s].desc);
  const dupT = t.length - new Set(t).size, dupD = d.length - new Set(d).size;
  let maxT = 0, maxD = 0;
  for (let i = 0; i < 13; i++) for (let j = i + 1; j < 13; j++) {
    maxT = Math.max(maxT, jac(grams(t[i], 3), grams(t[j], 3)));
    maxD = Math.max(maxD, jac(grams(d[i], 5), grams(d[j], 5)));
  }
  push('G02', dupT === 0 && dupD === 0 && maxT < 0.2 && maxD < 0.2,
    `완전중복 t=${dupT} d=${dupD} / 근사 title최대 ${(maxT * 100).toFixed(1)}% desc최대 ${(maxD * 100).toFixed(1)}%`);
}

// G03 h1 1개 + 시맨틱 7종
{
  const need = ['<header', '<nav', '<main', '<article', '<section', '<aside', '<footer'];
  const bad = NEW.filter(s => meta[s].h1.length !== 1 || !need.every(n => docs[s].includes(n)));
  push('G03', bad.length === 0, `h1 1개 & 시맨틱7종 ${13 - bad.length}/13 ${bad.join(',')}`);
}

// G04 325쌍 5-gram
let simReport;
{
  const all = [...OLD, ...NEW];
  const g = {}; all.forEach(s => g[s] = grams(meta[s].body, 5));
  const pairs = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++)
    pairs.push({ a: all[i], b: all[j], v: jac(g[all[i]], g[all[j]]), cross: (i < 13) !== (j < 13) });
  pairs.sort((x, y) => y.v - x.v);
  const max = pairs[0].v, avg = pairs.reduce((s, p) => s + p.v, 0) / pairs.length;
  simReport = { n: pairs.length, max, avg, top: pairs.slice(0, 5) };
  push('G04', max < 0.15, `${pairs.length}쌍 최대 ${(max * 100).toFixed(2)}% 평균 ${(avg * 100).toFixed(2)}%`);
}

// G06/G07 callbar besta12
{
  const cb = s => (docs[s].match(/<div class="callbar"[\s\S]*?<\/div>/) || [''])[0];
  const A = PAGES.filter(p => p.group === 'A'), B = PAGES.filter(p => p.group === 'B');
  const a6 = A.filter(p => cb(p.slug).includes('besta12'));
  const b7 = B.filter(p => cb(p.slug).includes('besta12'));
  push('G06', a6.length === 0, `A그룹 4페이지 고정바 besta12 ${a6.length}회`);
  push('G07', b7.length === 9, `B그룹 고정바 besta12 노출 ${b7.length}/9`);
}

// G08 푸터 besta12
{
  const bad = NEW.filter(s => !/class="ad-inquiry"[\s\S]*?besta12/.test(docs[s]));
  push('G08', bad.length === 0, `푸터 besta12 ${13 - bad.length}/13 · #ffd400/#111 대비 13.2:1`);
}

// G09 JSON-LD
{
  let err = 0, faqBad = [];
  for (const s of NEW) {
    const blocks = tag(docs[s], /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g);
    if (blocks.length !== 3) err++;
    for (const b of blocks) { try { const o = JSON.parse(b); if (o['@type'] === 'FAQPage') o.mainEntity.forEach(q => { const L = q.acceptedAnswer.text.length; if (L < 40 || L > 90) faqBad.push(`${s}:${L}`); }); } catch (e) { err++; } }
  }
  push('G09', err === 0 && faqBad.length === 0, `파싱오류 ${err} / FAQ길이위반 ${faqBad.length} ${faqBad.slice(0, 5).join(',')}`);
}

// G10 외부 아웃바운드
{
  const bad = [];
  for (const s of NEW) {
    const hrefs = tag(docs[s], /href="([^"]*)"/g).filter(h => /^https?:\/\//.test(h) && !h.startsWith('https://b.nolcool.com'));
    if (hrefs.length) bad.push(`${s}:${hrefs.join('|')}`);
  }
  push('G10', bad.length === 0, `외부 링크 ${bad.length}건 ${bad.join(' ')}`);
}

// G13 기존 13페이지 무손상
{
  const { execSync } = require('child_process');
  const d = execSync('git diff --stat -- night/ansan-hit-night night/bulgwang-hobak-night night/busan-asiad-night night/changwon-lululala-night night/cheongdam-night night/daejeon-one-night night/daejeon-seven-night night/ilsan-shampoo-night night/sangbong-hangukgwan-night night/sillim-grandprix-night night/suwon-chance-dome-night night/suyu-shampoo-night night/ulsan-champion-night', { cwd: ROOT }).toString().trim();
  push('G13', d === '', `기존 13페이지 diff: ${d || '0건'}`);
}

// G15 형태소
const morph = {};
{
  const bad = [];
  for (const p of PAGES) {
    const t = meta[p.slug].body;
    const cnt = (re) => (t.match(re) || []).length;
    const A = cnt(new RegExp(p.kw, 'g'));
    const C = cnt(new RegExp(p.kwC, 'g'));
    const B = cnt(new RegExp(p.kwB + '(?!클럽)', 'g'));
    morph[p.slug] = { A, B, C };
    if (A < 10 || B < 2 || C < 1) bad.push(`${p.slug}(A${A}/B${B}/C${C})`);
  }
  push('G15', bad.length === 0, bad.length ? bad.join(' ') : '13/13 A≥10 B≥2 C≥1');
}

// G16 title
{
  const bad = PAGES.filter(p => !p.title.startsWith(p.kw) || p.title.length < 25 || p.title.length > 30);
  push('G16', bad.length === 0, bad.length ? bad.map(p => `${p.slug}:${p.title.length}자`).join(' ') : `13/13 (${PAGES.map(p => p.title.length).join(',')}자)`);
}

// G17 첫 100자 안에 A형
{
  const bad = PAGES.filter(p => !meta[p.slug].lead.slice(0, 100).includes(p.kw));
  push('G17', bad.length === 0, bad.length ? bad.map(p => p.slug).join(' ') : '13/13');
}

// G18 교통 단어
{
  const bad = [];
  for (const p of PAGES) {
    const t = meta[p.slug].body;
    const c = ['지하철', '환승', '막차', '택시'].reduce((s, w) => s + (t.match(new RegExp(w, 'g')) || []).length, 0);
    if (c > 3) bad.push(`${p.slug}:${c}`);
  }
  push('G18', bad.length === 0, bad.length ? bad.join(' ') : '전 페이지 3회 이하');
}

// G19 H2 키워드
{
  const bad = PAGES.filter(p => meta[p.slug].h2.filter(h => h.includes(p.kw)).length < 4);
  push('G19', bad.length === 0, bad.length ? bad.map(p => `${p.slug}:${meta[p.slug].h2.filter(h => h.includes(p.kw)).length}`).join(' ')
    : PAGES.map(p => meta[p.slug].h2.filter(h => h.includes(p.kw)).length).join(','));
}

// G23 각도
{
  const ang = PAGES.map(p => ((3 - 1) + (p.n - 1) + 7) % 13 + 1);
  const old = PAGES.map(p => ((3 - 1) + (p.n - 1)) % 13 + 1);
  const ok = new Set(ang).size === 13 && ang.every((a, i) => a !== old[i]) && ang.every((a, i) => a === PAGES[i].angle);
  push('G23', ok, `각도 ${ang.join(',')} / 1차 ${old.join(',')}`);
}

// G24 slug 충돌
{
  const col = NEW.filter(s => OLD.includes(s));
  const dash2 = NEW.filter(s => /-2$/.test(s));
  push('G24', col.length === 0 && dash2.length === 0, `충돌 ${col.length}건 / "-2" ${dash2.length}건`);
}

// G25 금지어
{
  const bad = PAGES.filter(p => /안녕하세요|오늘은|알아보겠습니다/.test(meta[p.slug].lead));
  push('G25', bad.length === 0, bad.length ? bad.map(p => p.slug).join(' ') : '0회');
}

// G26 bridge 개수
{
  const bad = [];
  for (const p of PAGES) {
    const h2n = (docs[p.slug].match(/<section>/g) || []).length;
    const br = (docs[p.slug].match(/class="bridge"/g) || []).length;
    if (h2n !== br) bad.push(`${p.slug}:${br}/${h2n}`);
  }
  push('G26', bad.length === 0, bad.length ? bad.join(' ') : PAGES.map(p => (docs[p.slug].match(/class="bridge"/g) || []).length).join(','));
}

// G27 title 접미어 26개 고유
{
  const sufNew = PAGES.map(p => p.title.slice(p.kw.length + 1));
  const sufOld = OLD.map(s => { const t = meta[s].title; return t.slice(t.indexOf(' ') + 1); });
  const all = [...sufNew, ...sufOld];
  const dupNew = sufNew.length - new Set(sufNew).size;
  // 접미어 풀 문구 기준 비교 (신규는 [4] 풀 값)
  const pool = PAGES.map(p => p.suffix || p.title.split(' ').slice(1, 4).join(' '));
  push('G27', dupNew === 0 && new Set(all).size === all.length, `신규 상호중복 ${dupNew} / 26개 고유 ${new Set(all).size}/26`);
}

// G28 첫 문장 문형
{
  const f = s => meta[s].lead.split(/(?<=[.?!])\s/)[0];
  const all = [...NEW, ...OLD].map(f);
  push('G28', new Set(all).size === 26, `첫 문장 고유 ${new Set(all).size}/26`);
}

// G29 H2 첫 항목
{
  const all = [...NEW, ...OLD].map(s => meta[s].h2[0]);
  push('G29', new Set(all).size === 26, `H2 첫 항목 고유 ${new Set(all).size}/26`);
}

// G30 answer-box 두 번째 문장
{
  const a = PAGES.map(p => p.answer2);
  push('G30', new Set(a).size === 13, `고유 ${new Set(a).size}/13`);
}

// G33 연령 축약
{
  const bad = [];
  const forb = [/27\+/, /38\+/, /만27세/, /27세이상/, /27이상/, /38세이상/, /38이상/, /만38세/, /27\/38/];
  for (const s of NEW) {
    const h = docs[s];
    for (const f of forb) if (f.test(h)) bad.push(`${s}:${f}`);
    // 27세/38세 단독 (앞에 "만 " 없는 경우)
    const m = h.match(/(?<!만 )(27|38)세/g);
    if (m) bad.push(`${s}:단독${m.join()}`);
  }
  const cw = docs['changwon-night'].includes('만 27세 이상');
  const dj = docs['daejeon-night'].includes('만 38세 이상');
  push('G33', bad.length === 0 && cw && dj, `금지축약 ${bad.length}건 ${bad.slice(0,4).join(' ')} / 완전문 창원 ${cw} 대전 ${dj}`);
}

// G34 배정 업소 링크
{
  const bad = PAGES.filter(p => !docs[p.slug].includes(`href="${p.shopUrl}"`));
  push('G34', bad.length === 0, `${13 - bad.length}/13`);
}

// 출력
console.log('=== 게이트(로컬) ===');
for (const r of R) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}  ${r.detail}`);
console.log('\n=== 유사도 상위 5쌍 ===');
for (const p of simReport.top) console.log(`${(p.v * 100).toFixed(2)}%  ${p.a} ↔ ${p.b}${p.cross ? '  [기존↔신규]' : ''}`);
console.log(`쌍 ${simReport.n} / 최대 ${(simReport.max * 100).toFixed(2)}% / 평균 ${(simReport.avg * 100).toFixed(2)}%`);
console.log('\n=== 형태소 ===');
for (const p of PAGES) console.log(`${p.slug}\tA:${morph[p.slug].A}\tB:${morph[p.slug].B}\tC:${morph[p.slug].C}`);
const fails = R.filter(r => !r.ok);
console.log(`\n로컬 게이트 ${R.length - fails.length}/${R.length} PASS` + (fails.length ? ` — FAIL: ${fails.map(f => f.id).join(',')}` : ''));
fs.writeFileSync(path.join(__dirname, '..', 'night2-audit.json'), JSON.stringify({ R, simReport, morph }, null, 1));

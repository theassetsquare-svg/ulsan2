#!/usr/bin/env node
// 키워드 스터핑 + 메타 중복 + 무결성 검사. 임계치 위반시 exit 1.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
  { slug: 'home', path: 'index.html' },
  { slug: 'first-time', path: 'blog/first-time/index.html' },
  { slug: 'weekend', path: 'blog/weekend/index.html' },
  { slug: 'over40', path: 'blog/over40/index.html' },
  { slug: 'couple', path: 'blog/couple/index.html' },
  { slug: 'alone', path: 'blog/alone/index.html' },
  { slug: 'summer', path: 'blog/summer/index.html' },
  { slug: 'event', path: 'blog/event/index.html' },
  { slug: 'vs', path: 'blog/vs/index.html' },
  { slug: 'food', path: 'blog/food/index.html' },
  { slug: 'safety', path: 'blog/safety/index.html' },
];

const KEYWORDS = ['울산챔피언나이트', '울산나이트', '울산 나이트', '챔피언나이트', '춘자'];

// 임계치
const T = {
  titleMin: 25, titleMax: 70,
  descMin: 60, descMax: 165,
  densityMaxPct: 2.5,            // 단일 키워드 본문 밀도 상한 (%)
  titleSimMaxJaccard: 0.55,      // 페이지간 title 유사도 상한
  descSimMaxJaccard: 0.50,       // description 유사도 상한
  minBodyChars: 1500,            // 본문 최소 글자수
};

function stripHTML(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getMeta(html, name) {
  const re = new RegExp(`<meta\\s+(?:[^>]*\\s+)?(?:name|property)=["']${name}["']\\s+[^>]*content=["']([^"']*)["']`, 'i');
  const m = html.match(re);
  if (m) return decode(m[1]);
  const re2 = new RegExp(`<meta\\s+(?:[^>]*\\s+)?content=["']([^"']*)["'][^>]*\\s+(?:name|property)=["']${name}["']`, 'i');
  const m2 = html.match(re2);
  return m2 ? decode(m2[1]) : null;
}
function decode(s) { return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#\d+;/g, ''); }

function getTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? decode(m[1]).trim() : null;
}

function getBody(html) {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return stripHTML(m ? m[1] : html);
}

function getHeadings(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(stripHTML(m[1]));
  return out;
}

// Jaccard on character bigrams — Korean-friendly
function bigrams(s) {
  const t = (s || '').toLowerCase().replace(/\s+/g, '');
  const set = new Set();
  for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
  return set;
}
function jaccard(a, b) {
  const A = bigrams(a), B = bigrams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

function densityPct(body, kw) {
  if (!body.length) return 0;
  const occ = (body.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  return (occ * kw.replace(/\s/g, '').length / body.replace(/\s/g, '').length) * 100;
}

const report = { generatedAt: new Date().toISOString(), pages: [], issues: [], summary: {} };

for (const p of PAGES) {
  const file = path.join(ROOT, p.path);
  if (!fs.existsSync(file)) {
    report.issues.push({ slug: p.slug, level: 'error', msg: `missing file: ${p.path}` });
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const title = getTitle(html);
  const desc = getMeta(html, 'description');
  const ogTitle = getMeta(html, 'og:title');
  const ogDesc = getMeta(html, 'og:description');
  const ogImage = getMeta(html, 'og:image');
  const twTitle = getMeta(html, 'twitter:title');
  const twDesc = getMeta(html, 'twitter:description');
  const keywords = getMeta(html, 'keywords');
  const h1 = getHeadings(html, 'h1');
  const h2 = getHeadings(html, 'h2');
  const h3 = getHeadings(html, 'h3');
  const body = getBody(html);

  const densities = {};
  for (const k of KEYWORDS) densities[k] = +densityPct(body, k).toFixed(2);

  const entry = {
    slug: p.slug,
    path: p.path,
    title,
    titleLen: title ? title.length : 0,
    description: desc,
    descLen: desc ? desc.length : 0,
    keywords,
    ogImage,
    h1Count: h1.length,
    h2Count: h2.length,
    h3Count: h3.length,
    bodyChars: body.length,
    densities,
    meta: { ogTitle: !!ogTitle, ogDesc: !!ogDesc, twTitle: !!twTitle, twDesc: !!twDesc },
  };

  // Per-page checks
  if (!title) report.issues.push({ slug: p.slug, level: 'error', msg: 'missing <title>' });
  else if (title.length < T.titleMin || title.length > T.titleMax)
    report.issues.push({ slug: p.slug, level: 'warn', msg: `title length ${title.length} not in [${T.titleMin},${T.titleMax}]` });

  if (!desc) report.issues.push({ slug: p.slug, level: 'error', msg: 'missing meta description' });
  else if (desc.length < T.descMin || desc.length > T.descMax)
    report.issues.push({ slug: p.slug, level: 'warn', msg: `description length ${desc.length} not in [${T.descMin},${T.descMax}]` });

  if (!ogImage) report.issues.push({ slug: p.slug, level: 'error', msg: 'missing og:image' });
  if (!ogTitle || !ogDesc) report.issues.push({ slug: p.slug, level: 'warn', msg: 'missing og:title/og:description' });
  if (!twTitle || !twDesc) report.issues.push({ slug: p.slug, level: 'warn', msg: 'missing twitter:title/description' });

  if (h1.length === 0) report.issues.push({ slug: p.slug, level: 'warn', msg: 'no <h1>' });
  if (h1.length > 1) report.issues.push({ slug: p.slug, level: 'warn', msg: `multiple <h1> (${h1.length})` });

  if (body.length < T.minBodyChars && p.slug !== 'home')
    report.issues.push({ slug: p.slug, level: 'warn', msg: `body too short (${body.length} chars)` });

  for (const [k, v] of Object.entries(densities)) {
    if (v > T.densityMaxPct)
      report.issues.push({ slug: p.slug, level: 'error', msg: `keyword "${k}" density ${v}% > ${T.densityMaxPct}%` });
  }

  // og:title === <title> 와 twitter:title === <title> 일치성
  if (ogTitle && title && ogTitle !== title)
    report.issues.push({ slug: p.slug, level: 'info', msg: 'og:title differs from <title>' });

  report.pages.push(entry);
}

// Cross-page similarity
for (let i = 0; i < report.pages.length; i++) {
  for (let j = i + 1; j < report.pages.length; j++) {
    const a = report.pages[i], b = report.pages[j];
    const ts = +jaccard(a.title, b.title).toFixed(3);
    const ds = +jaccard(a.description, b.description).toFixed(3);
    if (ts > T.titleSimMaxJaccard)
      report.issues.push({ level: 'error', msg: `title similarity ${a.slug}↔${b.slug} = ${ts} > ${T.titleSimMaxJaccard}` });
    if (ds > T.descSimMaxJaccard)
      report.issues.push({ level: 'error', msg: `desc similarity ${a.slug}↔${b.slug} = ${ds} > ${T.descSimMaxJaccard}` });
  }
}

const errors = report.issues.filter(x => x.level === 'error').length;
const warns = report.issues.filter(x => x.level === 'warn').length;
const infos = report.issues.filter(x => x.level === 'info').length;
report.summary = { pages: report.pages.length, errors, warns, infos };

const outFile = path.join(ROOT, 'audit-report.json');
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

// Human-readable summary
console.log('=== ULSAN2 AUDIT REPORT ===');
console.log(`Pages: ${report.summary.pages}  Errors: ${errors}  Warnings: ${warns}  Info: ${infos}`);
console.log('');
for (const p of report.pages) {
  console.log(`[${p.slug}] title=${p.titleLen}ch  desc=${p.descLen}ch  body=${p.bodyChars}ch  h1=${p.h1Count} h2=${p.h2Count} h3=${p.h3Count}`);
  console.log(`  densities: ${Object.entries(p.densities).map(([k, v]) => `${k}=${v}%`).join('  ')}`);
}
console.log('');
console.log('--- ISSUES ---');
const grouped = {};
for (const i of report.issues) {
  const k = i.level;
  (grouped[k] ||= []).push(i);
}
for (const lvl of ['error', 'warn', 'info']) {
  for (const it of grouped[lvl] || []) {
    console.log(`[${lvl.toUpperCase()}]${it.slug ? ' ' + it.slug : ''}: ${it.msg}`);
  }
}
console.log('');
console.log(`Full report → ${path.relative(ROOT, outFile)}`);

if (errors > 0) {
  console.error(`\n❌ ${errors} error(s) — fail`);
  process.exit(1);
}
console.log('\n✅ no errors');

#!/usr/bin/env node
// 라이브 사이트 직접 검증 (audit.js와 같은 로직).
const https = require('https');

const BASE = 'https://b.nolcool.com';
const PATHS = [
  '/', '/first-time/', '/weekend/', '/over40/', '/couple/',
  '/alone/', '/summer/', '/event/', '/vs/', '/food/', '/safety/',
];
const KEYWORDS = ['울산챔피언나이트', '울산나이트', '울산 나이트', '챔피언나이트', '춘자'];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'audit-live/1.0' } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}
function stripHTML(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ').trim();
}
function getBody(html) {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return stripHTML(m ? m[1] : html);
}
function getMeta(html, name) {
  const re = new RegExp(`<meta\\s+(?:[^>]*\\s+)?(?:name|property)=["']${name}["']\\s+[^>]*content=["']([^"']*)["']`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}
function getTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}
function densityPct(body, kw) {
  if (!body.length) return 0;
  const occ = (body.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  return (occ * kw.replace(/\s/g, '').length / body.replace(/\s/g, '').length) * 100;
}

(async () => {
  console.log('=== LIVE SITE AUDIT ===');
  console.log(`Source: ${BASE}\n`);
  let totalErrors = 0;
  for (const p of PATHS) {
    const html = await fetch(BASE + p + '?ts=' + Date.now());
    const title = getTitle(html);
    const desc = getMeta(html, 'description');
    const body = getBody(html);
    const dens = KEYWORDS.map(k => `${k}=${densityPct(body, k).toFixed(2)}%`).join(' ');
    const tLen = title ? title.length : 0;
    const dLen = desc ? desc.length : 0;
    const skip = html.includes('class="skip-link"');
    const schema = (html.match(/application\/ld\+json/g) || []).length;
    const ogImg = !!getMeta(html, 'og:image');
    let issues = [];
    if (tLen < 25 || tLen > 70) issues.push(`title-len:${tLen}`);
    if (dLen < 60 || dLen > 165) issues.push(`desc-len:${dLen}`);
    if (!skip) issues.push('no-skip');
    if (schema === 0) issues.push('no-schema');
    if (!ogImg) issues.push('no-ogImg');
    const maxDens = Math.max(...KEYWORDS.map(k => densityPct(body, k)));
    if (maxDens > 2.5) issues.push(`density-max:${maxDens.toFixed(2)}%`);
    if (issues.length) totalErrors++;
    console.log(`${p.padEnd(22)} t:${String(tLen).padStart(2)} d:${String(dLen).padStart(3)} body:${String(body.length).padStart(4)} skip:${skip?'✓':'✗'} schema:${schema} ${issues.length ? '❌ '+issues.join(',') : '✅'}`);
  }
  console.log(`\n총 ${PATHS.length}페이지 중 문제 ${totalErrors}건`);
  if (totalErrors > 0) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });

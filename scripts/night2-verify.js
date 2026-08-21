// 고정바·색인·접근성 실측 (Playwright + 시스템 Chromium)
// 사용: node scripts/night2-verify.js <base>   base = file:///home/user/ulsan2 또는 https://baeyong.pages.dev
'use strict';
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const { PAGES } = require('./night2-data.js');
const EXE = '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium';
const BASE = process.argv[2] || 'https://baeyong.pages.dev';
const LIVE = BASE.startsWith('http');
const VIEWPORTS = [
  { name: '모바일 390x844', width: 390, height: 844 },
  { name: '데스크톱 1920x1080', width: 1920, height: 1080 },
];
const BAD_PROPS = ['transform', 'filter', 'perspective', 'backdropFilter', 'willChange', 'contain'];

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const rows = [], issues = [];
  for (const p of PAGES) {
    const url = LIVE ? `${BASE}/night/${p.slug}/?cb=${Date.now()}` : `${BASE}/night/${p.slug}/index.html`;
    for (const v of VIEWPORTS) {
      const ctx = await b.newContext({ viewport: { width: v.width, height: v.height } });
      const page = await ctx.newPage();
      const t0 = Date.now();
      const resp = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      const loadMs = Date.now() - t0;
      const redirects = resp ? resp.request().redirectedFrom() ? 1 : 0 : 0;

      const d = await page.evaluate((BAD) => {
        const bar = document.querySelector('.callbar');
        const r = {};
        r.scrollable = document.documentElement.scrollHeight > window.innerHeight;
        r.scrollHeight = document.documentElement.scrollHeight;
        r.innerHeight = window.innerHeight;
        r.top0 = bar ? bar.getBoundingClientRect().top : null;
        r.parentIsBody = bar ? bar.parentElement === document.body : false;
        // 조상 체인 검사
        r.ancestors = [];
        let el = bar ? bar.parentElement : null;
        while (el && el !== document.documentElement) {
          const cs = getComputedStyle(el);
          const hit = BAD.filter(k => {
            const val = cs[k];
            return val && val !== 'none' && val !== 'auto' && val !== 'normal';
          });
          if (hit.length) r.ancestors.push(el.tagName + '.' + el.className + ':' + hit.join(','));
          el = el.parentElement;
        }
        r.barText = bar ? bar.innerText : '';
        r.imgs = document.querySelectorAll('img').length;
        r.imgsNoAlt = [...document.querySelectorAll('img')].filter(i => !i.getAttribute('alt')).length;
        r.noindex = /noindex/i.test((document.querySelector('meta[name="robots"]') || {}).content || '');
        r.canonical = (document.querySelector('link[rel=canonical]') || {}).href || '';
        r.h1 = document.querySelectorAll('article h1').length;
        return r;
      }, BAD_PROPS);

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(300);
      const after = await page.evaluate(() => {
        const bar = document.querySelector('.callbar');
        const ad = document.querySelector('.ad-inquiry');
        const br = bar.getBoundingClientRect(), ar = ad ? ad.getBoundingClientRect() : null;
        return {
          top1: br.top, scrollY: window.scrollY,
          adBottom: ar ? ar.bottom : null,
          adCovered: ar ? (ar.bottom > br.top && ar.top < br.bottom) : null,
        };
      });

      const diff = Math.abs(after.top1 - d.top0);
      rows.push({
        slug: p.slug, vp: v.name, scrollable: d.scrollable,
        top0: +d.top0.toFixed(2), top1: +after.top1.toFixed(2), diff: +diff.toFixed(2),
        pass: d.scrollable && diff === 0,
        parentIsBody: d.parentIsBody, ancestors: d.ancestors.join('|') || '없음',
        besta12: /besta12/i.test(d.barText), tel: /01[0-9]-/.test(d.barText),
        adCovered: after.adCovered, imgsNoAlt: d.imgsNoAlt, noindex: d.noindex,
        canonicalSelf: d.canonical.replace(/\?.*/, '') === `https://baeyong.pages.dev/night/${p.slug}/`,
        redirects, loadMs, h1: d.h1,
      });
      if (!d.scrollable) issues.push(`${p.slug}/${v.name}: 스크롤 없음`);
      if (diff !== 0) issues.push(`${p.slug}/${v.name}: 고정바 ${diff}px 이동`);
      if (d.ancestors.length) issues.push(`${p.slug}/${v.name}: 조상 ${d.ancestors.join(',')}`);
      if (after.adCovered) issues.push(`${p.slug}/${v.name}: 고정바가 .ad-inquiry 가림`);
      if (p.group === 'A' && /besta12/i.test(d.barText)) issues.push(`${p.slug}: A그룹 고정바 besta12`);
      if (p.group === 'B' && !/besta12/i.test(d.barText)) issues.push(`${p.slug}: B그룹 고정바 besta12 없음`);
      await ctx.close();
    }
  }
  await b.close();

  console.log(`=== 고정바 실측 (${LIVE ? '라이브' : '로컬'}) ${rows.length}행 ===`);
  for (const r of rows) console.log(
    `${r.pass ? 'PASS' : 'FAIL'} ${r.slug.padEnd(17)} ${r.vp.padEnd(18)} top0=${r.top0} top1=${r.top1} diff=${r.diff} body직계=${r.parentIsBody} 조상=${r.ancestors} 가림=${r.adCovered} ${r.loadMs}ms`);
  console.log(`\n문제 ${issues.length}건`);
  issues.forEach(i => console.log('  - ' + i));
  fs.writeFileSync(path.join(__dirname, '..', `night2-verify-${LIVE ? 'live' : 'local'}.json`), JSON.stringify({ rows, issues }, null, 1));
})();

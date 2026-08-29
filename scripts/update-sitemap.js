#!/usr/bin/env node
// 각 페이지 mtime을 읽어서 sitemap.xml의 lastmod를 자동 갱신.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITEMAP = path.join(ROOT, 'sitemap.xml');

// loc URL → 실제 파일 매핑
const URL_TO_FILE = {
  'https://b.nolcool.com/': 'index.html',
  'https://b.nolcool.com/area/first-time/': 'blog/first-time/index.html',
  'https://b.nolcool.com/area/weekend/': 'blog/weekend/index.html',
  'https://b.nolcool.com/area/over40/': 'blog/over40/index.html',
  'https://b.nolcool.com/area/couple/': 'blog/couple/index.html',
  'https://b.nolcool.com/area/alone/': 'blog/alone/index.html',
  'https://b.nolcool.com/area/summer/': 'blog/summer/index.html',
  'https://b.nolcool.com/event/': 'blog/event/index.html',
  'https://b.nolcool.com/area/vs/': 'blog/vs/index.html',
  'https://b.nolcool.com/area/food/': 'blog/food/index.html',
  'https://b.nolcool.com/area/safety/': 'blog/safety/index.html',
  'https://b.nolcool.com/guide/bulgwang-hobak-night/': 'bulgwang-hobak/index.html',
};

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

let xml = fs.readFileSync(SITEMAP, 'utf8');
let changes = 0;

for (const [url, file] of Object.entries(URL_TO_FILE)) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  const mtime = isoDate(fs.statSync(full).mtime);
  // url 블록 안의 lastmod 갱신
  const blockRe = new RegExp(`(<url>\\s*<loc>${url.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}</loc>\\s*<lastmod>)([^<]+)(</lastmod>)`);
  if (blockRe.test(xml)) {
    xml = xml.replace(blockRe, (_, p1, p2, p3) => {
      if (p2 !== mtime) changes++;
      return `${p1}${mtime}${p3}`;
    });
  }
}

fs.writeFileSync(SITEMAP, xml);
console.log(`sitemap.xml: ${changes} lastmod updated`);

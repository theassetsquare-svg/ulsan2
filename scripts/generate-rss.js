#!/usr/bin/env node
// 표준 RSS 2.0 생성. seo-config.js의 PAGES/SITE 사용, 각 item link는 절대 URL.
const fs = require('fs');
const path = require('path');
const { SITE, PAGES } = require('./seo-config.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'rss.xml');

function xmlEsc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function pubDate(dateStr) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00+09:00') : new Date();
  return d.toUTCString();
}

function urlFor(slug, cfg) {
  if (cfg.type === 'home') return SITE.baseUrl + '/';
  return `${SITE.baseUrl}/blog/${slug}/`;
}

const lastBuild = pubDate(SITE.modifiedDate);
const feedUrl = `${SITE.baseUrl}/rss.xml`;

// 홈은 채널 자체이므로 item에서 제외
const items = Object.entries(PAGES)
  .filter(([, cfg]) => cfg.type !== 'home')
  .map(([slug, cfg]) => {
    const link = urlFor(slug, cfg);
    const guid = link;
    const pub = pubDate(cfg.publishedAt || SITE.modifiedDate);
    const category = xmlEsc(cfg.section || '');
    return `    <item>
      <title>${xmlEsc(cfg.title)}</title>
      <link>${xmlEsc(link)}</link>
      <guid isPermaLink="true">${xmlEsc(guid)}</guid>
      <description>${xmlEsc(cfg.description)}</description>
      <category>${category}</category>
      <pubDate>${pub}</pubDate>
    </item>`;
  }).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEsc(SITE.siteName)}</title>
    <link>${xmlEsc(SITE.baseUrl + '/')}</link>
    <atom:link href="${xmlEsc(feedUrl)}" rel="self" type="application/rss+xml" />
    <description>${xmlEsc(PAGES.home ? PAGES.home.description : SITE.siteName)}</description>
    <language>ko</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>
`;

fs.writeFileSync(OUT, xml);
console.log(`rss.xml: ${Object.keys(PAGES).length - 1} item(s) written → ${path.relative(ROOT, OUT)}`);

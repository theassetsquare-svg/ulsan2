// 전 페이지 레지스트리 — 슬러그/가게이름/광고주/주제 단일 소스
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE = 'https://baeyong.pages.dev';

// ★ 광고주 정답표 (2026-08-20 확정) — 유일한 기준
const ADS = {
  '울산챔피언나이트': { nick: '춘자',   tel: '010-5653-0069' },
  '창원룰루랄라나이트': { nick: '로또',   tel: '010-7528-4936' },
  '불광동호박나이트': { nick: '손흥민', tel: '010-2221-1937' },
  '청담나이트':      { nick: '펩시맨', tel: '010-5655-4866' },
  '답십리미라클나이트': { nick: '유재석', tel: '010-8156-6558' },
};
// ★지역 키워드 페이지 → 연결된 광고주 (전화번호는 넣고, 타 가게이름은 넣지 않는다)
const AD_PAGES = {
  '/night/ulsan-night/':     '울산챔피언나이트',
  '/night/changwon-night/':  '창원룰루랄라나이트',
  '/night/eunpyeong-night/': '불광동호박나이트',
  '/night/gangnam-night/':   '청담나이트',
};

const CTA_NICK = '광고문의';
const CTA_KAKAO = '카카오톡 besta12';

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', '.git', 'tools', 'scripts', 'og', 'og-qa', 'og-images', 'skills'].includes(e.name) || e.name.startsWith('.')) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

// 페이지 고유 가게이름 (h1 기준, blog/bulgwang 는 고정)
function ownName(url, h) {
  if (url === '/') return null;
  if (url === '/qa/' || url === '/night/') return null;
  if (url.startsWith('/blog/')) return '울산챔피언나이트';
  if (url === '/bulgwang-hobak-guide/') return '불광동호박나이트';
  let h1 = ((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]*>/g, '').trim();
  const m = h1.match(/[가-힣A-Za-z0-9]*나이트(?:클럽)?/);
  return m ? m[0] : null;
}

function build() {
  const files = walk(ROOT).sort();
  const pages = files.map(f => {
    const rel = path.relative(ROOT, f);
    const url = '/' + rel.replace(/index\.html$/, '');
    const h = fs.readFileSync(f, 'utf8');
    const slug = url === '/' ? 'home' : url.replace(/^\/|\/$/g, '').replace(/\//g, '-');
    const store = ownName(url, h);
    const ad = (store && ADS[store]) || (AD_PAGES[url] && ADS[AD_PAGES[url]]) || null;
    const title = ((h.match(/<title>([^<]*)/) || [])[1] || '').trim();
    return { file: f, rel, url, absUrl: BASE + url, slug, store, ad,
             kind: url === '/' ? 'home' : (url === '/qa/' || url === '/night/') ? 'hub' : (ad ? 'A' : 'B'),
             title };
  });
  const names = [...new Set(pages.map(p => p.store).filter(Boolean))].sort((a, b) => b.length - a.length);
  return { pages, names, ADS, AD_PAGES, CTA_NICK, CTA_KAKAO, BASE, ROOT };
}
module.exports = { build, ADS, AD_PAGES, CTA_NICK, CTA_KAKAO, BASE, ROOT, walk };

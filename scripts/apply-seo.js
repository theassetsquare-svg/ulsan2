#!/usr/bin/env node
// seo-config.js를 읽어서 11페이지에 적용. 기존 본문 보존, 메타/헤더/FAQ/관련글만 교체.
const fs = require('fs');
const path = require('path');
const { SITE, PAGES } = require('./seo-config.js');

const ROOT = path.join(__dirname, '..');

const NAVER_CODE_NEW = '008f62b10b97d3f60b8493009bb7d50e10aea521';
const RSS_LINK_TAG = `<link rel="alternate" type="application/rss+xml" title="울산챔피언나이트 춘자 RSS" href="${'https://baeyong.pages.dev'}/rss.xml" />`;

function ensureNaverAndRss(html) {
  if (!html.includes(NAVER_CODE_NEW)) {
    html = html.replace(/(<meta\s+name="naver-site-verification"[^>]*>)/,
      `$1\n<meta name="naver-site-verification" content="${NAVER_CODE_NEW}" />`);
  }
  if (!html.includes('type="application/rss+xml"')) {
    html = html.replace(/(<link rel="icon"[^>]*>)/, `$1\n${RSS_LINK_TAG}`);
  }
  return html;
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function jsonEsc(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
function htmlAttrEsc(s) {
  return s.replace(/"/g, '&quot;');
}

function applyArticle(html, slug, cfg) {
  // cfg.url / cfg.ogImage 를 주면 /blog/<slug>/ 규칙을 벗어난 랜딩 페이지도 처리 가능
  const url = cfg.url || `${SITE.baseUrl}/blog/${slug}/`;
  const ogImage = cfg.ogImage || `${SITE.baseUrl}/og-images/${slug}.png`;

  // --- HEAD ---
  // <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(cfg.title)}</title>`);

  // meta description
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${htmlAttrEsc(cfg.description)}">`);

  // meta keywords
  html = html.replace(/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${htmlAttrEsc(cfg.keywords)}">`);

  // og:title
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${htmlAttrEsc(cfg.title)}">`);
  // og:description
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${htmlAttrEsc(cfg.description)}">`);
  // og:image:alt
  html = html.replace(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${htmlAttrEsc(cfg.ogImageAlt)}">`);
  // og:url
  html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);

  // article:section
  html = html.replace(/<meta property="article:section" content="[^"]*">/, `<meta property="article:section" content="${htmlAttrEsc(cfg.section)}">`);
  // article:modified_time
  html = html.replace(/<meta property="article:modified_time" content="[^"]*">/, `<meta property="article:modified_time" content="${SITE.modifiedDate}T00:00:00+09:00">`);
  // article:published_time
  if (cfg.publishedAt) {
    html = html.replace(/<meta property="article:published_time" content="[^"]*">/, `<meta property="article:published_time" content="${cfg.publishedAt}T00:00:00+09:00">`);
  }

  // twitter:title/description
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${htmlAttrEsc(cfg.title)}">`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${htmlAttrEsc(cfg.description)}">`);

  // canonical
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);

  // --- JSON-LD ---
  const faqLd = cfg.faq.map(([q, a]) => ({
    "@type": "Question",
    "name": q,
    "acceptedAnswer": { "@type": "Answer", "text": a }
  }));
  // cfg.ld 가 함수면 페이지 전용 스키마로 대체 (예: NightClub 랜딩)
  const ld = typeof cfg.ld === 'function' ? cfg.ld({ SITE, cfg, url, ogImage, faqLd }) : [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": cfg.title,
      "description": cfg.description,
      "image": { "@type": "ImageObject", "url": ogImage, "width": 1200, "height": 630 },
      "author": { "@type": "Organization", "name": SITE.siteName, "url": SITE.baseUrl },
      "publisher": { "@type": "Organization", "name": SITE.siteName, "logo": { "@type": "ImageObject", "url": `${SITE.baseUrl}/favicon.svg` } },
      "datePublished": cfg.publishedAt || SITE.modifiedDate,
      "dateModified": SITE.modifiedDate,
      "mainEntityOfPage": { "@type": "WebPage", "@id": url },
      "keywords": cfg.keywords,
      "inLanguage": "ko",
      "isPartOf": { "@type": "WebSite", "name": SITE.siteName, "url": SITE.baseUrl }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "울산챔피언나이트", "item": SITE.baseUrl },
        { "@type": "ListItem", "position": 2, "name": cfg.section, "item": url }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqLd
    }
  ];
  const ldStr = JSON.stringify(ld);
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${ldStr}\n</script>`);

  // --- BODY ---
  // 헤더 hd: h1 → div(브랜드)로 변경, 페이지별 다른 텍스트
  const newHd = `<div class="hd"><a href="/" class="site-brand">${esc(cfg.headerBrand)}</a><p>${esc(cfg.headerSub)}</p></div>`;
  html = html.replace(/<div class="hd">[\s\S]*?<\/div>/, newHd);

  // Skip link 추가 (이미 있으면 skip)
  if (!html.includes('class="skip-link"')) {
    html = html.replace(/(<body[^>]*>)/, `$1\n<a href="#post-main" class="skip-link">본문 바로가기</a>`);
  }
  // article-card에 id 추가
  html = html.replace(/<div class="article-card">\s*<h1 class="post-title"/,
    `<div class="article-card" id="post-main"><h1 class="post-title"`);

  // article-card h2 → h1 (실제 페이지의 H1이 되어야 함)
  html = html.replace(/<div class="article-card">\s*<h2>[^<]*<\/h2>/,
    `<div class="article-card">\n<h1 class="post-title">${esc(cfg.h1)}</h1>`);

  // meta date
  const dateMonth = cfg.publishedAt ? cfg.publishedAt.slice(0, 7).replace('-', '년 ') + '월' : '2026년 3월';
  html = html.replace(/<p class="meta">[^<]*<\/p>/,
    `<p class="meta">${dateMonth} · ${esc(cfg.section)}</p>`);

  // FAQ section (visible)
  const faqHtml = cfg.faq.map(([q, a]) =>
    `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n');
  html = html.replace(/<div class="faq-section">[\s\S]*?<\/div>/,
    `<div class="faq-section">\n<h3>자주 묻는 질문</h3>\n${faqHtml}\n</div>`);

  // Related posts
  const relHtml = cfg.related.map(([url, label]) =>
    `<a href="${url}" class="related-link">${esc(label)}</a>`).join('\n');
  html = html.replace(/<div class="related-posts">[\s\S]*?<\/div>/,
    `<div class="related-posts">\n<h3>관련 글 더 보기</h3>\n${relHtml}\n</div>`);

  // Footer (브랜드명 다양화)
  html = html.replace(/<footer>[\s\S]*?<\/footer>/,
    `<footer><p>광고문의 카카오톡 ${SITE.kakao}</p><p>&copy; 2026 ${esc(cfg.headerBrand)}</p></footer>`);

  // next-bar
  if (cfg.nextUrl && cfg.nextBarLabel) {
    html = html.replace(/<div class="next-bar"[^>]*>[\s\S]*?<\/div>/,
      `<div class="next-bar" id="nextBar">다음 글: <a href="${cfg.nextUrl}">${esc(cfg.nextBarLabel)}</a> <span class="countdown" id="cd">8</span>초 <span class="skip" id="skipNext">취소</span></div>`);
  }

  // achieve box
  // 주의: .achieve 안에 .emoji div가 중첩되어 있어 non-greedy `</div>`로 끊으면
  // 꼬리(<h3>..</h3><p>..</p></div>)가 본문에 그대로 남는다. 과거 실행에서 쌓인
  // 중복 꼬리까지 함께 흡수하도록 매칭.
  if (cfg.achieveTitle) {
    html = html.replace(/<div class="achieve" id="achieve">[\s\S]*?<\/div>(?:\s*<h3>[\s\S]*?<\/p>\s*<\/div>)*/,
      `<div class="achieve" id="achieve"><div class="emoji">${cfg.achieveEmoji}</div><h3>${esc(cfg.achieveTitle)}</h3><p>${esc(cfg.achieveBody)}</p></div>`);
  }

  // body data attrs
  if (cfg.nextUrl) {
    html = html.replace(/(<body\s+data-page-type="article"\s+data-page-slug="[^"]+"\s+data-next-url=")[^"]*"/,
      `$1${cfg.nextUrl}"`);
    if (cfg.nextTitle) {
      html = html.replace(/(data-next-title=")[^"]*"/, `$1${esc(cfg.nextTitle)}"`);
    }
  }

  // float-next link
  if (cfg.nextUrl) {
    html = html.replace(/<a href="[^"]*" class="float-next" id="floatNext">다음 글 →<\/a>/,
      `<a href="${cfg.nextUrl}" class="float-next" id="floatNext">다음 글 →</a>`);
  }

  return html;
}

function applyHome(html, cfg) {
  const url = SITE.baseUrl + '/';
  const ogImg = cfg.ogImage || SITE.ogDefault;

  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${ogImg}">`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${ogImg}">`);
  html = html.replace(/<link rel="image_src" href="[^"]*">/, `<link rel="image_src" href="${ogImg}">`);

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(cfg.title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${htmlAttrEsc(cfg.description)}">`);
  html = html.replace(/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${htmlAttrEsc(cfg.keywords)}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${htmlAttrEsc(cfg.title)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${htmlAttrEsc(cfg.description)}">`);
  html = html.replace(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${htmlAttrEsc(cfg.ogImageAlt)}">`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${htmlAttrEsc(cfg.title)}">`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${htmlAttrEsc(cfg.description)}">`);

  // JSON-LD home
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "NightClub",
      "name": SITE.siteName,
      "alternateName": "울산챔피언나이트",
      "description": cfg.description,
      "url": SITE.baseUrl,
      "telephone": SITE.phone,
      "address": { "@type": "PostalAddress", "addressLocality": "울산", "addressRegion": "울산광역시", "addressCountry": "KR" },
      "image": { "@type": "ImageObject", "url": cfg.ogImage, "width": 1200, "height": 630, "caption": cfg.ogImageAlt },
      "sameAs": ["https://bamkey.com"]
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": SITE.siteName,
      "alternateName": ["울산챔피언나이트", "챔피언나이트", "울산 나이트클럽"],
      "url": SITE.baseUrl,
      "description": cfg.description,
      "inLanguage": "ko",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": `${SITE.baseUrl}/?q={search_term_string}` },
        "query-input": "required name=search_term_string"
      },
      "publisher": { "@type": "Organization", "name": SITE.siteName }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "울산챔피언나이트", "item": SITE.baseUrl }]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "울산챔피언나이트는 어디에 있나요?", "acceptedAnswer": { "@type": "Answer", "text": "울산광역시에 위치한 대표 나이트클럽입니다. 정확한 위치 안내는 010-5653-0069로 문의하세요." } },
        { "@type": "Question", "name": "영업시간은 어떻게 되나요?", "acceptedAnswer": { "@type": "Answer", "text": "주말 기준 밤 10시부터 새벽까지 운영됩니다. 시즌별로 변동 가능하니 전화 확인 권장." } },
        { "@type": "Question", "name": "예약은 어떻게 하나요?", "acceptedAnswer": { "@type": "Answer", "text": "전화(010-5653-0069) 또는 카카오톡(besta12)으로 예약 가능합니다." } },
        { "@type": "Question", "name": "춘자가 누구인가요?", "acceptedAnswer": { "@type": "Answer", "text": "춘자는 대표 안내 담당자입니다. 전화 문의 시 춘자를 찾으시면 빠른 안내를 받을 수 있습니다." } }
      ]
    }
  ];
  const ldStr = JSON.stringify(ld);
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${ldStr}\n</script>`);

  // header hd 유지 (홈에서는 브랜드를 H1로)
  const newHd = `<div class="hd">\n<h1>${esc(cfg.h1)}</h1>\n<p>${esc(cfg.headerSub)}</p>\n</div>`;
  html = html.replace(/<div class="hd">[\s\S]*?<\/div>/, newHd);

  if (!html.includes('class="skip-link"')) {
    html = html.replace(/(<body[^>]*>)/, `$1\n<a href="#home-main" class="skip-link">본문 바로가기</a>`);
  }
  html = html.replace(/<div class="wrap">/, `<div class="wrap" id="home-main">`);

  // hero h2 hook 유지
  html = html.replace(/<div class="hero">\s*<h2>[\s\S]*?<\/h2>\s*<\/div>/,
    `<div class="hero">\n<h2>${cfg.hookH2}</h2>\n</div>`);

  // footer
  html = html.replace(/<footer>[\s\S]*?<\/footer>/,
    `<footer><p>광고문의 카카오톡 ${SITE.kakao}</p><p>&copy; 2026 ${esc(cfg.footerBrand)}</p></footer>`);

  return html;
}

let touched = 0;
for (const [slug, cfg] of Object.entries(PAGES)) {
  // 홈(/)은 독립 성공스토리 단독 페이지 — SEO 일괄 적용 대상에서 제외.
  if (cfg.type === 'home') { console.log('SKIP (독립 홈): ' + cfg.path); continue; }
  const filePath = path.join(ROOT, cfg.path);
  if (!fs.existsSync(filePath)) {
    console.error(`SKIP (missing): ${cfg.path}`);
    continue;
  }
  let html = fs.readFileSync(filePath, 'utf8');
  const before = html;
  html = cfg.type === 'home' ? applyHome(html, cfg) : applyArticle(html, slug, cfg);
  html = ensureNaverAndRss(html);
  if (html !== before) {
    fs.writeFileSync(filePath, html);
    touched++;
    console.log(`✓ ${cfg.path}`);
  } else {
    console.log(`= ${cfg.path} (no change)`);
  }
}
console.log(`\n${touched} file(s) updated`);

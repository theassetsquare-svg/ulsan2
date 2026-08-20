// 라이브 실측: /og/*.png HTTP 200 + image/png + 1200x1200, 대표 페이지 HTML 반영 확인
'use strict';
const fs = require('fs'), path = require('path'), https = require('https');
const { build, BASE, ROOT } = require('./pages.js');

function head(url) {
  return new Promise(res => {
    const req = https.request(url, { method: 'GET', headers: { 'user-agent': 'ulsang-verify/1.0' } }, r => {
      const chunks = []; let n = 0;
      r.on('data', c => { chunks.push(c); n += c.length; });
      r.on('end', () => res({ status: r.statusCode, type: r.headers['content-type'], len: n, body: Buffer.concat(chunks) }));
    });
    req.on('error', e => res({ status: 0, err: e.message }));
    req.setTimeout(25000, () => { req.destroy(); res({ status: 0, err: 'timeout' }); });
    req.end();
  });
}
const dim = b => (b.length > 24 && b.slice(1, 4).toString() === 'PNG')
  ? `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}` : '?';

(async () => {
  const { pages } = build();
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'og/manifest.json'), 'utf8'));
  const out = { images: [], htmls: [], fail: [] };

  for (let i = 0; i < manifest.length; i += 8) {
    const batch = manifest.slice(i, i + 8);
    const rs = await Promise.all(batch.map(m => head(BASE + m.file)));
    rs.forEach((r, k) => {
      const m = batch[k];
      const d = r.body ? dim(r.body) : '-';
      const ok = r.status === 200 && /image\/png/.test(r.type || '') && d === '1200x1200';
      out.images.push({ file: m.file, status: r.status, type: r.type, dim: d, kb: +(r.len / 1024).toFixed(1), ok });
      if (!ok) out.fail.push(`IMG ${m.file} status=${r.status} type=${r.type} dim=${d}`);
    });
    process.stdout.write(`\r이미지 ${Math.min(i + 8, manifest.length)}/${manifest.length}`);
  }
  console.log('');

  for (const p of pages) {
    const r = await head(p.absUrl);
    const h = r.body ? r.body.toString('utf8') : '';
    const want = p.kind === 'home' ? '/og/home.png' : `/og/${p.slug}.png`;
    const chk = {
      url: p.url, status: r.status,
      ogImage: h.includes(`<meta property="og:image" content="${BASE}${want}">`),
      bodyImg: p.kind === 'home' ? !/<img\b/i.test(h.slice(h.search(/<body/i))) : h.includes(`<img src="${want}"`),
      homeLink: !/<a\b[^>]*href="(\/|\.\/|\/index\.html)"/.test(h),
    };
    chk.ok = r.status === 200 && chk.ogImage && chk.bodyImg && chk.homeLink;
    out.htmls.push(chk);
    if (!chk.ok) out.fail.push(`HTML ${p.url} ${JSON.stringify(chk)}`);
    process.stdout.write(`\rHTML ${out.htmls.length}/${pages.length}`);
  }
  console.log('');
  fs.writeFileSync(path.join(ROOT, 'live-report.json'), JSON.stringify(out, null, 1));
  console.log(`이미지 ${out.images.filter(x => x.ok).length}/${out.images.length} OK · HTML ${out.htmls.filter(x => x.ok).length}/${out.htmls.length} OK · 실패 ${out.fail.length}`);
  out.fail.slice(0, 30).forEach(f => console.log('  ✗ ' + f));
})();

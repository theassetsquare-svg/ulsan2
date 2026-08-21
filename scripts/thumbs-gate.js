// 게이트 G9+ : 썸네일 노출 조건 6항목. 하나라도 FAIL 이면 exit 1 (배포 금지)
'use strict';
const fs = require('fs'); const path = require('path'); const sharp = require('sharp');
const ROOT = path.join(__dirname, '..'); const BASE = 'https://baeyong.pages.dev';
function walk(d, o = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['node_modules','.git'].includes(e.name)||e.name.startsWith('.')) continue; const p=path.join(d,e.name); if(e.isDirectory())walk(p,o); else if(e.name==='index.html')o.push(p);} return o; }
const g = (h,n)=>{const m=h.match(new RegExp(`<meta\\s+[^>]*(?:name|property)=["']${n}["'][^>]*content=["']([^"']*)["']`,'i'));return m?m[1]:null;};
const cnt = (h,n)=>(h.match(new RegExp(`(?:name|property)=["']${n}["']`,'gi'))||[]).length;

(async () => {
  const rows = []; const fails = [];
  for (const f of walk(ROOT).sort()) {
    const h = fs.readFileSync(f, 'utf8');
    const slug = '/' + path.relative(ROOT, f).replace(/index\.html$/, '');
    const og = g(h,'og:image') || '';
    const rel = og.replace(/^https?:\/\/[^/]+/, '');
    const body = h.slice(h.search(/<body[^>]*>/i));
    const im = body.match(new RegExp(`<img[^>]*src=["']([^"']*${rel.split('/').pop().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})["'][^>]*>`,'i'));
    const imgSrc = im ? im[1] : null;
    const alt = g(h,'og:image:alt') || '';
    const title = (h.match(/<title>([^<]+)<\/title>/)||[])[1]||'';
    const brands = [...new Set([...title.matchAll(/[가-힣A-Za-z]*나이트/g)].map(m=>m[0]))];

    const abs = path.join(ROOT, rel);
    let w=0,ht=0,kb=0;
    if (fs.existsSync(abs)) { const m = await sharp(abs).metadata(); w=m.width; ht=m.height; kb=+(fs.statSync(abs).size/1024).toFixed(1); }

    const c = {
      '①본문img': !!imgSrc,
      '②og=본문동일': !!imgSrc && imgSrc.replace(/^https?:\/\/[^/]+/,'') === rel,
      '③메타9종': og.startsWith('http') && cnt(h,'og:image:secure_url')===1 && g(h,'og:image:width')==='1200'
                 && g(h,'og:image:height')==='1200' && g(h,'og:image:type')==='image/png' && !!alt
                 && g(h,'twitter:card')==='summary' && cnt(h,'twitter:image')===1 && cnt(h,'thumbnail')===1,
      '④1200x1200': w===1200 && ht===1200,
      '⑤300KB이하': kb>0 && kb<=300,
      '⑥alt업소명': brands.length===0 ? 'N/A' : brands.some(b=>alt.includes(b)),
    };
    const bad = Object.entries(c).filter(([k,v])=>v===false).map(([k])=>k);
    if (bad.length) fails.push({slug, bad});
    rows.push({slug, thumb: rel, kb, dim:`${w}x${ht}`, imgSrc, alt, c, ok: bad.length===0});
  }
  fs.writeFileSync(path.join(ROOT,'thumbs-gate.json'), JSON.stringify(rows,null,1));
  console.log(`=== 게이트 G9+ · 페이지 ${rows.length}개 ===`);
  for (const k of ['①본문img','②og=본문동일','③메타9종','④1200x1200','⑤300KB이하','⑥alt업소명']) {
    const pass = rows.filter(r=>r.c[k]===true).length, na = rows.filter(r=>r.c[k]==='N/A').length;
    console.log(`  ${k.padEnd(12)} PASS ${pass}/${rows.length}${na?`  (N/A ${na})`:''}${pass+na<rows.length?'  ❌':'  ✅'}`);
  }
  if (fails.length) { console.error('\n❌ FAIL:'); fails.forEach(f=>console.error('  ',f.slug,f.bad.join(','))); process.exit(1); }
  console.log('\n✅ 게이트 G9+ 전항목 PASS — 배포 가능');
})();

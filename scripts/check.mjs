import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
async function walk(dir) { const entries=await readdir(dir,{withFileTypes:true}); return (await Promise.all(entries.map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat(); }
const files=await walk(root);
const pages=files.filter(f=>f.endsWith('.html'));
let checkedLinks=0;
for(const filename of pages) {
  const html=await readFile(filename,'utf8');
  assert.match(html,/<html lang="zh-CN">/,`Page language: ${filename}`);
  assert.match(html,/<h1[ >]/,`Page heading: ${filename}`);
  assert.match(html,/<title>[^<]+<\/title>/,`Page title: ${filename}`);
  assert.ok(!/bwl@example\.com|codex-preview|href="#"/.test(html),`Unfinished content: ${filename}`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,`Duplicate IDs: ${filename}`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const href=match[1];
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const pathname=decodeURIComponent(href.split(/[?#]/)[0]);
    let target=path.join(root,pathname);
    if(pathname.endsWith('/')) target=path.join(target,'index.html');
    const info=await stat(target).catch(()=>null);
    assert.ok(info?.isFile(),`Missing local target ${href} in ${path.relative(root,filename)}`);
    checkedLinks++;
  }
}
const content=JSON.parse(await readFile('content.json','utf8'));
const index=JSON.parse(await readFile('dist/search.json','utf8'));
const config=JSON.parse(await readFile('site.config.json','utf8'));
const packageInfo=JSON.parse(await readFile('package.json','utf8'));
assert.equal(config.version,packageInfo.version,'Software version matches site configuration');
assert.equal((await readFile('VERSION','utf8')).trim(),config.versionLabel,'Release version label');
assert.equal(index.length,content.length,'All articles searchable');
for(const post of content) {
  const html=await readFile(path.join(root,post.slug,'index.html'),'utf8');
  assert.ok(html.includes(post.body),`Original article body changed: ${post.slug}`);
  assert.ok(html.includes(config.versionLabel),`Visible version: ${post.slug}`);
  if(post.source_sha) assert.equal(index.find(p=>p.slug===post.slug)?.source_sha,post.source_sha,'Source provenance');
  if(post.showCover) {
    assert.ok(html.includes('class="article-cover"'),'Article cover renders');
    assert.ok(html.includes(`property="og:image" content="${config.origin}${post.image}"`),'Article share image');
  }
  for(const c of post.categories) assert.ok(files.includes(path.join(root,'categories',c,'index.html')),`Category route: ${c}`);
  for(const t of post.tags) assert.ok(files.includes(path.join(root,'tags',t,'index.html')),`Tag route: ${t}`);
}
assert.ok(!files.some(f=>f.endsWith('.md')),'Markdown records are not in the generated website');
console.log(`PASS: ${pages.length} pages, ${checkedLinks} local links/assets, ${content.length} articles (${content.filter(p=>p.source_sha).length} original bodies), version ${config.versionLabel}, all category/tag routes.`);

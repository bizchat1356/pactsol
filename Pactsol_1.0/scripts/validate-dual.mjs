import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
const origins = { [process.env.PUBLIC_PORTAL_ORIGIN]: 'dist-portal', [process.env.PUBLIC_SOFTWARE_ORIGIN]: 'dist-software' };
async function files(dir) { const result=[]; for(const f of await readdir(dir)){const p=`${dir}/${f}`; if((await stat(p)).isDirectory())result.push(...await files(p));else result.push(p);}return result; }
let checks=0;
for(const [origin,dir] of Object.entries(origins)) {
 assert(origin && origin !== 'undefined', 'Set both PUBLIC_*_ORIGIN variables');
 const config=JSON.parse(await readFile(`deploy/wrangler.${dir==='dist-portal'?'portal':'software'}.jsonc`,'utf8'));
 assert(!config.d1_databases && !config.services && !config.routes,'Website workers must not bind backend services or existing routes');
 for(const f of (await files(dir)).filter(f=>f.endsWith('.html'))) {
  const html=await readFile(f,'utf8');
  assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,`${f}: one H1`);
  for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
   if(/^(mailto:|tel:|data:|#)/.test(raw))continue;
   const url=new URL(raw,origin);
   if(!origins[url.origin])continue;
   const root=origins[url.origin]; const path=decodeURIComponent(url.pathname);
   const target=resolve(root,'.'+path+(path.endsWith('/')?'index.html':''));
   let actual=target;
   try { if((await stat(actual)).isDirectory())actual+='/index.html'; } catch { if(path==='/')continue; try{actual=target+'/index.html';await stat(actual);}catch{throw new Error(`${f}: broken ${raw}`);} }
   if(url.hash && actual.endsWith('.html'))assert((await readFile(actual,'utf8')).includes(`id="${url.hash.slice(1)}"`),`${f}: missing anchor ${raw}`);
   checks++;
  }
 }
 const headers=await readFile(`${dir}/_headers`,'utf8');
 assert(headers.includes('frame-src https://tally.so'));
 assert(headers.includes('X-Robots-Tag: noindex, nofollow'));
}
for(const [page,id] of [['request-quote','lb2Mko'],['supplier-registration','PdQrdB']])assert((await readFile(`dist-portal/${page}/index.html`,'utf8')).includes(`https://tally.so/embed/${id}`));
assert(!(await files('dist-software')).some(p=>/request-quote|supplier-registration/.test(p)));
assert((await readFile('dist-software/software/index.html','utf8')).includes('mailto:hello@pactsol.in?subject=Software'));
console.log(`PASS: ${checks} local links/assets, page headings, original Tally IDs, consultancy separation, no backend bindings and preview indexing controls.`);

for (const name of ['PUBLIC_PORTAL_ORIGIN', 'PUBLIC_SOFTWARE_ORIGIN']) {
 const value = process.env[name];
 if (!value || !/^https?:\/\//.test(value)) throw new Error(`Set ${name} to the corresponding preview origin before building.`);
 const url = new URL(value);
 if(url.pathname !== '/' || url.search || url.hash) throw new Error(`${name} must be an origin without a path, query or fragment.`);
}
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
const shared = ['_astro','images','scripts','favicon.svg','favicon.ico','_headers','privacy','terms','404.html'];
for (const kind of ['portal','software']) {
 const out = `dist-${kind}`; await rm(out,{recursive:true,force:true}); await mkdir(out,{recursive:true});
 for (const entry of shared) { await cp(`dist-dual/${entry}`,`${out}/${entry}`,{recursive:true}); }
 const pages = kind === 'portal' ? ['index.html','sourcing','request-quote','supplier-registration','software'] : ['software'];
 for (const entry of pages) await cp(`dist-dual/${entry}`,`${out}/${entry}`,{recursive:true});
 if(kind==='software') await writeFile(`${out}/_redirects`,'/ /software/ 302\n');
 // Development deployments are intentionally excluded from indexing.
 await writeFile(`${out}/robots.txt`,'User-agent: *\nDisallow: /\n');
 const {appendFile}=await import('node:fs/promises'); await appendFile(`${out}/_headers`,'  X-Robots-Tag: noindex, nofollow\n');
}

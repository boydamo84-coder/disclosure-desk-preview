'use strict';
// Entire allowlisted public bundle: static links, local anchors, titles, basic
// accessibility structure, GA consent coverage and private research separation.
// No live requests, database access, deployment or Netlify API needed.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT='.release-staging/public-site';
assert(fs.existsSync(path.join(ROOT,'release-manifest.json')),'Run node scripts/build_public_release.cjs first');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'release-manifest.json'),'utf8'));
const htmls=manifest.files.filter(x=>x.path.endsWith('.html')).map(x=>x.path);
const primary=new Set(['index.html','guide.html','sources.html','community-rules.html','privacy.html','research-edition.html']);
const allowVirtual=new Set(['home','login','logout','signup','account','profile']);
let errors=0,warnings=0,links=0;
const report=[];
for(const file of htmls){
 const contents=fs.readFileSync(path.join(ROOT,file),'utf8');
 // Inline JS can contain example / template <a href="'+escape(value)+'"> HTML.
 // Scan actual markup only; dynamic destinations are covered by browser tests.
 const markup=contents.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
                      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
 const problems=[],notes=[],found=[...markup.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)];
 for(const match of found){
  const raw=match[2].replace(/&amp;/gi,'&').trim();
  if(!raw||raw.includes('$'+'{')||raw.includes('{{'))continue;
  links++;
  if(raw==='#'){notes.push('Placeholder href="#"');continue}
  // Writer-only links are explicitly CSS-hidden in Research Edition; retain
  // their DOM IDs for backward-compatible handlers, but never claim routes work.
  if(file==='research/wne.html'&&(raw==='/reader'||raw==='/remote')){
   const marker=raw==='/reader'?'#wne-writer-reader':'a[href="/remote"]';
   if(!contents.includes(marker))problems.push('Legacy link not demonstrably hidden '+raw);
   else notes.push('Hidden legacy Writer-only link remains in source '+raw);
   continue;
  }
  if(/^javascript:/i.test(raw)){problems.push('JavaScript link '+raw.slice(0,80));continue}
  if(/^(?:mailto:|tel:|blob:|data:)/i.test(raw))continue;
  let target;
  try{target=new URL(raw,'https://uapdisclosuredesk.com/'+file)}
  catch{notes.push('Invalid href '+raw.slice(0,80));continue}
  if(target.origin!=='https://uapdisclosuredesk.com')continue;
  let local;
  try{local=decodeURIComponent(target.pathname).replace(/^\/+/,'')}catch{notes.push('Malformed local href '+raw.slice(0,80));continue}
  if(!local||local.endsWith('/'))local+='index.html';
  if(allowVirtual.has(local)||local.startsWith('api/'))continue;
  const checked=path.resolve(ROOT,local);
  if(!checked.startsWith(path.resolve(ROOT)+path.sep)){problems.push('Escaping href '+raw.slice(0,80));continue}
  if(!fs.existsSync(checked)){problems.push('Missing local target '+raw.slice(0,100));continue}
  if(target.hash&&/^#[\w-]+$/.test(target.hash)){
   const other=fs.readFileSync(checked,'utf8');
   if(!new RegExp('(?:\\bid\\s*=\\s*["\\x27])'+target.hash.slice(1)+'(?:["\\x27])','i').test(other))
    notes.push('Missing local anchor '+raw.slice(0,100));
  }
 }
 if(primary.has(file)){
  if(!/<title>[^<]{10,}/i.test(contents))problems.push('Missing useful title');
  if(!/<meta\s+name="description"\s+content="[^"]{40,}"/i.test(contents))problems.push('Missing SEO description');
  if(!contents.includes('analytics-consent.js'))problems.push('Missing optional analytics consent module');
  if(/<script[^>]+src=["'][^"']*googletagmanager\.com/i.test(contents))problems.push('Direct analytics tag without opt-in');
 }
 if(file.startsWith('research/')&&contents.includes('analytics-consent.js'))
  problems.push('Private Research page contains Analytics tag');
 const uniqueProblems=[...new Set(problems)],uniqueNotes=[...new Set(notes)];
 errors+=uniqueProblems.length;warnings+=uniqueNotes.length;
 report.push({file,links:found.length,errors:uniqueProblems,warnings:uniqueNotes});
 console.log('AUDIT PAGE '+file+': '+found.length+' links, '+uniqueProblems.length+' errors, '+uniqueNotes.length+' warnings');
 for(const p of uniqueProblems)console.log('  ERROR '+p);
 for(const p of uniqueNotes.slice(0,12))console.log('  WARN '+p);
}
console.log('AUDIT TOTAL '+htmls.length+' pages, '+links+' static hrefs, '+errors+' errors, '+warnings+' warnings');
if(errors)process.exitCode=1;

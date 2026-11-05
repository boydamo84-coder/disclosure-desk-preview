'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.release-staging','public-site');
if(fs.existsSync(out))throw Error('Refuse to overwrite existing build output');
cp.execFileSync(process.execPath,['scripts/build_public_release.cjs'],{cwd:root,stdio:'inherit'});
const m=JSON.parse(fs.readFileSync(path.join(out,'release-manifest.json'),'utf8'));
const paths=m.files.map(f=>f.path),names=new Set(paths);
assert.equal(names.size,paths.length);
assert.ok(paths.length>=35&&paths.length<=80,'Unexpected package count '+paths.length);
for(const f of m.files){
 const bytes=fs.readFileSync(path.join(out,f.path));
 assert.equal(bytes.length,f.bytes,f.path);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256,f.path);
 assert.doesNotMatch(f.path,/(^|\/)(?:scripts|supabase|finance_local|finance-review|finance|android-test|docs|\.github)(\/|$)|\.(?:zip|sql|py|md|env)$/i);
}
for(const f of ['index.html','sources.html','research/wne.html','research/index.html',
 'research/research-site-nav.js','assets/community-test-config.js','assets/profile-private-chat.js',
 'assets/community-discussions.js','data/approved-live-events.json','data/historical-news-archive.json'])
 assert.ok(names.has(f),'Required site dependency missing: '+f);
for(const f of ['MASTER_HANDOVER.md','finance_local/vault.py','supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql',
 'data/gep-2026-09-preflight-summary.json','data/news-feed-health.json','data/modern-official-uap-seed.json'])
 assert.ok(!names.has(f),'Internal file leaked: '+f);
assert.equal(m.totalBytes,m.files.reduce((n,f)=>n+f.bytes,0));
const pages=fs.readFileSync(path.join(root,'.github/workflows/pages.yml'),'utf8');
assert.match(pages,/path: \.release-staging\/public-site/);
assert.doesNotMatch(pages,/path: \.\s*(?:\n|$)/);
// Check actual HTML static paths and literal JSON dependencies. The previous
// hash/allowlist test did not detect accidentally omitted relative scripts.
function assetPath(file,target){
 const url=target.split(/[?#]/)[0].trim();
 if(!url||/^(?:https?:)?\/\//i.test(url)||url.startsWith('data:')||
   url.startsWith('mailto:')||url.startsWith('#')||
   !/\.(?:html?|js|css|svg|json|webmanifest|png|ico|txt|xml)$/i.test(url))
  return null;
 return url.startsWith('/')?url.slice(1):
  path.posix.normalize(path.posix.join(path.posix.dirname(file),url));
}
let dependencyCount=0;
for(const file of paths.filter(p=>p.endsWith('.html'))){
 const html=fs.readFileSync(path.join(out,file),'utf8');
 // Inline code may contain CSS selectors like a[href="./old-page.html"].
 // Those are NOT navigational HTML references and must not fail publication.
 const markup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
                  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
 for(const m of markup.matchAll(/<(?:a|img|iframe|script|link|source)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"'<>]+)["'][^>]*>/gi)){
  const rel=assetPath(file,m[1]);if(!rel)continue;
  assert.ok(names.has(rel),'Public page references omitted file '+file+' => '+m[1]+' => '+rel);
  dependencyCount++;
 }
}
for(const file of ['index.html','assets/live-hearings.js','assets/live-schedule.js']){
 const text=fs.readFileSync(path.join(out,file),'utf8');
 for(const m of text.matchAll(/fetch\(\s*['"](data\/[^'"?]+\.json)['"]/g)){
  assert.ok(names.has(m[1]),'Public JS fetch references omitted file '+file+' => '+m[1]);
  dependencyCount++;
 }
}
console.log('PASS '+dependencyCount+' actual HTML/static JSON references are in public-only bundle');
console.log('PASS release packaging: '+m.files.length+' files; internal finance/SQL/QA excluded; root Pages upload disabled');

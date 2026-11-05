'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),DIST=path.join(ROOT,'dist-public-site');
assert.ok(fs.statSync(DIST).isDirectory(),'Run build-public-release before testing');
function walk(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const abs=path.join(dir,entry.name);
  if(entry.isSymbolicLink())throw Error('Symlink disallowed in public release: '+abs);
  return entry.isDirectory()?walk(abs):[path.relative(DIST,abs).split(path.sep).join('/')];
 });
}
const publicFiles=walk(DIST).sort();
const {inventory}=require('./build-public-release.cjs');
assert.deepEqual(publicFiles,[...inventory].sort(),'ONLY the hard-coded public allowlist may ship');
const bans=[
 /^\.github\//,/^docs\//,/^finance/i,/^supabase\//,/^scripts\//,
 /^tests\//,/^android-test\//,/^MASTER_HANDOVER\.md$/i,
 /^PROJECT_/i,/^DEVELOPMENT_HANDOVER/i,/^FEATURE_REGISTRY/i,
 /(?:^|\/)\.env(?:\.|$)/i,/(?:^|\/)private[-_ ]?key/i,
 /(?:^|\/)(?:backup|dump)[-_](?:private|production)/i
];
for(const filename of publicFiles)for(const regex of bans){
 assert.ok(!regex.test(filename),'Private/internal file escaped: '+filename);
}
function has(p){return fs.existsSync(path.join(DIST,p))}
for(const rel of [
 'index.html','sources.html','community-rules.html','privacy.html',
 'assets/community-test-config.js','assets/live-chat.js','assets/live-hearings.js',
 'assets/live-schedule.js','assets/community-discussions.js','assets/profile-private-chat.js',
 'research/wne.html','research/index.html','research/research-site-nav.js',
 'research/data/curated-public-cases.json','data/approved-live-events.json',
 'data/historical-news-archive.json','data/disclosure-clips.json','data/disclosure-map.json'
])assert.ok(has(rel),'Required customer-facing asset missing '+rel);
for(const forbidden of [
 'finance_local','finance-review','supabase','scripts','docs','.github','tests',
 'android-test','data/gep-2026-09-preflight-summary.json',
 'data/modern-official-uap-seed.json','data/international-source-registry.json',
 'MASTER_HANDOVER.md','RELEASE_READINESS.md'
])assert.ok(!has(forbidden),'Internal artifact copied: '+forbidden);
function isLocalStatic(candidate){
 if(/^(https?:)?\/\//i.test(candidate)||candidate.startsWith('data:')||
  candidate.startsWith('mailto:')||candidate.startsWith('#'))return null;
 candidate=candidate.split(/[?#]/)[0].trim();
 if(!candidate||!/\.(?:html?|js|css|svg|json|webmanifest|png|ico|txt|xml)$/i.test(candidate))return null;
 return candidate;
}
let refs=0;
for(const filename of publicFiles.filter(f=>f.endsWith('.html'))){
 const html=fs.readFileSync(path.join(DIST,filename),'utf8');
 const dir=path.posix.dirname(filename);
 // HTML src/href paths include the actual W.NE iframe dependencies. Inline
 // application API routes such as /api/library are not static assets.
 for(const m of html.matchAll(/(?:src|href)\s*=\s*["']([^"'<>]+)["']/gi)){
  const target=isLocalStatic(m[1]);if(!target)continue;
  const rel=target.startsWith('/')?target.slice(1):path.posix.normalize(path.posix.join(dir,target));
  assert.ok(has(rel),filename+' references excluded or missing public asset: '+m[1]+' => '+rel);
  refs++;
 }
}
const main=fs.readFileSync(path.join(DIST,'index.html'),'utf8');
for(const match of main.matchAll(/(?:fetch\()\s*['"](data\/[^'"]+\.json)['"]/g)){
 assert.ok(has(match[1]),'Main site fetch references missing data: '+match[1]);
 refs++;
}
const config=fs.readFileSync(path.join(DIST,'assets/community-test-config.js'),'utf8');
assert.match(config,/privateChat:false/);
assert.match(config,/discussions:false/);
assert.match(config,/researchPublishing:false/);
const count=publicFiles.length;
assert.ok(count>=50&&count<=65,'Unexpected public bundle file count '+count);
const allSource=publicFiles.filter(f=>/\.(?:html?|js|css|json)$/i.test(f))
 .map(f=>fs.readFileSync(path.join(DIST,f),'utf8'));
for(const body of allSource){
 assert.doesNotMatch(body,/\bsb_secret_[A-Za-z0-9_-]{10,}/,
  'Secret Supabase API key present in public release');
 assert.doesNotMatch(body,/\bSUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["'][^"']{10,}/i,
  'Service role key present in public release');
}
console.log('PASS public bundle: '+count+' allowlisted files, '+refs+
 ' HTML/runtime static references resolved, private/Finance/SQL review sources absent, feature gates OFF.');

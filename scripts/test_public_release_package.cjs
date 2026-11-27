'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.release-staging','public-site');
if(!fs.existsSync(out))cp.execFileSync(process.execPath,['scripts/build_public_release.cjs'],{cwd:root,stdio:'inherit'});
else console.log('Verifying existing immutable public staging from Android snapshot build; no overwrite');
const m=JSON.parse(fs.readFileSync(path.join(out,'release-manifest.json'),'utf8'));
const paths=m.files.map(f=>f.path),names=new Set(paths);
assert.equal(names.size,paths.length);
const themeHtml=fs.readFileSync(path.join(out,'index.html'),'utf8');
const themeEnabled=themeHtml.includes('id="ddHomeThemeHero" data-media-ready="true"');
const themeAssets=['nightfall','eclipse'].flatMap(n=>['mp4','jpg'].map(e=>'data/'+n+'.'+e));
assert.deepEqual(paths.filter(p=>themeAssets.includes(p)).sort(),themeEnabled?themeAssets.sort():[],'Theme assets must match the explicit activation gate');
assert.ok(!names.has('data/orbital.mp4')&&!names.has('data/orbital.jpg'),'Uncleared Orbital must not ship');
assert.ok(paths.length>=35&&paths.length<=(process.env.CONTEXT==='production'?140:141)+(themeEnabled?4:0),'Unexpected package count '+paths.length);
for(const f of m.files){
 const bytes=fs.readFileSync(path.join(out,f.path));
 assert.equal(bytes.length,f.bytes,f.path);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256,f.path);
 assert.doesNotMatch(f.path,/(^|\/)(?:scripts|supabase|finance_local|finance-review|finance|android-test|docs|\.github)(\/|$)|\.(?:zip|sql|py|md|env)$/i);
}
for(const f of ['index.html','guide.html','sources.html','investigations.html','research-collaborations.html','pursue.html','foia-tracker.html','data/pursue-index.json','data/foia/27-f-0917-decision-extract.pdf','data/foia/27-f-0917-referral-extracts.pdf','rendlesham-forest-1980.html','roswell-1947.html','who-is-who.html','terms.html','research/wne.html','research/index.html',
 'research/research-site-nav.js','research/google-drive.js','research/google-drive-config.js',
 'research/vendor-jszip-3.10.1.js','research/vendor-docx-9.5.1.js','research/vendor-dompurify-3.4.17.js','research/vendor-mammoth-1.12.3.js','research/docx-import-worker.js',
 'assets/community-polish.css','assets/media-submissions.js','assets/community-test-config.js','assets/profile-private-chat.js',
 'assets/community-discussions.js','assets/page-help.js','assets/evidence-dna.js','assets/person-case-links.js','assets/people-directory.js','data/public-people-directory.json','data/evidence-dna-claim-drafts.json','data/public-person-case-links.json','data/approved-live-events.json','data/historical-news-archive.json'])
 assert.ok(names.has(f),'Required site dependency missing: '+f);
// R3 public route is an explicit, allowlisted browser interface, never a
// server-side engine, SQL schema, private profile, file export or account data.
for(const f of ['research/r3-lab/index.html','research/r3-lab/hypothesis-ui.js',
 'research/r3-lab/hypothesis-cloud.js','research/r3-lab/hypothesis-vault.js',
 'research/r3-lab/curated-public-cases.js','research/r3-lab/hypothesis-hosted.css'])
 assert.ok(names.has(f),'Hosted R3 reviewed dependency missing: '+f);
const production=process.env.CONTEXT==='production';
if(production)
 assert.ok(!names.has('research/r3-lab/hypothesis-session-qa.js'),
  'Production must not ship private QA helper code');
else assert.ok(names.has('research/r3-lab/hypothesis-session-qa.js'),
  'Preview must include opt-in QA helper');
// Homepage release history is accessible but collapsed by default, preserving the previous research announcement.
const homeHtml=fs.readFileSync(path.join(out,'index.html'),'utf8');
assert.equal((homeHtml.match(/id="ddSiteUpdates"/g)||[]).length,1);
assert.match(homeHtml,/<details id="ddSiteUpdates" class="dd-site-updates">/,'Site Updates must start collapsed');
assert.match(homeHtml,/<summary id="ddSiteUpdatesButton">/);
assert.doesNotMatch(homeHtml,/PINNED SITE NEWS/);
const updates=homeHtml.indexOf('id="ddSiteUpdates"'),oldUpdate=homeHtml.indexOf('id="ddR3ReleaseAnnouncement"');
assert(updates>homeHtml.indexOf('id="discover"')&&oldUpdate>updates&&oldUpdate<homeHtml.indexOf('My Investigation Boards'),'Release history must be within Site Updates before Boards');
assert.equal((homeHtml.match(/id="ddR3ReleaseAnnouncement"/g)||[]).length,1);
assert.match(homeHtml,/id="ddR3ReleaseGuide"/);
assert.match(homeHtml,/href="\/research\/r3-lab\/"/);
for(const term of ['Research Gap Finder','Hypothesis Lab','Compare','History','Enable encrypted saving','Save encrypted backup to account','manual','independent security review','521 indexed records','27-F-0917','42-topic, 14-day scheduled trial','pending media clearance and playback testing','Android beta'])assert(homeHtml.includes(term),'Release notes missing '+term);
const r3Html=fs.readFileSync(path.join(out,'research/r3-lab/index.html'),'utf8');
assert.match(r3Html,/data-r3-hosted="true"/);
assert.match(r3Html,/noindex,nofollow,noarchive/);
assert.match(r3Html,/\/assets\/community-test-config\.js|\.\.\/\.\.\/assets\/community-test-config\.js/);
assert.match(r3Html,/r3CloudPanel/);
if(production){
 assert.doesNotMatch(r3Html,/r3QaPanel|r3QaOwnId|hypothesis-session-qa\.js|dd_r3_qa/,
  'Production must not contain the preview-only account QA UI');
}else{
 assert.match(r3Html,/r3QaPanel/);
 assert.ok(r3Html.includes('hypothesis-session-qa.js'),'Hosted R3 QA script link missing');
}
assert.match(r3Html,/integrity="sha384-uteMfOloLDGt042uDz\+xHGF3ym63\/WQ6rFq7murQRG8Ih7QrXGEGNtWd8688sb4O"/);
assert.match(r3Html,/@supabase\/supabase-js@2\.119\.0/,'R3 cloud SDK must stay pinned');
assert.doesNotMatch(r3Html,/127\.0\.0\.1:4175/,'Hosted R3 must not claim localhost origin');
assert.ok(!paths.some(p=>p.startsWith('experiments/')||
 p.startsWith('supabase/')||p.endsWith('.cjs')||p.endsWith('.sql')),
 'No R3 experiments/SQL/server/test files in public output');
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
   !/\.(?:html?|js|css|svg|json|webmanifest|png|ico|txt|xml|pdf)$/i.test(url))
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

'use strict';
// Offline public website staging: never deploys, never touches real accounts.
// M71 future release safety: only production may publish in actual Netlify production context.
require('./guard_official_deploy.cjs');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.release-staging','public-site');
if(fs.existsSync(out))throw Error('Refusing to overwrite existing release staging folder');
const top=['index.html','guide.html','sources.html','research-collaborations.html','pursue.html','foia-tracker.html','discussion-hosts.html','investigations.html','rendlesham-forest-1980.html','roswell-1947.html','who-is-who.html','world-uap-programmes.html','community-rules.html','privacy.html','terms.html','research-edition.html',
 'cloud-boards.js','manifest.webmanifest','robots.txt','sitemap.xml','ads.txt','app-ads.txt'];
const data=['approved-live-events.json','curated-historical-cases.json','evidence-dna-claim-drafts.json','public-people-directory.json','public-people-directory-additions-m58.json','public-source-verification.json','pursue-index.json','who-editorial-handoff-m29.json','public-person-case-links.json','programmes-places-m58.json','curated-official-videos.json',
 'disclosure-clips.json','disclosure-map.json','historical-news-archive.json',
 'international-source-registry.json','news-alerts.json'];
const webExt=new Set(['.html','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.woff2']);
const files=[];
// Explicitly excluded development-only worksheet. It remains executable in its
// isolated fixture, but is never copied into the candidate public website.
const developmentOnly=Object.freeze({assets:['who-community-worksheet-m57.js']});
function copy(rel){
 const src=path.resolve(root,rel),dest=path.resolve(out,rel);
 if(!src.startsWith(root+path.sep)||!dest.startsWith(out+path.sep))throw Error('Unsafe path '+rel);
 const stat=fs.lstatSync(src);
 if(!stat.isFile()||stat.isSymbolicLink())throw Error('Non-regular source '+rel);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(src,dest,fs.constants.COPYFILE_EXCL);
 const bytes=fs.readFileSync(dest);
 files.push({path:rel,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
// Explicit filename review: adding another .js/.html to assets or research
// must never silently make it publicly accessible on a subsequent deploy.
const approvedWeb=Object.freeze({
 assets:[
  'research-public.css','research-public.js','discussion-hosts.js','host-recommendations.js','who-private-worksheet-m76.js','media-submissions.js','community-polish.css','secondary-editorial-nav.css','secondary-editorial-nav.js','site-ad-layout-m01.css','site-ad-layout-m01.js','site-adsterra-m02.js','case-comment-moderation.js','case-connections.js','evidence-dna.js','person-case-links.js','people-directory.js','world-uap-programmes.js','who-archive-return.js','source-verification.js','who-international-programmes-m68.js','source-outreach-digest-m68.js','source-outreach-digest-m68.css','page-help.js','case-discussions.js','chat-tab-ui.js','community-discussions.js',
  'community-test-config.js','community-votes.js','confirmation-dialog.js','disclosure-desk-mark.svg',
  'discussions-admin.js','historical-satellite.js','inline-news-comments.js','unified-action-rails.js',
  'live-chat.js','live-hearings.js','live-schedule.css','live-schedule.js',
  'news-ticker.css','news-ticker.js','news-article-votes.js',
  'profile-avatars.js','member-avatars.js','profile-private-chat.js','public-profiles.js','research-hub.js',
  'support-site.js','watch-read.js','witness-community.js'
 ],
 research:[
  'google-drive-config.js','google-drive.js','vendor-jszip-3.10.1.js','vendor-dompurify-3.4.17.js','vendor-docx-9.5.1.js','vendor-mammoth-1.12.3.js','docx-tools.js','docx-import-worker.js','guest-preview.html','import-cloud-bridge.js','import.html',
  'index.html','research-auth-guard.js','research-bible.html','research-entry.js',
  'research-library-cloud-bridge.js','research-site-nav.css',
  'research-docx-import.js','research-insert-menu.js','research-site-nav.js','research-text-size.js','research-workspace.html','restore-copy.html',
  'restore-library.html','restore-library-core.js','restore-library.js',
  'restore-copy.js','wne-cloud-bridge.js','wne-export-integration.js',
  'wne-research-live-spelling.js','wne-dialogs-m34.js','wne-polish-m34.css','wne-polish-m34.js',
  'wne-view-m39.css','wne-view-m39.js','wne-ui-m40.css','wne-ui-m40.js','wne.html'
 ]
});
function websiteDir(dir){
 const allowed=new Set(approvedWeb[dir]),found=new Set();
 for(const d of fs.readdirSync(path.join(root,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  if(developmentOnly[dir]?.includes(d.name)){
   if(!d.isFile()||fs.lstatSync(path.join(root,dir,d.name)).isSymbolicLink())
    throw Error('Non-regular development fixture: '+dir+'/'+d.name);
   continue;
  }
  // The sole approved nested directory is copied by an explicit JSON allowlist below.
  if(dir==='research'&&d.isDirectory()&&d.name==='data')continue;
  if(!d.isFile()||!webExt.has(path.extname(d.name).toLowerCase())||!allowed.has(d.name))
   throw Error('Unexpected or unapproved public web file: '+dir+'/'+d.name);
  found.add(d.name);copy(dir+'/'+d.name);
 }
 for(const required of allowed)if(!found.has(required))
  throw Error('Approved website dependency missing: '+dir+'/'+required);
}
top.forEach(copy);websiteDir('assets');websiteDir('research');
data.forEach(p=>copy('data/'+p));
// Homepage background assets are only released after exact-source licence review and explicit media gate activation.
const themeEnabled=fs.readFileSync(path.join(root,'index.html'),'utf8').includes('id="ddHomeThemeHero" data-media-ready="true"');
if(themeEnabled){
 for(const name of ['nightfall','eclipse'])for(const ext of ['mp4','jpg']){
  const rel='data/'+name+'.'+ext;
  const size=fs.statSync(path.join(root,rel)).size;
  if(size<1||size>(ext==='mp4'?1500000:150000))throw Error('Theme media size budget exceeded: '+rel);
  copy(rel);
 }
}

copy('research/data/curated-public-cases.json');
for(const file of ['27-f-0917-decision-extract.pdf','27-f-0917-referral-extracts.pdf'])copy('data/foia/'+file);
// R3: a separately scoped, noindex browser page with opt-in account-backed
// ciphertext only. Original website bundle and navigation stay intact.
require('./build_r3_hosted_assets.cjs')(root,out,files);
const cfg=fs.readFileSync(path.join(out,'assets/community-test-config.js'),'utf8');
for(const flag of ['privateChat:enabled','discussions:enabled','profileAvatars:enabled','researchPublishing:false','discussionHosts:enabled','hostRecommendations:enabled'])
 if(!cfg.includes(flag))throw Error('Unapproved feature activation detected: '+flag);
// M70 release gate: unfinished claim ballots and real Adsterra cannot be activated by this bundle.
const whoHtml=fs.readFileSync(path.join(out,'who-is-who.html'),'utf8');
if(whoHtml.includes('who-evidence-ballot-m64.js')||whoHtml.includes('who-evidence-ballot-m64.css'))throw Error('Unapproved Who evidence voting runtime bundled');
if(!cfg.includes('whoEvidenceBallots:false'))throw Error('Who evidence ballots must stay OFF');
// M76 self-evaluation is client-only and must never add voting, API or storage writes.
if(!whoHtml.includes('who-private-worksheet-m76.js'))throw Error('Private worksheet entrypoint missing');
const adSource=fs.readFileSync(path.join(out,'assets/site-adsterra-m02.js'),'utf8');
if(!adSource.includes('const RELEASE_ENABLED=false;'))throw Error('Real Adsterra must stay OFF');
if(files.some(f=>f.path.includes('who-evidence-ballot-m64')||f.path.includes('who-community-approvals-m64')))
 throw Error('Unapproved voting draft in public release');
const manifest={type:'Disclosure Desk candidate static site - NOT DEPLOYED',files:files.sort((a,b)=>a.path.localeCompare(b.path)),
 totalBytes:files.reduce((n,f)=>n+f.bytes,0)};
fs.writeFileSync(path.join(out,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log('PASS allowlisted public staging: '+files.length+' files '+manifest.totalBytes+' bytes; NO deploy');

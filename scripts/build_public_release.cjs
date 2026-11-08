'use strict';
// Offline public website staging: never deploys, never touches real accounts.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.release-staging','public-site');
if(fs.existsSync(out))throw Error('Refusing to overwrite existing release staging folder');
const top=['index.html','guide.html','sources.html','community-rules.html','privacy.html','research-edition.html',
 'cloud-boards.js','manifest.webmanifest','robots.txt','sitemap.xml','ads.txt','app-ads.txt'];
const data=['approved-live-events.json','curated-historical-cases.json','curated-official-videos.json',
 'disclosure-clips.json','disclosure-map.json','historical-news-archive.json',
 'international-source-registry.json','news-alerts.json'];
const webExt=new Set(['.html','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.woff2']);
const files=[];
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
  'case-comment-moderation.js','case-discussions.js','chat-tab-ui.js','community-discussions.js',
  'community-test-config.js','community-votes.js','disclosure-desk-mark.svg',
  'discussions-admin.js','historical-satellite.js','inline-news-comments.js',
  'live-chat.js','live-hearings.js','live-schedule.css','live-schedule.js',
  'news-ticker.css','news-ticker.js',
  'profile-avatars.js','profile-private-chat.js','public-profiles.js','research-hub.js',
  'support-site.js','watch-read.js','witness-community.js'
 ],
 research:[
  'docx-tools.js','guest-preview.html','import-cloud-bridge.js','import.html',
  'index.html','research-auth-guard.js','research-bible.html','research-entry.js',
  'research-library-cloud-bridge.js','research-site-nav.css',
  'research-site-nav.js','research-workspace.html','restore-copy.html',
  'restore-copy.js','wne-cloud-bridge.js','wne-export-integration.js',
  'wne-research-live-spelling.js','wne.html'
 ]
});
function websiteDir(dir){
 const allowed=new Set(approvedWeb[dir]),found=new Set();
 for(const d of fs.readdirSync(path.join(root,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
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
copy('research/data/curated-public-cases.json');
const cfg=fs.readFileSync(path.join(out,'assets/community-test-config.js'),'utf8');
for(const flag of ['privateChat:false','discussions:false','profileAvatars:false','researchPublishing:false'])
 if(!cfg.includes(flag))throw Error('Unapproved feature activation detected: '+flag);
const manifest={type:'Disclosure Desk candidate static site - NOT DEPLOYED',files:files.sort((a,b)=>a.path.localeCompare(b.path)),
 totalBytes:files.reduce((n,f)=>n+f.bytes,0)};
fs.writeFileSync(path.join(out,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log('PASS allowlisted public staging: '+files.length+' files '+manifest.totalBytes+' bytes; NO deploy');

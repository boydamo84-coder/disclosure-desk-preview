'use strict';
// SAFE PUBLIC-BUNDLE ASSEMBLER. Never deploys and never reads secrets.
// The source repository contains private development/Finance material;
// publishing the repo root is explicitly forbidden for a release.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(ROOT,'dist-public-site');
const GROUPS=Object.freeze({
 root:[
  'index.html','sources.html','community-rules.html','privacy.html',
  'research-edition.html','cloud-boards.js','manifest.webmanifest',
  'robots.txt','sitemap.xml','app-ads.txt'
 ],
 assets:[
  'case-comment-moderation.js','case-discussions.js','community-discussions.js',
  'community-test-config.js','community-votes.js','disclosure-desk-mark.svg',
  'discussions-admin.js','historical-satellite.js','inline-news-comments.js',
  'live-chat.js','live-hearings.js','live-schedule.css','live-schedule.js',
  'profile-private-chat.js','public-profiles.js','research-hub.js',
  'support-site.js','watch-read.js','witness-community.js'
 ],
 research:[
  'docx-tools.js','guest-preview.html','import-cloud-bridge.js','import.html',
  'index.html','research-auth-guard.js','research-bible.html','research-entry.js',
  'research-library-cloud-bridge.js','research-site-nav.css','research-site-nav.js',
  'research-workspace.html','restore-copy.html','restore-copy.js',
  'wne-cloud-bridge.js','wne-export-integration.js',
  'wne-research-live-spelling.js','wne.html'
 ],
 'research/data':['curated-public-cases.json'],
 data:[
  'approved-live-events.json','curated-historical-cases.json',
  'curated-official-videos.json','disclosure-clips.json','disclosure-map.json',
  'historical-news-archive.json','news-alerts.json'
 ]
});
const inventory=Object.entries(GROUPS).flatMap(([dir,names])=>
 names.map(name=>dir==='root'?name:dir+'/'+name));
if(new Set(inventory).size!==inventory.length)throw Error('Duplicate public release path');
if(fs.existsSync(OUT))throw Error('Refuse to overwrite an existing release directory: '+OUT);
const manifest=[];
for(const rel of inventory){
 if(rel.startsWith('/')||rel.includes('..')||rel.includes('\\')||rel.split('/').some(x=>x.startsWith('.')))
  throw Error('Unsafe public path '+rel);
 const src=path.join(ROOT,rel),stat=fs.lstatSync(src);
 if(!stat.isFile()||stat.isSymbolicLink())throw Error('Unexpected non-file or symlink '+rel);
 if(stat.size>18000000)throw Error('Unexpected oversized public file '+rel);
 const dest=path.join(OUT,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(src,dest,fs.constants.COPYFILE_EXCL);
 const hash=crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex');
 manifest.push({path:rel,bytes:stat.size,sha256:hash});
}
if(!manifest.find(x=>x.path==='index.html')||!manifest.find(x=>x.path==='research/wne.html'))
 throw Error('Missing critical site entry');
if(manifest.some(x=>/(?:^|\/)(?:finance|supabase|scripts|docs|admin|\.env|MASTER_HANDOVER)/i.test(x.path)))
 throw Error('Internal path included in release!');
const bytes=manifest.reduce((n,x)=>n+x.bytes,0);
console.log('PUBLIC-BUNDLE PREPARED (not deployed): '+manifest.length+
 ' explicit public files, '+bytes+' bytes');
for(const [dir,names] of Object.entries(GROUPS))console.log('  '+dir+': '+names.length);
console.log('No repository-root publishing, Netlify action or Supabase connection.');
module.exports={GROUPS,inventory,OUT,manifest};

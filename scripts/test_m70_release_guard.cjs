'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
const isBundle=process.argv.includes('--bundle');
const site=(p)=>read((isBundle?'.release-staging/public-site/':'')+p);
const html=site('index.html'),who=site('who-is-who.html'),config=site('assets/community-test-config.js');
const ad=site('assets/site-adsterra-m02.js'),build=read('scripts/build_public_release.cjs');
assert.equal((html.match(/href="https:\/\/boyddigitalstudios\.com\/"/g)||[]).length,2,'Two official BDS links');
assert(html.includes('research-hub.js?v=m69-stay-on-profile'),'M69 profile cache busting');
assert.match(who,/who-international-programmes-m68\.js/);
assert.match(who,/source-outreach-digest-m68\.js/);
assert.doesNotMatch(who,/who-evidence-ballot-m64\.(js|css)/);
assert.match(config,/whoEvidenceBallots:false/);
assert.match(config,/researchPublishing:false/);
assert.match(ad,/const RELEASE_ENABLED=false;/);
assert(!/wixsite\.com/i.test(html),'No obsolete Wix domain in home');
assert.match(html,/https:\/\/uapdisclosuredesk\.com\//);
assert.match(html,/mailto:support@uapdisclosuredesk\.com/);
assert.match(build,/who-international-programmes-m68\.js/);
assert.match(build,/source-outreach-digest-m68\.js/);
assert.match(build,/source-outreach-digest-m68\.css/);
for(const name of ['assets/who-evidence-ballot-m64.js','assets/who-evidence-ballot-m64.css','data/who-community-approvals-m64.json']){
 assert(!fs.existsSync(path.join(base,name)),'Must not copy unfinished voting source: '+name);
}
if(isBundle){
 const manifest=JSON.parse(read('.release-staging/public-site/release-manifest.json'));
 const names=manifest.files.map(f=>f.path);
 for(const name of ['assets/who-international-programmes-m68.js','assets/source-outreach-digest-m68.js','assets/source-outreach-digest-m68.css'])assert(names.includes(name),'Missing M68 asset '+name);
 const themeCount=names.filter(n=>/^data\/(nightfall|eclipse)\.(mp4|jpg)$/.test(n)).length;
 assert([0,4].includes(themeCount),'Unexpected theme media count');
 assert(!names.includes('data/orbital.mp4')&&!names.includes('data/orbital.jpg'),'Uncleared Orbital must not ship');
 assert(names.length>=120 && names.length<=(process.env.CONTEXT==='production'?157:158)+themeCount,'Unexpected public bundle file count '+names.length);
 assert(!names.some(x=>/who-evidence-ballot|who-community-approvals|(?:^|\/)(?:docs|scripts|supabase|android-test|\.github)(?:\/|$)/.test(x)),'No staging/voting/private files in live bundle');
}
console.log('PASS M70 curated '+(isBundle?'PUBLIC BUNDLE':'SOURCE')+': Who M68 + Profile M69 + BDS; voting closed, Adsterra off, no old Wix');

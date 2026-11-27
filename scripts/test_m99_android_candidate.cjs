'use strict';
// Current-production Android candidate source + exact embedded snapshot.
// No emulator, device, real account, network API or Play Store calls.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const snapshot='android-test/app/src/main/assets/dd-site/';
const data=JSON.parse(read('.release-staging/public-site/release-manifest.json'));
const approved=new Map(data.files.map(f=>[f.path,f.sha256]));
const required=['index.html','assets/research-spotlight.js','data/research-spotlight.json','first-investigation.html','site-updates.html','assets/secondary-editorial-nav.js','assets/page-help.js','sources.html','foia-tracker.html','pursue.html','research-collaborations.html','assets/host-recommendations.js','assets/discussion-hosts.js','privacy.html','research/wne.html','research/google-drive.js','research/r3-lab/index.html','data/nightfall.mp4','data/eclipse.mp4','data/pursue-index.json'];
for(const p of required){
 assert(approved.has(p),'Required current public file not packaged: '+p);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,snapshot,p))).digest('hex'),approved.get(p),p+' snapshot bytes');
}
const html=read(snapshot+'index.html');
for(const id of ['ddSpotlightCard','ddSpotlightControls','ddLatestNewsPagerTop','ddLatestNewsPager','ddExploreTitle','newsStickyControls'])assert.ok(html.includes('id="'+id+'"'),id+' included');
assert.match(html,/<h2 id="ddExploreTitle">Help<\/h2>/);
assert.match(html,/dd-news-pager-top/);
assert.match(html,/<script defer src="assets\/community-test-config\.js\?v=20261127-host-picks"/);
const sandbox={window:{},location:{hostname:'uapdisclosuredesk.com'}};
vm.runInNewContext(read(snapshot+'assets/community-test-config.js'),sandbox);
assert.equal(sandbox.window.DD_COMMUNITY_FEATURES.researchPublishing,false);
assert.equal(sandbox.window.DD_COMMUNITY_FEATURES.whoEvidenceBallots,false);
assert.equal(sandbox.window.DD_COMMUNITY_FEATURES.discussionHosts,true);
for(const p of approved.keys())assert.doesNotMatch(p,/community-publication-preview|community-research\.js|bouncer|SCHEMA_DRAFT|hypothesis-session-qa|who-evidence-ballot/);
assert.match(read(snapshot+'privacy.html'),/id="account-deletion"/);
const main=read('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java');
assert.match(main,/snapshotFiles\.contains\(name\+"\.html"\)/,'Clean editorial routes resolve in embedded site');
assert.match(main,/else if\(name\.endsWith\("\.mp4"\)\)mime="video\/mp4";/);
assert.match(main,/else if\(name\.endsWith\("\.pdf"\)\)mime="application\/pdf";/);
assert.match(main,/String encoding=\("video\/mp4"\.equals\(mime\)\|\|"application\/pdf"\.equals\(mime\)\)\?null:"UTF-8"/);
assert.match(main,/FOIA_PDFS\.contains\(url\.getPath\(\)\)/,'FOIA file routing retained');
assert.match(main,/Intent\.FLAG_GRANT_READ_URI_PERMISSION/);
assert.match(main,/getAssets\(\)\.open\("dd-site\/"\+name\)/);
assert.match(main,/dd_external_drive/,'Drive browser handoff retained');
assert.match(main,/installResearchInboxControl/,'Research Inbox shortcuts retained');
assert.match(read('android-test/app/src/main/assets/native-shell.js'),/return false;\n\}\)/,'Do not replace web pagination with native news list');
assert.match(read('android-test/app/build.gradle.kts'),/applicationIdSuffix = "\.beta\.m100"/);
assert.match(read('android-test/app/build.gradle.kts'),/versionCode = 36/);
console.log('PASS M100: exact current homepage, pagination, Help, editorial routes, media MIME types, permissions, privacy, existing native tools, disabled Community Research, separate Android package');

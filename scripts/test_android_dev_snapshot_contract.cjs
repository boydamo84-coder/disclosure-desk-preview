'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const target=path.join(root,'android-test/app/src/main/assets/dd-site');
const manifest=JSON.parse(fs.readFileSync(path.join(target,'snapshot-manifest.json'),'utf8'));
const publicManifest=JSON.parse(read('.release-staging/public-site/release-manifest.json'));
const main=read('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java');
const gradle=read('android-test/app/build.gradle.kts'),html=read('index.html');
assert.equal(manifest.type,'Disclosure Desk embedded Android development snapshot');
assert.deepEqual(manifest.files,publicManifest.files.map(x=>x.path));
assert.equal(manifest.totalBytes,publicManifest.totalBytes);
for(const rel of [
 'index.html','research-collaborations.html','pursue.html','foia-tracker.html','discussion-hosts.html','data/pursue-index.json','data/foia/27-f-0917-decision-extract.pdf','guide.html','assets/community-polish.css','assets/community-votes.js',
 'assets/confirmation-dialog.js','assets/community-discussions.js',
 'assets/inline-news-comments.js','assets/case-discussions.js','assets/unified-action-rails.js',
 'research/wne.html','assets/research-hub.js','who-is-who.html',
 'world-uap-programmes.html','assets/who-private-worksheet-m76.js','assets/source-outreach-digest-m68.js']){
 assert(manifest.files.includes(rel),'Critical pending UI file packaged: '+rel);
 const apkFile=path.join(target,rel);
 const branchFile=path.join(root,['pursue.html','who-is-who.html'].includes(rel)?'.release-staging/public-site':'',rel);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(apkFile)).digest('hex'),
  crypto.createHash('sha256').update(fs.readFileSync(branchFile)).digest('hex'),
  'Packaged file exactly matches current development source: '+rel);
}
assert(manifest.files.includes('research/r3-lab/index.html'),'Hypothesis Lab is bundled');
for(const file of ['assets/site-dock.js','data/case-dossier-readers.js','project-blue-book.html','foia-pentagon-25-f-3215.html']){
 assert(manifest.files.includes(file),'Offline editorial route or dependency missing: '+file);
}
assert.match(main,/#ddDockMore\[open\][^\n]+close\(\)/,'Android Back closes More before navigating');
assert.match(main,/endsWith\("\.pdf"\)\)mime="application\/pdf"/,'Android passes the published PDF type');

assert(!manifest.files.some(p=>p.includes('hypothesis-session-qa')||p.includes('analytics-consent')||p.includes('who-evidence-ballot')),
 'Private QA, retired Analytics and staged community ballots are excluded');
const gaReference=/(?:google-analytics\.com|googletagmanager\.com|analytics-consent\.js|G-ZWJQMK8JSW|\bgtag\s*\()/i;
for(const rel of manifest.files.filter(p=>/\.(?:html|js)$/i.test(p))){
 assert.doesNotMatch(fs.readFileSync(path.join(target,rel),'utf8'),gaReference,'No Google Analytics implementation: '+rel);
}
assert.match(main,/isGoogleAnalyticsHost\(request\.getUrl\(\)\.getHost\(\)\)/,'WebView blocks GA requests');
assert.match(main,/path\.endsWith\("\/"\)\)name\+="index\.html"/,'Nested site directories resolve to embedded indexes');
assert.match(html,/confirmation-dialog\.js\?v=m74/,'Newest popup reached APK');
assert.match(html,/community-votes\.js\?v=m74-branded-confirm/,'M73 owner actions reached APK');
assert.match(main,/shouldInterceptRequest\(WebView view,WebResourceRequest request\)/);
assert.match(main,/snapshotFiles\.contains\(name\)/,'Only reviewed site files intercepted');
assert.match(main,/"https"\.equals\(url\.getScheme\(\)\)/,'Only HTTPS origin intercepted');
assert.match(main,/"uapdisclosuredesk\.com"\.equals\(url\.getHost\(\)\)/);
assert.match(main,/DD_FIREBASE_APP_ID/,'Firebase groundwork preserved');
assert.match(main,/PLAY_BILLING_APPROVED = false/,'Unverified paid purchase is disabled');
assert.match(gradle,/applicationIdSuffix = "\.beta\.m101"/,'Private beta does not overwrite production app');
assert.match(gradle,/targetSdk = 36/);
assert.match(gradle,/versionCode = 37/);
assert(!manifest.files.some(p=>p.startsWith('.github/')||p.startsWith('supabase/')||p.startsWith('scripts/')||p.includes('SECRET')),
 'No source jobs, SQL or internal config distributed in APK');
console.log('PASS reviewed M76 app snapshot, private worksheet and research assets, no GA implementation and separate Android package');

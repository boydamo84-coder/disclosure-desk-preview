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
 'index.html','assets/community-polish.css','assets/community-votes.js',
 'assets/confirmation-dialog.js','assets/community-discussions.js',
 'assets/inline-news-comments.js','assets/case-discussions.js','assets/unified-action-rails.js',
 'research/wne.html','assets/research-hub.js']){
 assert(manifest.files.includes(rel),'Critical pending UI file packaged: '+rel);
 const apkFile=path.join(target,rel),branchFile=path.join(root,rel);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(apkFile)).digest('hex'),
  crypto.createHash('sha256').update(fs.readFileSync(branchFile)).digest('hex'),
  'Packaged file exactly matches current development source: '+rel);
}
assert.match(html,/confirmation-dialog\.js\?v=m74/,'Newest popup reached APK');
assert.match(html,/community-votes\.js\?v=m74-branded-confirm/,'M73 owner actions reached APK');
assert.match(main,/shouldInterceptRequest\(WebView view,WebResourceRequest request\)/);
assert.match(main,/snapshotFiles\.contains\(name\)/,'Only reviewed site files intercepted');
assert.match(main,/"https"\.equals\(url\.getScheme\(\)\)/,'Only HTTPS origin intercepted');
assert.match(main,/"uapdisclosuredesk\.com"\.equals\(url\.getHost\(\)\)/);
assert.match(main,/DD_FIREBASE_APP_ID/,'Firebase groundwork preserved');
assert.match(main,/PLAY_BILLING_APPROVED = false/,'Unverified paid purchase is disabled');
assert.match(gradle,/applicationIdSuffix = "\.beta"/,'Private beta does not overwrite production app');
assert.match(gradle,/targetSdk = 36/);
assert.match(gradle,/versionCode = 16/);
assert(!manifest.files.some(p=>p.startsWith('.github/')||p.startsWith('supabase/')||p.startsWith('scripts/')||p.includes('SECRET')),
 'No source jobs, SQL or internal config distributed in APK');
console.log('PASS M77 private beta uses exact M74 pending website snapshot, no Netlify dependency, protected origin and separate Android package');

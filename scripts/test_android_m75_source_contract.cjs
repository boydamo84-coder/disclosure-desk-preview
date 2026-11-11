'use strict';
// Non-destructive source gate; Android SDK compilation runs independently in CI.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const app=read('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java');
const worker=read('android-test/app/src/main/java/com/disclosuredesk/preview/DiscoveryWorker.java');
const gradle=read('android-test/app/build.gradle.kts');
const manifest=read('android-test/app/src/main/AndroidManifest.xml');
const workflow=read('.github/workflows/android-test-apk.yml');
const stage=read('scripts/stage_android_dev_snapshot.cjs');
const html=read('index.html');
const tokens=[
 'loadSnapshotManifest();','snapshotFiles.isEmpty()','shouldInterceptRequest(WebView view,WebResourceRequest request)',
 'snapshotFiles.contains(name)','getAssets().open("dd-site/"+name)',
 '"https".equals(url.getScheme())','"uapdisclosuredesk.com".equals(url.getHost())',
 'settings.setAllowFileAccess(false)','onShowFileChooser','onSaveInstanceState(Bundle state)',
 'web.restoreState(savedInstanceState)','isAppHomeUrl(url)','ddForumReplyPane',
 'WindowInsets.Type.navigationBars()','PLAY_BILLING_APPROVED = false',
 'setCacheMode(WebSettings.LOAD_NO_CACHE)'
];
for(const t of tokens)assert(app.includes(t),'Android source must preserve '+t);
assert(!app.includes('settings.setAllowContentAccess(false)'), 'Android content URI chooser is allowed');
assert.match(app,/if\(PLAY_BILLING_APPROVED\)premium=new LifetimeAdsManager/);
assert.match(app,/if\(PLAY_BILLING_APPROVED && premium!=null\)choices.addView\(removeAds\)/);
assert.match(app,/chats.setEnabled\(false\)/,'Incomplete FCM push is not advertised as delivered');
assert.match(gradle,/applicationIdSuffix = "\.beta"/);
assert.match(gradle,/manifestPlaceholders\["ddAppLabel"\] = "Disclosure Desk Beta"/);
assert.match(gradle,/targetSdk = 36/);
assert.match(gradle,/versionCode = (?:14|15|16)/);
assert.match(manifest,/android:label="\$\{ddAppLabel\}"/);
assert.match(worker,/dd_scope/);
assert.match(html,/assets\/confirmation-dialog\.js\?v=m74/);
assert.match(html,/assets\/community-votes\.js\?v=m74-branded-confirm/);
assert.match(stage,/release-manifest\.json/);
assert.match(stage,/crypto\.createHash\('sha256'\)/);
assert.match(stage,/stat\.isSymbolicLink\(\)/);
assert.match(stage,/Refusing to overwrite existing Android snapshot/);
assert.match(workflow,/node scripts\/build_public_release\.cjs/);
assert.match(workflow,/node scripts\/stage_android_dev_snapshot\.cjs/);
assert.match(workflow,/node scripts\/test_android_dev_snapshot_contract\.cjs/);
assert.match(workflow,/android\/m78-profile-notification-settings-nov11/);
assert.match(workflow,/DisclosureDesk-M78-PRIVATE-BETA/);
assert(!/(?:^|\n)\s*(?:npx\s+)?netlify\s+(?:deploy|build|publish)\b/im.test(workflow),'No Netlify CLI deployment in APK build');
console.log('PASS M75 Android beta source: pending M74/M73 UI, origin-safe snapshot, isolated install, native back, file picker, explicit billing/push gates, no Netlify.');

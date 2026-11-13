'use strict';
// Static M77 Android contract: source-only, no live Supabase or network writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),read=p=>fs.readFileSync(p,'utf8');
const main=read('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java');
const style=read('assets/community-polish.css');
const inline=read('assets/inline-news-comments.js');
const cases=read('assets/case-discussions.js');
const votes=read('assets/community-votes.js');
const gradle=read('android-test/app/build.gradle.kts');
const workflow=read('.github/workflows/android-test-apk.yml');
for(const token of [
 'installProfileNotificationControl();','showFirstRunAlertsPrompt();',
 'FIRST_RUN_ALERTS_CHOICE','ddAndroidAlertsSettings','open_notification_settings',
 'window.DDAndroid.postMessage','runOnUiThread(this::notificationSettings)',
 'Keep up with new discoveries?','Enable available alerts','Not now',
 '.putBoolean("news",true).putBoolean("videos",true)',
 'requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},712)',
 'news.setChecked(prefs.getBoolean("news",false))',
 'footage.setChecked(prefs.getBoolean("videos",false))',
 'chats.setEnabled(false)','Android notification permission',
 'Settings.ACTION_APP_NOTIFICATION_SETTINGS','syncDiscoverySchedules()'
 ])assert(main.includes(token),'Notification intent or Profile settings missing: '+token);
assert(!main.includes('notifications.setText("🔔")'),'Floating bell removed');
assert(!main.includes('root.addView(notifications,bell)'),'Floating bell overlay removed');
assert(!main.includes('notifications.setOnClickListener'),'No orphan native bell handler');
assert(main.indexOf('FIRST_RUN_ALERTS_CHOICE')<main.indexOf('showFirstRunAlertsPrompt(){'),'First-run check declared');
assert(main.includes('prefs.getBoolean(FIRST_RUN_ALERTS_CHOICE,false)'),'Prompt is one-time per beta install');
assert(main.includes('if(!isMainFrame'),'Native bridge retains main-frame restriction');
assert(main.includes('Collections.singleton("https://uapdisclosuredesk.com")'),'Native bridge origin stays pinned');
assert(main.includes('if(PLAY_BILLING_APPROVED)premium=new LifetimeAdsManager'),'Paid billing still disabled');
assert(Number(gradle.match(/versionCode = (\d+)/)?.[1]) >= 15);
assert.match(gradle,/applicationIdSuffix = "\.beta\.m92"/);
for(const source of [inline,cases]){
 assert(source.includes("item.parent_id||''"),'Nested row uses real parent_id');
 assert(source.includes("card.style.setProperty('--dd-comment-indent'"),'Nesting has computed valid px offset');
 assert(source.includes("card.classList.add('dd-comment-nested')"),'Nested state marked');
 assert(source.includes('parent_id:'),'Posts still carry real parent relationship');
}
assert(votes.includes('threadedComments(items)'),'Central threaded renderer preserved');
assert(votes.includes("lookup.get(String(item?.parent_id||''))"),'Threading uses canonical backend parent_id');
for(const token of [
 'M77 — real nested comment hierarchy','--dd-comment-indent',
 'width:calc(100% - var(--dd-comment-indent))!important',
 '.dd-comment-card.dd-comment-nested .dd-comment-parent-label',
 'position:static!important;clip-path:none!important',
 'M77 — mobile Chat gets its own properly sized screen',
 '--dd-chat-visual-height','--dd-chat-bottom-space',
 'position:fixed!important','min-height:0!important'
 ])assert(style.includes(token),'Missing mobile CSS: '+token);
const tail=style.slice(style.lastIndexOf('/* M77 — real nested'));
assert(!tail.includes('calc(var(--dd-comment-depth,1) * var(--dd-thread-step))'),
 'Modern WebView style must not use unsupported calc multiplication for replies');
assert(workflow.includes('android/m92-web-parity-native-desk-nov13'),'Correct Android development branch');
assert(workflow.includes('scripts/test_m77_android_mobile_contract.cjs'),'M77 source test runs in APK CI');
assert(workflow.includes('scripts/test_m77_android_mobile_chromium.cjs'),'Real mobile browser test runs in APK CI');
assert(!/\bnetlify deploy\b/.test(workflow),'M77 never deploys Netlify');
console.log('PASS M77 mobile UI source: consent-first notifications, Profile settings, no floating bell, backend-accurate nested replies, expanded Chat, isolated beta');

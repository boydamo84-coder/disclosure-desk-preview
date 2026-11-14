'use strict';
// Offline contract and JavaScript syntax gate for Android-only native Research Inbox.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const main=read('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java');
const inbox=read('android-test/app/src/main/java/com/disclosuredesk/preview/ResearchInboxActivity.java');
const manifest=read('android-test/app/src/main/AndroidManifest.xml');
const store=read('android-test/app/src/main/java/com/disclosuredesk/preview/ResearchInboxStore.java');
const parser=read('android-test/app/src/main/java/com/disclosuredesk/preview/ResearchLinkParser.java');
const html=read('index.html'),guide=read('guide.html'),build=read('.github/workflows/android-test-apk.yml');
const gradle=read('android-test/app/build.gradle.kts');
for(const p of [
'installResearchInboxControl();','ResearchInboxStore researchInbox;',
'new ResearchInboxStore(this)','receiveSharedResearchLink(getIntent());',
'Intent.ACTION_SEND.equals(intent.getAction())','"text/plain".equalsIgnoreCase(intent.getType())',
'ResearchLinkParser.fromSharedText','intent.removeExtra(Intent.EXTRA_TEXT);',
'intent.setAction(Intent.ACTION_MAIN);','if(receiveSharedResearchLink(intent))return;',
'open_research_inbox','runOnUiThread(this::showResearchInbox)',
'open_research_inbox_help','runOnUiThread(this::showResearchInboxHelp)',
'else if("/guide".equals(path))name="guide.html";',
'web.loadUrl(HOME+"guide#android-research-inbox")',
'private void showResearchInbox(){','new Intent(this,ResearchInboxActivity.class)',
'Research Inbox · saved links',
'installProfileNotificationControl();','showFirstRunAlertsPrompt();',
'PLAY_BILLING_APPROVED = false','Collections.singleton("https://uapdisclosuredesk.com")',
])assert(main.includes(p),'Missing native integration: '+p);
assert(main.includes('if(!isMainFrame || origin==null'),'Bridge must reject third-party frames');
assert(main.includes('if(receiveSharedResearchLink(intent))return;'),'Share must not reset active WebView');
for(const p of ['ClipboardManager','ClipData.newPlainText','startActivity(open);','store.list()'])
 assert(inbox.includes(p),'Missing native inbox action: '+p);
assert(!main.includes('Uri.parse(intent.getStringExtra('), 'Untrusted external text must never be parsed into an auto-open intent');
assert.match(manifest,/android\.intent\.action\.SEND/,'Share target registered');
assert.match(manifest,/android\.intent\.category\.DEFAULT/,'Share target visible to chooser');
assert.match(manifest,/android:mimeType="text\/plain"/,'Text links only');
assert(!/android\.intent\.action\.SEND_MULTIPLE/.test(manifest),'No bulk file permissions');
assert(!/android\.permission\.READ_EXTERNAL_STORAGE/.test(manifest),'No storage permissions');
assert(!/android\.permission\.READ_MEDIA_/.test(manifest),'No broad media permission');
assert(store.includes('Context.MODE_PRIVATE'),'Device links kept private to app');
assert(store.includes('public static final int MAX_ITEMS=50'),'Bounded local retention');
assert(store.includes('preferences.edit().remove(KEY).commit()'),'Explicit clear all supported');
assert(!/supabase|httpURLConnection|fetch\(/i.test(store),'No network/cloud writes in inbox');
assert(parser.includes('looksLikeCredentialLink'),'Sensitive shared tokens filtered');
assert(parser.includes('parsed.getRawUserInfo()!=null'),'No HTTP basic-auth links');
assert(parser.includes('MAX_URL = 2048'),'Unsafe enormous payloads rejected');
assert.match(gradle,/versionCode = 27/,'New APK version');
assert.match(gradle,/applicationIdSuffix = "\.beta\.m95"/,'Private test app separately installed');
assert(!html.includes('ddAndroidResearchInbox'),'Android-only controls never shipped into website HTML');
assert(!html.includes('ResearchInboxStore'),'Native store not exposed on public site');
assert(build.includes('node scripts/test_m81_native_research_contract.cjs'),'Contract runs in private APK CI');
assert(build.includes('node scripts/test_m81_research_inbox_chromium.cjs'),'Inbox shortcuts tested in Chromium');
assert(build.includes('ResearchLinkParserTest'),'Pure JVM URL safety test runs in CI');
assert(build.includes('android/m95-restore-editorial-layout-nov13'),'Android branch only');
assert(!/\bnetlify deploy\b/i.test(build),'CI never deploys Netlify');
const start=main.indexOf('private void installResearchInboxControl(){');
const end=main.indexOf('private boolean receiveSharedResearchLink(',start);
assert(start>=0&&end>start,'Android-only inbox injector exists');
const block=main.slice(start,end);
const snippet=block.slice(block.indexOf('String script='),block.indexOf('web.evaluateJavascript(script,null)'));
const tokens=[...snippet.matchAll(/"(?:\\.|[^"\\])*"/g)].map(x=>JSON.parse(x[0]));
assert(tokens.length>=10,'Java string pieces found');
const script=tokens.join('');
new Function(script); // tests actual string that WebView will run
assert(script.includes("newsHero.before(shortcut('ddAndroidResearchInbox'))"),'Inbox opens directly from News');
assert(script.includes("exploreHeading.after(shortcut('ddAndroidResearchInboxExplore'))"),'Inbox opens directly from Explore');
assert(!script.includes('ddProfileSettings'),'Inbox is independent of Profile settings and sign-in');
assert(script.includes("document.getElementById('ddAndroidResearchInbox')"),'No duplicate controls on reload');
assert(script.includes("window.DDAndroid.postMessage(JSON.stringify({type:type}))"),'Calls origin-restricted native bridge');
assert.match(guide,/id="android-research-inbox" data-help-search/,'Android guide has a searchable deep link');
assert(guide.includes('<summary>How do I save a link from Chrome to Research Inbox?</summary>'),'FAQ includes Chrome Share instructions');
module.exports={getInjectedJs:()=>script};
if(require.main===module)console.log('PASS Research Inbox native actions, safe Android Share, private local storage, Java-injected shortcuts, guide and FAQ.');

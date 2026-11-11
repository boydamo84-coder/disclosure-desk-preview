'use strict';
// Offline contract and JavaScript syntax gate for Android-only native Research Inbox.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const main=read('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java');
const manifest=read('android-test/app/src/main/AndroidManifest.xml');
const store=read('android-test/app/src/main/java/com/disclosuredesk/preview/ResearchInboxStore.java');
const parser=read('android-test/app/src/main/java/com/disclosuredesk/preview/ResearchLinkParser.java');
const html=read('index.html'),build=read('.github/workflows/android-test-apk.yml');
const gradle=read('android-test/app/build.gradle.kts');
for(const p of [
'installResearchInboxControl();','ResearchInboxStore researchInbox;',
'new ResearchInboxStore(this)','receiveSharedResearchLink(getIntent());',
'Intent.ACTION_SEND.equals(intent.getAction())','"text/plain".equalsIgnoreCase(intent.getType())',
'ResearchLinkParser.fromSharedText','intent.removeExtra(Intent.EXTRA_TEXT);',
'intent.setAction(Intent.ACTION_MAIN);','if(receiveSharedResearchLink(intent))return;',
'open_research_inbox','runOnUiThread(this::showResearchInbox)',
'private void showResearchInbox(){','private void showSavedResearchLink(',
'ClipboardManager','ClipData.newPlainText','startActivity(open);',
'Research Inbox · saved links','Links open in your usual browser',
'installProfileNotificationControl();','showFirstRunAlertsPrompt();',
'PLAY_BILLING_APPROVED = false','Collections.singleton("https://uapdisclosuredesk.com")',
])assert(main.includes(p),'Missing native integration: '+p);
assert(main.includes('if(!isMainFrame || origin==null'),'Bridge must reject third-party frames');
assert(main.includes('if(receiveSharedResearchLink(intent))return;'),'Share must not reset active WebView');
assert(main.includes('new AlertDialog.Builder(this)'), 'Native list and actions use Android dialogs');
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
assert.match(gradle,/versionCode = (?:18|19)/,'New APK version');
assert.match(gradle,/applicationIdSuffix = "\.beta"/,'Private test app separately installed');
assert(!html.includes('ddAndroidResearchInbox'),'Android-only controls never shipped into website HTML');
assert(!html.includes('ResearchInboxStore'),'Native store not exposed on public site');
assert(build.includes('node scripts/test_m81_native_research_contract.cjs'),'Contract runs in private APK CI');
assert(build.includes('node scripts/test_m81_research_inbox_chromium.cjs'),'Profile row tested in Chromium');
assert(build.includes('ResearchLinkParserTest'),'Pure JVM URL safety test runs in CI');
assert(build.includes('android/m82-inbox-dialog-list-fix-nov11'),'Android branch only');
assert(!/\bnetlify deploy\b/i.test(build),'CI never deploys Netlify');
const start=main.indexOf('private void installResearchInboxControl(){');
const end=main.indexOf('private boolean receiveSharedResearchLink(',start);
assert(start>=0&&end>start,'Android-only profile injector exists');
const block=main.slice(start,end);
const snippet=block.slice(block.indexOf('String script='),block.indexOf('web.evaluateJavascript(script,null)'));
const tokens=[...snippet.matchAll(/"(?:\\.|[^"\\])*"/g)].map(x=>JSON.parse(x[0]));
assert(tokens.length>=10,'Java string pieces found');
const script=tokens.join('');
new Function(script); // tests actual string that WebView will run
assert(script.includes("document.getElementById('ddProfileSettings')"),'Profile row is in existing settings');
assert(script.includes("if(!settings||document.getElementById('ddAndroidResearchInbox'))return"),'No duplicate row on reload');
assert(script.includes("window.DDAndroid.postMessage(JSON.stringify({type:'open_research_inbox'}))"),'Calls origin-restricted native bridge');
module.exports={getInjectedJs:()=>script};
if(require.main===module)console.log('PASS M81 native Research Inbox source; safe Android Share links; private bounded local storage; real Java-injected Profile JS parsed; no Netlify.');

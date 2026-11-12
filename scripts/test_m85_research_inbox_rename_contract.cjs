'use strict';
// M85 device-local naming contract. No cloud, network or device data writes.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const activity=read('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java');
const store=read('android-test/app/src/main/java/com/disclosuredesk/preview/ResearchInboxStore.java');
const parser=read('android-test/app/src/main/java/com/disclosuredesk/preview/ResearchLinkParser.java');
const workflow=read('.github/workflows/android-test-apk.yml');
const gradle=read('android-test/app/build.gradle.kts');
const inbox=read('android-test/app/src/main/java/com/disclosuredesk/preview/ResearchInboxActivity.java');
const editor=read('android-test/app/src/main/java/com/disclosuredesk/preview/ResearchLinkNameDialog.java');
for(const part of [
 'ResearchLinkParser.preferSharedSubject(shared,intent.getStringExtra(Intent.EXTRA_SUBJECT))',
 'intent.removeExtra(Intent.EXTRA_SUBJECT);',
 'getWindow().getDecorView().post(()->ResearchLinkNameDialog.show(this,researchInbox,savedUrl,true'
])assert(activity.includes(part),'Missing safe share prompt: '+part);
assert(activity.indexOf('researchInbox.add(shared)') < activity.indexOf('ResearchLinkNameDialog.show('),
 'Links are saved before naming');
for(const part of [
 'new InputFilter.LengthFilter(120)',
 'name.setSelectAllOnFocus(true)',
 'setOnShowListener',
 'ResearchLinkParser.cleanCustomTitle(name.getText().toString())',
 'store.rename(url, proposed)',
 'afterShare ? "Later" : "Cancel"'
])assert(editor.includes(part),'Missing safe name editor: '+part);
assert(inbox.includes('ResearchLinkParser.formatInboxRow(item.title, domain)'),'M84 de-duplicated labels preserved');
assert(inbox.includes('ResearchLinkNameDialog.show(this, store, item.url, false, this::reload)'),'Rename refreshes the current inbox');
assert(inbox.includes('source.setTextIsSelectable(true)'),'Original URL remains selectable');
for(const part of [
 'public synchronized boolean rename(String target,String requestedTitle)',
 'ResearchLinkParser.cleanCustomTitle(requestedTitle)',
 'if(item.url.equals(target))',
 'put(updated,item.url,safeTitle,item.addedAt)',
 'return found && preferences.edit().putString(KEY,updated.toString()).commit()',
 'previous!=null?previous.title:',
 'previous!=null?previous.addedAt:System.currentTimeMillis()',
 'MAX_ITEMS=50'
])assert(store.includes(part),'Missing local persistence or custom title preservation: '+part);
assert(!/Supabase|HttpURLConnection|fetch\(|DELETE|cloud backup/.test(store),'Renaming never writes online');
assert(parser.includes('public static String cleanCustomTitle(String raw)'),'Shared title validation');
assert(parser.includes('public static Entry preferSharedSubject('),'Optional browser subjects supported');
assert(gradle.includes('versionCode = 23')&&gradle.includes('0.13.0-m91-private-beta'),'New Android-only beta version');
assert(workflow.includes('android/m91-research-inbox-polish-nov12'),'Private testing branch');
assert(workflow.includes('node scripts/test_m85_research_inbox_rename_contract.cjs'),'Contract runs in CI');
assert(workflow.includes('DisclosureDesk-M91-PRIVATE-BETA'),'M85 artifact name');
assert(!/\bnetlify deploy\b/i.test(workflow),'No public website publishing');
assert(read('guide.html').includes('<strong>Rename</strong>'),'Guide reflects four actions');
console.log('PASS M85 Research Inbox: prompt on share, later rename, URL/age preservation, duplicate-safe title, no network or public deploy.');

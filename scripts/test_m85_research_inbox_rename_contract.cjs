'use strict';
// M85 device-local naming contract. No cloud, network or device data writes.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const activity=read('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java');
const store=read('android-test/app/src/main/java/com/disclosuredesk/preview/ResearchInboxStore.java');
const parser=read('android-test/app/src/main/java/com/disclosuredesk/preview/ResearchLinkParser.java');
const workflow=read('.github/workflows/android-test-apk.yml');
const gradle=read('android-test/app/build.gradle.kts');
for(const part of [
 'ResearchLinkParser.preferSharedSubject(shared,intent.getStringExtra(Intent.EXTRA_SUBJECT))',
 'intent.removeExtra(Intent.EXTRA_SUBJECT);',
 'getWindow().getDecorView().post(()->promptResearchLinkTitle(savedUrl,true))',
 'private void promptResearchLinkTitle(String url,boolean afterShare)',
 'new InputFilter.LengthFilter(120)',
 'name.selectAll();',
 'setOnShowListener',
 'ResearchLinkParser.cleanCustomTitle(name.getText().toString())',
 'researchInbox.rename(url,proposed)',
 'afterShare?"Later":"Cancel"',
 'if(!afterShare)showResearchInbox()'
])assert(activity.includes(part),'Missing safe name prompt: '+part);
const list=activity.slice(activity.indexOf('private void showResearchInbox(){'),
 activity.indexOf('private void showSavedResearchLink('));
assert(list.includes('labels[i]=ResearchLinkParser.formatInboxRow('),'M84 de-duplicated labels preserved');
assert(list.includes('.setItems(labels,(dialog,index)->showSavedResearchLink(entries.get(index)))'),'Tappable list retained');
const actions=activity.slice(activity.indexOf('private void showSavedResearchLink('),
 activity.indexOf('private void promptResearchLinkTitle('));
assert(actions.includes('.setItems(new String[]{"Rename","Open in browser","Copy link","Remove"}'),'Rename visible alongside all existing actions');
assert(actions.includes('setTextIsSelectable(true)'),'Original URL remains readable and selectable');
assert(!actions.includes('setMessage(item.url'),'No message/item collision');
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
assert(gradle.includes('versionCode = 22')&&gradle.includes('0.12.4-m85-private-beta'),'New Android-only beta version');
assert(workflow.includes('android/m85-research-inbox-rename-nov11'),'Private testing branch');
assert(workflow.includes('node scripts/test_m85_research_inbox_rename_contract.cjs'),'Contract runs in CI');
assert(workflow.includes('DisclosureDesk-M85-PRIVATE-BETA'),'M85 artifact name');
assert(!/\bnetlify deploy\b/i.test(workflow),'No public website publishing');
assert(read('guide.html').includes('<strong>Rename</strong>'),'Guide reflects four actions');
console.log('PASS M85 Research Inbox: prompt on share, later rename, URL/age preservation, duplicate-safe title, no network or public deploy.');

'use strict';
// M82 regression: Android AlertDialog.Builder.setMessage and setItems compete for
// the same body region. Test the NON-EMPTY research inbox separately so a saved
// link can never be hidden by a message. No user data or Android login involved.
const assert=require('node:assert/strict'),fs=require('node:fs');
const main=fs.readFileSync('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java','utf8');
const manifest=fs.readFileSync('android-test/app/src/main/AndroidManifest.xml','utf8');
const gradle=fs.readFileSync('android-test/app/build.gradle.kts','utf8');
const workflow=fs.readFileSync('.github/workflows/android-test-apk.yml','utf8');
const start=main.indexOf('private void showResearchInbox(){');
const end=main.indexOf('private void showSavedResearchLink(',start);
assert(start>=0&&end>start,'Native research inbox list method exists');
const section=main.slice(start,end);
const emptyStart=section.indexOf('if(entries.isEmpty()){');
const emptyEnd=section.indexOf('String[] labels=',emptyStart);
assert(emptyStart>=0&&emptyEnd>emptyStart,'Empty state separate from saved-link list');
const nonempty=section.slice(emptyEnd);
for(const needle of [
 'String[] labels=new String[entries.size()]',
 'labels[i]=ResearchLinkParser.formatInboxRow(item.title,host==null?item.url:host)',
 'LinearLayout header=new LinearLayout(this)',
 'TextView heading=new TextView(this)',
 'TextView privacy=new TextView(this)',
 '.setCustomTitle(header)',
 '.setItems(labels,(dialog,index)->showSavedResearchLink(entries.get(index)))',
 '.setNegativeButton("Close",null)',
 '.setNeutralButton("Clear all"',
 'The app',
])if(needle!=='The app')assert(nonempty.includes(needle),'Missing saved-link UI: '+needle);
// The Clear All button deliberately opens a *separate* confirmation dialog
// with setMessage; only the saved-items list builder must avoid that conflict.
const builder=nonempty.slice(nonempty.indexOf('new AlertDialog.Builder(this)'),
  nonempty.indexOf('.setNeutralButton("Clear all"'));
assert(!builder.includes('.setMessage('),
 'CRITICAL: setMessage suppresses setItems rows in Android AlertDialog');
assert(builder.indexOf('.setCustomTitle(header)')<builder.indexOf('.setItems(labels,'),
 'Informational title must precede actual clickable list');
assert(nonempty.includes('privacy.setText("Device only · not synced between accounts. Tap a source to open, copy or remove it.")'),
 'Device-only/account-independent notice remains visible');
assert(section.includes('researchInbox.list()'),'Real device-local items loaded');
assert(!section.includes('getCurrentUser('),'Signed-in website account must not gate local inbox');
const saved=main.slice(end,main.indexOf('private void showFirstRunAlertsPrompt(',end));
assert(saved.includes('.setPositiveButton("Open in browser"'),'Open saved link');
assert(saved.includes('.setNeutralButton("Copy link"'),'Copy saved link');
assert(saved.includes('.setNegativeButton("Remove"'),'Remove saved link with confirmation');
assert(section.includes('.setTitle("Clear Research Inbox?")'),'Clear all is confirmed');
assert(/android:windowSoftInputMode="adjustResize"/.test(manifest),'M79 keyboard setting retained');
assert(/versionCode = 21/.test(gradle),'Current installable beta');
assert(workflow.includes('android/m84-inbox-row-labels-nov11'),'Correct private branch');
assert(workflow.includes('scripts/test_m82_research_inbox_dialog_contract.cjs'),'CI runs hotfix check');
assert(workflow.includes('DisclosureDesk-M84-PRIVATE-BETA'),'New isolated artifact');
assert(!/\bnetlify deploy\b/i.test(workflow),'Website deployment never occurs here');
console.log('PASS M82 native Research Inbox saved-row visibility: message/list collision removed, custom notice and tappable items retained, account-independent local data untouched.');

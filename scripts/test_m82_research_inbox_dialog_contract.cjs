'use strict';
// M82 regression: one saved source must be visible and tappable. M91 uses a native
// list for the inbox; its per-link action dialog still keeps message and list separate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');
const root = 'android-test/app/src/main/';
const main = read(root + 'java/com/disclosuredesk/preview/MainActivity.java');
const inbox = read(root + 'java/com/disclosuredesk/preview/ResearchInboxActivity.java');
const manifest = read(root + 'AndroidManifest.xml');
const gradle = read('android-test/app/build.gradle.kts');
const workflow = read('.github/workflows/android-test-apk.yml');

assert.match(main, /startActivity\(new Intent\(this,ResearchInboxActivity\.class\)\)/);
assert.match(manifest, /<activity android:name="\.ResearchInboxActivity" android:exported="false"\s+android:label="Research Inbox" android:windowSoftInputMode="adjustResize"/);
for (const token of [
    'entries = store.list()', 'list.setAdapter(adapter)', 'list.setEmptyView(empty)',
    'adapter.setRows(matches)', 'new LinkAdapter()', 'matches.add(item)',
    'ResearchLinkParser.matchesInboxSearch(item.title, item.url, query)',
    'link.setOnClickListener(view -> open(item))', 'options.setOnClickListener(view -> showLinkOptions(item))',
    'Saved on this device.', 'No saved links yet', 'No matching links',
    'WindowInsets.Type.displayCutout() | WindowInsets.Type.ime()', 'state.putString("query"',
    '.setTitle("Clear Research Inbox?")', '.setTitle("Remove this saved link?")',
    'Intent.ACTION_VIEW', 'ClipData.newPlainText("Research source", item.url)'
]) assert(inbox.includes(token), 'Missing native inbox behavior: ' + token);
assert(!/getCurrentUser\(|HttpURLConnection|WebView/.test(inbox), 'Inbox requires only device-local data');
const actions = inbox.slice(inbox.indexOf('private void showLinkOptions('), inbox.indexOf('private void open('));
assert(actions.includes('.setCustomTitle(header)'));
assert(actions.includes('.setItems(new String[]{"Open in browser", "Rename", "Copy link", "Remove"}'));
assert(!actions.includes('.setMessage('), 'Dialog message must not hide the selectable actions');
assert.match(gradle, /versionCode = 27/);
assert(workflow.includes('android/m95-restore-editorial-layout-nov13'));
assert(workflow.includes('DisclosureDesk-M95-PRIVATE-BETA'));
assert(workflow.includes('scripts/test_m82_research_inbox_dialog_contract.cjs'));
assert(!/\bnetlify deploy\b/i.test(workflow));
console.log('PASS native Research Inbox list, search, saved-row actions, local-only data and separate confirmation dialogs.');

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const root = 'android-test/app/src/main/';
const java = root + 'java/com/disclosuredesk/preview/';
const activity = fs.readFileSync(java + 'MainActivity.java', 'utf8');
const archive = fs.readFileSync(java + 'OfflineArchiveActivity.java', 'utf8');
const manifest = fs.readFileSync(root + 'AndroidManifest.xml', 'utf8');
const snapshot = root + 'assets/dd-site/';
const site = JSON.parse(fs.readFileSync(snapshot + 'snapshot-manifest.json'));
const release = JSON.parse(fs.readFileSync('.release-staging/public-site/release-manifest.json'));

assert.deepEqual(site.files, release.files.map(file => file.path));
for (const file of release.files) {
    const apkBytes = fs.readFileSync(snapshot + file.path);
    assert.equal(crypto.createHash('sha256').update(apkBytes).digest('hex'), file.sha256, file.path);
}
for (const path of ['terms.html', 'index.html', 'data/curated-historical-cases.json', 'data/historical-news-archive.json']) {
    assert(site.files.includes(path), path);
}
const index = fs.readFileSync(snapshot + 'index.html', 'utf8');
assert(index.includes('ddArchiveCaseId'));
assert(index.includes('m90=tabs'));
assert.match(manifest, /<activity android:name="\.OfflineArchiveActivity" android:exported="false"/);
assert(activity.includes('startActivityForResult(new Intent(this,OfflineArchiveActivity.class),OFFLINE_ARCHIVE_REQUEST)'));
assert(activity.includes('fullView==null'));
assert(activity.includes('LEGAL_PAGES.contains'));
assert(archive.includes('getAssets().open("dd-site/data/" + name)'));
assert(archive.includes('putExtra("archive_case", record.id)'));
assert(!/WebView|HttpURLConnection|supabase|WebMessage/i.test(archive));
console.log('PASS M92: exact allowlisted snapshot, November website routes, and native offline catalogue scope.');

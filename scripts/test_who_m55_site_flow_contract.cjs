'use strict';
// M55: staged public website flow and ZIP QA. Not permission to publish,
// authenticate cases, launch voting or accept new witness counts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ledger=JSON.parse(read('data/public-person-case-links.json'));
const data=JSON.parse(read('data/public-people-directory.json'));
const relationships=ledger.links;
assert.equal(data.people.length,50);
assert.equal(data.people.filter(p=>p.evidenceScope).length,27);
const claims=data.people.flatMap(p=>p.claimEvidence||[]);
assert.equal(claims.length,23);
assert.equal(claims.reduce((n,c)=>n+(c.evidenceReviewSummary.links?.length||0),0),84);
assert(claims.every(c=>c.ratingReadiness.publicationApproval==='withheld'&&
 c.sourceAudit.reviewerSignoff==='not_obtained'&&c.sourceAccessCheck.secondEditorSignoff==='not_obtained'));
const expected={
 'david-fravor':'featured-nimitz-2004',
 'kevin-knuth':'featured-nimitz-2004',
 'larry-warren':'featured-rendlesham-1980',
 'nick-pope':'featured-rendlesham-1980'
};
assert.equal(relationships.length,4,'Only four cited person-to-case records');
for(const link of relationships){
 assert.equal(expected[link.personId],link.caseId,'No new invented link for '+link.personId);
 assert.equal(link.eventVerified,false);
 assert.equal(link.reviewStatus,'editorial-draft');
 assert(link.source.url.startsWith('https://'));
}
assert.equal(relationships.find(l=>l.personId==='david-fravor').role,'firsthand-statement');
assert.equal(relationships.find(l=>l.personId==='kevin-knuth').role,'published-commentary');
assert.match(relationships.find(l=>l.personId==='kevin-knuth').context,/not be counted as an extra eyewitness/);
const who=read('assets/people-directory.js'),home=read('index.html');
const module=read('assets/who-archive-return.js');
const workflow=read('.github/workflows/who-m40-policy-worklist-no-deploy.yml');
const chrome=read('scripts/test_who_m55_real_site_flow_chromium.cjs');
const build=read('scripts/build_public_release.cjs');
for(const x of ["dest.searchParams.set('dd_from','who')","sessionStorage.setItem(CASE_RETURN_KEY",
 "window.DDPeopleDirectoryBack=backToDirectory","'featured-nimitz-2004','featured-rendlesham-1980'"]){
 assert(who.includes(x),'Who origin + return route '+x);
}
assert(home.includes('assets/who-archive-return.js?v=r2-m54-archive-return'));
assert(home.includes("window.DDWhoArchiveReturn?.update?.($('ddWhoArchiveReturn'),String(r.id))"));
assert(home.includes('ddPendingArchiveCase'));
assert(home.includes("archiveCaseOpen(linked.id)"));
assert(home.includes('id="archiveCaseDialog"'));
assert(home.includes('id="ddWhoArchiveReturn"'));
assert(module.includes('marker.caseId!==caseId'));
assert(module.includes('now-marker.savedAt>15*60*1000'));
assert(module.includes("here.searchParams.get('dd_from')!=='who'"));
assert(build.includes("'who-archive-return.js'"));
assert(workflow.includes('prep/who-m55-site-flow-and-android-test-kit-20261117'));
assert(workflow.includes('node scripts/test_who_m55_real_site_flow_chromium.cjs'));
assert(workflow.includes('m55-android-local-preview-artifact:'));
assert(workflow.includes('needs: [source-and-package, chromium-phone-tablet-desktop]'));
assert(workflow.includes('actions/upload-artifact@v4'));
assert(workflow.includes('disclosure-desk-m55-local-web-qa'));
assert(!workflow.includes('netlify')&&!workflow.includes('deploy:'),'No production publishing in QA workflow');
assert(chrome.includes("await page.locator('#archiveCaseDialog')")||
 chrome.includes("const dialog=page.locator('#archiveCaseDialog')"));
assert(chrome.includes("archiveCaseBody"));
assert(chrome.includes("ddWhoArchiveReturn"));
assert(chrome.includes("page.waitForURL"));
assert(chrome.includes('dd_from'));
assert(!build.includes('WHO_M55_ANDROID_TEST_KIT_2026-11-17.md'));
console.log('M55 PASS: 50/23/27 profiles, 84 links, 4 cited Nimitz/Rendlesham relationships, guarded Who/Archive real-site QA and artifact gated on prior tests; no publishing/voting/ratings.');

'use strict';
/* M68 source-first programme and correspondence contract; no account or external APIs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const programmes=JSON.parse(read('data/programmes-places-m58.json'));
const enquiries=JSON.parse(read('data/public-source-verification.json'));
const people=JSON.parse(read('data/public-people-directory.json'));
const additions=JSON.parse(read('data/public-people-directory-additions-m58.json'));
const who=read('who-is-who.html');
const js=read('assets/who-world-programmes-m68.js');
const statuses=read('assets/who-source-status-m68.js');
const sources=read('assets/source-verification.js');
const build=read('scripts/build_public_release.cjs');
const config=read('assets/community-test-config.js');
const approvals=JSON.parse(read('data/who-community-approvals-m64.json'));
assert.equal(programmes.schemaVersion,1);
assert.equal(programmes.total,23);
assert.equal(programmes.records.length,23);
assert.equal(new Set(programmes.records.map(r=>r.id)).size,23);
assert.equal(new Set(programmes.records.map(r=>r.country)).size,18);
assert.equal(programmes.internationalResearchLeads.length,14);
for(const r of programmes.records){
 assert(r.name&&r.country&&r.period&&r.category&&Array.isArray(r.sources)&&r.sources.length>0);
 assert(r.sources.some(s=>/^https:\/\//.test(s.url)),'Missing a verifiable public source '+r.id);
}
const v=programmes.records.find(r=>r.id==='vatican');
assert(v&&v.country==='Vatican City');
assert(v.sources.length>=4);
assert(v.comparisons.some(c=>/1933/.test(c.topic)));
assert(v.comparisons.some(c=>/denial|unresolved/i.test(c.status)||/denial|not a finding/.test(c.caution)));
assert(v.people.some(p=>p.id==='david-grusch'));
assert.equal(programmes.records.find(r=>r.id==='fr-geipan').institutionalStatus,'active_official_unit');
assert.equal(programmes.records.find(r=>r.id==='gb-mod-desk').institutionalStatus,'closed_2009');
assert(programmes.internationalResearchLeads.some(r=>r.country==='Germany'&&r.status==='further_original_source_verification_required'));
assert(programmes.internationalResearchLeads.some(r=>r.country==='China'&&r.url===null));
assert.equal(enquiries.records.length,5);
assert.deepEqual(new Set(enquiries.records.map(r=>r.id)),
 new Set(['osd-151-pages','germany-gep-case-data','brazil-arquivo-nacional-sian','canada-lac-reproduction-permissions','nara-mj12-revision']));
assert.equal(enquiries.records.find(r=>r.id==='osd-151-pages').status,'response_received');
assert.equal(enquiries.records.find(r=>r.id==='brazil-arquivo-nacional-sian').status,'response_received');
assert.equal(enquiries.records.find(r=>r.id==='canada-lac-reproduction-permissions').status,'response_received');
assert.equal(enquiries.records.find(r=>r.id==='germany-gep-case-data').status,'response_received');
assert.equal(enquiries.records.find(r=>r.id==='nara-mj12-revision').status,'sent_unacknowledged');
assert.equal(people.people.length,50);
assert(additions.people?.length>=7);
for(const marker of ['id="ddWhoProgrammes"','id="ddWhoProgrammesDisclosure"','id="ddWhoProgrammeCards"',
 'id="ddWhoProgrammeLeads"','id="ddWhoOutreachStatus"','data-dd-who-programme-jump="Vatican"',
 'href="/sources#sourceVerification"','who-world-programmes-m68.js','who-source-status-m68.js',
 'who-world-programmes-m68.css'])assert(who.includes(marker),'Who directory needs '+marker);
for(const key of ['programmes-places-m58.json','id===\'vatican\'','original-source','dd-who-programme-comparison','dd-who-programme-caution']){
 assert(js.includes(key),'Programme renderer must keep source/warning control '+key);
}
assert(!js.includes('supabase.co')&&!statuses.includes('supabase.co'));
assert(js.includes('document.createElement')&&statuses.includes('document.createElement'));
assert(statuses.includes('/data/public-source-verification.json'),'Must reuse canonical correspondence source');
assert(sources.includes("doc.id='dd-enquiry-'+r.id"),'Status list needs deep-link anchors');
for(const x of ['who-world-programmes-m68.js','who-world-programmes-m68.css','who-source-status-m68.js'])
 assert(build.includes("'"+x+"'"),'M68 public file missing from explicit allowlist: '+x);
assert(!build.includes('WHO_M63_FIVE_CRITERIA_BALLOTS_SQL_DRAFT_ONLY.sql'));
assert(config.includes('whoEvidenceBallots:false'));
assert.deepEqual(approvals.approvedClaims,[]);
assert(!/googletagmanager|gtag\s*\(/.test(who));
console.log('M68 CONTRACT PASS: 23 source-linked institutions across 18 jurisdictions, 14 unverified country leads, Vatican 1933 contested sourcing, 5 canonical enquiry statuses, no person rating or live vote.');

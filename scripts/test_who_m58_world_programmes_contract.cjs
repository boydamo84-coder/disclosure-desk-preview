'use strict';
// M58 government programme and original case-source directory. NO DEPLOY.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const catalogue=JSON.parse(read('data/programmes-places-m58.json'));
const additions=JSON.parse(read('data/public-people-directory-additions-m58.json'));
const people=JSON.parse(read('data/public-people-directory.json'));
const build=read('scripts/build_public_release.cjs');
const page=read('world-uap-programmes.html'),js=read('assets/world-uap-programmes.js');
const sources=read('sources.html'),home=read('index.html'),who=read('who-is-who.html');
assert.equal(catalogue.total,23);
assert.equal(catalogue.records.length,23);
assert.equal(new Set(catalogue.records.map(r=>r.id)).size,23);
assert.equal(new Set(catalogue.records.map(r=>r.country)).size,18);
assert.equal(catalogue.internationalResearchLeads.length,14);
const originalSeven=['aaro','aatip','aawsap','project-blue-book','nids','skinwalker-ranch','vatican'];
assert(originalSeven.every(id=>catalogue.records.some(r=>r.id===id)));
const validated=[
['France','geipan-france','dedicated_unit'],['Chile','cl-sefaa','dedicated_unit'],
['Argentina','ar-ciae','dedicated_unit'],['Uruguay','uy-cridovni','dedicated_unit'],
['Peru','pe-oifaa','historical_office'],['Italy','it-ovni','reporting_process'],
['Brazil','br-ufo-archive','government_archive'],['United Kingdom','gb-mod-desk','historical_office'],
['Spain','es-ovni-archive','government_archive'],['Denmark','dk-ufo-archive','government_archive'],
['Canada','ca-sky','government_review'],['Australia','au-raaf','government_archive'],
['New Zealand','nz-nzdf','government_archive'],['Mexico','mx-campeche','government_case_record'],
['Sweden','se-ghost','historical_office'],['Japan','jp-uap','reporting_process']
];
for(const [country,id,type]of validated){
 const x=catalogue.records.find(r=>r.id===id);
 assert(x&&x.country===country&&x.category===type,'Missing/misclassified original-source record '+country);
 assert(x.flag.length>0&&x.description.length>=60&&x.period.length>=4);
 assert(Array.isArray(x.sources)&&x.sources.length>=1);
 assert(x.sources.every(y=>y.url.startsWith('https://')&&y.scope.length>=50));
 assert(Array.isArray(x.featuredCases)&&x.featuredCases.length>=1);
 assert(x.featuredCases.every(y=>y.sourceUrl.startsWith('https://')&&y.description.length>=55));
}
for(const x of catalogue.records)assert(x.country&&x.category&&x.institutionalStatus);
assert(catalogue.internationalResearchLeads.some(x=>x.country==='China'&&x.url===null));
assert(catalogue.internationalResearchLeads.some(x=>x.country==='Russia'&&x.url===null));
assert(catalogue.internationalResearchLeads.some(x=>x.country==='Ireland'));
assert.equal(additions.people.length,6,'Staged person additions kept separate until full Who tests updated');
assert.deepEqual(additions.people.map(x=>x.id),[
 'sean-kirkpatrick','robert-bigelow','john-lear','james-lacatski','j-allen-hynek','stanton-friedman'
]);
assert(additions.people.every(x=>x.photo===null&&!x.claimEvidence),'No invented portrait permissions or public case ratings');
assert.equal(people.people.length,50,'Live Who directory currently remains its separately reviewed 50');
assert.equal(people.people.flatMap(x=>x.claimEvidence||[]).length,23);
assert(people.people.flatMap(x=>x.claimEvidence||[]).every(x=>x.ratingReadiness.publicationApproval==='withheld'));
for(const f of ['world-uap-programmes.html','world-uap-programmes.js','programmes-places-m58.json'])assert(build.includes(f),'New public read-only file not explicitly approved in builder: '+f);
for(const s of [sources,home,who])assert(s.includes('/world-uap-programmes.html'),'Navigation missing');
assert(page.includes('programmeSearch')&&page.includes('programmeType')&&page.includes('programmeResults'));
assert(page.includes('researchLeads')&&page.includes('leadsCount'));
assert(js.includes("textContent")&&js.includes("createElement")&&js.includes("rel='noopener noreferrer'"));
assert(!/localStorage|sessionStorage|\.rpc\(|dd_who_claim_rating_set/.test(js),'No voting, account or persistent user state');
assert(!/ratingSave|votingEnabled|claim-score/.test(page+js));
assert(!build.includes('public-people-directory-additions-m58.json'),'Unreviewed six-person staging file must not be deployed');
assert(!build.includes('who-m57-all-50-enrichment-queue.json'),'Private per-person research backlog is not public');
console.log('M58 world directory structural checks: 23 entries / 18 jurisdictions, 16 international source-backed entries, 14 pending-country leads, 6 staged people still private, public case/source links, no voting or deploy.');

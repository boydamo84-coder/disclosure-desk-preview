'use strict';
// M54: context-specific return only, with no open redirect or fabricated case/witness link.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const back=require('../assets/who-archive-return.js');
const here='http://127.0.0.1:4173/?dd_tab=archivePage&dd_archive_case=featured-nimitz-2004&dd_from=who';
const now=1800000000000;
const marker={
 personId:'kevin-knuth',personName:'Kevin Knuth',origin:'http://127.0.0.1:4173',page:'/who-is-who.html?person=kevin-knuth',
 target:'archive',caseId:'featured-nimitz-2004',savedAt:now-1000,
 directoryReturn:null,y:1500
};
function resolved(item=marker,url=here,caseId='featured-nimitz-2004',when=now){
 return back.resolve(item,url,caseId,when);
}
assert.equal(back.KEY,'dd-who-case-return-v1');
assert.deepEqual(resolved(),{
 href:'/who-is-who.html?person=kevin-knuth',personId:'kevin-knuth',caseId:'featured-nimitz-2004'
},'Exact archive/person origin returns the internal profile route');
assert.deepEqual(resolved({...marker,savedAt:now-15*60*1000}),resolved(),'A 15-minute age boundary is valid');
assert.equal(resolved({...marker,savedAt:now-15*60*1000-1}),null,'Expired marker must not display');
assert.equal(resolved({...marker,savedAt:now+1}),null,'Future marker must not display');
assert.equal(resolved({...marker,caseId:'featured-rendlesham-1980'}),null,'Reject mismatched case marker');
assert.equal(resolved(marker,here,'featured-rendlesham-1980'),null,'Hide return when a different case is opened');
assert.equal(resolved({...marker,personId:'larry-warren'}),null,'Profile route must match the marker identity');
assert.equal(resolved({...marker,personId:'../../google.com'}),null,'No path injection');
assert.equal(resolved({...marker,target:'dossier'}),null,'Dossier navigation is not an Archive visit');
assert.equal(resolved({...marker,origin:'https://another.example'}),null,'Reject foreign saved origin');
assert.equal(resolved({...marker,origin:undefined}),null,'Reject legacy marker missing origin');
assert.equal(resolved({...marker,page:'https://evil.example/who-is-who.html?person=kevin-knuth'}),null,'Reject cross-origin URL');
assert.equal(resolved({...marker,page:'//evil.example/who-is-who.html?person=kevin-knuth'}),null,'Reject protocol-relative redirect');
assert.equal(resolved({...marker,page:'/who-is-who.html?person=kevin-knuth&next=https://evil.example'}),null,'Reject extra query parameters');
assert.equal(resolved(marker,here.replace('&dd_from=who','')),null,'Direct Archive browsing has no contextual return');
assert.equal(resolved(marker,here.replace('dd_from=who','dd_from=other')),null,'Explicit Who marker required');
assert.equal(resolved(marker,here.replace('dd_tab=archivePage','dd_tab=discover')),null,'Only Archive deep link');
assert.equal(resolved(marker,'https://another.example/?dd_tab=archivePage&dd_from=who'),null,'Marker from different origin is not usable');
assert.equal(resolved(null),null,'Missing storage marker must fail closed');
assert.equal(resolved('bad data'),null,'Malformed data must fail closed');
assert.equal(resolved({...marker,savedAt:NaN}),null,'Invalid timestamp must fail closed');
const index=read('index.html'),reader=read('assets/people-directory.js'),build=read('scripts/build_public_release.cjs');
assert(index.includes('id="ddWhoArchiveReturnWrap" hidden'),'No empty visible return bar on normal Archive visits');
assert(index.includes('id="ddWhoArchiveReturn" class="outline" hidden'),'Button initially hidden');
assert(index.includes('assets/who-archive-return.js?v=r2-m54-archive-return'),'Module loaded with cache-busting version');
assert(index.includes("window.DDWhoArchiveReturn?.update?.($('ddWhoArchiveReturn'),String(r.id))"),'Case identity passed to return control');
assert(index.includes('#ddWhoArchiveReturnWrap[hidden]{display:none!important}'),'No hidden-element CSS collision');
assert(reader.includes("dest.searchParams.set('dd_from','who')"));
assert(reader.includes("sessionStorage.setItem(CASE_RETURN_KEY"));
assert(reader.includes("const CASE_RETURN_KEY='dd-who-case-return-v1'"));
assert(build.includes("'who-archive-return.js'"),'Explicit public release allowlist');
assert(!build.includes('WHO_M54_ARCHIVE_CONTEXT_RETURN_2026-11-17.md'),'Internal report is not packaged');
const p=JSON.parse(read('data/public-person-case-links.json'));
assert.equal(p.links.length,4,'No person/case attributions changed');
assert(p.links.every(x=>x.reviewStatus==='editorial-draft'&&x.eventVerified===false));
const who=JSON.parse(read('data/public-people-directory.json')).people;
assert.equal(who.length,50);
assert.equal(who.flatMap(x=>x.claimEvidence||[]).length,23);
assert(who.flatMap(x=>x.claimEvidence||[]).every(x=>x.ratingReadiness.publicationApproval==='withheld'));
console.log('M54 PASS: strict contextual Who return, case/person/URL/timestamp validation, no redirect, safe hidden Archive control, 50/23 profiles, 4 unverified person-case links, ratings withheld.');

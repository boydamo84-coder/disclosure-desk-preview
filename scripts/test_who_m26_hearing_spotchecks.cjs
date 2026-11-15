'use strict';
// M26: review locator contract. NO automatic judgement on extraordinary origins,
// no fabricated human verification, and no scores. Pure local file reads only.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data/public-people-directory.json'),'utf8'));
const expected={
 'ryan-graves':[/Rep\. Raskin/i,/not on the aircraft|not personally witnessed/i,/near.miss|other pilot|50-foot/i],
 'david-fravor':[/later obtained the 90-second video|later flight crew|subsequent sortie/i,/fire.control radar/i,/Fravor/i],
 'david-grusch':[/had not seen alleged bodies|not personally seen alleged bodies/i,/other people|secondhand|accounts collected/i,/Burlison/i]
};
assert.equal(data.people.length,50,'50 people preserved');
let audited=0;
for(const [id,patterns] of Object.entries(expected)){
 const p=data.people.find(x=>x.id===id);
 assert(p&&p.claimEvidence?.length===1,'M26 covered person has precisely one claim: '+id);
 const c=p.claimEvidence[0],a=c.sourceAudit;
 const spot=a.m26DirectHearingSpotCheck;
 assert(spot,'Spot check not documented: '+id);
 assert.equal(spot.originalUrl,
 'https://www.govinfo.gov/content/pkg/CHRG-118hhrg53022/html/CHRG-118hhrg53022.htm');
 assert.equal(spot.checkedAt,'2026-11-15');
 assert.equal(spot.method,'direct_first_party_public_hearing_text_spot_check_not_whole_case_review');
 assert.equal(spot.independentSecondHumanEditor,false);
 assert.equal(spot.permissionToPublishPercentage,false);
 for(const pattern of patterns)
  assert.match([spot.locator,spot.attribution,spot.verificationLimit,a.independentEvidence].join(' '),pattern,
   'Source attribution important distinction absent: '+id+' '+pattern);
 assert.equal(c.sourceAccessCheck.fullOriginalReviewed,false,
  'Spot check is not complete investigation review: '+id);
 assert.equal(c.sourceAccessCheck.secondEditorSignoff,'not_obtained',
  'No second human editor has been supplied: '+id);
 assert.equal(c.ratingReadiness.publicationApproval,'withheld',
  'No source-only spot check can authorize a numeric rating: '+id);
 audited++;
}
assert.equal(data.people.filter(p=>p.claimEvidence?.[0]?.sourceAudit?.m26DirectHearingSpotCheck).length,3,
 'Spot-check provenance applies precisely to 3 named sources');
assert.equal(data.people.filter(p=>p.claimEvidence?.length).length,23);
assert.equal(data.people.reduce((n,p)=>n+(p.claimEvidence||[]).reduce((m,c)=>m+c.researchEvidence.items.length,0),0),89);
assert(data.people.every(p=>p.photoRightsAudit?.finalRightsApproval===false),'No image rights automatically approved');
console.log('M26 first-party hearing audit: 3 specific direct/secondhand distinctions with original locators verified; 50 profiles, 23 claims, 89 evidence entries, zero editorial/photo approvals (NO DEPLOY).');

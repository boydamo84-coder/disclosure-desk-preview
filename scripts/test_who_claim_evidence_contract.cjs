'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert.match(html,/id="profileEvidenceReviews"/);
assert.match(html,/id="claimReviewMethod"/);
assert.match(html,/r2-evidence-ledger-v15-20261115/);
assert.match(html,/claim-role-card/);
assert.match(html,/claim-work-card/);
assert.match(home,/all <strong>50 Who's Who people have an expanded source reader/);
assert.match(html,/original-source role records/);
assert.match(html,/View evidence &amp; scoring breakdown/);
assert.match(html,/claim-evidence-details/);
assert.match(html,/Community rating/);
assert.match(html,/Scientific and policy recommendations are Not applicable/);
assert.match(home,/Twenty-three source-linked profiles now contain/);
assert.match(home,/27 people now have individual, source-linked research-scope decisions/);
assert.match(home,/All 23 claim\/recommendation research panels now include/);
assert.match(home,/27 source-backed NASA and congressional role cards/);
assert.match(html,/community-test-config\.js/);
assert.match(html,/supabase-js@2\.119\.0/);
assert.match(home,/id="ddR3ReleaseAnnouncement"/);
assert.match(home,/Who's Who — how the two ratings work/);
assert.match(home,/once voting has passed its account-security/);
assert.match(html,/Statements are attributed/);
assert.match(html,/secondary-editorial-nav\.js/);
assert.match(html,/source trail and editorial checks/);
assert.equal(data.people.length,50,'Existing Who’s Who directory must retain all 50 public profiles');
const roleEntries=data.people.filter(p=>p.roleEvidence);
assert.equal(roleEntries.length,27,'17 NASA (16 members and a designated coordinator) plus 10 congressional roles');
const workEntries=data.people.filter(p=>p.publicWorkEvidence);
assert.equal(workEntries.length,17,'17 remaining named people must have original-publication source trails');
assert.equal(workEntries.reduce((n,p)=>n+p.publicWorkEvidence.sources.length,0),39,
 '17 publisher and research source cards now include 39 inspected/indexed entries, two official FOIA links newly added');
assert.equal(new Set(data.people.filter(p=>p.roleEvidence||p.publicWorkEvidence||p.claimEvidence?.length).map(p=>p.id)).size,50,
 'All 50 original profiles must now have an expanded source reader');
for(const p of workEntries){
 const work=p.publicWorkEvidence;
 assert.equal(work.status,'research_links_indexed');
 assert(work.title.length>=12&&work.description.length>=65&&work.openQuestions.length>=80);
 assert(work.sources.length>=2);
 for(const src of work.sources){
  assert(src.url.startsWith('https://'));
  assert(src.title.length>=12&&src.locator.length>=5&&src.note.length>=45);
  assert.match(src.indexedAt,/^\d{4}-\d{2}-\d{2}$/);
 }
}
assert.match(data.people.find(p=>p.id==='larry-warren').publicWorkEvidence.openQuestions,/Halt/);
assert.equal(data.people.find(p=>p.id==='larry-warren').publicWorkEvidence.sources.length,5);

assert.equal(roleEntries.reduce((n,p)=>n+p.roleEvidence.sources.length,0),56,
 'All 27 role records must keep 56 openable official reference entries');
assert.equal(roleEntries.filter(p=>p.roleEvidence.kind==='institutional_role').length,17);
assert.equal(roleEntries.filter(p=>p.roleEvidence.kind==='legislative_role').length,7);
assert.equal(roleEntries.filter(p=>p.roleEvidence.kind==='legislative_action').length,2);
assert.equal(roleEntries.filter(p=>p.roleEvidence.kind==='congressional_oversight').length,1);
assert.equal(data.people.find(p=>p.id==='jen-buss').roleEvidence.officialListedName,'Jennifer Buss');
assert.match(data.people.find(p=>p.id==='daniel-evans').roleEvidence.title,/coordinat/);
assert.match(data.people.find(p=>p.id==='jared-moskowitz').roleEvidence.description,/not one of the named task-force members/);
assert.match(data.people.find(p=>p.id==='chuck-schumer').roleEvidence.description,/eventual enacted law/);
for(const p of roleEntries){
 const role=p.roleEvidence;
 assert.equal(role.status,'official_source_crosscheck');
 assert.match(role.eventDate,/^\d{4}-\d{2}-\d{2}$/);
 assert(role.title.length>=12&&role.description.length>=60);
 assert(role.sources.length>=2);
 for(const e of role.sources){
  assert(e.url.startsWith('https://'));
  assert(e.title.length>=8&&e.note.length>=25&&e.locator.length>=6);
  assert.match(e.checkedAt,/^\d{4}-\d{2}-\d{2}$/);
 }
}

const scopes=data.people.filter(p=>p.evidenceScope);
assert.equal(scopes.length,27,'All 27 remaining profiles must have explicit evidence-scope source decisions');
assert.equal(scopes.filter(p=>p.roleEvidence).length,26,'16 NASA, 10 Congress role-only profiles');
assert.equal(scopes.filter(p=>p.publicWorkEvidence && !p.roleEvidence).length,1,'One FOIA archivist source-scope decision');
assert.equal(scopes.reduce((n,p)=>n+p.evidenceScope.sourceChecks.length,0),60,'Exactly 60 original-source scope cross-references, not independent corroborations');
assert(scopes.every(p=>!p.claimEvidence?.length),'No role-only profile may hide a reviewed individual claim');
assert.equal(data.people.filter(p=>p.evidenceScope&&p.evidenceScope.applicability==='not_applicable_to_documented_role').length,27);
for(const p of scopes){
 const d=p.evidenceScope;
 assert.equal(d.status,'research_scope_draft','Role source-scope review must remain unsigned and explicitly draft');
 assert.equal(d.classification,'documented_role_or_publication_only');
 assert.equal(d.applicability,'not_applicable_to_documented_role','No zero or invented incident score for roles');
 assert.match(d.reviewDate,/^\d{4}-\d{2}-\d{2}$/);
 assert(d.originalRole.length>=30&&d.reason.length>=80&&d.nextEvidenceNeeded.length>=80);
 assert(d.sourceChecks.length>=2&&d.sourceChecks.length<=6);
 for(const src of d.sourceChecks){
  assert(src.url.startsWith('https://'));
  assert(src.title.length>10&&src.locator.length>=6&&src.interpretation.length>=30);
 }
 assert(!Object.hasOwn(p,'believability') && !Object.hasOwn(d,'score'));
}
assert.equal(data.people.find(p=>p.id==='mike-gold').evidenceScope,undefined,'Keep reviewed individual research recommendation separate from all role-only decisions');
assert.equal(scopes.filter(p=>p.roleEvidence?.kind==='institutional_role').length,16,'Mike Gold separately has a policy review plus role');
assert.equal(scopes.filter(p=>p.roleEvidence?.kind==='legislative_role').length,7);
assert.equal(scopes.filter(p=>p.roleEvidence?.kind==='legislative_action').length,2);
assert.equal(scopes.filter(p=>p.roleEvidence?.kind==='congressional_oversight').length,1);
assert(data.people.find(p=>p.id==='anna-paulina-luna').evidenceScope.sourceChecks.some(s=>s.url.includes('luna-opens-hearing')),'Luna future Eglin assertion candidate indexed, not yet scored');
assert(data.people.find(p=>p.id==='chuck-schumer').evidenceScope.sourceChecks.some(s=>s.url.includes('archives.gov')),'Enacted archival law distinguished from 2023 Senate proposal');
assert(!data.people.find(p=>p.id==='john-greenewald-jr').claimEvidence?.length,'FOIA request never manufactured into event claim');

const originalAuditIds=['david-grusch','ryan-graves','david-fravor','tim-gallaudet','luis-elizondo','michael-shellenberger','mike-gold'];
const technicalAuditIds=['mick-west','avi-loeb','garry-nolan','jacques-vallee','kevin-knuth'];
const reportingAuditIds=['ross-coulthart','jeremy-corbell','steven-greer','george-knapp'];
const finalAuditIds=['bob-lazar','jake-barber','larry-warren','nick-pope','christopher-mellon','james-fox','leslie-kean'];
const allAuditIds=[...originalAuditIds,...technicalAuditIds,...reportingAuditIds,...finalAuditIds];
const sourceAccess=data.people.filter(p=>p.claimEvidence?.[0]?.sourceAccessCheck).map(p=>p.claimEvidence[0].sourceAccessCheck);
assert.equal(sourceAccess.length,23,'M16 source accessibility status for every one of 23 claims');
assert.equal(sourceAccess.filter(a=>a.status==='full_original_recheck_pending').length,19);
assert.equal(sourceAccess.filter(a=>a.status==='original_page_fetch_unavailable').length,3);
assert.equal(sourceAccess.filter(a=>a.status==='publisher_video_metadata_verified').length,1);
assert(sourceAccess.every(x=>x.fullOriginalReviewed===false&&x.secondEditorSignoff==='not_obtained'));
assert.equal(data.people.filter(p=>p.photoRightsAudit).length,50,'Photo/initials reuse triage covers every profile');
assert.equal(data.people.filter(p=>p.photoRightsAudit.status==='license_metadata_crosschecked').length,5);
assert.equal(data.people.filter(p=>p.photoRightsAudit.status==='license_listing_recheck_pending').length,15);
assert.equal(data.people.filter(p=>p.photoRightsAudit.status==='initials_fallback_no_licensed_photo_selected').length,30);
assert(data.people.every(p=>p.photoRightsAudit.finalRightsApproval===false),'No rights signoff invented');
assert.equal(data.people.filter(p=>p.photo?.url).length,20,'No previously selected portrait removed');
assert.equal(data.people.find(p=>p.id==='larry-warren').claimEvidence[0].sourceAccessCheck.status,'publisher_video_metadata_verified');
assert.equal(data.people.find(p=>p.id==='bob-lazar').claimEvidence[0].sourceAccessCheck.status,'original_page_fetch_unavailable');
const scoreReadiness=data.people.filter(p=>p.claimEvidence?.[0]?.ratingReadiness).map(p=>p.claimEvidence[0].ratingReadiness);
assert.equal(scoreReadiness.length,23,'All 23 claim drafts must have one first-pass scoring suitability decision');
assert.equal(scoreReadiness.filter(r=>r.scorePath==='incident_evidence_review_pending').length,6);
assert.equal(scoreReadiness.filter(r=>r.scorePath==='documentary_source_review_pending').length,9);
assert.equal(scoreReadiness.filter(r=>r.scorePath==='method_specific_review_pending').length,6);
assert.equal(scoreReadiness.filter(r=>r.scorePath==='not_applicable_to_incident_score').length,2);
assert(scoreReadiness.every(r=>r.status==='first_pass_triage'&&r.publicationApproval==='withheld'&&r.secondEditor==='not_assigned'));
assert.deepEqual(data.people.filter(p=>p.claimEvidence?.[0]?.ratingReadiness?.scorePath==='not_applicable_to_incident_score').map(p=>p.id).sort(),['christopher-mellon','mike-gold']);
assert.equal(data.people.filter(p=>p.claimEvidence?.some(c=>c.sourceAudit)).length,23,'All 23 original-source drafts cover 7 congressional, 5 technical, 4 reporting and 7 final-case sources; no scores');
for(const id of allAuditIds){
 const person=data.people.find(p=>p.id===id),audit=person?.claimEvidence?.[0]?.sourceAudit;
 assert(audit, 'Missing original-record audit draft '+id);
 assert.equal(audit.status,'original_record_comparison_draft');
 assert.equal(audit.reviewerSignoff,'not_obtained','No original comparison impersonates a second editor');
 assert.match(audit.checkedAt,/^\d{4}-\d{2}-\d{2}$/);
 if(originalAuditIds.includes(id))assert(audit.original.url.startsWith('https://www.govinfo.gov/content/pkg/CHRG-'));
 else assert(audit.original.url.startsWith('https://'),'Science/video records must originate from first-party public analytical source');
 assert(audit.original.locator.length>=25&&audit.original.assessment.length>=75);
 assert(audit.independentEvidence.length>=75&&audit.competingRecord.length>=75&&audit.missingEvidence.length>=75);
 assert(!person.claimEvidence[0].review&&!person.claimEvidence[0].sourceReviewApproved,'No rating approval');
}
assert.match(data.people.find(p=>p.id==='david-grusch').claimEvidence[0].sourceAudit.original.assessment,/not personally seen alleged bodies/);
assert.match(data.people.find(p=>p.id==='ryan-graves').claimEvidence[0].sourceAudit.original.assessment,/OTHER Navy flight crew/);
assert.match(data.people.find(p=>p.id==='david-fravor').claimEvidence[0].sourceAudit.independentEvidence,/shared encounter/i);
assert.match(data.people.find(p=>p.id==='tim-gallaudet').claimEvidence[0].sourceAudit.competingRecord,/NOT the alleged email/i);
assert.match(data.people.find(p=>p.id==='michael-shellenberger').claimEvidence[0].sourceAudit.independentEvidence,/not independent agency programme confirmation/i);
assert.match(data.people.find(p=>p.id==='mike-gold').claimEvidence[0].sourceAudit.original.assessment,/not for NASA/);

const nolan=data.people.find(p=>p.id==='garry-nolan').claimEvidence[0],vallee=data.people.find(p=>p.id==='jacques-vallee').claimEvidence[0];
assert.equal(nolan.sourceAudit.relatedSourceGroup,vallee.sourceAudit.relatedSourceGroup,'Nolan and Vallee are one study/sample, never two independent replications');
assert.equal(nolan.sourceAudit.original.url,vallee.sourceAudit.original.url,'Shared DOI article link identical');
assert.match(nolan.sourceAudit.original.assessment,/terrestrial-normal isotope ratios/);
assert.match(vallee.sourceAudit.independentEvidence,/NOT create two independently corroborated/i);
const loeb=data.people.find(p=>p.id==='avi-loeb').claimEvidence[0],west=data.people.find(p=>p.id==='mick-west').claimEvidence[0],knuth=data.people.find(p=>p.id==='kevin-knuth').claimEvidence[0];
assert.match(loeb.sourceAudit.original.assessment,/no recovered material can be definitively attributed to IM1/i,'Do not equate 2023 seafloor collection with certified 2014 meteor debris');
assert(loeb.researchEvidence.items.some(e=>e.id==='loeb-2025-team-morphology-reassessment'&&e.url.includes('S0009254125000178')),'2025 coauthor mixed/terrestrial re-evaluation linked to reader');
assert(loeb.researchEvidence.items.some(e=>e.id==='loeb-2025-peer-critique'),'Independent critical 2025 Chemical Geology paper preserved');
assert.match(loeb.sourceAudit.competingRecord,/not tallied as separate extraterrestrial confirmations/);
assert.match(west.sourceAudit.original.assessment,/camera\/pod rotation/);
assert.match(west.sourceAudit.competingRecord,/2026 technical debate/,'Recorded forum counterarguments remain exploratory, not forensic certainty');
assert.match(knuth.sourceAudit.original.assessment,/0\.78 seconds/);
assert.match(knuth.sourceAudit.missingEvidence,/78-second retelling/);
for(const id of ['garry-nolan','jacques-vallee']){
 const c=data.people.find(p=>p.id===id).claimEvidence[0];
 assert(c.researchEvidence.items.some(e=>e.stance==='challenges'&&e.url.includes('metabunk.org')),'Public method criticism labelled as informal and contestable');
}
assert.equal(allAuditIds.length,23);
assert.match(data.people.find(p=>p.id==='ross-coulthart').claimEvidence[0].sourceAudit.original.assessment,/video player was not accessible/);
assert.match(data.people.find(p=>p.id==='jeremy-corbell').claimEvidence[0].sourceAudit.original.assessment,/does NOT independently certify/);
assert.match(data.people.find(p=>p.id==='steven-greer').claimEvidence[0].sourceAudit.independentEvidence,/NOT be counted as 420 confirmed/);
assert.match(data.people.find(p=>p.id==='george-knapp').claimEvidence[0].sourceAudit.original.assessment,/not a UFO eyewitness/);
assert.equal(data.people.find(p=>p.id==='george-knapp').claimEvidence[0].sourceAudit.original.url,'https://oversight.house.gov/wp-content/uploads/2025/09/George-Knapp-Written-Testimony.pdf');
assert.match(data.people.find(p=>p.id==='bob-lazar').claimEvidence[0].sourceAudit.original.assessment,/later electronic reproduction/);
assert.match(data.people.find(p=>p.id==='jake-barber').claimEvidence[0].sourceAudit.independentEvidence,/SAME newsroom/);
assert.match(data.people.find(p=>p.id==='larry-warren').claimEvidence[0].sourceAudit.independentEvidence,/UK National Archives/);
assert.equal(data.people.find(p=>p.id==='larry-warren').claimEvidence[0].sourceAudit.relatedSourceGroup,data.people.find(p=>p.id==='nick-pope').claimEvidence[0].sourceAudit.relatedSourceGroup,'Warren and Pope refer to one historical incident, not two independently corroborated events');
assert.match(data.people.find(p=>p.id==='nick-pope').claimEvidence[0].sourceAudit.original.assessment,/does NOT claim to have been present/);
assert.match(data.people.find(p=>p.id==='christopher-mellon').claimEvidence[0].sourceAudit.competingRecord,/legitimately postponed records/);
assert.match(data.people.find(p=>p.id==='james-fox').claimEvidence[0].sourceAudit.original.assessment,/1966.*typo/);
assert.match(data.people.find(p=>p.id==='leslie-kean').claimEvidence[0].sourceAudit.original.assessment,/identities or full primary statements/);
assert.equal(data.people.find(p=>p.id==='leslie-kean').claimEvidence[0].sourceAudit.relatedSourceGroup,data.people.find(p=>p.id==='ross-coulthart').claimEvidence[0].sourceAudit.relatedSourceGroup,'Coulthart and Kean share Grusch reporting ancestry');
assert(data.people.every(p=>!p.claimEvidence?.length||!!p.claimEvidence[0].sourceAudit),'No claim draft is left without original-record source audit');


const candidates=data.people.filter(p=>Array.isArray(p.claimEvidence)&&p.claimEvidence.length);
assert.equal(candidates.length,23,'Eighteen earlier drafts plus five original-claim source reviews remain unassessed');
assert.equal(candidates.reduce((n,p)=>n+(p.claimEvidence[0].researchEvidence?.items?.length||0),0),89,
 'Twenty-three claim drafts must retain eighty-nine provisional evidence/context entries including 2025 author reply and shared-paper critique');
const newCaseIds=['bob-lazar','jake-barber','larry-warren','mick-west','avi-loeb'];
for(const caseId of newCaseIds){
 const person=data.people.find(p=>p.id===caseId);
 assert.equal(person.claimEvidence?.length,1,`${caseId}: exactly one review-pending event or analysis claim`);
 assert.equal(person.claimEvidence[0].status,'source_review_pending');
 assert.equal(person.claimEvidence[0].researchEvidence?.status,'research_draft');
 assert(person.claimEvidence[0].researchEvidence.items.length>=3);
 assert(person.publicWorkEvidence,'Retain original publications panel alongside claim-specific review');
 assert(!person.claimEvidence[0].review,'No real numeric review allowed before separate editorial sign-off');
}
assert(data.people.find(p=>p.id==='avi-loeb').claimEvidence[0].researchEvidence.items.some(e=>e.stance==='challenges'),'Loeb chemistry must include independent 2025 chemical critique');
assert(data.people.find(p=>p.id==='larry-warren').claimEvidence[0].researchEvidence.items.some(e=>/Halt/i.test(e.title)),'Rendlesham opposing account preserved');
assert(data.people.find(p=>p.id==='mick-west').claimEvidence[0].researchEvidence.items.some(e=>e.stance==='challenges'),'Gimbal alternate interpretation preserved');
assert(data.people.filter(p=>p.claimEvidence?.some(c=>c.review?.status==='published')).length===0,'Never display a real-person editorial percentage before review');
const newNextIds=['ross-coulthart','jeremy-corbell','steven-greer','garry-nolan','jacques-vallee','kevin-knuth'];
for(const caseId of newNextIds){
 const person=data.people.find(p=>p.id===caseId);
 assert.equal(person.claimEvidence?.length,1,`${caseId}: one specifically attributed source review`);
 assert.equal(person.claimEvidence[0].status,'source_review_pending');
 assert.equal(person.claimEvidence[0].researchEvidence?.status,'research_draft');
 assert(person.claimEvidence[0].researchEvidence.items.length>=3);
 assert(person.publicWorkEvidence,'Keep existing professional source reader');
 assert(!person.claimEvidence[0].review,'No signed off editorial percentage may be included');
}
const nolanClaim=data.people.find(p=>p.id==='garry-nolan').claimEvidence[0];
const valleeClaim=data.people.find(p=>p.id==='jacques-vallee').claimEvidence[0];
assert.equal(nolanClaim.sources[0].url,valleeClaim.sources[0].url,'Shared journal paper must match: not independent reproductions');
assert(nolanClaim.researchEvidence.editorialNote.includes('duplicate Jacques Vallée') || nolanClaim.researchEvidence.editorialNote.includes('same'), 'Nolan review must explicitly prevent duplicated study');
assert(valleeClaim.researchEvidence.editorialNote.includes('Nolan'), 'Vallée review identifies same study');
assert(data.people.find(p=>p.id==='ross-coulthart').claimEvidence[0].researchEvidence.items.some(s=>s.stance==='challenges'),'Original Australian critique not omitted');
assert(data.people.find(p=>p.id==='jeremy-corbell').claimEvidence[0].researchEvidence.items.some(s=>s.reviewNote.includes('did not')||s.reviewNote.includes('not establish')),'Navy video provenance versus technology must be distinguished');
assert(data.people.find(p=>p.id==='kevin-knuth').claimEvidence[0].researchEvidence.items.some(s=>s.url.includes('mdpi.com/1099-4300')),'Original accessible journal paper required');
assert(!data.people.some(p=>(p.claimEvidence||[]).some(c=>c.review?.status==='published')),'No real scores are released');
const milestone9Ids=['george-knapp','christopher-mellon','james-fox','nick-pope','leslie-kean'];
for(const caseId of milestone9Ids){
 const person=data.people.find(p=>p.id===caseId);
 assert.equal(person.claimEvidence?.length,1,`${caseId}: one identifiable first-person or journalistic assertion`);
 assert.equal(person.claimEvidence[0].status,'source_review_pending');
 assert.equal(person.claimEvidence[0].researchEvidence?.status,'research_draft');
 assert.equal(person.claimEvidence[0].researchEvidence.items.length,4);
 assert(person.publicWorkEvidence,'Existing work/publisher reader must survive research expansion');
 assert(!person.claimEvidence[0].review,'Unapproved real persons cannot receive a published numeric rating');
 assert(person.claimEvidence[0].researchEvidence.items.some(e=>['challenges','alternative'].includes(e.stance)), 'Include contextual challenge or competing analysis');
}
const greenewald=data.people.find(p=>p.id==='john-greenewald-jr');
assert(!greenewald.claimEvidence?.length,'Do not force a personal or UAP-event rating on records-only FOIA archivist work');
assert.equal(greenewald.publicWorkEvidence.sources.length,4,'Retain two original and two official FOIA paper-trail records');
assert(greenewald.publicWorkEvidence.sources.some(e=>e.url.includes('DODOIG-2023-000010.pdf')),'FOIA official Inspector General response included');
assert(greenewald.publicWorkEvidence.sources.some(e=>e.url.includes('DF-2022-00013-MDR_Log')),'ODNI original request log included');
assert(data.people.find(p=>p.id==='james-fox').claimEvidence[0].researchEvidence.items.some(e=>e.url.includes('arquimedes.stm.jus.br')),'Brazil original military tribunal evidence attached');
assert(data.people.find(p=>p.id==='george-knapp').claimEvidence[0].researchEvidence.items.some(e=>e.url.includes('George-Knapp-Written-Testimony.pdf')),'Original 2025 House submission required');
assert(data.people.find(p=>p.id==='leslie-kean').claimEvidence[0].researchEvidence.items.some(e=>e.url.includes('thedebrief.org')),'Actual author original article required');
assert(data.people.filter(p=>p.claimEvidence?.some(c=>c.review?.status==='published')).length===0,'All 23 draft claims must remain unapproved');
const advisory=data.people.find(p=>p.id==='mike-gold');
assert.equal(advisory.claimEvidence[0].claimKind,'policy_recommendation');
assert.equal(data.people.filter(p=>p.claimEvidence?.some(c=>c.claimKind==='policy_recommendation')).length,1);
assert.deepEqual(candidates.map(p=>p.id).sort(),[
 'avi-loeb','bob-lazar','christopher-mellon','david-fravor','david-grusch','garry-nolan','george-knapp','jacques-vallee','jake-barber','james-fox','jeremy-corbell','kevin-knuth','larry-warren','leslie-kean','luis-elizondo','michael-shellenberger','mick-west','mike-gold','nick-pope','ross-coulthart','ryan-graves','steven-greer','tim-gallaudet'
]);
for(const p of data.people){
 assert(!Object.hasOwn(p,'believability'),'No person-level believability rating permitted');
 for(const c of p.claimEvidence||[]){
  assert.equal(c.status,'source_review_pending');
  assert.match(c.id,/^[a-z0-9-]+$/);
  assert.notEqual(c.sourceReviewApproved,true);
  assert.equal(c.review,undefined,'Never silently ship person-specific score drafts');
  assert.equal(c.researchEvidence?.status,'research_draft');
  assert.match(c.researchEvidence.editorialNote,/\w/);
  assert(c.researchEvidence.items.length>=3);
  for(const e of c.researchEvidence.items){
   assert.match(e.id,/^[a-z0-9][a-z0-9-]+$/);
   assert.equal(e.access,'public');
   assert(e.url.startsWith('https://'));
   assert(e.locator.length>=3&&e.reviewNote.length>=25);
   assert.match(e.checkedAt,/^\d{4}-\d{2}-\d{2}$/);
  }
  assert(Array.isArray(c.sources)&&c.sources.some(s=>s.kind==='primary'&&s.url.startsWith('https://')));
 }
}
const start=js.indexOf('const EVIDENCE_RUBRIC='),end=js.indexOf('function openPerson(');
assert(start>=0&&end>start);
const snippet=js.slice(start,end);
const host={innerHTML:''};
const safeUrl=value=>{try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const validLinks=v=>Array.isArray(v)?v.filter(x=>x&&safeUrl(x.url)).slice(0,30):[];
const ctx={safeUrl,esc,validLinks,$:()=>host};
const fns=vm.runInNewContext(snippet+';({publishedClaimReview,publishedEvidenceTrail,sourceAuditDraftHtml,ratingReadinessHtml,sourceAccessCheckHtml,draftEvidenceTrailHtml,renderPublicRoleEvidence,renderPublicWorkEvidence,renderEvidenceScope,communityClaimEligible,renderClaimEvidence,EVIDENCE_RUBRIC})',ctx,{timeout:1000});
assert.equal(fns.EVIDENCE_RUBRIC.reduce((n,r)=>n+r.max,0),100);
for(const id of allAuditIds){
 const claim=data.people.find(p=>p.id===id).claimEvidence[0];
 const html=fns.sourceAuditDraftHtml(claim);
 assert.match(html,/Original-record comparison/);
 assert.match(html,/Read original record/);
 assert.match(html,/Independent second-editor signoff: <strong>Pending/);
 assert.match(html,/What remains unavailable or unverified/);
 assert.doesNotMatch(html,/class="claim-score"|data-evidence-claim-id|data-rating-save/);
 assert(html.includes(esc(claim.sourceAudit.original.assessment)),'All original-attribution limitations visible');
 assert.match(fns.draftEvidenceTrailHtml(claim),/claim-audit-draft/,'Audit should appear in same expandable public evidence reader');
 const triage=fns.ratingReadinessHtml(claim);
 assert.match(triage,/Is an evidence percentage appropriate for this claim\?/);
 assert.match(triage,/Independent reviewer: <strong>Not assigned/);
 assert.match(triage,/Approval: withheld/);
 assert.doesNotMatch(triage,/class="claim-score"|data-evidence-claim-id|data-rating-save/);
 assert.match(fns.draftEvidenceTrailHtml(claim),/claim-readiness-draft/,'Triage should appear in the same expandable source panel');
 const access=fns.sourceAccessCheckHtml(claim);
 assert.match(access,/Original source access &amp; verification status/);
 assert.match(access,/Full original reviewed: <strong>No/);
 assert.match(access,/Independent approval: <strong>Pending/);
 assert.match(fns.draftEvidenceTrailHtml(claim),/claim-source-access/,'Original-access status appears in the same source panel');
 assert.doesNotMatch(access,/class="claim-score"|data-evidence-claim-id|data-rating-save/);
}
const badAudit=JSON.parse(JSON.stringify(data.people.find(p=>p.id==='david-grusch').claimEvidence[0]));
badAudit.sourceAudit.original.url='javascript:alert(1)';
assert.equal(fns.sourceAuditDraftHtml(badAudit),'','Original record audit fails closed on unsafe URLs');
badAudit.sourceAudit.original.url='https://www.govinfo.gov/';
badAudit.sourceAudit.reviewerSignoff='approved';
assert.equal(fns.sourceAuditDraftHtml(badAudit),'','Never falsely indicate independent second-editor approval');
const escapedAudit=JSON.parse(JSON.stringify(data.people.find(p=>p.id==='david-grusch').claimEvidence[0]));
escapedAudit.sourceAudit.missingEvidence+=' <script>alert(1)</script>';
const safeAudit=fns.sourceAuditDraftHtml(escapedAudit);
assert.match(safeAudit,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert(!safeAudit.includes('<script>'));
const badTriage=JSON.parse(JSON.stringify(data.people.find(p=>p.id==='david-grusch').claimEvidence[0]));
badTriage.ratingReadiness.status='independently_approved';
assert.equal(fns.ratingReadinessHtml(badTriage),'','Public draft reader must not falsely render an approved triage state');
const injectedTriage=JSON.parse(JSON.stringify(data.people.find(p=>p.id==='david-grusch').claimEvidence[0]));
injectedTriage.ratingReadiness.reason+=' <script>alert(1)</script>';
assert.match(fns.ratingReadinessHtml(injectedTriage),/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(fns.ratingReadinessHtml(injectedTriage),/<script>/);
const badAccess=JSON.parse(JSON.stringify(data.people.find(p=>p.id==='larry-warren').claimEvidence[0]));
badAccess.sourceAccessCheck.referenceUrl='javascript:alert(1)';
assert.equal(fns.sourceAccessCheckHtml(badAccess),'','M16 must not render dangerous source URLs');
badAccess.sourceAccessCheck.referenceUrl='https://cdn.nationalarchives.gov.uk/documents/briefing-guide-12-07-12.pdf';
badAccess.sourceAccessCheck.fullOriginalReviewed=true;
assert.equal(fns.sourceAccessCheckHtml(badAccess),'','Full original cannot be silently declared reviewed');
const escapedAccess=JSON.parse(JSON.stringify(data.people.find(p=>p.id==='ross-coulthart').claimEvidence[0]));
escapedAccess.sourceAccessCheck.observation+=' <script>alert(1)</script>';
assert.match(fns.sourceAccessCheckHtml(escapedAccess),/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(fns.sourceAccessCheckHtml(escapedAccess),/<script>/);

for(const person of scopes){
 const html=fns.renderEvidenceScope(person);
 assert.match(html,/Why no event-claim percentage\?/);
 assert.match(html,/Not applicable to the documented role or work/);
 assert.match(html,/Inspect why this role is not scored/);
 assert.match(html,/Inspect original source/);
 assert.doesNotMatch(html,/class="claim-score"|data-evidence-claim-id|data-rating-save/);
 assert(html.includes(esc(person.evidenceScope.reason)),'Original rationale must be visible and HTML escaped');
 host.innerHTML='';
 fns.renderClaimEvidence(person);
 assert.match(host.innerHTML,/claim-scope-review/,'Source-only roles show their written no-score decision');
 assert.doesNotMatch(host.innerHTML,/class="claim-score"|data-rating-save/);
}
const invalidScope=JSON.parse(JSON.stringify(scopes[0]));
invalidScope.evidenceScope.sourceChecks[0].url='javascript:alert(1)';
assert.equal(fns.renderEvidenceScope(invalidScope),'','Unsafe URLs must not render evidence scope card');
const badScopeStatus=JSON.parse(JSON.stringify(scopes[0]));
badScopeStatus.evidenceScope.status='published';
assert.equal(fns.renderEvidenceScope(badScopeStatus),'','No falsely approved role-only scope status');
const escapeScope=JSON.parse(JSON.stringify(scopes[0]));
escapeScope.evidenceScope.reason+='<script>alert(1)</script>';
const escapedScopeHtml=fns.renderEvidenceScope(escapeScope);
assert(escapedScopeHtml.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
assert(!escapedScopeHtml.includes('<script>'));

for(const person of roleEntries){
 const sourceHtml=fns.renderPublicRoleEvidence(person);
 assert.match(sourceHtml,/Inspect original role &amp; legislative records/);
 assert.match(sourceHtml,/Read official source/);
 assert.match(sourceHtml,/Not an incident evidence score/);
 assert.doesNotMatch(sourceHtml,/class="claim-score"/);
 assert.doesNotMatch(sourceHtml,/data-rating-save/);
 for(const s of person.roleEvidence.sources){
  assert(sourceHtml.includes(esc(s.title)),'Every public source is in reader-facing HTML');
  assert(sourceHtml.includes(esc(s.locator)),'Reader sees original-page locator');
 }
 host.innerHTML='';
 fns.renderClaimEvidence(person);
 assert.match(host.innerHTML,/Read official source/);
 assert.doesNotMatch(host.innerHTML,/class="claim-score"/);
 assert.doesNotMatch(host.innerHTML,/data-rating-save/);
}
for(const person of workEntries){
 const htmlWork=fns.renderPublicWorkEvidence(person);
 assert.match(htmlWork,/Inspect original publications &amp; source trail/);
 assert.match(htmlWork,/NOT an approved case assessment/);
 assert.match(htmlWork,/Open cited publication or archive/);
 assert.doesNotMatch(htmlWork,/class="claim-score"/);
 assert.doesNotMatch(htmlWork,/data-rating-save/);
 for(const src of person.publicWorkEvidence.sources){
  assert(htmlWork.includes(esc(src.title)));
  assert(htmlWork.includes(esc(src.locator)));
  assert(htmlWork.includes(esc(src.note)));
 }
 host.innerHTML='';fns.renderClaimEvidence(person);
 assert.match(host.innerHTML,/Not assessed/);
 assert.match(host.innerHTML,/Open cited publication or archive/);
 assert.doesNotMatch(host.innerHTML,/class="claim-score"/);
 assert.doesNotMatch(host.innerHTML,/data-rating-save/);
}
const invalidWork=JSON.parse(JSON.stringify(workEntries[0]));
invalidWork.publicWorkEvidence.sources[0].url='javascript:alert(1)';
assert.equal(fns.renderPublicWorkEvidence(invalidWork),'',
 'Work source records with one invalid source fail closed, not rendered as verified');
const injectedWork=JSON.parse(JSON.stringify(workEntries[0]));
injectedWork.publicWorkEvidence.title='<img src=x onerror=alert(1)>';
assert.match(fns.renderPublicWorkEvidence(injectedWork),/&lt;img/);
assert.doesNotMatch(fns.renderPublicWorkEvidence(injectedWork),/<img/);
const inheritedKindWork=JSON.parse(JSON.stringify(workEntries[0]));
inheritedKindWork.publicWorkEvidence.kind='constructor';
assert.equal(fns.renderPublicWorkEvidence(inheritedKindWork),'',
 'Inherited JavaScript prototype names are not valid source-category kinds');
const inheritedSource=JSON.parse(JSON.stringify(workEntries[0]));
inheritedSource.publicWorkEvidence.sources[0].sourceClass='toString';
assert.equal(fns.renderPublicWorkEvidence(inheritedSource),'',
 'Inherited JavaScript prototype names are not source classes');
const inheritedRole=JSON.parse(JSON.stringify(roleEntries[0]));
inheritedRole.roleEvidence.kind='constructor';
assert.equal(fns.renderPublicRoleEvidence(inheritedRole),'',
 'Inherited property names are not official NASA/congressional role types');
const emptyLinksWork=JSON.parse(JSON.stringify(workEntries[0]));
emptyLinksWork.publicWorkEvidence.sources=[];
assert.equal(fns.renderPublicWorkEvidence(emptyLinksWork),'');
const intactRole=JSON.parse(JSON.stringify(roleEntries[0]));
intactRole.roleEvidence.sources[0].url='javascript:alert(1)';
assert.equal(fns.renderPublicRoleEvidence(intactRole),'',
 'A role with an invalid source fails closed rather than showing partial citations');
const escapedRole=JSON.parse(JSON.stringify(roleEntries[0]));
escapedRole.roleEvidence.title='<img src=x onerror=alert(1)>';
assert.match(fns.renderPublicRoleEvidence(escapedRole),/&lt;img/);
assert.doesNotMatch(fns.renderPublicRoleEvidence(escapedRole),/<img/);
host.innerHTML='';fns.renderClaimEvidence(data.people.find(p=>p.id==='mike-gold'));
assert.match(host.innerHTML,/PUBLIC RESEARCH RECOMMENDATION/);
assert.match(host.innerHTML,/Not applicable/);
assert.match(host.innerHTML,/Read official source/);

for(const p of candidates){
 host.innerHTML='';fns.renderClaimEvidence(p);
 if(['mike-gold','christopher-mellon'].includes(p.id)){
  assert.match(host.innerHTML,/PUBLIC RESEARCH RECOMMENDATION/);
  assert.match(host.innerHTML,/Not applicable/);
  assert.doesNotMatch(host.innerHTML,/Voting not open/);
 }else{
  assert.match(host.innerHTML,/Not assessed/);
  assert.match(host.innerHTML,/Voting not open/);
 }
 assert.match(host.innerHTML,/Research notes — NOT a completed evidence review/);
 assert.match(host.innerHTML,/Read original source/);
 assert.match(host.innerHTML,/Link consulted/);
 assert.doesNotMatch(host.innerHTML,/class="claim-score"/);
 assert.doesNotMatch(host.innerHTML,/data-rating-save/);
}
const tamperedDraft=JSON.parse(JSON.stringify(candidates[0].claimEvidence[0]));
tamperedDraft.researchEvidence.items.push({
 id:'bad-link',type:'primary',stance:'supports',access:'public',
 url:'javascript:alert(1)',title:'Unsafe injected script',locator:'Page 3',
 reviewNote:'This is a synthetic unsafe link and must not appear in public HTML.',checkedAt:'2026-11-15'
});
const blockedHtml=fns.draftEvidenceTrailHtml(tamperedDraft);
assert.doesNotMatch(blockedHtml,/Unsafe injected script/);
assert.doesNotMatch(blockedHtml,/javascript:alert/);
assert.equal(fns.publishedClaimReview(tamperedDraft),null);
host.innerHTML='';fns.renderClaimEvidence(data.people.find(p=>p.id==='mick-west'));assert.match(host.innerHTML,/Not assessed/);assert.doesNotMatch(host.innerHTML,/class="claim-score"/);

const fictional={
 statement:'Fictional evidence review example (this is not a statement by a real person)',
 date:'2026-11-15', context:'Synthetic test only.',
 sources:[{kind:'primary',label:'Fictional record',url:'https://example.org/fictional-record'}],
 review:{
  status:'published',methodology:'dd-claim-evidence-v1',reviewer:'Sample Review Editor',
  reviewedAt:'2026-11-15',
  editorialChecks:{sourceVerified:true,claimContextChecked:true,contraryEvidenceReviewed:true,secondEditorApproved:true},
  points:{original:25,independent:18,direct:17,testable:7,alternatives:5},
  rationale:Object.fromEntries(['original','independent','direct','testable','alternatives'].map(k=>[k,'Fictional reasoning for the '+k+' criterion only'])),
  revision:'2026-demo-v1',
  scopeNote:'Synthetic exercise: review of fictional testimony and technical examples only.',
  limitations:'These are fictional references and therefore prove nothing about any real UAP report.',
  evidenceTrail:[
   {id:'original-record',type:'primary',stance:'context',access:'public',
    url:'https://example.org/fictional-record',title:'Fictional written testimony',
    locator:'Page 2, paragraph 4',checkedAt:'2026-11-15',
    reviewNote:'This is imaginary source text used only to test the primary-record attribution flow.'},
   {id:'supporting-record',type:'records',stance:'supports',access:'public',
    url:'https://example.org/fictional-data',title:'Fictional measurement dataset',
    locator:'Table 3',checkedAt:'2026-11-15',
    reviewNote:'This fabricated dataset merely exercises the display of an independently checkable document.'},
   {id:'alternative-analysis',type:'analysis',stance:'alternative',access:'public',
    url:'https://example.org/fictional-analysis',title:'Fictional competing analysis',
    locator:'Section 5',checkedAt:'2026-11-15',
    reviewNote:'This invented alternative shows that sources challenging a proposed inference can be consulted.'}
  ],
  criterionSources:{
   original:['original-record'],
   independent:['supporting-record'],
   direct:['supporting-record'],
   testable:['original-record'],
   alternatives:['alternative-analysis']
  }
 }
};
assert(fns.publishedClaimReview(fictional));
host.innerHTML='';fns.renderClaimEvidence({claimEvidence:[fictional]});
assert.match(host.innerHTML,/class="claim-score"/);assert.match(host.innerHTML,/72<small>/);
assert.match(host.innerHTML,/View evidence &amp; scoring breakdown/);
assert.match(host.innerHTML,/Inspect original evidence/);
assert.match(host.innerHTML,/Fictional competing analysis/);
assert.match(host.innerHTML,/Table 3/);
assert.match(host.innerHTML,/Evidence considered/);
assert.match(host.innerHTML,/Disclosure Desk rating/);
assert.match(host.innerHTML,/Community rating/);
assert.match(host.innerHTML,/Voting not open/);
const unscoreablePolicy={
 ...fictional,id:'synthetic-policy-example',status:'source_verified',
 sourceReviewApproved:true,claimKind:'policy_recommendation'
};
assert.equal(fns.publishedClaimReview(unscoreablePolicy),null,
 'Even an editor-labelled published review must never score a policy recommendation');
assert.equal(fns.communityClaimEligible(unscoreablePolicy),false);
host.innerHTML='';fns.renderClaimEvidence({claimEvidence:[unscoreablePolicy]});
assert.match(host.innerHTML,/PUBLIC RESEARCH RECOMMENDATION/);
assert.match(host.innerHTML,/Not applicable/);
assert.doesNotMatch(host.innerHTML,/class="claim-score"/);
assert.doesNotMatch(host.innerHTML,/data-rating-save/);
const eligibleFictional={...fictional,id:'fictional-example-2026',status:'source_verified',sourceReviewApproved:true};
assert(fns.communityClaimEligible(eligibleFictional));
host.innerHTML='';fns.renderClaimEvidence({claimEvidence:[eligibleFictional]});
assert.match(host.innerHTML,/data-evidence-claim-id="fictional-example-2026"/);
assert.match(host.innerHTML,/data-rating-save/);
assert(!fns.communityClaimEligible({...eligibleFictional,sourceReviewApproved:false}));
assert(!fns.communityClaimEligible({...eligibleFictional,id:'javascript:alert(1)'}));
const withheldFictional={...eligibleFictional,ratingReadiness:{...data.people.find(p=>p.id==='david-grusch').claimEvidence[0].ratingReadiness}};
assert.equal(fns.publishedClaimReview(withheldFictional),null,'First-pass triage must never be bypassed by synthetic published review flags');
assert.equal(fns.communityClaimEligible(withheldFictional),false);
const noIncidentFictional={...eligibleFictional,ratingReadiness:{...data.people.find(p=>p.id==='mike-gold').claimEvidence[0].ratingReadiness}};
assert.equal(fns.publishedClaimReview(noIncidentFictional),null,'Not-applicable incident policy claims cannot publish a score');

for(const mutation of [
 c=>{delete c.review.editorialChecks.secondEditorApproved},
 c=>{c.review.points.independent=31},
 c=>{c.review.rationale.direct='Too short'},
 c=>{c.sources[0].url='javascript:alert(1)'},
 c=>{c.review.reviewer=''},
 c=>{c.review.status='review_pending'},
 c=>{delete c.review.evidenceTrail},
 c=>{c.review.criterionSources.independent=['not-in-evidence']},
 c=>{c.review.evidenceTrail[0].access='restricted'},
 c=>{c.review.evidenceTrail[0].url='javascript:alert(1)'},
 c=>{c.review.evidenceTrail[0].reviewNote='Too short'},
 c=>{c.review.limitations='Insufficient'}
]){
 const bad=JSON.parse(JSON.stringify(fictional));mutation(bad);
 assert.equal(fns.publishedClaimReview(bad),null,'Missing editorial gate must block numerical score');
 host.innerHTML='';fns.renderClaimEvidence({claimEvidence:[bad]});
 assert.match(host.innerHTML,/Not assessed/);assert.doesNotMatch(host.innerHTML,/class="claim-score"/);
}
console.log('Who’s Who: 50 profiles, 23 claim drafts with 89 sources, 23 source audits, 23 scoreability drafts, 23 access checks, 50 portrait-rights scope records, 27 nonclaim scopes; no published numbers or votes (NO DEPLOY).');

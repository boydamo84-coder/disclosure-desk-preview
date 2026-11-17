/* Who's Who in Disclosure — research profile directory, R2 draft.
 * Public editorial data only. Click-to-load privacy-aware YouTube embeds.
 * No unreviewed popularity ratings, user accounts, tracking or private witnesses.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const safeUrl=value=>{try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
const supportedVideoId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{11}$/.test(id);
let people=[];
let selected=null;
let caseLinks={valid:true,links:[]};
let m29Dockets=new Map();
let m29Rubric=null;
const CASE_RETURN_KEY='dd-who-case-return-v1';
let restoreSequence=0;
const numberY=value=>Number.isFinite(value)&&value>=0?Math.round(value):null;
function scrollToArea(element,offset=12){
 if(!element)return;
 window.scrollTo({top:Math.max(0,window.scrollY+element.getBoundingClientRect().top-offset),behavior:'instant'});
}
function showProfileAtContent(person,allowCaseReturn=false){
 const token=++restoreSequence;
 let saved=null;
 try{
  const raw=allowCaseReturn?sessionStorage.getItem(CASE_RETURN_KEY):null;
  if(!allowCaseReturn)sessionStorage.removeItem(CASE_RETURN_KEY);
  if(raw){
   const candidate=JSON.parse(raw);
   if(candidate.personId===person.id && candidate.page===location.pathname+location.search &&
      Date.now()-candidate.savedAt<15*60*1000){
    saved=numberY(candidate.y);
    const anchor=candidate.directoryReturn;
    if(anchor&&anchor.personId===person.id&&numberY(anchor.y)!==null)
     history.replaceState({...history.state,ddDirectoryReturn:{
      personId:person.id,y:numberY(anchor.y)
     }},'',location.href);
   }
   sessionStorage.removeItem(CASE_RETURN_KEY);
  }
 }catch{try{sessionStorage.removeItem(CASE_RETURN_KEY)}catch{}}
 requestAnimationFrame(()=>{
  if(token!==restoreSequence || !selected || selected.id!==person.id)return;
  if(saved!==null)window.scrollTo({top:saved,behavior:'instant'});
  else scrollToArea($('personProfile'));
 });
}
function restoreDirectoryPosition(anchor){
 const token=++restoreSequence;
 const y=numberY(anchor?.y);
 if(y===null && !anchor?.firstCard){window.scrollTo({top:0,behavior:'instant'});return;}
 const id=String(anchor.personId||'');
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(token!==restoreSequence || selected)return;
  if(anchor.firstCard)scrollToArea($('peopleCards'),115);
  else window.scrollTo({top:y,behavior:'instant'});
  const card=[...$('peopleCards').querySelectorAll('[data-person-id]')]
    .find(el=>el.dataset.personId===id);
  if(card){
   card.classList.add('dd-returned-card');
   card.querySelector('button')?.focus({preventScroll:true});
   window.setTimeout(()=>card.classList.remove('dd-returned-card'),2000);
  }
 }));
}
function rememberProfileCaseDeparture(event){
 const link=event.target.closest?.('#profileRelatedCases a[href]');
 if(!link || !selected)return;
 try{
  const dest=new URL(link.href,location.href);
  if(dest.origin!==location.origin)return;
  const isArchive=(dest.pathname==='/'&&dest.searchParams.get('dd_tab')==='archivePage'
    &&/^featured-[a-z0-9-]{3,65}$/.test(dest.searchParams.get('dd_archive_case')||''));
  const isDossier=['/rendlesham-forest-1980','/rendlesham-forest-1980.html',
   '/roswell-1947','/roswell-1947.html'].includes(dest.pathname);
  if(!isArchive&&!isDossier)return;
  const directoryReturn=history.state?.ddDirectoryReturn;
  sessionStorage.setItem(CASE_RETURN_KEY,JSON.stringify({
   personId:selected.id,personName:selected.name.slice(0,120),
   page:location.pathname+location.search,
   target:isArchive?'archive':'dossier',
   caseId:isArchive?dest.searchParams.get('dd_archive_case'):null,
   targetPath:isDossier?dest.pathname:null,
   directoryReturn:directoryReturn?.personId===selected.id
     ?{personId:selected.id,y:numberY(directoryReturn.y)}:null,
   savedAt:Date.now(),y:window.scrollY
  }));
  // An explicit same-origin marker is required to activate Android's
  // contextual Back. Visiting Archive independently never inherits this state.
  dest.searchParams.set('dd_from','who');
  link.href=dest.pathname+dest.search+dest.hash;
 }catch{}
}

const initials=p=>String(p.name||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const shortDate=v=>String(v||'');
function paintPortrait(host,person){
 if(!host)return;
 // Profile detail reuses the same host for successive people. Never retain a
 // previous portrait's transparent-initials class when the next has no photo.
 host.classList.remove('has-photo');
 host.replaceChildren(document.createTextNode(initials(person)));
 const photo=person.photo;
 if(!photo||!safeUrl(photo.url)||!safeUrl(photo.source)||!photo.credit||
   !['Public domain (US federal government)','CC0 1.0','CC BY 2.0','CC BY 3.0','CC BY 4.0','CC BY-SA 4.0'].includes(photo.license))return;
 const u=new URL(photo.url);
 if(!['commons.wikimedia.org','upload.wikimedia.org','images-assets.nasa.gov'].includes(u.hostname))return;
 const picture=document.createElement('img');
 picture.alt='';picture.loading='lazy';picture.decoding='async';
 picture.referrerPolicy='no-referrer';
 // Detached images can still dispatch an asynchronous load/error after the
 // visitor has opened another profile. Only the image currently inside this
 // avatar may update its visible/initials state.
 picture.addEventListener('load',()=>{if(host.contains(picture))host.classList.add('has-photo')},{once:true});
 picture.addEventListener('error',()=>{
  if(host.contains(picture)){host.classList.remove('has-photo');picture.remove()}
 },{once:true});
 picture.src=u.href;host.appendChild(picture);
}
// Restrict licence destinations to verified CC deed URLs; data can never
// inject a third-party link into the attribution widget.
const PHOTO_LICENSE_URLS=Object.freeze({
 'CC0 1.0':'https://creativecommons.org/publicdomain/zero/1.0/',
 'CC BY 2.0':'https://creativecommons.org/licenses/by/2.0/',
 'CC BY 3.0':'https://creativecommons.org/licenses/by/3.0/',
 'CC BY 4.0':'https://creativecommons.org/licenses/by/4.0/',
 'CC BY-SA 4.0':'https://creativecommons.org/licenses/by-sa/4.0/'
});
function appendPortraitCredit(host,photo){
 if(!host||!photo?.credit||!safeUrl(photo.source))return false;
 const link=(url,label)=>{
  const a=document.createElement('a');
  a.href=url;a.target='_blank';a.rel='noopener noreferrer';
  a.textContent=label;return a;
 };
 // Visible author / source / licence / display change (TASL), not a title
 // tooltip. CSS object-fit:cover crops the displayed photo, not source bytes.
 host.appendChild(link(safeUrl(photo.source),'Photo: '+photo.credit));
 const licenseUrl=PHOTO_LICENSE_URLS[photo.license];
 host.appendChild(document.createTextNode(' · '));
 if(licenseUrl)host.appendChild(link(licenseUrl,photo.license));
 else host.appendChild(document.createTextNode(photo.license||'Rights at source'));
 if(licenseUrl)host.appendChild(document.createTextNode(' · Display cropped to fit'));
 return true;
}
const validLinks=(v)=>Array.isArray(v)?v.filter(x=>x&&safeUrl(x.url)).slice(0,30):[];
function renderList(items,opts={}){
 const filtered=validLinks(items);
 return filtered.length?'<ul class="link-list">'+filtered.map(x=>
  '<li><a href="'+esc(safeUrl(x.url))+'" rel="noopener noreferrer" target="_blank">'+esc(x.label||x.title||'Original source')+' ↗</a>'+
  (x.publisher?'<span class="muted small"> · '+esc(x.publisher)+'</span>':'')+
  (x.date?'<span class="muted small"> · '+esc(x.date)+'</span>':'')+
  (x.kind?'<span class="muted small"> · '+esc(x.kind)+'</span>':'')+'</li>').join('')+'</ul>':
  '<p class="muted small">'+(opts.empty||'No independently confirmed links in this research profile.')+'</p>';
}
// Evidence strength is attributed to an individual public claim, never a person.
// All numeric output requires an explicit editor-reviewed, source-linked gate.
const EVIDENCE_RUBRIC=Object.freeze([
 {key:'original',label:'Original claim recorded in context',max:25},
 {key:'independent',label:'Independent corroboration',max:30},
 {key:'direct',label:'Inspectible supporting records / data',max:25},
 {key:'testable',label:'Specificity and independent testability',max:10},
 {key:'alternatives',label:'Alternative explanations and contrary evidence',max:10}
]);
// Every scored criterion must point to named, publicly inspectable evidence.
// A source's publication proves only what the source reports; review notes
// explicitly distinguish this from proof of the underlying UAP explanation.
const EVIDENCE_STANCES=Object.freeze({
 supports:'Supports an aspect of the claim',
 challenges:'Challenges or conflicts with the claim',
 alternative:'Alternative interpretation',
 context:'Establishes context or what was said'
});
const EVIDENCE_TYPES=Object.freeze({
 primary:'Original statement, testimony or document',
 records:'Independent records / measurements',
 analysis:'Published technical analysis',
 reporting:'Attributable reporting'
});
function publishedEvidenceTrail(claim){
 const r=claim?.review;
 const entries=r?.evidenceTrail;
 if(!Array.isArray(entries)||entries.length===0||entries.length>35||
    typeof r.scopeNote!=='string'||r.scopeNote.trim().length<35||
    typeof r.limitations!=='string'||r.limitations.trim().length<35||
    typeof r.revision!=='string'||r.revision.trim().length<3)return null;
 const ids=new Set(),linked=new Set();
 for(const e of entries){
  if(!e||typeof e.id!=='string'||!/^[a-z0-9][a-z0-9-]{2,65}$/.test(e.id)||ids.has(e.id)||
   !EVIDENCE_STANCES[e.stance]||!EVIDENCE_TYPES[e.type]||
   e.access!=='public'||!safeUrl(e.url)||
   typeof e.title!=='string'||e.title.trim().length<8||
   typeof e.locator!=='string'||e.locator.trim().length<3||
   typeof e.reviewNote!=='string'||e.reviewNote.trim().length<25||
   typeof e.checkedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.checkedAt))return null;
  ids.add(e.id);
  if(e.type==='primary')linked.add(safeUrl(e.url));
 }
 const original=Array.isArray(claim?.sources)?claim.sources.filter(s=>s?.kind==='primary'&&safeUrl(s.url)).map(s=>safeUrl(s.url)):[];
 if(!original.some(url=>linked.has(url)))return null;
 if(!r.criterionSources||EVIDENCE_RUBRIC.some(row=>{
  const refs=r.criterionSources[row.key];
  return !Array.isArray(refs)||!refs.length||refs.length>15||
   refs.some(id=>typeof id!=='string'||!ids.has(id));
 }))return null;
 return entries;
}
function evidenceTrailHtml(claim,review,entries){
 const byId=new Map(entries.map(e=>[e.id,e]));
 const criterion=EVIDENCE_RUBRIC.map(row=>{
  const points=review.points[row.key];
  const refs=review.criterionSources[row.key].map(id=>byId.get(id)).filter(Boolean);
  return '<div class="claim-metric"><div class="claim-metric-head"><span>'+esc(row.label)+'</span>'+
    '<strong>'+points+' / '+row.max+'</strong></div>'+
    '<div class="claim-track" role="img" aria-label="'+esc(row.label+': '+points+' of '+row.max)+'">'+
    '<span style="width:'+((points/row.max)*100).toFixed(1)+'%"></span></div>'+
    '<p>'+esc(review.rationale[row.key])+'</p>'+
    '<p class="muted small">Evidence considered: '+refs.map(e=>'<a href="'+esc(safeUrl(e.url))+
      '" target="_blank" rel="noopener noreferrer">'+esc(e.title)+' ('+esc(e.locator)+') ↗</a>').join(' · ')+'</p></div>';
 }).join('');
 const groups=[
  ['supports','Supporting material'],
  ['challenges','Conflicting or challenging material'],
  ['alternative','Alternative interpretations'],
  ['context','Original statements and context']
 ].map(([type,label])=>{
  const group=entries.filter(e=>e.stance===type);
  if(!group.length)return '';
  return '<section class="claim-evidence-group"><h5>'+label+'</h5><ul class="claim-evidence-list">'+
   group.map(e=>'<li><strong>'+esc(e.title)+'</strong>'+
    '<span class="muted small"> · '+esc(EVIDENCE_TYPES[e.type])+' · '+esc(EVIDENCE_STANCES[e.stance])+'</span>'+
    '<p class="muted small">Find it: '+esc(e.locator)+' · Source checked '+esc(e.checkedAt)+'</p>'+
    '<p>'+esc(e.reviewNote)+'</p>'+
    '<a href="'+esc(safeUrl(e.url))+'" target="_blank" rel="noopener noreferrer">Inspect original evidence ↗</a></li>').join('')+
   '</ul></section>';
 }).join('');
 return '<p class="muted small"><strong>Review scope:</strong> '+esc(review.scopeNote)+'</p>'+
  '<p class="muted small"><strong>What remains uncertain:</strong> '+esc(review.limitations)+'</p>'+
  '<h5>How each criterion was scored</h5>'+criterion+
  '<h5>All material considered</h5>'+groups+
  '<p class="muted small">Review: '+esc(review.reviewer)+' · '+esc(review.reviewedAt)+
  ' · Edition '+esc(review.revision)+' · Method: '+esc(review.methodology)+'</p>'+
  '<p class="muted small">Records are classified by how they relate to this specific claim, not as proof of a particular explanation. Original publishers control access and copyright; a link may change or become unavailable later.</p>';
}
// M28: exact original-hearing passage checks, still unsigned and unscored.
function m28HearingCrosscheckHtml(claim){
 const check=claim?.sourceAudit?.m28OfficialHearingCheck;
 if(!check||check.status!=='primary_hearing_passages_spot_checked_not_whole_case_audit'||
   check.checkedAt!=='2026-11-16'||check.hearingDate!=='2024-11-13'||
   check.secondIndependentHumanEditor!=='not_obtained'||
   check.fullUnderlyingClaimVerification!==false||
   check.permissionToPublishScoreOrCommunityVote!==false||
   check.permissionToPublishNewPortrait!==false||!safeUrl(check.firstPartyUrl)||
   !Array.isArray(check.passageChecks)||check.passageChecks.length<2||check.passageChecks.length>4||
   !Array.isArray(check.contrastingRecords)||check.contrastingRecords.length>3)return '';
 const validEntry=e=>e&&typeof e.locator==='string'&&e.locator.length>=25&&
   typeof e.finding==='string'&&e.finding.length>=65&&
   typeof e.limit==='string'&&e.limit.length>=60;
 if(!check.passageChecks.every(validEntry)||!check.contrastingRecords.every(e=>validEntry(e)&&safeUrl(e.url)))return '';
 const primary=check.passageChecks.map(e=>
  '<li><strong>'+esc(e.locator)+'</strong><p>'+esc(e.finding)+'</p>'+
  '<p class="muted small"><strong>Limit:</strong> '+esc(e.limit)+'</p></li>').join('');
 const contrary=check.contrastingRecords.map(e=>
  '<li><strong>'+esc(e.locator)+'</strong><p>'+esc(e.finding)+'</p>'+
  '<p class="muted small"><strong>Limit:</strong> '+esc(e.limit)+'</p>'+
  '<a href="'+esc(safeUrl(e.url))+'" target="_blank" rel="noopener noreferrer">Read contrasting original record ↗</a></li>').join('');
 return '<details class="claim-m28-check" data-m28-crosscheck>'+
  '<summary>Additional original-source cross-check · 16 Nov 2026</summary>'+
  '<p class="claim-draft-warning"><strong>Source-passage check only.</strong> This verifies narrow attributed statements and notes competing evidence. No underlying event is independently verified; no separate editor, score or community ballot is approved.</p>'+
  '<p class="muted small">Original public congressional hearing: 13 November 2024 · '+
  '<a href="'+esc(safeUrl(check.firstPartyUrl))+'" target="_blank" rel="noopener noreferrer">Open GPO transcript ↗</a></p>'+
  '<h5>Passages checked and their limits</h5><ul class="claim-evidence-list">'+primary+'</ul>'+
  (contrary?'<h5>Case-specific contrasting record</h5><ul class="claim-evidence-list">'+contrary+'</ul>':'')+
  '<p class="muted small">Scope: original-publication comparisons, not original secret programmes or complete incident verification. Second independent human review pending.</p>'+
  '</details>';
}
// M28b: public-source attribution reader only; NEVER silently enable numbers or votes.
function m28bOriginalSourceCheckHtml(claim){
 const check=claim?.sourceAudit?.m28bOriginalSourceCheck;
 if(!check||check.status!=='selected_original_publication_passages_checked_not_complete_independent_claim_review'||
    check.checkedAt!=='2026-11-16'||!safeUrl(check.primaryUrl)||
    check.fullUnderlyingClaimVerification!==false||
    check.secondIndependentHumanEditor!=='not_obtained'||
    check.permissionToPublishScoreOrCommunityVote!==false||
    check.permissionToPublishNewPortrait!==false||
    claim?.ratingReadiness?.publicationApproval!=='withheld'||
    claim?.sourceAccessCheck?.secondEditorSignoff!=='not_obtained'||
    !/^\d{4}-\d{2}-\d{2}$/.test(check.publicationDate||'')||
    typeof check.publicationTitle!=='string'||check.publicationTitle.trim().length<15||
    typeof check.method!=='string'||check.method.trim().length<55||
    typeof check.sourceLineageNote!=='string'||check.sourceLineageNote.trim().length<90||
    typeof check.remainingGap!=='string'||check.remainingGap.trim().length<90||
    !Array.isArray(check.passageChecks)||check.passageChecks.length<2||check.passageChecks.length>6||
    !Array.isArray(check.contrastChecks)||check.contrastChecks.length>4)return '';
 const validPassage=e=>e&&typeof e.locator==='string'&&e.locator.trim().length>=30&&
  typeof e.finding==='string'&&e.finding.trim().length>=75&&
  typeof e.limit==='string'&&e.limit.trim().length>=75;
 const validContrast=e=>validPassage(e)&&safeUrl(e.url)&&
  ['publisher_indexed_abstract_direct_fulltext_blocked','direct_original_public_record'].includes(e.accessStatus);
 if(!check.passageChecks.every(validPassage)||!check.contrastChecks.every(validContrast))return '';
 const rows=check.passageChecks.map(e=>
   '<li><strong>'+esc(e.locator)+'</strong><p>'+esc(e.finding)+'</p>'+
   '<p class="muted small"><strong>Verification limit:</strong> '+esc(e.limit)+'</p></li>').join('');
 const contrasting=check.contrastChecks.map(e=>
   '<li><strong>'+esc(e.locator)+'</strong>'+
   '<p>'+esc(e.finding)+'</p>'+
   '<p class="muted small"><strong>Source accessibility:</strong> '+
    (e.accessStatus==='publisher_indexed_abstract_direct_fulltext_blocked'
     ?'Publisher abstract/highlights indexed; full text not directly accessible in this review'
     :'Original public record directly accessible')+'</p>'+
   '<p class="muted small"><strong>Verification limit:</strong> '+esc(e.limit)+'</p>'+
   '<a href="'+esc(safeUrl(e.url))+'" target="_blank" rel="noopener noreferrer">Inspect cited publication ↗</a></li>').join('');
 return '<details class="claim-m28b-check" data-m28b-sourcecheck>'+
  '<summary>New original-publication source checks · 16 Nov 2026</summary>'+
  '<p class="claim-draft-warning"><strong>Research comparison — not an approved finding or rating.</strong> The passages below establish what was published or calculated, not independent proof of the underlying UAP interpretation.</p>'+
  '<p class="muted small"><strong>Original publication:</strong> '+esc(check.publicationTitle)+
  ' · '+esc(check.publicationDate)+' · <a href="'+esc(safeUrl(check.primaryUrl))+
  '" target="_blank" rel="noopener noreferrer">Read original source ↗</a></p>'+
  '<p class="muted small"><strong>What was actually inspected:</strong> '+esc(check.method)+'</p>'+
  '<h5>Original passages and precisely what they establish</h5><ul class="claim-evidence-list">'+rows+'</ul>'+
  (contrasting?'<h5>Separate interpretations and their accessibility</h5><ul class="claim-evidence-list">'+contrasting+'</ul>':'')+
  '<p><strong>Repeated-source warning:</strong> '+esc(check.sourceLineageNote)+'</p>'+
  '<p><strong>Still needed:</strong> '+esc(check.remainingGap)+'</p>'+
  '<p class="muted small">Underlying-claim verification: incomplete · Second human editorial approval: not obtained · Scores, member voting and new image permissions: withheld.</p>'+
  '</details>';
}
// M28c: source-only first-hand/relayed/policy distinctions; no unapproved findings.
function m28cFirstPartyCheckHtml(claim){
 const r=claim?.sourceAudit?.m28cFirstPartyCheck;
 if(!r||r.status!=='selected_original_statement_published_scope_check_not_full_incident_review'||
  r.checkedAt!=='2026-11-16'||!safeUrl(r.originalUrl)||
  !/^\d{4}-\d{2}-\d{2}$/.test(r.publicationDate||'')||
  r.fullUnderlyingClaimVerification!==false||
  r.independentSecondHumanEditor!=='not_obtained'||
  r.scorePublicationPermission!==false||r.communityVotePermission!==false||
  r.newImageRightsPermission!==false||
  claim?.ratingReadiness?.publicationApproval!=='withheld'||
  claim?.sourceAccessCheck?.secondEditorSignoff!=='not_obtained'||
  typeof r.documentTitle!=='string'||r.documentTitle.length<20||
  typeof r.method!=='string'||r.method.length<80||
  typeof r.claimScope!=='string'||r.claimScope.length<90||
  typeof r.sourceLineageNote!=='string'||r.sourceLineageNote.length<100||
  typeof r.nextValidation!=='string'||r.nextValidation.length<95||
  !Array.isArray(r.passageChecks)||r.passageChecks.length<2||r.passageChecks.length>5||
  !Array.isArray(r.contextSources)||r.contextSources.length>4)return '';
 const kinds={
  secondhand_claim:'Information attributed to another source',
  first_hand_context:'First-person operational context',
  firsthand_context:'First-person operational context',
  firsthand_visual_account:'First-person visual testimony',
  firsthand_scope_limit:'Explicit firsthand-evidence limitation',
  separate_source_chain:'Other crew or controller evidence',
  attributed_opinion:'Signed personal perspective',
  attributed_policy_argument:'Published legal/policy argument',
  policy_recommendation:'Published recommendation'
 };
 const validPassage=e=>e&&Object.hasOwn(kinds,e.evidenceKind)&&
  typeof e.locator==='string'&&e.locator.length>=35&&
  typeof e.finding==='string'&&e.finding.length>=85&&
  typeof e.limit==='string'&&e.limit.length>=90;
 const validContext=e=>e&&safeUrl(e.url)&&e.accessLevel==='official_administrative_context_only'&&
  typeof e.title==='string'&&e.title.length>=18&&
  typeof e.locator==='string'&&e.locator.length>=40&&
  typeof e.finding==='string'&&e.finding.length>=95&&
  typeof e.limit==='string'&&e.limit.length>=90;
 if(!r.passageChecks.every(validPassage)||!r.contextSources.every(validContext))return '';
 const rows=r.passageChecks.map(e=>
  '<li><strong>'+esc(kinds[e.evidenceKind])+'</strong>'+
  '<p class="muted small">Find in original: '+esc(e.locator)+'</p>'+
  '<p>'+esc(e.finding)+'</p>'+
  '<p class="muted small"><strong>Limitation:</strong> '+esc(e.limit)+'</p></li>').join('');
 const contexts=r.contextSources.map(e=>
  '<li><strong>'+esc(e.title)+'</strong><p class="muted small">'+
  esc(e.locator)+'</p><p>'+esc(e.finding)+'</p>'+
  '<p class="muted small"><strong>Does not establish:</strong> '+esc(e.limit)+'</p>'+
  '<a href="'+esc(safeUrl(e.url))+'" rel="noopener noreferrer" target="_blank">Inspect agency original ↗</a></li>').join('');
 return '<details class="claim-m28c-check" data-m28c-sourcecheck>'+
  '<summary>Firsthand vs reported sources · 16 Nov 2026</summary>'+
  '<p class="claim-draft-warning"><strong>Selected original-publication passages only — not independently verified UAP events, personal credibility or approved percentages.</strong> These distinctions must be retained when assessing evidence.</p>'+
  '<p><strong>Scope:</strong> '+esc(r.claimScope)+'</p>'+
  '<p class="muted small"><strong>Original record:</strong> '+esc(r.documentTitle)+
  ' · '+esc(r.publicationDate)+' · <a href="'+esc(safeUrl(r.originalUrl))+
  '" rel="noopener noreferrer" target="_blank">Read first-party source ↗</a></p>'+
  '<p class="muted small"><strong>What was actually inspected:</strong> '+esc(r.method)+'</p>'+
  '<h5>Attribution, firsthand scope and missing evidence</h5><ul class="claim-evidence-list">'+rows+'</ul>'+
  (contexts?'<h5>Independent institutional context, not physical corroboration</h5><ul class="claim-evidence-list">'+contexts+'</ul>':'')+
  '<p><strong>Repeated-source caution:</strong> '+esc(r.sourceLineageNote)+'</p>'+
  '<p><strong>Further verification required:</strong> '+esc(r.nextValidation)+'</p>'+
  '<p class="muted small">Not a completed full-case review · Independent human editor: not obtained · Scores, community voting and new portrait approvals remain withheld.</p>'+
  '</details>';
}
// M28d: provenance and access-label gate for broadcasters and historical archives.
// Metadata/secondary quotation is never silently promoted to a played original video.
function m28dBroadcastLineageHtml(claim){
 const r=claim?.sourceAudit?.m28dBroadcastLineageCheck;
 const originals=Object.freeze({
  original_broadcaster_video_not_played:'Original broadcaster video NOT played in this review',
  historical_transcript_original_url_502_and_original_broadcast_not_played:'Original transcript URL unavailable; authenticated original TV tape NOT reviewed',
  original_publisher_title_chapters_only_full_video_not_reviewed:'Original publisher metadata and chapters; complete video NOT reviewed'
 });
 const grades=Object.freeze({
  independent_broadcaster_attribution_transcript:'Independent broadcaster quoting another original',
  independent_editorial_comparison:'Independent publisher editorial analysis',
  official_public_testimony_same_source_lineage:'Official testimony of underlying interviewee; overlapping account',
  same_publisher_syndicated_original_clip_description:'Original newsroom clip redistributed by another website',
  same_publisher_broadcast_schedule_not_full_programme:'Original newsroom advance notice, not full programme',
  official_preclaim_general_context:'Earlier official agency review, NOT case-specific',
  third_party_retyped_transcript_not_original_master:'Third-party retyped interview, original master unaudited',
  original_interview_of_original_reporters_separate_biography_question:'Later original interview of broadcasters, separate biographical question',
  same_1989_interview_repeated_not_independent:'Repeat of same retyped broadcast, not corroboration',
  publisher_video_chapter_metadata_only:'Publisher video chapter titles/metadata, NOT a watched transcript',
  publisher_alternative_interview_metadata_only:'Separate competing broadcaster interview, metadata only',
  official_archive_briefing_page_visually_inspected:'Official archival briefing, specified original PDF page visually checked'
 });
 if(!r||r.status!=='source_chain_access_comparison_not_full_original_audio_video_review'||
    r.checkedAt!=='2026-11-16'||r.fullOriginalBroadcastReviewed!==false||
    r.underlyingIncidentVerified!==false||r.secondIndependentHumanEditor!=='not_obtained'||
    r.permissionToPublishScoreOrVotes!==false||r.newPortraitRightsApproval!==false||
    claim?.ratingReadiness?.publicationApproval!=='withheld'||
    claim?.sourceAccessCheck?.fullOriginalReviewed!==false||
    !r.primaryRecord||!safeUrl(r.primaryRecord.url)||
    !Object.hasOwn(originals,r.primaryRecord.access)||
    typeof r.primaryRecord.title!=='string'||r.primaryRecord.title.length<30||
    typeof r.primaryRecord.observation!=='string'||r.primaryRecord.observation.length<95||
    typeof r.scope!=='string'||r.scope.length<110||
    typeof r.lineage!=='string'||r.lineage.length<115||
    typeof r.missing!=='string'||r.missing.length<120||
    !Array.isArray(r.checks)||r.checks.length!==3)return '';
 const valid=e=>e&&safeUrl(e.url)&&Object.hasOwn(grades,e.access)&&
  typeof e.locator==='string'&&e.locator.length>=45&&
  typeof e.finding==='string'&&e.finding.length>=100&&
  typeof e.limit==='string'&&e.limit.length>=110;
 if(!r.checks.every(valid))return '';
 const rows=r.checks.map(e=>'<li><strong>'+esc(grades[e.access])+'</strong>'+
   '<p class="muted small">Where this source can be checked: '+esc(e.locator)+'</p>'+
   '<p>'+esc(e.finding)+'</p>'+
   '<p class="muted small"><strong>What it does NOT verify:</strong> '+esc(e.limit)+'</p>'+
   '<a href="'+esc(safeUrl(e.url))+'" target="_blank" rel="noopener noreferrer">Inspect linked source ↗</a></li>').join('');
 return '<details class="claim-m28d-check" data-m28d-accesscheck>'+
  '<summary>Broadcast/source access and cross-check · 16 Nov 2026</summary>'+
  '<p class="claim-draft-warning"><strong>Publication and source-chain research only — NOT an approved UAP finding, personal believability score, or completed video review.</strong> Third-party transcripts, news redistribution and chapter labels have different evidential limits.</p>'+
  '<p><strong>What is assessed:</strong> '+esc(r.scope)+'</p>'+
  '<p class="muted small"><strong>Original broadcaster source:</strong> '+esc(r.primaryRecord.title)+
  ' · <a href="'+esc(safeUrl(r.primaryRecord.url))+
  '" target="_blank" rel="noopener noreferrer">Open original listing ↗</a></p>'+
  '<p><strong>Original-source access:</strong> '+esc(originals[r.primaryRecord.access])+'</p>'+
  '<p class="muted small">'+esc(r.primaryRecord.observation)+'</p>'+
  '<h5>Attribution and linked records (not independent proof)</h5><ul class="claim-evidence-list">'+rows+'</ul>'+
  '<p><strong>Source overlap:</strong> '+esc(r.lineage)+'</p>'+
  '<p><strong>Further independent checks required:</strong> '+esc(r.missing)+'</p>'+
  '<p class="muted small">Underlying incident verification: incomplete · Independent human editor: not obtained · Numeric scores, community votes and new portrait approvals: withheld.</p>'+
  '</details>';
}
// M28e: Seven source-graded public readings; never promote research to scored approvals.
function m28eFinalSevenSourceHtml(claim){
 const r=claim?.sourceAudit?.m28eFinalSevenSourceCheck;
 const grades=Object.freeze({
  original_publisher_broadcast_transcript_full_audiovisual_not_reviewed:'Original broadcaster transcript read; full video and sensor records not inspected',
  official_original_pdf_selected_pages_visually_checked:'Original government PDF: selected pages visually examined',
  contemporaneous_original_newsroom_article_not_press_conference_master:'Contemporaneous original reporting read; complete press-event recording not inspected',
  publisher_indexed_abstract_direct_article_403_shared_study:'Original publisher full text blocked (403); indexed abstract/sections only — ONE shared coauthor study',
  original_film_director_publisher_pages_full_film_not_played:'Original filmmaker-publisher interview pages read; documentary not watched',
  author_page_search_indexed_live_redirect_inaccessible:'Original author page indexed; current direct site redirect inaccessible; historical page not fully checked'
 });
 const kinds=Object.freeze({
  speaker_attribution_and_publisher_quoted_agency_confirmation:'Original speaker and quoted agency response',
  disputed_technical_inference:'Claim and competing interpretation',
  published_record_limit:'Publisher transcript limitations',
  explicit_witness_scope_limit:'Speaker explicitly not an eyewitness',
  reported_confidential_informant_chain:'Journalist account of unreviewed informants',
  reported_third_party_agreement:'Journalist account of uncompleted arrangement',
  asserted_historical_archive_access:'Reported historical archive transfers',
  original_contemporary_event_attribution:'Contemporaneous newsroom event record',
  organizer_asserted_witness_count:'Organizer-stated witness number, not verified cases',
  independent_catalogue_not_authentication_of_testimony:'Library catalogue, not recorded testimony proof',
  publisher_abstract_methods:'Original publisher indexed methods and abstract',
  published_isotope_limit:'Terrestrial-normal isotopic measurements reported',
  publisher_indexed_conclusion_context:'Publisher conclusion excerpt, not full-paper methods',
  original_publisher_project_description:'Original filmmaker interview page, not eyewitness master',
  publisher_publication_date_discrepancy:'Conflicting publication years',
  official_inquiry_catalogue_not_its_final_finding:'Official institutional case index, not final finding',
  author_acknowledged_not_eyewitness:'Author acknowledges later retrospective role',
  attributed_retrospective_interpretation:'Author’s interpretation, not 1980 observation',
  official_position_described_by_author_not_independently_reevaluated:'Official response as quoted by later author'
 });
 if(!r||r.status!=='targeted_publication_or_indexed_access_comparison_not_editorially_approved'||
    r.checkedAt!=='2026-11-16'||!safeUrl(r.primaryUrl)||
    !Object.hasOwn(grades,r.accessGrade)||
    r.fullUnderlyingClaimVerification!==false||
    r.secondIndependentHumanEditor!=='not_obtained'||
    r.permissionToPublishScoreOrCommunityVote!==false||
    r.permissionToApproveNewPortrait!==false||
    claim?.ratingReadiness?.publicationApproval!=='withheld'||
    claim?.sourceAccessCheck?.secondEditorSignoff!=='not_obtained'||
    typeof r.sourceTitle!=='string'||r.sourceTitle.length<32||
    typeof r.sourceMethod!=='string'||r.sourceMethod.length<105||
    typeof r.scope!=='string'||r.scope.length<115||
    typeof r.sourceLineage!=='string'||r.sourceLineage.length<115||
    typeof r.missingEvidence!=='string'||r.missingEvidence.length<110||
    !Array.isArray(r.passages)||r.passages.length<3||r.passages.length>4)return '';
 const valid=q=>q&&Object.hasOwn(kinds,q.kind)&&
   typeof q.locator==='string'&&q.locator.length>=45&&
   typeof q.finding==='string'&&q.finding.length>=105&&
   typeof q.limit==='string'&&q.limit.length>=115;
 if(!r.passages.every(valid))return '';
 const checks=r.passages.map(q=>
  '<li><strong>'+esc(kinds[q.kind])+'</strong><p class="muted small">Find it: '+esc(q.locator)+'</p>'+
  '<p>'+esc(q.finding)+'</p>'+
  '<p class="muted small"><strong>What it does NOT prove:</strong> '+esc(q.limit)+'</p></li>').join('');
 return '<details class="claim-m28e-check" data-m28e-final-source>'+
  '<summary>Original publication and source limits · 16 Nov 2026</summary>'+
  '<p class="claim-draft-warning"><strong>Research comparison, NOT approval.</strong> A publisher quote, library listing, archival index or author statement does not independently verify the underlying UAP claim or the person’s overall believability.</p>'+
  '<p><strong>Original access grade:</strong> '+esc(grades[r.accessGrade])+'</p>'+
  '<p><strong>What this check covers:</strong> '+esc(r.scope)+'</p>'+
  '<p class="muted small"><strong>Publication:</strong> '+esc(r.sourceTitle)+
  ' · <a href="'+esc(safeUrl(r.primaryUrl))+'" rel="noopener noreferrer" target="_blank">Inspect original publication ↗</a></p>'+
  '<p class="muted small"><strong>Inspection method:</strong> '+esc(r.sourceMethod)+'</p>'+
  '<h5>Attributed passages and their limits</h5><ul class="claim-evidence-list">'+checks+'</ul>'+
  '<p><strong>Shared-source warning:</strong> '+esc(r.sourceLineage)+'</p>'+
  '<p><strong>Missing independent checks:</strong> '+esc(r.missingEvidence)+'</p>'+
  '<p class="muted small">Underlying claim verification: incomplete · Independent human editor: not obtained · Claim scores, community voting and new portrait permission: withheld.</p>'+
  '</details>';
}
// M29 read-only editor handoff. This presentation cannot create, record or infer human approval.
function m29EditorialHandoffHtml(claim){
 const r=claim&&typeof m29Dockets!=='undefined'&&m29Dockets?.get?.(claim.id),
  rubric=typeof m29Rubric==='undefined'?null:m29Rubric;
 if(!r||!rubric||r.claimId!==claim.id||
  r.originalSourceUrl!==claim?.sourceAudit?.original?.url||
  r.sourceLineageGroup!==claim?.sourceAudit?.relatedSourceGroup||
  r.firstPassCoverage!=='m28_selected_original_or_explicitly_limited_source_review_complete'||
  r.fullOriginalInspected!==false||
  r.reviewerHandoff?.status!=='unassigned_requires_independent_human'||
  r.reviewerHandoff?.independentSecondHumanSignoff!=='not_obtained'||
  r.reviewerHandoff?.editorialPublicationPermission!==false||
  r.reviewerHandoff?.communityVotingPermission!==false||
  r.reviewerHandoff?.newPortraitRightsPermission!==false||
  r.reviewerHandoff?.leadEditor!==null||r.reviewerHandoff?.independentSecondEditor!==null||
  r.reviewerHandoff?.signedDecisionDate!==null||
  claim?.ratingReadiness?.publicationApproval!=='withheld'||
  !safeUrl(r.originalSourceUrl)||!Array.isArray(r.bibliography)||r.bibliography.length<1||
  r.bibliography.length>15||!Array.isArray(r.sameUrlReferenceReuses)||
  !Array.isArray(r.linkedClaimsSameResearchFamily)||r.linkedClaimsSameResearchFamily.length>10)return '';
 const kinds={
  originalRecordAndFullContext:'Inspect full original and statement context',
  sourceIndependenceAndLineage:'Separate firsthand evidence from rebroadcasts / shared studies',
  rawRecordsOrCustody:'Check underlying data, calibration and chain of custody',
  strongestRelevantContraryEvidence:'Read and document competing original records',
  reproducibilityAndUncertainty:'Review uncertainty, testability and replication',
  rightsAndPrivacy:'Verify rights and sensitive-source privacy'
 };
 if(!r.checklist||Object.keys(kinds).some(key=>r.checklist[key]!=='requires_separate_editorial_recheck'))return '';
 const rubricValid=rubric.status==='criteria_defined_no_scores_assigned'&&rubric.maxTotalPoints===100&&
  Array.isArray(rubric.criteria)&&rubric.criteria.length===5&&
  rubric.criteria.every(row=>EVIDENCE_RUBRIC.some(e=>e.key===row.id&&e.max===row.maxPoints)&&
    typeof row.title==='string'&&row.title.length>20&&typeof row.reviewEvidence==='string'&&row.reviewEvidence.length>60);
 if(!rubricValid)return '';
 if(r.bibliography.some(s=>!s||!safeUrl(s.url)||typeof s.title!=='string'||
   s.title.length<8||!EVIDENCE_STANCES[s.stance]||!EVIDENCE_TYPES[s.type]||
   !Number.isInteger(s.sourceOccurrences)||s.sourceOccurrences<1||
   !Array.isArray(s.reusedAcrossClaims)))return '';
 const itemById=new Map(r.bibliography.map(s=>[s.id,s]));
 if(itemById.size!==r.bibliography.length)return '';
 const repeats=r.sameUrlReferenceReuses.map(s=>itemById.get(s.id)).filter(Boolean);
 if(repeats.length!==r.sameUrlReferenceReuses.length)return '';
 const isPolicy=r.suitability==='not_applicable_to_incident_evidence_score';
 const weights=isPolicy?
  '<p><strong>Incident evidence percentage: Not applicable.</strong> This policy/recommendation record still needs its original sources and context reviewed; there is no event score to assign.</p>':
  '<h5>Five proposed evidence criteria — NO points assigned</h5>'+
  '<ul class="claim-m29-criteria">'+rubric.criteria.map(item=>
   '<li><strong>'+esc(item.title)+' · up to '+item.maxPoints+' potential points</strong>'+
   '<p class="muted small">'+esc(item.reviewEvidence)+'</p>'+
   '<p class="muted small"><strong>Guardrail:</strong> '+esc(item.blocker)+'</p></li>').join('')+'</ul>';
 const duplicates=repeats.length?
  '<h5>Reused URLs — NOT separate confirmation</h5><ul class="claim-evidence-list">'+repeats.map(s=>
   '<li><strong>'+esc(s.title)+'</strong><p class="muted small">'+
   esc(s.reusedAcrossClaims.length+' other claim dossiers cite the same exact URL; shared testimony or generic background is not independent evidence for an event.')+'</p>'+
   '<a href="'+esc(safeUrl(s.url))+'" target="_blank" rel="noopener noreferrer">Inspect repeated public reference ↗</a></li>').join('')+'</ul>':
  '<p class="muted small">No identical cited URL across other claim dossiers in this index. That does NOT establish source independence.</p>';
 const family=r.linkedClaimsSameResearchFamily.length?
  '<p><strong>Related research family:</strong> '+esc(r.sourceLineageGroup)+
  '. '+r.linkedClaimsSameResearchFamily.length+' other claim docket(s) use this same incident/report/study family. Family links require manual provenance review and must not be counted as independent corroboration.</p>':
  '<p class="muted small">Research family: '+esc(r.sourceLineageGroup)+'. No other docket has this exact family ID; this is not evidence of independence.</p>';
 const contrary=(r.contextualOrContraryReferenceIds||[]).map(id=>itemById.get(id)).filter(Boolean);
 const challenges=contrary.length?
  '<h5>Potential contrasting sources — not adjudicated</h5><ul class="claim-evidence-list">'+contrary.map(s=>
   '<li><strong>'+esc(s.title)+'</strong> · '+esc(EVIDENCE_STANCES[s.stance])+
   '<p class="muted small">A linked alternative or challenge, not proof it applies to the exact underlying claim.</p>'+
   '<a href="'+esc(safeUrl(s.url))+'" target="_blank" rel="noopener noreferrer">Check original contrasting source ↗</a></li>').join('')+'</ul>':
  '<p class="muted small"><strong>Contrary-source gap:</strong> No bibliography item is yet classified as a challenge or alternative; this does not mean none exists.</p>';
 return '<details class="claim-m29-docket" data-m29-editorial-handoff>'+
  '<summary>M29 · Editorial criteria, source overlap &amp; independent-review checklist</summary>'+
  '<p class="claim-draft-warning"><strong>Reviewer handoff, NOT an editorial verdict.</strong> All 23 dossiers have a targeted source-coverage pass, but no independently signed case finding, 0–100 score, member vote or personal credibility judgement.</p>'+
  '<p><strong>Claim reference:</strong> '+esc(r.claimId)+'</p>'+
  '<p><strong>Original:</strong> <a href="'+esc(safeUrl(r.originalSourceUrl))+'" target="_blank" rel="noopener noreferrer">Inspect original source ↗</a> · '+esc(r.primarySourceAccessStatus)+'</p>'+
  weights+family+duplicates+challenges+
  '<h5>Independent human-editor checklist — ALL pending</h5>'+
  '<ul class="claim-m29-criteria">'+Object.entries(kinds).map(([key,label])=>
    '<li><strong>Not signed off:</strong> '+esc(label)+'</li>').join('')+'</ul>'+
  '<p class="muted small">Lead reviewer: unassigned · Independent second human editor: unassigned · Conflicts of interest: not checked · All publication, community-vote and portrait permissions: withheld.</p>'+
  '<p class="muted small">A shared publication, third-party quote or multiple coauthors never creates an additional independent physical observation. Review the linked original records and uncertainties directly before any human signoff.</p>'+
 '</details>';
}
function parseM29EditorialQueue(raw,directoryPeople){
 if(!raw||raw.schemaVersion!==1||raw.status!=='research_handoff_readonly_no_human_approval'||
    raw.proposedRubric?.status!=='criteria_defined_no_scores_assigned'||
    raw.proposedRubric.maxTotalPoints!==100||
    raw.policy?.noClaimScorePublished!==true||
    raw.policy?.noMemberBallotsEnabled!==true||
    raw.policy?.noHumanSignoffCreatedByAutomation!==true||
    raw.policy?.noPersonBelievabilityRating!==true||
    !Array.isArray(raw.dockets)||raw.dockets.length!==23)return null;
 const byId=new Map();
 for(const d of raw.dockets){
  const p=directoryPeople.find(x=>x.id===d?.personId);
  const c=p?.claimEvidence?.find(x=>x.id===d.claimId);
  if(!c||byId.has(d.claimId)||d.originalSourceUrl!==c.sourceAudit?.original?.url||
     d.sourceLineageGroup!==c.sourceAudit?.relatedSourceGroup||
     d.fullOriginalInspected!==false||
     d.reviewerHandoff?.status!=='unassigned_requires_independent_human'||
     d.reviewerHandoff?.independentSecondHumanSignoff!=='not_obtained'||
     d.reviewerHandoff?.editorialPublicationPermission!==false||
     d.reviewerHandoff?.communityVotingPermission!==false||
     d.reviewerHandoff?.newPortraitRightsPermission!==false||
     d.reviewerHandoff?.leadEditor!==null||
     d.reviewerHandoff?.independentSecondEditor!==null||
     d.reviewerHandoff?.signedDecisionDate!==null||
     c.ratingReadiness?.publicationApproval!=='withheld')return null;
  byId.set(d.claimId,d);
 }
 if(directoryPeople.filter(x=>x.claimEvidence?.length).length!==23)return null;
 return {rubric:raw.proposedRubric,dockets:byId};
}
function sourceAuditDraftHtml(claim){
 const d=claim?.sourceAudit;
 if(!d||d.status!=='original_record_comparison_draft'||d.reviewerSignoff!=='not_obtained'||
   !/^\d{4}-\d{2}-\d{2}$/.test(d.checkedAt||'')||
   !d.original||!safeUrl(d.original.url)||
   typeof d.original.locator!=='string'||d.original.locator.trim().length<25||
   typeof d.original.assessment!=='string'||d.original.assessment.trim().length<75||
   [d.independentEvidence,d.competingRecord,d.missingEvidence].some(v=>typeof v!=='string'||v.trim().length<75)||
   (d.relatedSourceGroup!==null && d.relatedSourceGroup!==undefined &&
    (typeof d.relatedSourceGroup!=='string'||!/^[a-z0-9-]{8,80}$/.test(d.relatedSourceGroup))))return '';
 return '<section class="claim-audit-draft" aria-label="Original-record source comparison, review pending">'+
  '<h5>Original-record comparison · first pass</h5>'+
  '<p class="claim-draft-warning"><strong>Unsigned research check — not a scored or independently approved finding.</strong> This compares what is in the public record with what the underlying evidence can actually establish. It does not calculate a probability or rate anyone’s honesty.</p>'+
  '<p class="muted small">Record consulted '+esc(d.checkedAt)+' · Independent second-editor signoff: <strong>Pending</strong></p>'+
  '<p><strong>What the original record establishes:</strong> '+esc(d.original.assessment)+'</p>'+
  '<p class="muted small"><strong>Exact record location:</strong> '+esc(d.original.locator)+
   ' · <a href="'+esc(safeUrl(d.original.url))+'" target="_blank" rel="noopener noreferrer">Read original record ↗</a></p>'+
  '<p><strong>Independent evidence versus repeat reporting:</strong> '+esc(d.independentEvidence)+'</p>'+
  '<p><strong>What alternative or challenging material establishes:</strong> '+esc(d.competingRecord)+'</p>'+
  '<p><strong>What remains unavailable or unverified:</strong> '+esc(d.missingEvidence)+'</p>'+
  '</section>';
}
// Claim-by-claim editorial triage explains whether an EVENT evidence metric
// would be meaningful. It does not authorize scoring or create any real votes.
const READINESS_ROUTES=Object.freeze({
 incident_evidence_review_pending:'Incident evidence review still required',
 documentary_source_review_pending:'Documentary source corroboration still required',
 method_specific_review_pending:'Scientific or method-specific review still required',
 not_applicable_to_incident_score:'Not applicable to an incident evidence percentage'
});
const READINESS_TYPES=Object.freeze([
 'incident_or_observation','institutional_programme_allegation',
 'reporting_or_source_claim','technical_or_scientific_analysis',
 'policy_or_records_access','retrospective_case_interpretation'
]);
const PRIMARY_ACCESS_STATUSES=Object.freeze({
 official_written_record_first_pass:'Official written testimony — first pass only',
 publisher_text_first_pass:'Original publisher text — first pass only',
 original_master_or_full_video_not_verified:'Full original recording or master still unverified',
 partial_original_or_abstract_only:'Original document or methods only partly accessible'
});
function ratingReadinessHtml(claim){
 const d=claim?.ratingReadiness;
 if(!d||d.status!=='first_pass_triage'||d.publicationApproval!=='withheld'||
   d.secondEditor!=='not_assigned'||!/^\d{4}-\d{2}-\d{2}$/.test(d.date||'')||
   !READINESS_TYPES.includes(d.claimType)||
   !Object.hasOwn(READINESS_ROUTES,d.scorePath)||
   !Object.hasOwn(PRIMARY_ACCESS_STATUSES,d.primarySourceAccess)||
   typeof d.reason!=='string'||d.reason.trim().length<90||
   typeof d.requiredNextCheck!=='string'||d.requiredNextCheck.trim().length<70)return '';
 return '<section class="claim-readiness-draft" aria-label="Editorial scoring suitability triage — pending">'+
  '<h5>Is an evidence percentage appropriate for this claim?</h5>'+
  '<p class="claim-draft-warning"><strong>'+esc(READINESS_ROUTES[d.scorePath])+'.</strong> Editorial triage only; no numerical claim assessment or community vote is approved.</p>'+
  '<p><strong>What could be assessed:</strong> '+esc(d.reason)+'</p>'+
  '<p class="muted small"><strong>Access to original:</strong> '+esc(PRIMARY_ACCESS_STATUSES[d.primarySourceAccess])+'</p>'+
  '<p><strong>Before any rating:</strong> '+esc(d.requiredNextCheck)+'</p>'+
  '<p class="muted small">Triage '+esc(d.date)+' · Independent reviewer: <strong>Not assigned</strong> · Approval: withheld. This is a classification of the research task, not of anyone’s honesty or reliability.</p>'+
 '</section>';
}

// M16 original-source access is a reader-facing transparency log, NOT
// independent corroboration or a signed editorial verification.
const SOURCE_ACCESS_LABELS=Object.freeze({
 full_original_recheck_pending:'Full original recheck still pending',
 original_page_fetch_unavailable:'Original-source access unavailable in this check',
 publisher_video_metadata_verified:'Publisher video and chapter metadata checked (not full footage)',
 official_hearing_transcript_retrieved:'Government hearing transcript text accessible (not event confirmation)',
 publisher_original_article_retrieved:'Original signed publisher article accessible (not independent source validation)',
 publisher_original_article_landing_retrieved:'Original paper abstract accessible (complete methods not reviewed)',
 publisher_original_interview_transcript_retrieved:'Original broadcast interview transcript accessible (footage/data not fully checked)',
 official_written_testimony_pdf_selected_pages_inspected:'Original House written testimony PDF — selected pages visually inspected',
 original_technical_analysis_post_retrieved:'Original technical analysis post and model links accessible (model not independently run)',
 original_author_opinion_text_retrieved:'Original author policy opinion accessible (not legal finding)',
 original_peer_reviewed_paper_pdf_selected_pages_inspected:'Original peer-reviewed PDF — selected pages visually inspected, no replication',
 contemporaneous_reporting_full_text_retrieved:'Contemporaneous publisher report accessible (allegations unverified)',
 original_film_director_interview_pages_retrieved:'Original filmmaker interviews accessible (film witness footage not viewed)',
 journal_original_page_indexed_direct_fetch_blocked:'Journal article indexed, original publisher direct access blocked',
 original_author_page_indexed_direct_fetch_blocked:'Original author essay indexed, canonical page directly blocked',
 original_author_page_text_retrieved:'Original author essay directly accessible (historic case independently unverified)'
});
function sourceAccessCheckHtml(claim){
 const r=claim?.sourceAccessCheck;
 if(!r || r.reviewStage!=='m16_source_access_only' || r.fullOriginalReviewed!==false ||
    r.secondEditorSignoff!=='not_obtained' ||
    !Object.hasOwn(SOURCE_ACCESS_LABELS,r.status) ||
    !safeUrl(r.primaryUrl) || r.primaryUrl!==claim?.sourceAudit?.original?.url ||
    (r.checkedAt!==null && !/^\d{4}-\d{2}-\d{2}$/.test(r.checkedAt||'')) ||
    (r.status==='full_original_recheck_pending' ? r.checkedAt!==null : r.checkedAt===null) ||
    (r.referenceUrl!==null && !safeUrl(r.referenceUrl)) ||
    (r.locator!==undefined&&(typeof r.locator!=='string'||r.locator.trim().length<20)) ||
    typeof r.observation!=='string' || r.observation.trim().length<85 ||
    typeof r.nextAction!=='string' || r.nextAction.trim().length<75)return '';
 return '<section class="claim-source-access" aria-label="Original-source access status">'+
  '<h5>Original source access &amp; verification status</h5>'+
  '<p class="muted small"><strong>'+esc(SOURCE_ACCESS_LABELS[r.status])+'</strong> · Full original reviewed: <strong>No</strong> · Independent approval: <strong>Pending</strong></p>'+
  '<p>'+esc(r.observation)+'</p>'+
  (r.locator?'<p class="muted small"><strong>Where in source:</strong> '+esc(r.locator)+'</p>':'')+
  '<p><strong>What to verify next:</strong> '+esc(r.nextAction)+'</p>'+
  '<p class="muted small"><a href="'+esc(safeUrl(r.primaryUrl))+'" target="_blank" rel="noopener noreferrer">Inspect linked original source ↗</a>'+
   (r.referenceUrl?' · <a href="'+esc(safeUrl(r.referenceUrl))+'" target="_blank" rel="noopener noreferrer">Supporting access or context record ↗</a>':'')+
   (r.checkedAt?' · Checked '+esc(r.checkedAt):' · New direct-access check pending')+'</p>'+
 '</section>';
}

function evidenceReviewSummaryHtml(summary){
 if(!summary||typeof summary.finding!=='string'||!summary.finding.trim()||
    typeof summary.remaining!=='string'||!summary.remaining.trim())return '';
 const links=(Array.isArray(summary.links)?summary.links:[]).filter(link=>
  link&&typeof link.title==='string'&&link.title.trim()&&safeUrl(link.url));
 return '<section class="claim-source-access" aria-label="Evidence review summary">'+
  '<h5>Evidence review summary</h5>'+
  '<p>'+esc(summary.finding)+'</p>'+
  '<p><strong>Still to verify:</strong> '+esc(summary.remaining)+'</p>'+
  (links.length?'<ul class="link-list">'+links.map(link=>
   '<li><a href="'+esc(safeUrl(link.url))+'" target="_blank" rel="noopener noreferrer">'+
   esc(link.title)+'</a></li>').join('')+'</ul>':'')+
  '</section>';
}

function draftEvidenceTrailHtml(claim){
 const draft=claim?.researchEvidence;
 if(draft?.status!=='research_draft'||!Array.isArray(draft.items)||draft.items.length>20||
    typeof draft.editorialNote!=='string'||draft.editorialNote.trim().length<35)return '';
 const entries=draft.items.filter(e=>e&&
   typeof e.id==='string'&&/^[a-z0-9][a-z0-9-]{2,65}$/.test(e.id)&&
   EVIDENCE_STANCES[e.stance]&&EVIDENCE_TYPES[e.type]&&e.access==='public'&&
   safeUrl(e.url)&&typeof e.title==='string'&&e.title.trim().length>=8&&
   typeof e.locator==='string'&&e.locator.trim().length>=3&&
   typeof e.reviewNote==='string'&&e.reviewNote.trim().length>=25&&
   typeof e.checkedAt==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.checkedAt));
 if(!entries.length)return '';
 const items=entries.map(e=>
   '<li><strong>'+esc(e.title)+'</strong>'+
   '<span class="muted small"> · '+esc(EVIDENCE_TYPES[e.type])+' · '+esc(EVIDENCE_STANCES[e.stance])+'</span>'+
   '<p class="muted small">Find it: '+esc(e.locator)+' · Link consulted '+esc(e.checkedAt)+'</p>'+
   '<p>'+esc(e.reviewNote)+'</p>'+
   '<a href="'+esc(safeUrl(e.url))+'" target="_blank" rel="noopener noreferrer">Read original source ↗</a></li>'
 ).join('');
 return '<p class="claim-draft-warning"><strong>Research notes — NOT a completed evidence review.</strong> The links below include original reporting and broader context. Listing a document does not establish that the underlying event occurred, or that conflicting interpretations have been fully checked.</p>'+
  evidenceReviewSummaryHtml(claim.evidenceReviewSummary)+
  sourceAuditDraftHtml(claim)+
  ratingReadinessHtml(claim)+
  sourceAccessCheckHtml(claim)+
  '<p class="muted small"><strong>Open questions:</strong> '+esc(draft.editorialNote)+'</p>'+
  '<h5>Public materials consulted (provisional)</h5><ul class="claim-evidence-list">'+items+'</ul>'+
  m28HearingCrosscheckHtml(claim)+
  m28bOriginalSourceCheckHtml(claim)+
  m28cFirstPartyCheckHtml(claim)+
  m28dBroadcastLineageHtml(claim)+
  m28eFinalSevenSourceHtml(claim)+
  m29EditorialHandoffHtml(claim)+
  '<p class="muted small">No criterion-by-criterion points or community votes are available until a separate source-and-editorial approval.</p>';
}
function publishedClaimReview(claim){
 // Research-policy recommendations and unknown claim categories must never
 // receive a fabricated 0–100 physical-evidence assessment.
 // Explicitly signed approval records are mandatory; missing metadata is NOT approval.
 // A pending, policy-only or unverified-original claim must never display points or voting.
 if(claim?.claimKind!=='public_claim')return null;
 const readiness=claim?.ratingReadiness;
 if(!readiness||readiness.status!=='independently_approved'||
    readiness.publicationApproval!=='granted'||readiness.secondEditor!=='approved'||
    !['incident_evidence_review_approved','documentary_source_review_approved','method_specific_review_approved'].includes(readiness.scorePath))return null;
 const originalAccess=claim?.sourceAccessCheck;
 if(!originalAccess||originalAccess.fullOriginalReviewed!==true||
    originalAccess.secondEditorSignoff!=='approved')return null;
 const r=claim?.review;
 if(!r||r.status!=='published'||r.methodology!=='dd-claim-evidence-v1')return null;
 if(typeof r.reviewer!=='string'||r.reviewer.trim().length<5||
    typeof r.reviewedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.reviewedAt))return null;
 if(!r.editorialChecks||!['sourceVerified','claimContextChecked','contraryEvidenceReviewed','secondEditorApproved'].every(k=>r.editorialChecks[k]===true))return null;
 const sources=Array.isArray(claim.sources)?claim.sources:[];
 if(!sources.some(s=>s?.kind==='primary'&&safeUrl(s.url)&&s.label))return null;
 if(!r.points||!r.rationale)return null;
 if(!publishedEvidenceTrail(claim))return null;
 if(EVIDENCE_RUBRIC.some(row=>!Number.isInteger(r.points[row.key])||
   r.points[row.key]<0||r.points[row.key]>row.max||
   typeof r.rationale[row.key]!=='string'||r.rationale[row.key].trim().length<20))return null;
 return r;
}
const scoreableClaimId=id=>typeof id==='string'&&/^[a-z0-9][a-z0-9-]{6,85}$/.test(id);
const communityClaimEligible=claim=>publishedClaimReview(claim)!==null&&claim?.status==='source_verified'&&
  claim?.sourceReviewApproved===true&&scoreableClaimId(claim.id)&&
  Array.isArray(claim.sources)&&claim.sources.some(x=>x?.kind==='primary'&&safeUrl(x.url)&&x.label);
let communityClient=null;
function communityDb(){
 const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
 const active=window.DD_COMMUNITY_FEATURES?.voting===true&&
   ['production','test'].includes(cfg.environment);
 if(!active||!cfg.url||!cfg.publishableKey||!window.supabase?.createClient)return null;
 return communityClient||(communityClient=window.supabase.createClient(cfg.url,cfg.publishableKey,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
 }));
}
async function hydrateCommunityRatings(){
 const target=$('profileEvidenceReviews');
 if(!target?.querySelectorAll)return;
 const roots=[...target.querySelectorAll('[data-evidence-claim-id]')];
 if(!roots.length)return;
 const db=communityDb();
 if(!db){for(const root of roots)root.querySelector('[data-rating-summary]').textContent='Community voting is not available yet.';return;}
 const ids=roots.map(n=>n.dataset.evidenceClaimId).filter(scoreableClaimId);
 let rows=[];
 try{
  const {data,error}=await db.rpc('dd_who_claim_rating_summary',{p_claim_ids:ids});
  if(error)throw error;
  rows=Array.isArray(data)?data:[];
 }catch{
  for(const root of roots)if(root.isConnected)root.querySelector('[data-rating-summary]').textContent='Community rating unavailable. Your vote has not been changed.';
  return;
 }
 let member=null;
 try{const {data,error}=await db.auth.getUser();if(!error&&!data?.user?.is_anonymous)member=data?.user||null}catch{}
 for(const root of roots){
  if(!root.isConnected || !selected || !selected.claimEvidence?.some(c=>c.id===root.dataset.evidenceClaimId))continue;
  const row=rows.find(r=>r.claim_id===root.dataset.evidenceClaimId);
  const info=root.querySelector('[data-rating-summary]');
  const count=Math.max(0,Math.floor(Number(row?.rating_count||0)));
  const mean=Number(row?.community_mean);
  const showMean=count>=5&&row?.community_mean!==null&&row?.community_mean!==undefined&&Number.isFinite(mean)&&mean>=0&&mean<=100;
  info.textContent=showMean?mean.toFixed(1)+'/100 · '+count+' member ratings':
    count>0?count+' rating'+(count===1?'':'s')+' · Average shown after 5 ratings':'No community ratings yet';
  const label=root.querySelector('[data-rating-control]');
  if(!member){label.hidden=true;root.querySelector('[data-rating-notice]').textContent='Sign in under Boards → Account to rate this claim’s supporting evidence.';continue;}
  label.hidden=false;
  const mine=Number(row?.my_rating);
  if(row?.my_rating!==null&&row?.my_rating!==undefined&&Number.isFinite(mine)&&mine>=0&&mine<=100){
   label.querySelector('[data-rating-slider]').value=String(mine);
   label.querySelector('[data-rating-number]').textContent=String(mine);
  }
  root.querySelector('[data-rating-notice]').textContent='One rating per account and claim; updates are subject to a cooldown.';
  const slider=label.querySelector('[data-rating-slider]'),amount=label.querySelector('[data-rating-number]');
  slider.addEventListener('input',()=>{amount.textContent=String(slider.value)});
  const button=label.querySelector('[data-rating-save]');
  button.addEventListener('click',async()=>{
   if(button.disabled)return;
   button.disabled=true;
   const notice=root.querySelector('[data-rating-notice]');
   notice.textContent='Submitting rating…';
   try{
    const score=Number(slider.value);
    if(!Number.isInteger(score)||score<0||score>100)throw Error('Invalid rating');
    const verify=await db.auth.getUser();
    if(verify.error||!verify.data?.user||verify.data.user.is_anonymous)throw Error('Sign in again before rating.');
    const {error}=await db.rpc('dd_who_claim_rating_set',{
     p_claim_id:root.dataset.evidenceClaimId,p_rating:score
    });
    if(error)throw error;
    notice.textContent='Rating submitted. Refreshing community average…';
    const refreshed=await db.rpc('dd_who_claim_rating_summary',{p_claim_ids:[root.dataset.evidenceClaimId]});
    if(refreshed.error)throw refreshed.error;
    const next=Array.isArray(refreshed.data)?refreshed.data[0]:null;
    if(next&&root.isConnected){
     const n=Math.max(0,Math.floor(Number(next.rating_count||0)));
     const v=Number(next.community_mean);
     info.textContent=n>=5&&next.community_mean!=null&&Number.isFinite(v)?v.toFixed(1)+'/100 · '+n+' member ratings':
       n? n+' rating'+(n===1?'':'s')+' · Average shown after 5 ratings':'No community ratings yet';
    }
    notice.textContent='Your rating has been received. You can change it after the cooldown.';
   }catch{
    notice.textContent='Rating not confirmed. Check your connection and refresh the current vote before retrying.';
   }finally{button.disabled=false}
  });
 }
}
// Source-backed role or legislative record, deliberately independent from
// extraordinary-event claim scoring and any member rating controls.
const PUBLIC_ROLE_KINDS=Object.freeze({
 institutional_role:'NASA study role',
 legislative_role:'Congressional task-force role',
 legislative_action:'Legislative action',
 congressional_oversight:'Congressional oversight'
});
function renderPublicRoleEvidence(person){
 const role=person?.roleEvidence;
 if(!role||role.status!=='official_source_crosscheck'||
    !Object.hasOwn(PUBLIC_ROLE_KINDS,role.kind)||
    typeof role.title!=='string'||role.title.trim().length<12||
    typeof role.description!=='string'||role.description.trim().length<60||
    !/^\d{4}-\d{2}-\d{2}$/.test(role.eventDate||'')||
    !Array.isArray(role.sources)||role.sources.length<2||role.sources.length>8)return '';
 const sources=role.sources.filter(s=>s&&safeUrl(s.url)&&
   typeof s.title==='string'&&s.title.trim().length>=8&&
   typeof s.locator==='string'&&s.locator.trim().length>=6&&
   typeof s.note==='string'&&s.note.trim().length>=25&&
   /^\d{4}-\d{2}-\d{2}$/.test(s.checkedAt||''));
 if(sources.length<2)return '';
 return '<article class="claim-role-card" aria-label="Public documentary role evidence">'+
  '<div class="claim-status">'+esc(PUBLIC_ROLE_KINDS[role.kind])+' · '+esc(role.eventDate)+'</div>'+
  '<h4>'+esc(role.title)+'</h4>'+
  '<p>'+esc(role.description)+'</p>'+
  '<p class="claim-role-caution"><strong>Not an incident evidence score.</strong> Official records establish the role or legislative action; they do not independently verify reported UAP events, endorsements of every argument or the origins of unidentified objects. This source cross-check is not a completed biography/portrait-rights review.</p>'+
  '<details class="claim-evidence-details"><summary>Inspect original role &amp; legislative records ('+sources.length+')</summary>'+
   '<ul class="claim-evidence-list">'+sources.map(x=>'<li><strong>'+esc(x.title)+'</strong>'+
    '<p class="muted small">Where to look: '+esc(x.locator)+' · Checked '+esc(x.checkedAt)+'</p>'+
    '<p>'+esc(x.note)+'</p>'+
    '<a href="'+esc(safeUrl(x.url))+'" target="_blank" rel="noopener noreferrer">Read official source ↗</a></li>').join('')+'</ul>'+
  '</details>'+
  '<p class="muted small"><strong>Scoring:</strong> Not applicable to an official role or policy action. Separate specific public incident claims, where applicable, require their own sourced review.</p>'+
 '</article>';
}
// First-party publications and attributed testimony are not verified incidents.
// Neither careers nor publications are person-wide credibility/voting categories.
const PUBLIC_WORK_KINDS=Object.freeze({
 journalism:'Journalistic reporting',
 documentary_reporting:'Documentary and interviews',
 technical_critique:'Published technical critique',
 contested_first_person_claim:'Historical or first-person account',
 organized_public_claim:'Public testimony event',
 government_policy_reporting:'Policy reporting and documentaries',
 academic_research:'Scientific research programme',
 published_research:'Public research and books',
 historical_public_work:'Historical archive and published work',
 archive_research:'Records and FOIA research'
});
const PUBLIC_SOURCE_CLASSES=Object.freeze({
 publisher:'Original publisher or syndicated reporting',
 first_party:'First-party biography or publication index',
 institutional:'Institutional or government source',
 archive:'Historical source archive'
});
function renderPublicWorkEvidence(person){
 const r=person?.publicWorkEvidence;
 if(!r||r.status!=='research_links_indexed'||
  !Object.hasOwn(PUBLIC_WORK_KINDS,r.kind)||
  typeof r.title!=='string'||r.title.trim().length<12||
  typeof r.period!=='string'||r.period.trim().length<4||
  typeof r.description!=='string'||r.description.trim().length<65||
  typeof r.openQuestions!=='string'||r.openQuestions.trim().length<80||
  !Array.isArray(r.sources)||r.sources.length<2||r.sources.length>8)return '';
 const items=r.sources.filter(x=>x&&Object.hasOwn(PUBLIC_SOURCE_CLASSES,x.sourceClass)&&
   safeUrl(x.url)&&typeof x.title==='string'&&x.title.trim().length>=12&&
   typeof x.locator==='string'&&x.locator.trim().length>=5&&
   typeof x.note==='string'&&x.note.trim().length>=45&&
   typeof x.indexedAt==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.indexedAt));
 if(items.length!==r.sources.length)return '';
 return '<article class="claim-work-card" aria-label="Original publication research records">'+
  '<div class="claim-status">'+esc(PUBLIC_WORK_KINDS[r.kind])+' · '+esc(r.period)+'</div>'+
  '<h4>'+esc(r.title)+'</h4><p>'+esc(r.description)+'</p>'+
  '<p class="claim-draft-warning"><strong>Source index — NOT an approved case assessment.</strong> An original interview, book, broadcast or paper establishes what was published and by whom. It does not establish the truth of the reported event. Every source and relevant counterargument still requires case-specific editorial review.</p>'+
  '<details class="claim-evidence-details"><summary>Inspect original publications &amp; source trail ('+items.length+')</summary>'+
   '<p class="muted small"><strong>Research still needed:</strong> '+esc(r.openQuestions)+'</p>'+
   '<ul class="claim-evidence-list">'+items.map(x=>'<li><strong>'+esc(x.title)+'</strong>'+
    '<p class="muted small">'+esc(PUBLIC_SOURCE_CLASSES[x.sourceClass])+' · Find it: '+esc(x.locator)+' · Link indexed '+esc(x.indexedAt)+'</p>'+
    '<p>'+esc(x.note)+'</p>'+
    '<a href="'+esc(safeUrl(x.url))+'" target="_blank" rel="noopener noreferrer">Open cited publication or archive ↗</a></li>').join('')+'</ul>'+
  '</details>'+
  '<p class="muted small"><strong>Scoring:</strong> Not applicable to a professional career or publication list. Any specific UAP-event claim needs its own independent source review and explicit editorial approval before a 0–100 score or member ballot.</p>'+
 '</article>';
}
// Explain source-limited no-score decisions, not personal credibility judgements.
function renderEvidenceScope(person){
 const d=person?.evidenceScope;
 if(!d||d.status!=='research_scope_draft'||
  d.classification!=='documented_role_or_publication_only'||
  d.applicability!=='not_applicable_to_documented_role'||
  !/^\d{4}-\d{2}-\d{2}$/.test(d.reviewDate||'')||
  [d.originalRole,d.scope,d.reason,d.nextEvidenceNeeded].some(v=>typeof v!=='string'||v.trim().length<30)||
  !Array.isArray(d.sourceChecks)||d.sourceChecks.length<2||d.sourceChecks.length>6)return '';
 const refs=d.sourceChecks.filter(s=>s&&safeUrl(s.url)&&
  typeof s.title==='string'&&s.title.trim().length>10&&
  typeof s.locator==='string'&&s.locator.trim().length>=6&&
  typeof s.interpretation==='string'&&s.interpretation.trim().length>=30);
 if(refs.length!==d.sourceChecks.length)return '';
 return '<section class="claim-role-card claim-scope-review" aria-label="Evidence scope and scoring eligibility decision">'+
  '<div class="claim-status">Research scope check · '+esc(d.reviewDate)+'</div>'+
  '<h4>Why no event-claim percentage?</h4>'+
  '<p><strong>Not applicable to the documented role or work.</strong> This is not a 0/100 score for the person. A separate, specific event assertion can still be examined if a suitable primary source is found.</p>'+
  '<p><strong>What was reviewed:</strong> '+esc(d.scope)+'</p>'+
  '<p>'+esc(d.reason)+'</p>'+
  '<details class="claim-evidence-details"><summary>Inspect why this role is not scored ('+refs.length+' source checks)</summary>'+
   '<p class="muted small"><strong>What further evidence could change the scope:</strong> '+esc(d.nextEvidenceNeeded)+'</p>'+
   '<ul class="claim-evidence-list">'+refs.map(x=>'<li><strong>'+esc(x.title)+'</strong>'+
    '<p class="muted small">Locate: '+esc(x.locator)+'</p>'+
    '<p>'+esc(x.interpretation)+'</p>'+
    '<a href="'+esc(safeUrl(x.url))+'" target="_blank" rel="noopener noreferrer">Inspect original source ↗</a></li>').join('')+'</ul>'+
  '</details>'+
  '<p class="muted small">This is an unsigned research-scoping decision, not a completed independent fact-check, a permanent exclusion or a statement about personal honesty.</p>'+
 '</section>';
}
function renderClaimEvidence(person){
 const host=$('profileEvidenceReviews');
 if(!host)return;
 const roleHtml=renderPublicRoleEvidence(person);
 const workHtml=renderPublicWorkEvidence(person);
 const scopeHtml=renderEvidenceScope(person);
 const claims=Array.isArray(person.claimEvidence)?person.claimEvidence.slice(0,12):[];
 if(!claims.length){
  host.innerHTML=roleHtml?
   roleHtml+scopeHtml+'<p class="note small"><strong>No event-claim score applies to this documented role.</strong> No separate public UAP incident claim has completed editorial review for this person. Official research service, institutional participation and legislation cannot be assigned 0/100 or a community incident rating.</p>':
   workHtml?
   workHtml+scopeHtml+'<p class="note small"><strong>Disclosure Desk rating: Not assessed.</strong> Original work and public statements are indexed, but no specific UAP incident has received an approved evidence assessment. A publication list is not a person-wide credibility score and cannot be voted on.</p>':
   '<p class="note small"><strong>Disclosure Desk rating: Not assessed.</strong> There are no individually reviewed public claims for this profile yet. Community rating is not open on unreviewed statements. Biographies and citations do not constitute a personal score.</p>';
  return;
 }
 host.innerHTML=roleHtml+workHtml+claims.map(claim=>{
  if(!claim||!claim.statement)return '';
  const advisory=claim.claimKind==='policy_recommendation';
  const nonEventMetric=advisory||claim.ratingReadiness?.scorePath==='not_applicable_to_incident_score';
  const r=publishedClaimReview(claim);
  const score=r?EVIDENCE_RUBRIC.reduce((a,row)=>a+r.points[row.key],0):null;
  const allowed=communityClaimEligible(claim);
  const sources=validLinks(claim.sources);
  const refs=sources.map(s=>'<li><a href="'+esc(safeUrl(s.url))+'" target="_blank" rel="noopener noreferrer">'+
    esc(s.label||'Public reference')+' ↗</a> <span class="muted small">· '+esc(s.kind||'Attribution')+'</span>'+
    (s.context?'<p class="muted small">'+esc(s.context)+'</p>':'')+'</li>').join('');
  const evidence=r?publishedEvidenceTrail(claim):null;
  const detailedReview=r?evidenceTrailHtml(claim,r,evidence):'';
  const sitePanel='<section class="claim-dual-panel"><h5>Disclosure Desk rating</h5>'+
   (nonEventMetric?'<span class="claim-not-assessed">Not applicable</span>'+
     '<p class="muted small">This research-policy or records-access assertion is not evidence of an extraordinary incident. The original documents can be inspected below.</p>':
     r?'<div class="claim-score" aria-label="Public evidence support score '+score+' out of 100">'+score+
     '<small> /100 · Documented evidence support</small></div>'+
     '<p class="muted small">Detailed evidence, point-by-point reasoning and original records can be opened below.</p>':
     '<span class="claim-not-assessed">Not assessed</span>'+
     '<p class="muted small">Original statement is catalogued; evidence-strength review is pending.</p>')+
   '</section>';
  const communityPanel='<section class="claim-dual-panel"><h5>Community rating</h5>'+
   (allowed?'<div class="claim-community-rating" data-evidence-claim-id="'+esc(claim.id)+'">'+
      '<p class="muted small" data-rating-summary role="status">Checking community rating…</p>'+
      '<div data-rating-control hidden><label class="muted small">How strongly does the publicly available evidence support this claim? <strong data-rating-number>50</strong>/100'+
      '<input type="range" data-rating-slider min="0" max="100" step="5" value="50" aria-label="Community rating for evidence supporting this specific claim"></label>'+
      '<button type="button" class="btn" data-rating-save>Submit my rating</button></div>'+
      '<p class="muted small" data-rating-notice aria-live="polite">Checking sign-in and rating availability…</p></div>':
     (nonEventMetric?'<span class="claim-not-assessed">Not applicable</span><p class="muted small">Incident evidence votes do not apply to policy or record-release recommendations.</p>':
      '<span class="claim-not-assessed">Voting not open</span><p class="muted small">This claim is still awaiting source and context approval, so no member ratings are collected.</p>'))+
   '</section>';
  return '<article class="claim-review" aria-label="Individual public claim evidence review">'+
    '<div class="claim-status">'+(advisory?'PUBLIC RESEARCH RECOMMENDATION':nonEventMetric?'PUBLIC POLICY / RECORDS-ACCESS CLAIM':'PUBLIC CLAIM')+' · '+esc(claim.date||'Date requires verification')+'</div>'+
    '<h4>'+esc(claim.statement)+'</h4>'+
    '<p class="muted small">'+esc(claim.context||'Attribution is not verification of the underlying claim.')+'</p>'+
    '<div class="claim-dual">'+sitePanel+communityPanel+'</div>'+
    '<details class="claim-evidence-details"><summary>'+ (r?
      'View evidence &amp; scoring breakdown':'View original evidence sources (review pending)')+'</summary>'+
      (r?detailedReview:draftEvidenceTrailHtml(claim)||'<p class="muted small">These are source references to what was publicly said or reported. No completed independent evidence assessment, corroboration audit or scoring conclusion has been published for this claim.</p>')+
    '</details>'+
    (nonEventMetric?'<p class="muted small">This is a public policy or documentary-access claim, not a scored incident or a claim about personal credibility.</p>':
     '<p class="muted small">Both ratings concern supporting evidence for this specific claim, not this person’s trustworthiness or the probability that any extraordinary interpretation is true.</p>')+
    '<div class="claim-record"><strong>Original statement / public-source references</strong>'+
    (refs?'<ul class="link-list">'+refs+'</ul>':'<p class="muted small">No primary source has passed editorial review yet.</p>')+
    '</div></article>';
 }).join('')||'<p class="muted small">No reviewable claims available.</p>';
 void hydrateCommunityRatings();
}

function openPerson(person,updateUrl=true){
 if(!person)return;
 let originAnchor=null;
 if(updateUrl){
  originAnchor={personId:person.id,y:Math.max(0,Math.round(window.scrollY))};
  // Save the origin card's scroll position on the directory history entry.
  history.replaceState({...history.state,ddDirectoryReturn:originAnchor},'',location.href);
 }
 selected=person;
 const show=$('personProfile'),directory=$('directoryPage');
 if(!show||!directory)return;
 $('profileName').textContent=person.name;
 $('profileRole').textContent=person.role;
 $('profileShort').textContent=person.short;
 paintPortrait($('profileAvatar'),person);
 const credit=$('profilePhotoCredit');
 if(credit){
  credit.replaceChildren();
  appendPortraitCredit(credit,person.photo);
 }
 $('profilePosition').textContent=person.position;
 renderClaimEvidence(person);
 $('profileContext').textContent=person.context;
 $('profileTags').innerHTML=(person.category||[]).map(c=>'<span class="pill">'+esc(c)+'</span>').join('');
 $('profileSources').innerHTML=validLinks(person.sources).map(x=>'<li><a target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(x.url))+'">'+esc(x.label)+' ↗</a></li>').join('')||'<li>Source documents awaiting review</li>';
 $('profileMedia').innerHTML=validLinks(person.media).map(x=>'<li><a target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(x.url))+'">'+esc(x.label)+' ↗</a></li>').join('')||'<li>No publisher video selected yet</li>';
 $('profileLinks').innerHTML=validLinks(person.officialLinks).map(x=>'<li><a target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(x.url))+'">'+esc(x.label)+' ↗</a></li>').join('')||'<li>Official public accounts not established from cited sources</li>';
 const long=$('profileBiography');
 long.innerHTML=(Array.isArray(person.biography)?person.biography:[]).map(p=>'<p>'+esc(p)+'</p>').join('')||
   '<p>'+esc(person.short)+'</p>';
 const years=$('profileTimeline');
 years.innerHTML=(Array.isArray(person.milestones)?person.milestones:[]).map(entry=>
  '<li><time>'+esc(shortDate(entry.date))+'</time><div><strong>'+esc(entry.title)+'</strong>'+
  '<p>'+esc(entry.detail)+'</p>'+
  (safeUrl(entry.source)?'<a target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(entry.source))+'">Inspect original reference ↗</a>':'')+
  '</div></li>').join('');
 $('profileArticles').innerHTML=renderList(person.articles,{empty:'No separately verified media references added yet.'});
 $('profileSocials').innerHTML=renderList(person.socialPages,{empty:"No personal social media account has been positively attributed from an official source. We won't guess or link fan accounts."});
 const episodes=Array.isArray(person.podcastEpisodes)?person.podcastEpisodes.slice(0,24):[];
 $('profilePodcasts').innerHTML=episodes.length?episodes.map(e=>{
  const url=safeUrl(e.url);
  if(!url)return '';
  return '<article class="source-entry"><strong>'+esc(e.title)+'</strong><p class="muted small">'+
   esc(e.show)+' · '+esc(e.date)+' · '+esc(e.role)+'</p><p class="muted small">'+esc(e.context||'Original publisher episode')+'</p>'+
   '<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Open podcast episode ↗</a></article>';
 }).join(''):'<p class="muted small">No original episode has been verified yet.</p>';
 const films=Array.isArray(person.filmCredits)?person.filmCredits.slice(0,24):[];
 $('profileFilms').innerHTML=films.length?films.map(f=>{
  const url=safeUrl(f.url);
  if(!url)return '';
  return '<article class="source-entry"><strong>'+esc(f.title)+'</strong><p class="muted small">'+
   esc(f.year)+' · '+esc(f.type)+' · '+esc(f.role)+'</p><p class="muted small">'+
   esc(f.context||'Verify original credits and presentation')+'</p>'+
   '<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Publisher / credit source ↗</a></article>';
 }).join(''):'<p class="muted small">No film or documentary appearance has yet been verified from a reliable source. This is not a claim that none exists.</p>';
 const related=window.DDPersonCaseLinks?.byPerson?.(caseLinks,person.id)||[];
 const legacy=(Array.isArray(person.relatedCases)?person.relatedCases:[]).filter(c=>c&&/^\/[a-z0-9-]+$/.test(c.url));
 const relatedCard=$('profileRelatedCard');
 if(relatedCard){
  relatedCard.classList.toggle('hidden',related.length===0&&legacy.length===0);
  $('profileRelatedCases').innerHTML=related.map(link=>{
    const archive='/?dd_tab=archivePage&dd_archive_case='+encodeURIComponent(link.caseId);
    const dossier=link.caseId==='featured-rendlesham-1980'?'/rendlesham-forest-1980':null;
    return '<article class="source-entry dd-person-case-link" style="margin:12px 0">'+
      '<strong>'+esc(link.caseLabel)+'</strong><p class="muted small">'+esc(link.roleLabel)+' · Editorial review pending</p>'+
      '<p>'+esc(link.statement)+'</p><p class="muted small">'+esc(link.context)+'</p>'+
      '<p><a href="'+esc(archive)+'">Open linked Archive case ↗</a>'+
      (dossier?' · <a href="'+esc(dossier)+'">Read original research dossier ↗</a>':'')+'</p>'+
      '<p class="muted small"><a href="'+esc(safeUrl(link.source.url))+'" target="_blank" rel="noopener noreferrer">Inspect original attributed source ↗</a> · '+
      esc(link.source.publisher)+' · '+esc(link.source.locator)+'</p></article>';
  }).join('')+(related.length?'':legacy.map(c=>'<p><a href="'+esc(c.url)+'">'+esc(c.label)+'</a> · '+esc(c.context||'Check source documentation')+'</p>').join(''));
 }
 const videoHost=$('profileVideoPlayers');videoHost.replaceChildren();
 for(const v of Array.isArray(person.videos)?person.videos.slice(0,8):[]){
  if(!supportedVideoId(v.youtubeId))continue;
  const watch='https://www.youtube.com/watch?v='+v.youtubeId;
  const card=document.createElement('div');card.className='video-card';
  card.innerHTML='<strong>'+esc(v.title)+'</strong><p class="muted small">'+
   esc(v.type)+' · '+esc(v.publisher)+' · '+esc(v.date)+'</p><p>'+esc(v.context)+'</p>'+
   '<div class="video-preview"><button type="button" class="btn video-play">▶ Play here (YouTube)</button>'+
   '<p class="muted small">YouTube is loaded only after you press play. It may set cookies and apply its own privacy policy.</p></div>'+
   '<p><a target="_blank" rel="noopener noreferrer" href="'+esc(watch)+'">Open original video on YouTube ↗</a></p>';
  card.querySelector('.video-play').addEventListener('click',()=>{
   const slot=card.querySelector('.video-preview');
   slot.replaceChildren();
   const iframe=document.createElement('iframe');
   iframe.title='Video: '+v.title;iframe.width='560';iframe.height='315';
   iframe.loading='lazy';iframe.referrerPolicy='strict-origin-when-cross-origin';
   iframe.setAttribute('allow','accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share');
   iframe.setAttribute('allowfullscreen','');
   iframe.src='https://www.youtube-nocookie.com/embed/'+v.youtubeId;
   slot.appendChild(iframe);
  });
  videoHost.appendChild(card);
 }
 if(!videoHost.childElementCount)videoHost.textContent='No independently verified, embeddable publisher video selected. Use the attributed links above.';
 directory.classList.add('hidden');show.classList.remove('hidden');
 $('directoryBack').focus({preventScroll:true});
 if(updateUrl){
  const u=new URL(location.href);u.searchParams.set('person',person.id);
  history.pushState({directoryPerson:person.id,fromDirectory:true,
   ddDirectoryReturn:originAnchor},'',u.pathname+u.search+u.hash);
 }
 showProfileAtContent(person,!updateUrl);
}
function showDirectory(updateUrl=true,returnAnchor=null){
 $('personProfile').classList.add('hidden');$('directoryPage').classList.remove('hidden');
 selected=null;
 if(updateUrl){
  const u=new URL(location.href);u.searchParams.delete('person');
  history.pushState({directoryPerson:null},'',u.pathname+u.search+u.hash);
 }
 restoreDirectoryPosition(returnAnchor);
}
// Native Android Back and the on-screen Back button use identical history-aware logic.
function backToDirectory(){
 if(!selected)return false;
 if(history.state?.fromDirectory){history.back();return true;}
 const personId=selected.id;
 // Capture the return anchor BEFORE replaceState clears this profile entry.
 // This matters after crossing Archive's separate document history.
 const anchor=history.state?.ddDirectoryReturn;
 const u=new URL(location.href);u.searchParams.delete('person');
 history.replaceState({directoryPerson:null},'',u.pathname+u.search+u.hash);
 // A directly opened profile with no previous directory entry shows cards.
 showDirectory(false,anchor?.personId===personId&&numberY(anchor.y)!==null
  ?anchor:{personId,firstCard:true});return true;
}
window.DDPeopleDirectoryBack=backToDirectory;
function renderCards(){
 const query=$('peopleSearch').value.trim().toLocaleLowerCase();
 const kind=$('peopleCategory').value;
 const results=people.filter(p=>{
  if(kind!=='all'&&!(p.category||[]).includes(kind))return false;
  const searchable=[p.name,p.short,p.role,p.position,...(p.category||[]),...(p.biography||[]),...(p.milestones||[]).map(m=>m.title||''),...(p.podcastEpisodes||[]).map(e=>e.title+' '+e.show),...(p.filmCredits||[]).map(f=>f.title)].join(' ').toLocaleLowerCase();
  return !query||searchable.includes(query);
 });
 $('peopleStatus').textContent=results.length+' people match · Source-linked editorial profiles';
 const host=$('peopleCards');host.replaceChildren();
 for(const person of results){
  const card=document.createElement('article');card.className='card';
  card.dataset.personId=person.id;
  card.innerHTML='<div class="person-head"><span aria-hidden="true" class="avatar"></span><div><h3>'+esc(person.name)+'</h3><p class="muted small compact">'+esc(person.role)+'</p></div></div>'+
   '<div class="pills">'+(person.category||[]).map(c=>'<span class="pill">'+esc(c)+'</span>').join('')+'</div>'+
   '<p>'+esc(person.short)+'</p><button type="button" class="btn">Read detailed profile</button>';
  paintPortrait(card.querySelector('.avatar'),person);
  if(person.photo&&safeUrl(person.photo.source)&&person.photo.credit){
   const credit=document.createElement('span');credit.className='card-photo-credit';
   if(appendPortraitCredit(credit,person.photo))
    card.querySelector('.person-head > div').appendChild(credit);
  }
  card.querySelector('button').addEventListener('click',()=>openPerson(person));
  host.appendChild(card);
 }
 if(!results.length)host.innerHTML='<div class="card"><h3>No matching profiles yet</h3><p>Try another search or category. More public profiles can be added after checking their original sources.</p></div>';
}
function fromLocation(){
 const id=new URL(location.href).searchParams.get('person');
 const record=people.find(p=>p.id===id);
 if(record)openPerson(record,false);
 else showDirectory(false,history.state?.ddDirectoryReturn||null);
}
$('directoryBack').addEventListener('click',backToDirectory);
 $('profileRelatedCases').addEventListener('click',rememberProfileCaseDeparture);
// A Back-to-directory return scroll is scheduled over two animation frames.
// If the visitor immediately types or changes filters, their new interaction wins:
// never let the stale return animation refocus an old card or jump the list.
function onDirectoryFilterChanged(){++restoreSequence;renderCards();}
$('peopleSearch').addEventListener('input',onDirectoryFilterChanged);
$('peopleCategory').addEventListener('change',onDirectoryFilterChanged);
window.addEventListener('popstate',fromLocation);
Promise.all([
 fetch('/data/public-people-directory.json',{cache:'no-store'}).then(resp=>{
 if(!resp.ok)throw Error('Source directory '+resp.status);
 return resp;
}).then(resp=>resp.json()),
 fetch('/data/public-person-case-links.json',{cache:'no-store'}).then(resp=>{
  if(!resp.ok)throw Error('Public relationship ledger '+resp.status);
  return resp.json();
 }).catch(error=>{console.warn('Optional profile case links unavailable:',error);return null}),
 fetch('/data/who-editorial-handoff-m29.json',{cache:'no-store'}).then(resp=>resp.ok?resp.json():null)
  .catch(()=>null)
]).then(([data,publicLinks,reviewQueue])=>{
 if(data.version!==1||!Array.isArray(data.people))throw Error('Unsupported people schema');
 const ids=new Set();
 people=data.people.filter(p=>{
  if(!p||typeof p.id!=='string'||!(/^[a-z0-9-]{2,80}$/).test(p.id)||ids.has(p.id)||!p.name)return false;
  ids.add(p.id);return true;
 });
 const parsed=window.DDPersonCaseLinks?.parse?.(publicLinks,{
  personIds:people.map(p=>p.id),
  caseIds:['featured-nimitz-2004','featured-rendlesham-1980']
 });
 caseLinks=parsed?.valid?parsed:{valid:true,links:[]};
 people.sort((a,b)=>a.name.localeCompare(b.name));
 const reviewerDockets=parseM29EditorialQueue(reviewQueue,people);
 m29Dockets=reviewerDockets?.dockets||new Map();
 m29Rubric=reviewerDockets?.rubric||null;
 renderCards();fromLocation();
}).catch(error=>{
 $('peopleStatus').textContent='The public profile directory is temporarily unavailable. The research pages and source links above remain accessible.';
 console.warn('Who’s Who public editorial profiles not loaded:',error);
});
})();
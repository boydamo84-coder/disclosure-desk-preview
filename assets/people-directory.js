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
  '<p class="muted small"><strong>Open questions:</strong> '+esc(draft.editorialNote)+'</p>'+
  '<h5>Public materials consulted (provisional)</h5><ul class="claim-evidence-list">'+items+'</ul>'+
  '<p class="muted small">No criterion-by-criterion points or community votes are available until a separate source-and-editorial approval.</p>';
}
function publishedClaimReview(claim){
 // Research-policy recommendations and unknown claim categories must never
 // receive a fabricated 0–100 physical-evidence assessment.
 if(claim?.claimKind&&claim.claimKind!=='public_claim')return null;
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
function renderClaimEvidence(person){
 const host=$('profileEvidenceReviews');
 if(!host)return;
 const claims=Array.isArray(person.claimEvidence)?person.claimEvidence.slice(0,12):[];
 if(!claims.length){
  host.innerHTML='<p class="note small"><strong>Disclosure Desk rating: Not assessed.</strong> There are no individually reviewed public claims for this profile yet. Community rating is not open on unreviewed statements. Biographies and citations do not constitute a personal score.</p>';
  return;
 }
 host.innerHTML=claims.map(claim=>{
  if(!claim||!claim.statement)return '';
  const advisory=claim.claimKind==='policy_recommendation';
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
   (advisory?'<span class="claim-not-assessed">Not applicable</span>'+
     '<p class="muted small">A proposal for better scientific research is not a measurable claim about an extraordinary event. Source links are provided for reference.</p>':
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
     (advisory?'<span class="claim-not-assessed">Not applicable</span><p class="muted small">Member evidence scores do not apply to research recommendations.</p>':
      '<span class="claim-not-assessed">Voting not open</span><p class="muted small">This claim is still awaiting source and context approval, so no member ratings are collected.</p>'))+
   '</section>';
  return '<article class="claim-review" aria-label="Individual public claim evidence review">'+
    '<div class="claim-status">'+(advisory?'PUBLIC RESEARCH RECOMMENDATION':'PUBLIC CLAIM')+' · '+esc(claim.date||'Date requires verification')+'</div>'+
    '<h4>'+esc(claim.statement)+'</h4>'+
    '<p class="muted small">'+esc(claim.context||'Attribution is not verification of the underlying claim.')+'</p>'+
    '<div class="claim-dual">'+sitePanel+communityPanel+'</div>'+
    '<details class="claim-evidence-details"><summary>'+ (r?
      'View evidence &amp; scoring breakdown':'View original evidence sources (review pending)')+'</summary>'+
      (r?detailedReview:draftEvidenceTrailHtml(claim)||'<p class="muted small">These are source references to what was publicly said or reported. No completed independent evidence assessment, corroboration audit or scoring conclusion has been published for this claim.</p>')+
    '</details>'+
    (advisory?'<p class="muted small">This is an attributed research recommendation, not a scored incident or a claim about personal credibility.</p>':
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
$('peopleSearch').addEventListener('input',renderCards);
$('peopleCategory').addEventListener('change',renderCards);
window.addEventListener('popstate',fromLocation);
Promise.all([
 fetch('/data/public-people-directory.json',{cache:'no-store'}).then(resp=>{
 if(!resp.ok)throw Error('Source directory '+resp.status);
 return resp;
}).then(resp=>resp.json()),
 fetch('/data/public-person-case-links.json',{cache:'no-store'}).then(resp=>{
  if(!resp.ok)throw Error('Public relationship ledger '+resp.status);
  return resp.json();
 }).catch(error=>{console.warn('Optional profile case links unavailable:',error);return null})
]).then(([data,publicLinks])=>{
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
 renderCards();fromLocation();
}).catch(error=>{
 $('peopleStatus').textContent='The public profile directory is temporarily unavailable. The research pages and source links above remain accessible.';
 console.warn('Who’s Who public editorial profiles not loaded:',error);
});
})();
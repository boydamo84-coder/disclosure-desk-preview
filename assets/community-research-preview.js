/* M01 opt-in publication COPY preview. No network, no actual public publishing.
 * Never render user input with innerHTML; never read W.NE originals by default.
 * Drafts are ephemeral and W.NE snapshot is deleted from sessionStorage on import.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const KEY='dd-community-research-preview-copy-v1';
 const MAX_AGE=10*60*1000;
 const types={case:'Case investigation',archive:'Archive research',hypothesis:'Hypothesis',methods:'Methods and data'};
 let preview=null,imported=false;
 const message=text=>{$('composeStatus').textContent=String(text).slice(0,300)};
 const show=id=>{
  for(const section of ['researchLibrary','researchReader','researchComposer','researchPreview']){
   $(section).classList.toggle('hidden',section!==id);
  }
  const el=$(id);el?.scrollIntoView?.({block:'start',behavior:'instant'});
 };
 function safeUrl(raw){
  try{
   const u=new URL(String(raw||'').trim());
   if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||!u.hostname.includes('.')||u.hostname.length>240)return null;
   if(/(?:^|\.)(?:localhost|local|internal|test)$/i.test(u.hostname)||/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)||/^\[.*\]$/.test(u.hostname))return null;
   return u.href;
  }catch{return null}
 }
 function references(container,urls){
  container.replaceChildren();
  if(!urls.length){const li=document.createElement('li');li.textContent='No source links supplied. Add original references before public submission.';container.append(li);return}
  for(const link of urls){
   const li=document.createElement('li'),a=document.createElement('a');
   a.href=link;a.textContent=link;a.target='_blank';a.rel='noopener noreferrer nofollow ugc';
   li.append(a);container.append(li);
  }
 }
 function sourceLines(value){
  const lines=String(value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(lines.length>12)throw Error('Use no more than 12 source links.');
  const unique=new Set();
  for(const value of lines){const url=safeUrl(value);if(!url)throw Error('Every source must be a public HTTPS web address (no private network or login in the URL).');unique.add(url)}
  return [...unique];
 }
 function localDraft(){
  const item=sessionStorage.getItem(KEY);if(item===null)return;
  sessionStorage.removeItem(KEY); // single-use handoff; don't leave exported content in browser storage
  let data;
  try{data=JSON.parse(item)}catch{message('A temporary W.NE copy could not be read. Your original is safe.');return}
  if(!data||data.version!==1||typeof data.createdAt!=='number'||
   data.createdAt>Date.now()+60000||Date.now()-data.createdAt>MAX_AGE||
   typeof data.title!=='string'||data.title.length>140||
   typeof data.body!=='string'||data.body.length>30000||
   data.body.length<150||!['wne'].includes(data.origin)){
   message('The W.NE handoff was incomplete or expired. Your saved original has not been changed.');return;
  }
  $('researchTitle').value=data.title.trim();
  $('researchBody').value=data.body;
  $('researchAbstract').value='';
  $('researchSources').value='';
  $('researchOriginal').checked=false;$('researchConsent').checked=false;
  imported=true;
  show('researchComposer');
  message('W.NE section imported as an unsent, plain-text copy. Review its abstract and sources. Images, embedded media and original formatting remain in W.NE.');
 }
 function readExample(){
  $('readerEyebrow').textContent='Demonstration only · No researcher or account';
  $('readerTitle').textContent='The Nimitz case: evaluating source reliability';
  $('readerSummary').textContent='Sample article layout showing how original testimony, independently recorded measurements and later commentary could be kept distinct.';
  $('readerBody').textContent='RESEARCH QUESTION\nWhich claims about the encounter are independently documented?\n\nEXAMPLE METHOD\n1. Identify first-hand accounts and their publication dates.\n2. Compare official source records with later recollections.\n3. Separate missing information from evidence of an extraordinary explanation.\n\nLIMITATIONS\nThis is an illustrative outline, not a completed investigation or an authenticated report. It supplies no claims about actual radar, imagery or witness statements.';
  references($('readerReferences'),[]);
  show('researchReader');
 }
 function draftData(){
  const form=$('researchForm');
  if(!form.reportValidity())throw Error('Complete the required fields and authorship confirmation.');
  const title=$('researchTitle').value.trim(),abstract=$('researchAbstract').value.trim(),body=$('researchBody').value.trim();
  if(title.length<8||title.length>140||abstract.length<30||abstract.length>600||body.length<150||body.length>30000)throw Error('Title: 8–140; abstract: 30–600; body: 150–30,000 characters.');
  if(!$('researchOriginal').checked||!$('researchConsent').checked)throw Error('Confirm authorship, rights and preview-only consent before continuing.');
  return {title,abstract,body,type:types[$('researchType').value]||types.case,sources:sourceLines($('researchSources').value)};
 }
 function review(event){
  event.preventDefault();
  try{
   preview=draftData();
   $('previewPaperTitle').textContent=preview.title;
   $('previewAbstract').textContent=preview.abstract;
   $('previewType').textContent=preview.type;
   $('previewBody').textContent=preview.body;
   references($('previewSources'),preview.sources);
   show('researchPreview');
  }catch(e){message(e.message||'Could not prepare the preview.')}
 }
 function clear(){
  $('researchForm').reset();preview=null;imported=false;
  try{sessionStorage.removeItem(KEY)}catch{}
  $('researchTitle').value='';$('researchBody').value='';
  message('Temporary publication copy cleared. Your W.NE original is unchanged.');
  $('researchTitle').focus();
 }
 function filterExample(){
  const search=$('researchSearch').value.toLowerCase().trim();
  const category=$('researchCategory').value;
  const matches=(!search||'nimitz case evaluating source reliability'.includes(search))&&(!category||category==='case');
  $('researchDemoCard').hidden=!matches;
  $('researchEmpty').textContent=matches?
   'No real public community papers are available in this preview. The demonstration card below is not a published submission.':
   'No matching papers in this design preview. There is no live member research database yet.';
 }
 function init(){
  $('beginDraft').onclick=()=>{show('researchComposer');message(imported?'W.NE copy ready to review. Nothing has been submitted.':'Draft your publication copy here. Nothing is shared until a future, separately approved publish action.')};
  $('readDemo').onclick=readExample;
  $('closeReader').onclick=()=>show('researchLibrary');
  $('cancelCompose').onclick=()=>show('researchLibrary');
  $('editDraft').onclick=()=>show('researchComposer');
  $('returnLibrary').onclick=()=>show('researchLibrary');
  $('researchForm').addEventListener('submit',review);
  $('clearDraft').onclick=clear;
  for(const id of ['researchSearch','researchCategory','researchSort']){
   $(id).addEventListener(id==='researchSearch'?'input':'change',filterExample);
  }
  filterExample();
  try{localDraft()}catch{message('Browser storage unavailable. You may still prepare a manual preview.')}
  if(location.hash==='#compose'&&!imported)show('researchComposer');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
 window.DDCommunityResearchPreview=Object.freeze({safeUrl,sourceLines}); // for isolated tests; no public submit surface
})();
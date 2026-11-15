'use strict';
/*
 * R3 local alpha only. Shared Node hypothesis engine and browser WebCrypto
 * vault; explicit encrypted IndexedDB saving, NO account auth, server requests,
 * background publishing, outside scripts or evidence scoring.
 */
(()=>{
 const engine=window.DDHypothesisLab;
 const vault=window.DDPrivateVault;
 const gapBridge=window.DDResearchGapBridge;
 const publicCases=window.DDPublicCuratedCases;
 const hosted=document.documentElement.dataset.r3Hosted==='true';
 const cloud=hosted?window.DDR3Cloud:null;
 let cloudOwner=null,bootReady=!hosted;
 const $=id=>document.getElementById(id);
 if(!engine||!vault||!gapBridge||!Array.isArray(publicCases)){$('notice').hidden=false;$('notice').textContent='Secure hypothesis engine unavailable; no notebook was loaded.';return;}
 let book=null,selectedId=null,editingId=null,view='write';
 let unlockedVault=null,busy=false,revoked=false;
 const ensureActive=()=>{if(hosted&&revoked)throw new Error('Account changed: reload before continuing')};
 const selected=()=>book?.hypotheses.find(h=>h.id===selectedId)||null;
 const latest=h=>h?.revisions[h.revisions.length-1]||null;
 const curatedCases=gapBridge.caseCatalogue(publicCases);
 const elt=(tag,cls,text)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=String(text);
  return node;
 };
 const status=(msg,error=false)=>{
  if(revoked)return;
  const node=$('notice');node.textContent=msg;node.classList.toggle('error',error);node.hidden=false;
 };
 const hideStatus=()=>{$('notice').hidden=true;$('notice').textContent=''};
 const time=()=>new Date(Math.max(Date.now(),book?Date.parse(book.updatedAt)+1:0)).toISOString();
 const lines=id=>$(id).value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const slug=(title,count)=>{
  let out=String(title).toLowerCase().normalize('NFKD').replace(/[^a-z0-9 -]/g,'')
   .replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,54);
  return 'h-'+(out||'idea')+'-'+count;
 };
 function renderDock(){
  // Same 14 IDs, labels and glyphs as approved R2 secondary-editorial-nav.js;
  // links remain disabled because this is an isolated localhost prototype.
  const tabs=[
   ['discover','◈','News'],['archivePage','▥','Archive'],
   ['peopleDirectory','♙','Who’s Who'],['researchStudio','✎','W.NE'],
   ['mapPage','◎','Map'],['clips','▶','Videos'],['livePage','●','LIVE'],
   ['boards','▣','Boards'],['witness','◉','Witness'],
   ['discussionsPage','☷','Discussions'],['watchRead','♫','Watch & Read'],
   ['chatPage','','Chat'],['profilePage','👤','Profile'],['hub','☷','Explore']
  ];
  const rail=$('dockScroll'),prev=$('dockPrev'),next=$('dockNext');
  const chatGlyph=()=>{
   const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
   svg.setAttribute('viewBox','0 0 24 24');
   svg.setAttribute('stroke-width','1.85');
   svg.setAttribute('stroke-linecap','round');
   svg.setAttribute('stroke-linejoin','round');
   svg.setAttribute('class','dd-chat-nav-symbol');
   svg.setAttribute('aria-hidden','true');
   const p=document.createElementNS(ns,'path');
   p.setAttribute('d','M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4.2-1L3 21l2-5a8.5 8.5 0 1 1 16-4.5Z');
   svg.appendChild(p);return svg;
  };
  for(const [id,symbol,label] of tabs){
   const btn=elt('button','tab');btn.type='button';btn.dataset.tab=id;
   btn.disabled=!hosted;
   btn.title=hosted?label:label+' — not available in the offline prototype';
   if(hosted)btn.addEventListener('click',async()=>{
    if(!$('editorForm').hidden&&!(await confirmAction({
     title:'Leave unfinished research?',message:'Your editor has unsaved text. Save a revision before navigating or these edits will be lost.',
     confirmText:'Leave editor',cancelText:'Keep editing',destructive:true
    })))return;
    location.assign('/?dd_tab='+encodeURIComponent(id));
   });
   btn.setAttribute('aria-label',hosted?label:label+' (design preview only)');
   if(id==='boards'){btn.classList.add('active');btn.setAttribute('aria-current','page');}
   const icon=elt('span','ico');icon.setAttribute('aria-hidden','true');
   if(id==='chatPage')icon.appendChild(chatGlyph());else icon.textContent=symbol;
   btn.append(icon,document.createTextNode(label));rail.appendChild(btn);
  }
  const update=()=>{
   const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
   prev.hidden=max<8||rail.scrollLeft<=5;
   next.hidden=max<8||rail.scrollLeft>=max-5;
  };
  const move=direction=>{
   const tabWidth=rail.querySelector('.tab')?.getBoundingClientRect().width||72;
   rail.scrollTo({left:Math.max(0,Math.min(rail.scrollWidth-rail.clientWidth,
    rail.scrollLeft+direction*tabWidth)),behavior:'smooth'});
  };
  prev.addEventListener('click',()=>move(-1));
  next.addEventListener('click',()=>move(1));
  rail.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  if(window.ResizeObserver)new ResizeObserver(update).observe(rail);
  const editing=el=>!!el&&(el.matches?.('input,textarea,select,[contenteditable=true]')||
   !!el.closest?.('[contenteditable=true]'));
  // Keep the nav hidden throughout mobile editing, not just while a
  // textarea has focus. Otherwise focusout between pointerdown and click
  // makes the fixed dock reappear and steals taps on Add source/save.
  const keyboardShouldHide=()=>editing(document.activeElement)||!$('editorForm').hidden;
  // A focusout while the user taps Create/Record/Save can occur between
  // pointerdown and click. Keep nav hidden long enough for that click to
  // complete rather than shifting the viewport and stealing the action.
  let keyboardTimer;
  const deferredKeyboardSync=()=>{
   clearTimeout(keyboardTimer);
   keyboardTimer=setTimeout(()=>document.body.classList.toggle(
    'dd-web-keyboard-open',keyboardShouldHide()),350);
  };
  document.addEventListener('focusin',()=>{
   if(editing(document.activeElement)){
    clearTimeout(keyboardTimer);document.body.classList.add('dd-web-keyboard-open');
   }else deferredKeyboardSync();
  });
  document.addEventListener('focusout',deferredKeyboardSync);
  document.body.classList.add('dd-web-secondary-nav');
  if(hosted){
   const suppress=()=>{
    if($('ddAndroidEditorialNav')){ $('ddWebSecondaryNav').hidden=true;
     $('ddWebSecondaryNav').style.display='none';document.body.classList.remove('dd-web-secondary-nav');observer.disconnect();}
   };
   const observer=new MutationObserver(suppress);
   observer.observe(document.body,{childList:true});
   suppress();
  }
  requestAnimationFrame(update);
 }
 function confirmAction({title,message,confirmText='Continue',
   cancelText='Keep working',destructive=false,verifyDelete=false,icon}){
  return new Promise(resolve=>{
   const dialog=$('ddConfirmDialog');
   if(dialog.open){resolve(false);return;}
   const controller=new AbortController(),options={signal:controller.signal};
   const confirm=$('ddDialogAccept'),verify=$('ddDialogVerify');
   $('ddDialogTitle').textContent=title;
   $('ddDialogDescription').textContent=message;
   $('ddDialogCancel').textContent=cancelText;
   confirm.textContent=confirmText;
   confirm.className=destructive?'btn-danger':'btn-primary';
   $('ddDialogIcon').textContent=icon||(destructive?'!':'✓');
   dialog.classList.toggle('destructive',destructive);
   $('ddDialogVerifyWrap').hidden=!verifyDelete;
   verify.value='';confirm.disabled=verifyDelete;
   const finish=accepted=>{
    controller.abort();
    dialog.close();
    resolve(accepted);
   };
   verify.addEventListener('input',()=>{
    confirm.disabled=verify.value.trim()!=='DELETE';
   },options);
   $('ddDialogCancel').addEventListener('click',()=>finish(false),options);
   $('ddDialogClose').addEventListener('click',()=>finish(false),options);
   $('ddDialogForm').addEventListener('submit',event=>{
    event.preventDefault();
    if(verifyDelete&&verify.value.trim()!=='DELETE')return;
    finish(true);
   },options);
   dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false)},options);
   dialog.addEventListener('click',event=>{
    if(event.target===dialog)finish(false);
   },options);
   dialog.showModal();$('ddDialogCancel').focus();
  });
 }
 function section(root,title,items){
  const box=elt('div','detail-block');box.appendChild(elt('h3','',title));
  if(!items.length){box.appendChild(elt('p','', 'Not supplied in this draft'));root.appendChild(box);return;}
  const ul=elt('ul');
  for(const item of items)ul.appendChild(elt('li','',item));
  box.appendChild(ul);root.appendChild(box);
 }
 function paintContent(root,content){
  root.replaceChildren();
  section(root,'Assumptions',content.assumptions);
  section(root,'Predicted observations',content.predictions.map(p=>
   p.predictedObservation+' — If observed: '+p.ifObserved+'; if not: '+p.ifNotObserved+'; test: '+p.howToTest));
  section(root,'Potentially disconfirming evidence',
   content.disconfirmingTests.map(x=>x.potentiallyDisconfirmingObservation+' — Check: '+x.howToCheck));
  section(root,'Alternative interpretations',content.alternativeInterpretations);
  const sources=elt('div','detail-block');
  sources.appendChild(elt('h3','', 'Source references · not independently verified'));
  if(!content.sources.length)sources.appendChild(elt('p','', 'No references provided yet.'));
  else{
   const ul=elt('ul');
   for(const source of content.sources){
    const li=elt('li');
    const a=elt('a','',source.label);a.href=source.url;
    a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';
    li.appendChild(a);
    if(source.locator)li.appendChild(document.createTextNode(' — '+source.locator));
    ul.appendChild(li);
   }
   sources.appendChild(ul);
  }
  root.appendChild(sources);
 }
 function showView(next){
  view=next;
  for(const key of ['write','compare','history','gaps']){
   $(key+'View').hidden=key!==next;
   $(key+'Tab').setAttribute('aria-selected',String(key===next));
  }
  if(next==='compare')renderCompareOptions();
  if(next==='history')renderHistoryOptions();
  if(next==='gaps')renderGaps();
 }
 function renderList(){
  if(revoked)return;
  const host=$('hypothesisList');host.replaceChildren();
  $('countTag').textContent=String(book.hypotheses.length);
  if(!book.hypotheses.length)host.appendChild(elt('p','muted small','None yet. Add your first working explanation.'));
  for(const h of book.hypotheses){
   const r=latest(h),b=elt('button','hypothesis-item'+(h.id===selectedId?' active':''));
   b.type='button';b.dataset.hypothesisId=h.id;
   b.appendChild(elt('strong','',r.content.title));
   b.appendChild(elt('span','', 'Revision '+r.revision+' · '+(r.content.sources.length?'Citations linked':'Sources needed')));
   b.addEventListener('click',()=>{
    selectedId=h.id;editingId=null;renderList();renderSelected();showView('write');
   });
   host.appendChild(b);
  }
 }
 function renderSelected(){
  if(revoked)return;
  const h=selected();
  $('editorForm').hidden=true;editingId=null;
  $('writeEmpty').hidden=!!h;
  $('selectedPreview').hidden=!h;
  if(!h)return;
  const r=latest(h);
  $('selectedTitle').textContent=r.content.title;
  $('selectedExplanation').textContent=r.content.explanation;
  $('currentVersion').textContent='Revision '+r.revision+' · '+r.recordedAt.replace('T',' ').slice(0,16)+' UTC';
  paintContent($('selectedSections'),r.content);
 }
 function renderCompareOptions(){
  const host=$('compareOptions'),prior=new Set([...host.querySelectorAll('input:checked')].map(x=>x.value));
  host.replaceChildren();
  for(const h of book.hypotheses){
   const label=elt('label','check-item'),check=elt('input');check.type='checkbox';check.value=h.id;
   check.checked=prior.size?prior.has(h.id):true;
   label.append(check,document.createTextNode(latest(h).content.title));host.appendChild(label);
  }
 }
 function renderComparison(){
  hideStatus();const ids=[...$('compareOptions').querySelectorAll('input:checked')].map(x=>x.value);
  let compared;
  try{compared=engine.compareHypotheses(book,{workspaceId:book.workspaceId,ids});}
  catch(err){status(err.message,true);return;}
  const root=$('comparisonResult');root.replaceChildren();
  for(const item of compared.hypotheses){
   const card=elt('article','compare-column');card.appendChild(elt('h3','',item.content.title));
   card.appendChild(elt('p','muted small','Revision '+item.revision+' · Research draft, not verified'));
   card.appendChild(elt('p','',item.content.explanation));
   const structured=elt('div','structured-preview');paintContent(structured,item.content);
   card.appendChild(structured);root.appendChild(card);
  }
  status('Unranked comparison created locally. No hypothesis has been graded or published.');
 }
 function renderHistoryOptions(){
  const select=$('historyPerson'),previous=select.value;select.replaceChildren();
  const prompt=elt('option','','Select an explanation');prompt.value='';select.appendChild(prompt);
  for(const h of book.hypotheses){
   const option=elt('option','',latest(h).content.title);option.value=h.id;select.appendChild(option);
  }
  select.value=book.hypotheses.some(h=>h.id===previous)?previous:(selectedId||'');
  renderHistory();
 }
 function renderHistory(){
  const id=$('historyPerson').value;
  const h=book.hypotheses.find(x=>x.id===id);
  const buttons=$('revisionList');buttons.replaceChildren();
  $('historySnapshot').replaceChildren();
  if(!h)return;
  for(const item of h.revisions){
   const b=elt('button','', 'Version '+item.revision);b.type='button';
   b.dataset.revision=String(item.revision);
   b.addEventListener('click',()=>paintRevision(h,item.revision));
   buttons.appendChild(b);
  }
  paintRevision(h,h.revisions.length);
 }
 function paintRevision(h,number){
  const current=engine.revision(book,{workspaceId:book.workspaceId,id:h.id,number});
  for(const b of $('revisionList').querySelectorAll('button'))
   b.setAttribute('aria-pressed',String(b.dataset.revision===String(number)));
  const root=$('historySnapshot');root.replaceChildren();
  const header=elt('div','detail-block');
  header.append(elt('h3','',current.content.title),
   elt('p','', 'Recorded '+current.recordedAt+' · Version '+current.revision));
  header.appendChild(elt('p','',current.content.explanation));root.appendChild(header);
  const structure=elt('div','structured-preview');paintContent(structure,current.content);
  root.appendChild(structure);
 }
 function appendSourceLink(host,source){
  if(!source?.url||!/^https:\/\//.test(source.url))return;
  const a=elt('a','gap-source-link','Open catalogue-linked source');
  a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';
  host.appendChild(a);
 }
 function gapTitle(key){
  const labels={
   'event-year-not-indexed':'Event year needs checking',
   'event-date-precision-not-indexed':'Exact event date needs checking',
   'clock-time-not-indexed':'Observation time needs checking',
   'sighting-position-not-verified':'Location precision needs checking',
   'individual-source-list-not-indexed':'Supporting-source list needs checking',
   'instrument-metadata-not-indexed':'Instrument metadata needs checking',
   'witness-independence-not-indexed':'Witness independence needs checking'
  };
  return labels[key]||'A catalogue field needs checking';
 }
 function renderGaps(){
  if(!book)return;
  const info=$('gapCaseDetails'),host=$('gapCandidateList'),saved=$('gapReviewList');
  info.replaceChildren();host.replaceChildren();saved.replaceChildren();
  const known=curatedCases.find(x=>x.id===book.caseId);
  const candidates=gapBridge.candidates(publicCases,book.caseId);
  const reviews=gapBridge.recordedQuestions(book,{workspaceId:book.workspaceId});
  if(!known){
   $('gapSummary').textContent='This notebook is not tied to one of the three reviewed incident entries in this small local catalogue. No automated gap scan is possible here; that is not proof that a case has no research gaps.';
  }else{
   info.appendChild(elt('strong','',known.title));
   info.appendChild(elt('p','muted small','Scope: only fields indexed in this local curated catalogue. Links are for human review.'));
   $('gapSummary').textContent=candidates.length+' tentative questions to investigate, '+reviews.length+' explicitly saved. Nothing has been independently verified.';
   if(!candidates.length)host.appendChild(elt('p','muted','No reviewable linked prompts for this entry. Other archival sources may still contain research needs.'));
   for(const gap of candidates){
    const already=reviews.some(x=>x.id===gap.id);
    const card=elt('article','gap-card');card.dataset.gapId=gap.id;
    const top=elt('div','gap-head');
    top.appendChild(elt('h3','',gapTitle(gap.key)));
    top.appendChild(elt('span','gap-state',already?'Saved privately':'Unverified question'));
    card.appendChild(top);
    card.appendChild(elt('p','',gap.reason));
    card.appendChild(elt('p','gap-next','Suggested check: '+gap.nextAction));
    const attribution=elt('p','gap-attribution','Catalogue entry only · '+gap.source.label);
    card.appendChild(attribution);appendSourceLink(card,gap.source);
    const controls=elt('div','gap-review-controls');
    const label=elt('label','', 'Connect to existing hypothesis (optional)');
    const select=elt('select');select.setAttribute('aria-label','Link '+gapTitle(gap.key)+' to a hypothesis');
    const none=elt('option','', 'General case research · no hypothesis');
    none.value='';select.appendChild(none);
    for(const h of book.hypotheses){
     const opt=elt('option','',latest(h).content.title);opt.value=h.id;select.appendChild(opt);
    }
    label.appendChild(select);
    const button=elt('button','btn-add',already?'Already saved':'Record research question');
    button.type='button';button.disabled=already;button.dataset.gapRecord=gap.id;
    button.addEventListener('click',()=>recordGap(gap.id,select.value,button));
    controls.append(label,button);card.appendChild(controls);host.appendChild(card);
   }
  }
  if(!reviews.length)saved.appendChild(elt('p','muted','No research questions saved yet. Review an original source before drawing conclusions.'));
  for(const review of reviews){
   const entry=elt('article','gap-recorded');entry.dataset.recordId=review.id;
   entry.appendChild(elt('strong','',gapTitle(review.id.split(':').slice(1).join(':'))));
   entry.appendChild(elt('p','muted small',
    'Research question · '+review.reviewedAt+' · NOT verified evidence'));
   entry.appendChild(elt('p','',review.reason));
   entry.appendChild(elt('p','gap-next','Suggested check: '+review.nextAction));
   if(review.relatedHypothesisId){
    const h=book.hypotheses.find(h=>h.id===review.relatedHypothesisId);
    entry.appendChild(elt('p','gap-attribution',
     'Linked to hypothesis: '+(h?latest(h).content.title:review.relatedHypothesisId)));
   }
   appendSourceLink(entry,review.source);saved.appendChild(entry);
  }
 }
 async function recordGap(id,relatedHypothesisId,button){
  if(busy||!book)return;
  busy=true;button.disabled=true;hideStatus();
  try{
   const next=gapBridge.recordQuestion(book,{workspaceId:book.workspaceId,
    records:publicCases,gapId:id,relatedHypothesisId,at:time()});
   if(unlockedVault){
    const generation=await vault.save(next,unlockedVault.key,unlockedVault.generation);
    ensureActive();unlockedVault.generation=generation;
   }
   ensureActive();book=next;renderGaps();updateSecurityUI();
   status(unlockedVault?
    'Research question accepted and saved in your encrypted notebook; it remains unverified.':
    'Research question added to this session only. Enable encrypted saving to keep it.');
  }catch(error){
   status('Research question was NOT recorded: '+error.message,true);
   button.disabled=false;
  }finally{busy=false}
 }
 function populateCatalogueCases(){
  const select=$('catalogueCaseSelect');
  for(const entry of curatedCases){
   const option=elt('option','',entry.title);option.value=entry.id;select.appendChild(option);
  }
  select.addEventListener('change',()=>{
   const chosen=curatedCases.find(x=>x.id===select.value);
   if(!chosen)return;
   $('caseInput').value=chosen.id;
   $('notebookInput').value='Research notebook · '+chosen.title.replace(/^FEATURED INVESTIGATION · /,'').slice(0,140);
  });
 }
 function renderNotebook(){
  if(revoked||!book)return;
  $('setupPanel').hidden=true;$('vaultAccessPanel').hidden=true;$('workPanel').hidden=false;
  $('notebookHeading').textContent=book.title;
  $('notebookMeta').textContent='Workspace '+book.workspaceId+' · Case '+book.caseId+' · Private session';
  renderList();renderSelected();showView(view);
 }
 const fieldDescriptions={
  prediction:[
   ['predictedObservation','Predicted observation'],
   ['ifObserved','If observed, what would it mean?'],
   ['ifNotObserved','If not observed, what would it mean?'],
   ['howToTest','How could this be tested?']
  ],
  disconfirm:[
   ['potentiallyDisconfirmingObservation','Potentially disconfirming observation'],
   ['howToCheck','How would this be checked?']
  ],
  source:[
   ['label','Source / publisher label'],
   ['url','Public HTTPS source URL'],
   ['locator','Page, section or timestamp (optional)']
  ]
 };
 function addEntry(kind,values={}){
  const map={prediction:'predictionEntries',disconfirm:'disconfirmEntries',source:'sourceEntries'};
  const host=$(map[kind]);const existing=host.querySelectorAll('.entry-card');
  if(existing.length>=(kind==='source'?30:20)){
   status('Maximum number of '+kind+' entries reached.',true);return;
  }
  const box=elt('div','entry-card');box.dataset.kind=kind;
  const top=elt('div','entry-top');
  top.appendChild(elt('h4','',kind==='prediction'?'Prediction':kind==='disconfirm'?'Disconfirming test':'Citation'));
  const remove=elt('button','', 'Remove');remove.type='button';
  remove.addEventListener('click',()=>{
   if(kind!=='source'&&host.querySelectorAll('.entry-card').length===1){
    status('At least one '+kind+' entry is required.',true);return;
   }
   box.remove();
  });
  top.appendChild(remove);box.appendChild(top);
  for(const [key,labelText] of fieldDescriptions[kind]){
   const label=elt('label','',labelText);
   const input=kind==='source'?elt('input'):elt('textarea');
   input.dataset.field=key;input.value=values[key]||'';
   input.required=kind!=='source'||key!=='locator';
   if(kind==='source'&&key==='url')input.type='url';
   if(kind==='source'){input.maxLength=key==='url'?2048:key==='label'?180:600;}
   else{input.rows=2;input.maxLength=1200;}
   label.appendChild(input);box.appendChild(label);
  }
  host.appendChild(box);
 }
 function readEntries(kind){
  const host=$({prediction:'predictionEntries',disconfirm:'disconfirmEntries',source:'sourceEntries'}[kind]);
  return [...host.querySelectorAll('.entry-card')].map((item,index)=>{
   const values={};
   for(const node of item.querySelectorAll('[data-field]'))values[node.dataset.field]=node.value.trim();
   if(kind==='prediction')values.id='prediction-'+(index+1);
   if(kind==='disconfirm')values.id='disconfirm-'+(index+1);
   return values;
  }).filter(item=>kind!=='source'||Object.values(item).some(Boolean));
 }
 function populateEditor(h){
  const original=h?latest(h).content:null;
  $('hypothesisTitle').value=original?.title||'';
  $('hypothesisExplanation').value=original?.explanation||'';
  $('assumptionsInput').value=original?.assumptions.join('\n')||'';
  $('alternativesInput').value=original?.alternativeInterpretations.join('\n')||'';
  for(const host of ['predictionEntries','disconfirmEntries','sourceEntries'])$(host).replaceChildren();
  for(const p of original?.predictions||[{}])addEntry('prediction',p);
  for(const d of original?.disconfirmingTests||[{}])addEntry('disconfirm',d);
  for(const source of original?.sources||[])addEntry('source',source);
 }
 function openEditor(h=null){
  if(!book)return;
  hideStatus();editingId=h?.id||null;
  showView('write');
  $('writeEmpty').hidden=true;$('selectedPreview').hidden=true;$('editorForm').hidden=false;
  $('formMode').textContent=h?'CREATE A NEW VERSION':'NEW WORKING EXPLANATION';
  $('saveHypothesisBtn').textContent=h?'Save new revision':'Save private hypothesis';
  populateEditor(h);
  $('editorForm').scrollIntoView({behavior:'smooth',block:'start'});
  $('hypothesisTitle').focus({preventScroll:true});
 }
 function getContent(){
  return {
   title:$('hypothesisTitle').value.trim(),
   explanation:$('hypothesisExplanation').value.trim(),
   assumptions:lines('assumptionsInput'),
   predictions:readEntries('prediction'),
   disconfirmingTests:readEntries('disconfirm'),
   alternativeInterpretations:lines('alternativesInput'),
   sources:readEntries('source')
  };
 }
 async function saveHypothesis(event){
  event.preventDefault();if(busy)return;hideStatus();
  busy=true;$('saveHypothesisBtn').disabled=true;
  try{
   const content=getContent();
   const revising=!!editingId,id=revising?editingId:slug(content.title,book.hypotheses.length+1);
   const next=revising?
    engine.reviseHypothesis(book,{workspaceId:book.workspaceId,id,content,at:time()}):
    engine.addHypothesis(book,{workspaceId:book.workspaceId,id,content,at:time()});
   if(unlockedVault){
    const generation=await vault.save(next,unlockedVault.key,unlockedVault.generation);
    ensureActive();unlockedVault.generation=generation;
   }
   ensureActive();book=next;selectedId=id;editingId=null;
   renderList();renderSelected();
   updateSecurityUI();
   status(unlockedVault?'Encrypted local save complete. Previous revisions preserved.':
    'Draft saved in memory ONLY. Enable encryption before closing the page.');
  }catch(err){status('Save was NOT completed: '+err.message,true)}
  finally{busy=false;$('saveHypothesisBtn').disabled=false;updateSecurityUI()}
 }
 function createNotebook(event){
  event.preventDefault();if(!bootReady){status('Checking account and browser vault. Try again shortly.',true);return;}hideStatus();
  try{
   book=engine.createNotebook({
    workspaceId:$('workspaceInput').value.trim(),
    caseId:$('caseInput').value.trim(),
    title:$('notebookInput').value.trim(),at:new Date().toISOString()
   });
   selectedId=null;view='write';renderNotebook();updateSecurityUI();
   status('Notebook created in memory only. Enable encrypted saving to keep it after closing.');
  }catch(err){status(err.message,true);}
 }
 const demoContent=(title,description,observation)=>({
  title,explanation:description,
  assumptions:['The fictional report can be reviewed separately from interpretations.'],
  alternativeInterpretations:['Another hypothetical mechanism could explain the same pattern.'],
  predictions:[{id:'prediction-1',predictedObservation:observation,
   ifObserved:'Would warrant reviewing the original record, not proof.',
   ifNotObserved:'Would motivate re-examining the working explanation.',
   howToTest:'Compare fictional records and their stated measurement limitations.'}],
  disconfirmingTests:[{id:'disconfirm-1',
   potentiallyDisconfirmingObservation:'A synthetic independent measurement inconsistent with this idea',
   howToCheck:'Check the fictional original report and calibration history.'}],
  sources:[]
 });
 async function loadDemo(){
  if(!bootReady){status('Checking account and browser vault. Try again shortly.',true);return;}
  if(unlockedVault){status('Lock your encrypted notebook before loading a different demo.',true);return;}
  if(book&&!(await confirmAction({
   title:'Replace this demonstration?',
   message:'The current notebook is not encrypted or saved. Loading a new fictional example will discard its changes.',
   confirmText:'Replace demo',cancelText:'Keep current notebook',destructive:true
  })))return;
  ensureActive();book=engine.createNotebook({workspaceId:'demo-workspace',caseId:'fictional-case',
   title:'Fictional case — demonstration only',at:new Date().toISOString()});
  book=engine.addHypothesis(book,{workspaceId:book.workspaceId,id:'h-environmental',
   content:demoContent('Environmental interpretation','A hypothetical environmental mechanism might match the fictional report.',
    'Repeatable environmental readings would align with the fictional observations.'),at:time()});
  book=engine.addHypothesis(book,{workspaceId:book.workspaceId,id:'h-instrument',
   content:demoContent('Instrument interpretation','An imaginary instrument artefact might produce a similar pattern.',
    'A replicated sensor effect under controlled conditions would be detectable.'),at:time()});
  selectedId='h-environmental';view='write';renderNotebook();
  updateSecurityUI();status('Fictional demonstration loaded in memory. Enable encrypted saving if you wish to keep it.');
 }
 function clearDecryptedDOM(){
  for(const id of ['hypothesisList','selectedSections','comparisonResult',
   'compareOptions','revisionList','historySnapshot','predictionEntries',
   'disconfirmEntries','sourceEntries','gapCaseDetails','gapCandidateList','gapReviewList'])$(id).replaceChildren();
  $('editorForm').reset();
  $('notebookHeading').textContent='';$('notebookMeta').textContent='';
  $('selectedTitle').textContent='';$('selectedExplanation').textContent='';
  $('currentVersion').textContent='';
  $('historyPerson').replaceChildren();
  $('workspaceInput').value='';$('caseInput').value='';$('notebookInput').value='';
  for(const id of ['vaultNewPassphrase','vaultConfirmPassphrase',
   'unlockPassphrase','importPassphrase'])$(id).value='';
  $('importVaultFile').value='';
 }
 async function refreshVaultAccess(){
  const stored=await vault.readStored();
  ensureActive();
  // Single encrypted notebook per browser profile in this standalone alpha.
  // Do not offer a second unsaved notebook while a locked vault exists.
  // This avoids accidental confusion over which project can be persisted.
  if(!book)$('setupPanel').hidden=!!stored;
  $('vaultAccessPanel').hidden=!!book;
  $('unlockVaultForm').hidden=!stored;
  $('importVaultForm').hidden=!!stored;
  $('deleteVaultBtn').hidden=!stored;
  $('vaultAccessStatus').textContent=stored?
   'An encrypted notebook already exists in this browser. Unlock it or explicitly delete it before creating another. This alpha supports one encrypted notebook per browser profile.':
   'No local encrypted notebook found. You can restore a password-protected backup here, or start a fresh notebook.';
  if(!book)$('vaultBadge').textContent=stored?'◉ Encrypted notebook locked':'◉ Session only · not saved';
 }
 function updateSecurityUI(){
  $('enableVaultForm').hidden=!!unlockedVault;
  $('lockVaultBtn').hidden=!unlockedVault;
  $('exportBtn').disabled=!unlockedVault;
  if($('r3CloudUpload'))$('r3CloudUpload').disabled=!unlockedVault||!cloudOwner||busy;
  $('vaultSaveState').textContent=unlockedVault?
   'Encrypted autosave active for completed revisions. Download a separate encrypted backup in case Chrome data is cleared.':
   'Session-only: this notebook is NOT stored. Closing or refreshing will lose it.';
  $('vaultBadge').textContent=unlockedVault?'◉ Encrypted on this device':'◉ Session only · not saved';
 }
 async function enableEncryption(event){
  event.preventDefault();if(!book||busy||unlockedVault)return;
  const pass=$('vaultNewPassphrase').value;
  const confirm=$('vaultConfirmPassphrase').value;
  if(pass!==confirm){status('Passphrase confirmation does not match.',true);return;}
  busy=true;$('enableVaultBtn').disabled=true;hideStatus();
  try{
   const session=await vault.create(book,pass);
   ensureActive();unlockedVault=session;
   updateSecurityUI();
   status('Encrypted notebook saved in this browser. Reopen with your passphrase and download a separate encrypted backup.');
   await refreshVaultAccess();
  }catch(err){status('Encryption was NOT enabled: '+err.message,true)}
  finally{
   $('vaultNewPassphrase').value='';$('vaultConfirmPassphrase').value='';
   busy=false;$('enableVaultBtn').disabled=false;updateSecurityUI();
  }
 }
 async function unlockEncrypted(event){
  event.preventDefault();if(busy)return;busy=true;$('unlockVaultBtn').disabled=true;
  try{
   const session=await vault.unlock($('unlockPassphrase').value);
   ensureActive();book=session.book;unlockedVault={key:session.key,generation:session.generation};
   selectedId=book.hypotheses[0]?.id||null;editingId=null;view='write';
   renderNotebook();updateSecurityUI();await refreshVaultAccess();
   status('Encrypted notebook unlocked locally. All saved revisions recovered.');
  }catch(err){status('Unlock failed: '+err.message,true)}
  finally{$('unlockPassphrase').value='';$('unlockVaultBtn').disabled=false;busy=false;updateSecurityUI()}
 }
 async function importEncrypted(event){
  event.preventDefault();if(busy)return;
  const file=$('importVaultFile').files?.[0];
  if(!file||file.size>2*1024*1024){
   status('Select an encrypted R3 backup smaller than 2 MB.',true);return;
  }
  busy=true;$('importVaultBtn').disabled=true;hideStatus();
  try{
   const session=await vault.importBackup(await file.text(),$('importPassphrase').value);
   ensureActive();book=session.book;unlockedVault={key:session.key,generation:session.generation};
   selectedId=book.hypotheses[0]?.id||null;editingId=null;view='write';
   renderNotebook();updateSecurityUI();await refreshVaultAccess();
   status('Encrypted backup restored to browser storage. Previous revisions preserved.');
  }catch(err){status('Restore failed; no existing data was replaced: '+err.message,true)}
  finally{
   $('importPassphrase').value='';$('importVaultFile').value='';
   $('importVaultBtn').disabled=false;busy=false;updateSecurityUI();
  }
 }
 async function exportEncrypted(){
  if(!unlockedVault||busy)return;
  // Use the same branded navy-and-gold confirmation as other lab actions.
  // This can style our own prompt, not Chrome/Android's download UI.
  if(!(await confirmAction({
   title:'Download encrypted backup?',
   message:'This downloads your latest saved encrypted notebook as a JSON file. Unfinished edits are not included. Keep the file somewhere safe: you will need your original passphrase to restore it, and that passphrase cannot be recovered.',
   confirmText:'Download backup',cancelText:'Not now',icon:'↓'
  })))return;
  if(!unlockedVault||busy)return;
  busy=true;$('exportBtn').disabled=true;
  try{
   const text=await vault.encryptedExport(unlockedVault.generation);
   const blob=new Blob([text],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   const a=elt('a');a.href=url;
   a.download='disclosure-desk-R3-ENCRYPTED-backup.json';
   document.body.appendChild(a);a.click();a.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),1500);
   status('Encrypted backup download requested. Store the file safely; only your passphrase can open it.');
  }catch(err){status('Backup download failed: '+err.message,true)}
  finally{busy=false;$('exportBtn').disabled=!unlockedVault}
 }
 // Hosted website only: Supabase stores ciphertext under verified account RLS.
 // This manual backup workflow deliberately never uploads editor plaintext.
 const cloudStatus=(text,error=false)=>{
  if(revoked)return;
  const target=$('r3CloudStatus');if(!target)return;
  target.textContent=text;target.classList.toggle('error',error);
 };
 async function refreshCloudView(){
  if(!hosted||!$('r3CloudPanel'))return;
  $('r3CloudPanel').hidden=false;
  $('r3CloudUpload').disabled=!cloudOwner||!unlockedVault||busy;
  for(const id of ['r3CloudDownload','r3CloudRestore','r3CloudDelete'])
   $(id).disabled=!cloudOwner||busy;
  if(!cloudOwner){
   $('r3CloudProfile').textContent='Not signed in';
   cloudStatus('Sign in from the main Disclosure Desk Boards tab to link an encrypted backup. Local notebooks work without an account.');
   return;
  }
  $('r3CloudProfile').textContent=cloudOwner.email||'Verified Disclosure Desk account';
  try{
   const data=await cloud.readEncrypted();
   const stored=await vault.readStored();ensureActive();
   $('r3CloudRestore').disabled=!data||!!book||!!stored||busy;
   $('r3CloudDownload').disabled=!data||busy;
   $('r3CloudDelete').disabled=!data||busy;
   cloudStatus(data?'Your account contains an encrypted backup. You can restore it to a new device or explicitly replace it from this device.':
    'Connected to your account. No encrypted cloud backup exists yet.');
  }catch(err){cloudStatus(err.message,true)}
 }
 async function uploadCloud(){
  if(!cloudOwner||!unlockedVault||busy)return;
  busy=true;$('r3CloudUpload').disabled=true;
  try{
   const payload=await vault.encryptedExport(unlockedVault.generation);
   const previous=await cloud.readEncrypted();
   ensureActive();if(previous?.generation===unlockedVault.generation){
    cloudStatus('This exact encrypted version is already backed up to your account.');return;
   }
   const message=previous?
    'Replace the previous encrypted cloud backup for this account with the currently saved local revisions? This removes the previous cloud copy. Download that copy first if you want to keep it. Your local notebook will not be deleted.':
    'Save your current locally encrypted revisions to your signed-in account? The passphrase and readable research stay on this device. The account stores ciphertext only.';
   if(!(await confirmAction({title:previous?'Replace cloud backup?':'Back up notebook to your account?',
     message,confirmText:previous?'Replace encrypted backup':'Back up encrypted copy',
     cancelText:'Not now',icon:'☁'})))return;
   ensureActive();await cloud.saveEncrypted(payload,previous?.generation||null);
   ensureActive();
   $('r3CloudDownload').disabled=false;$('r3CloudDelete').disabled=false;
   cloudStatus('Encrypted cloud backup saved to your verified account. Your passphrase never left the browser.');
  }catch(err){cloudStatus('Cloud backup was NOT saved: '+err.message,true)}
  finally{busy=false;updateSecurityUI()}
 }
 async function downloadCloud(){
  if(!cloudOwner||busy)return;
  busy=true;
  try{
   const row=await cloud.readEncrypted();
   ensureActive();if(!row)throw new Error('No encrypted account backup was found');
   const json=JSON.stringify(row.encrypted_envelope,null,2);
   const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
   const link=elt('a');link.href=url;link.download='disclosure-desk-R3-CLOUD-ENCRYPTED-backup.json';
   document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1500);
   cloudStatus('Encrypted account backup download requested. Store it safely with your recovery passphrase.');
  }catch(err){cloudStatus('Backup download failed: '+err.message,true)}
  finally{busy=false}
 }
 async function restoreCloud(){
  if(!cloudOwner||busy)return;
  const passphrase=$('r3CloudPassphrase').value;
  if(!passphrase||passphrase.length<12){cloudStatus('Enter the original notebook passphrase (at least 12 characters).',true);return}
  busy=true;$('r3CloudRestore').disabled=true;
  try{
   if(book||await vault.readStored())
    throw new Error('A local notebook already exists. Export a backup and use another browser profile or explicitly delete the local copy before restoring. Nothing was overwritten.');
   const row=await cloud.readEncrypted();
   ensureActive();if(!row)throw new Error('No encrypted account backup is available');
   if(!(await confirmAction({
    title:'Restore account backup?',
    message:'Restore this encrypted account backup into this browser? An empty local vault is required. You must know the original passphrase. No other device will be changed.',
    confirmText:'Restore encrypted backup',cancelText:'Not now',icon:'☁'
   })))return;
   ensureActive();const session=await vault.importBackup(JSON.stringify(row.encrypted_envelope),passphrase);
   ensureActive();book=session.book;unlockedVault={key:session.key,generation:session.generation};
   selectedId=book.hypotheses[0]?.id||null;editingId=null;view='write';
   renderNotebook();updateSecurityUI();await refreshVaultAccess();
   $('r3CloudRestore').disabled=true;
   cloudStatus('Encrypted notebook restored to this browser. Your account backup remains unchanged.');
  }catch(err){cloudStatus('Cloud restore failed without changing existing work: '+err.message,true)}
  finally{
   $('r3CloudPassphrase').value='';busy=false;updateSecurityUI();
   try{$('r3CloudRestore').disabled=!cloudOwner||!!book||!!(await vault.readStored())}
   catch{$('r3CloudRestore').disabled=true}
  }
 }
 async function deleteCloud(){
  if(!cloudOwner||busy)return;
  busy=true;$('r3CloudDelete').disabled=true;
  try{
   const row=await cloud.readEncrypted();
   ensureActive();if(!row)throw new Error('There is no encrypted cloud copy to delete');
   if(!(await confirmAction({
    title:'Delete encrypted account backup?',
    message:'This permanently deletes the encrypted cloud backup in your Disclosure Desk account. Any local notebook or downloaded backup stays unchanged. Type DELETE to confirm.',
    confirmText:'Delete account backup',cancelText:'Keep backup',destructive:true,verifyDelete:true
   })))return;
   ensureActive();await cloud.deleteEncrypted(row.generation);
   ensureActive();$('r3CloudDownload').disabled=true;$('r3CloudRestore').disabled=true;
   cloudStatus('Encrypted account backup deleted. Local notebooks and downloaded files were not touched.');
  }catch(err){cloudStatus('Cloud backup was not deleted: '+err.message,true)}
  finally{busy=false;$('r3CloudDelete').disabled=false}
 }
 async function startR3(){
  if(hosted){
   $('setupPanel').hidden=true;
   $('r3CloudPanel').hidden=false;
   try{
    cloudOwner=cloud?await cloud.ready():null;
    ensureActive();vault.configureScope(cloudOwner?.id||null);
   }catch(err){
    vault.configureScope(null);cloudOwner=null;
    cloudStatus('Account connection unavailable; continuing in isolated guest-only local mode. '+err.message,true);
   }
  }
  ensureActive();bootReady=true;
  try{await refreshVaultAccess()}catch(err){status('Browser vault unavailable: '+err.message,true)}
  if(hosted){
   await refreshCloudView();
   if($('r3CloudUpload')){
    $('r3CloudUpload').addEventListener('click',uploadCloud);
    $('r3CloudDownload').addEventListener('click',downloadCloud);
    $('r3CloudRestore').addEventListener('click',restoreCloud);
    $('r3CloudDelete').addEventListener('click',deleteCloud);
   }
  }
  ensureActive();document.documentElement.dataset.r3Boot='ready';
 }
 async function closeSession(){
  if(!book||busy)return;
  if(!(await confirmAction(unlockedVault?{
   title:'Lock your private notebook?',
   message:'Completed revisions remain encrypted in this browser. Any text you have not saved in the editor will be lost.',
   confirmText:'Lock notebook',cancelText:'Keep working'
  }:{
   title:'Discard unsaved notebook?',
   message:'This notebook has not been encrypted or saved. Closing it now will permanently discard the changes in this session.',
   confirmText:'Discard notebook',cancelText:'Keep notebook open',destructive:true
  })))return;
  ensureActive();clearDecryptedDOM();
  book=null;unlockedVault=null;selectedId=null;editingId=null;view='write';
  $('workPanel').hidden=true;$('setupPanel').hidden=false;
  hideStatus();updateSecurityUI();
  try{await refreshVaultAccess();if(hosted)await refreshCloudView()}catch(err){status(err.message,true)}
 }
 async function deleteSaved(){
  if(busy||unlockedVault){
   status('Lock the active notebook before deleting its encrypted local copy.',true);return;
  }
  if(!(await confirmAction({
   title:'Delete this encrypted notebook?',
   message:'This permanently removes the saved copy from this browser. Download your encrypted backup first. Enter DELETE to confirm. Other backup files will not be removed.',
   confirmText:'Delete local copy',cancelText:'Keep encrypted copy',
   destructive:true,verifyDelete:true
  })))return;
  ensureActive();busy=true;$('deleteVaultBtn').disabled=true;
  try{
   await vault.deleteLocalVault();
   await refreshVaultAccess();
   status('Local encrypted notebook deleted. No encrypted backups elsewhere were changed.');
  }catch(err){status(err.message,true)}
  finally{busy=false;$('deleteVaultBtn').disabled=false;if(hosted)void refreshCloudView()}
 }
 $('setupForm').addEventListener('submit',createNotebook);
 $('sampleBtn').addEventListener('click',loadDemo);
 $('newHypothesisBtn').addEventListener('click',()=>openEditor());
 $('emptyStartBtn').addEventListener('click',()=>openEditor());
 $('editSelectedBtn').addEventListener('click',()=>openEditor(selected()));
 $('cancelEditBtn').addEventListener('click',()=>{renderSelected();hideStatus()});
 $('editorForm').addEventListener('submit',saveHypothesis);
 $('addPredictionBtn').addEventListener('click',()=>addEntry('prediction'));
 $('addDisconfirmBtn').addEventListener('click',()=>addEntry('disconfirm'));
 $('addSourceBtn').addEventListener('click',()=>addEntry('source'));
 for(const key of ['write','compare','history','gaps'])
  $(key+'Tab').addEventListener('click',async()=>{
   if(!$('editorForm').hidden&&!(await confirmAction({
    title:'Leave unfinished edits?',
    message:'The text currently in the editor has not been saved as a revision. Leave now and these edits will be lost.',
    confirmText:'Leave editor',cancelText:'Continue editing',destructive:true
   })))return;
   if(key==='write')renderSelected();
   showView(key);hideStatus();
  });
 $('buildCompareBtn').addEventListener('click',renderComparison);
 $('historyPerson').addEventListener('change',renderHistory);
 $('exportBtn').addEventListener('click',exportEncrypted);
 $('resetBtn').addEventListener('click',closeSession);
 $('lockVaultBtn').addEventListener('click',closeSession);
 $('enableVaultForm').addEventListener('submit',enableEncryption);
 $('unlockVaultForm').addEventListener('submit',unlockEncrypted);
 $('importVaultForm').addEventListener('submit',importEncrypted);
 $('deleteVaultBtn').addEventListener('click',deleteSaved);
 if(hosted)window.addEventListener('dd-r3-account-changed',()=>{
  revoked=true;bootReady=false;
  // Immediately wipe private content before browser navigation can occur.
  clearDecryptedDOM();book=null;unlockedVault=null;selectedId=null;editingId=null;
  $('workPanel').hidden=true;$('setupPanel').hidden=true;
  cloudOwner=null;updateSecurityUI();
  $('r3CloudPassphrase').value='';
  $('r3CloudStatus').textContent='Account changed. Private research was locked before reloading.';
 });
 populateCatalogueCases();
 renderDock();
 updateSecurityUI();
 startR3().catch(err=>{bootReady=true;document.documentElement.dataset.r3Boot='ready';status('R3 startup failed: '+err.message,true)});
})();

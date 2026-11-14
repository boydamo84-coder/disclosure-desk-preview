/* M12.3 — Private Android-only contextual research return.
 * No account data, remote calls, native JS interface, or public-site deployment.
 * Requires both an explicit same-origin navigation marker and a short-lived
 * profile context created by clicking a real Who's Who case/dossier link.
 */
(function(){
 'use strict';
 if(window.DDResearchReturn)return true;
 const KEY='dd-who-case-return-v1';
 const path=location.pathname;
 const query=new URLSearchParams(location.search);
 const currentOrigin=location.origin;
 const isArchive=path==='/'&&query.get('dd_tab')==='archivePage';
 const isDossier=['/rendlesham-forest-1980','/rendlesham-forest-1980.html',
                  '/roswell-1947','/roswell-1947.html'].includes(path);
 if(query.get('dd_from')!=='who'||(!isArchive&&!isDossier))return false;
 const validId=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9-]{1,79}$/.test(s);
 const validY=y=>Number.isFinite(y)&&y>=0&&y<10000000;
 let ctx=null;
 try{
  const raw=sessionStorage.getItem(KEY);
  if(raw){
   const p=JSON.parse(raw);
   const original=new URL(p.page,currentOrigin);
   if(p && validId(p.personId)&&typeof p.personName==='string'&&
      p.personName.length>0&&p.personName.length<=120&&
      original.origin===currentOrigin&&
      ['/who-is-who','/who-is-who.html'].includes(original.pathname)&&
      original.searchParams.get('person')===p.personId&&
      !original.hash&&validY(p.y)&&
      Number.isFinite(p.savedAt)&&Date.now()-p.savedAt>=0&&
      Date.now()-p.savedAt<15*60*1000&&
      ((isArchive&&p.target==='archive'&&validId(p.caseId))||
       (isDossier&&p.target==='dossier'&&p.targetPath===path))){
    ctx={personId:p.personId,personName:p.personName,page:original.pathname+original.search,
         savedAt:p.savedAt,target:p.target};
   }
  }
 }catch(_){} // No assumptions about browser storage availability.
 if(!ctx)return false;
 const archivePage=document.getElementById('archivePage');
 const archiveDialog=document.getElementById('archiveCaseDialog');
 const caseBody=document.getElementById('archiveCaseBody');
 const active=()=>{
  if(Date.now()-ctx.savedAt>=15*60*1000)return false;
  if(isArchive)return !!archivePage&&!archivePage.classList.contains('hidden');
  return isDossier;
 };
 const returnToPerson=()=>{
  if(!active())return false;
  // Only the validated relative Who's Who profile URL can be navigated to.
  location.assign(ctx.page);
  return true;
 };
 const style=document.createElement('style');
 style.id='ddResearchReturnStyle';
 style.textContent=`
 .dd-research-return-bar{display:flex;align-items:center;justify-content:flex-start;
 gap:9px;position:sticky;top:0;z-index:9;padding:9px 12px;
 background:#102535f5;border:1px solid #b99758;border-radius:10px;
 box-shadow:0 3px 14px #0006;margin:0 0 12px;color:#ebd29c}
 .dd-research-return-bar button{border:1px solid #d4b978;background:#293d49;
 color:#f1d7a1;min-height:39px;padding:8px 12px;border-radius:9px;font-weight:700;
 font-size:13px;cursor:pointer}
 .dd-research-return-bar button:focus-visible{outline:2px solid #ffe0a2}
 @media(prefers-reduced-motion:reduce){.dd-research-return-bar{scroll-behavior:auto}}
 `;
 document.head.appendChild(style);
 const buildBar=()=>{
  const bar=document.createElement('div');bar.className='dd-research-return-bar';
  bar.dataset.ddResearchReturn='who';
  const button=document.createElement('button');button.type='button';
  button.setAttribute('aria-label','Return to '+ctx.personName+' in Who’s Who');
  button.textContent='← Back to '+ctx.personName;
  button.addEventListener('click',returnToPerson);
  bar.appendChild(button);
  return bar;
 };
 const refresh=()=>{
  if(!active())return;
  if(isArchive){
   if(!archiveDialog?.open||!caseBody)return;
   // Archive re-renders the whole case body when cases change. Reinsert once.
   if(!caseBody.querySelector('[data-dd-research-return="who"]'))
    caseBody.prepend(buildBar());
  }else if(isDossier){
   if(document.querySelector('[data-dd-research-return="who"]'))return;
   const main=document.querySelector('main')||document.body;
   main.insertBefore(buildBar(),main.firstChild);
  }
 };
 const api=Object.freeze({
  canReturn:()=>active()&&(!isArchive||!!archiveDialog?.open||!!archivePage),
  handleBack:()=>active()?returnToPerson():false,
  returnToPerson
 });
 window.DDResearchReturn=api;
 if(isArchive){
  if(caseBody)new MutationObserver(refresh).observe(caseBody,{childList:true});
  if(archiveDialog)new MutationObserver(refresh).observe(archiveDialog,{attributes:true,attributeFilter:['open']});
 }
 // Defer inserting until the verified page's own UI is ready; never rewrite
 // index.html or interfere with its Archive dialog/history when no origin exists.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
 else refresh();
 return true;
})()

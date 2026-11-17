/* M54: explicit same-origin return from a cited Archive case to its Who's Who profile.
 * No identity, publisher, remote calls, ratings, passwords or case truth inference.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DDWhoArchiveReturn=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const KEY='dd-who-case-return-v1';
 const validId=id=>typeof id==='string'&&/^[a-z0-9][a-z0-9-]{1,79}$/.test(id);
 function resolve(marker,currentHref,caseId,now){
  if(!marker||typeof marker!=='object'||!validId(caseId)||
     !validId(marker.personId)||marker.target!=='archive'||marker.caseId!==caseId||
     typeof marker.page!=='string'||marker.page.length>260||
     !Number.isFinite(marker.savedAt)||!Number.isFinite(now)||
     now-marker.savedAt<0||now-marker.savedAt>15*60*1000)return null;
  try{
   const here=new URL(currentHref);
   if(!['http:','https:'].includes(here.protocol)||
      !['/','/index.html'].includes(here.pathname)||
      here.searchParams.get('dd_tab')!=='archivePage'||
      here.searchParams.get('dd_from')!=='who')return null;
   const source=new URL(marker.page,here.origin);
   if(source.origin!==here.origin||source.pathname!=='/who-is-who.html'||
      source.searchParams.get('person')!==marker.personId||
      [...source.searchParams.keys()].some(k=>k!=='person'))return null;
   const href='/who-is-who.html?person='+encodeURIComponent(marker.personId);
   if(source.pathname+source.search!==href)return null;
   return {href,personId:marker.personId,caseId};
  }catch(_){return null}
 }
 function fromSession(caseId){
  try{
   const marker=JSON.parse(window.sessionStorage.getItem(KEY)||'null');
   return resolve(marker,window.location.href,caseId,Date.now());
  }catch(_){return null}
 }
 function update(button,caseId){
  if(!button)return false;
  const target=fromSession(caseId);
  button.hidden=!target;
  button.onclick=target?function(){window.location.assign(target.href)}:null;
  return !!target;
 }
 return Object.freeze({KEY,resolve,fromSession,update});
});

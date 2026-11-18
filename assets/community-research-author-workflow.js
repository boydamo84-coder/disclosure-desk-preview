/* Community Research M03 | consent-first author workflow | test-only flag OFF.
 * No network or publication on production. No automatic upload/auto publish.
 * The underlying W.NE source is read ONLY by the M01 explicit-copy step.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
function init(){
 const drafts=window.DDCommunityResearchDrafts;
 const publish=window.DDCommunityResearchPublication;
 const panel=$('researchM03Panel');
 if(!panel||drafts?.enabled!==true||publish?.enabled!==true)return;
 const status=$('researchM03Status'), savedLabel=$('researchM03Saved');
 const approve=$('researchM03Consent'),submit=$('researchM03Publish');
 const withdrawArea=$('researchM03WithdrawArea');
 const withdrawConsent=$('researchM03WithdrawConsent');
 const withdrawText=$('researchM03WithdrawText');
 const withdrawing=$('researchM03Withdraw');
 let stored=null, publicRecord=null, busy=false, lastPreview=null;
 panel.hidden=false;
 status.textContent='Private testing enabled on this isolated host. No public website content has been published.';
 const say=s=>{status.textContent=String(s).slice(0,450)};
 const resetConsent=()=>{
   approve.checked=false;submit.disabled=true;
   withdrawConsent.checked=false;withdrawText.value='';
 };
 function reviewCopy(){
   const title=$('previewPaperTitle').textContent.trim();
   const abstract=$('previewAbstract').textContent.trim();
   const body=$('previewBody').textContent;
   const paper_type=$('researchType').value;
   const source_urls=window.DDCommunityResearchPreview?.sourceLines?.($('researchSources').value);
   if(!Array.isArray(source_urls)||source_urls.length<1)
    throw Error('Provide at least one original source link before public publication.');
   if(!$('researchOriginal').checked||!$('researchConsent').checked)
    throw Error('Confirm the right to use these materials and accept preview-only status.');
   if(title!==$('researchTitle').value.trim()||
      abstract!==$('researchAbstract').value.trim()||
      body!==$('researchBody').value.trim())
    throw Error('The editor changed since preview. Review the latest paper first.');
   if(title.length<8||abstract.length<30||abstract.length>600||body.trim().length<150)
    throw Error('Title, abstract and research body must be complete before publication.');
   return {title,abstract,body,paper_type,source_urls};
 }
 function same(a,b){
  if(!a||!b)return false;
  for(const k of ['title','abstract','body','paper_type']){
   if(a[k]!==b[k])return false;
  }
  const lhs=a.source_urls,rhs=b.source_urls;
  return Array.isArray(lhs)&&Array.isArray(rhs)&&
    lhs.length===rhs.length&&lhs.every((u,i)=>u===rhs[i]);
 }
 const lock=on=>{
  busy=on;
  $('researchM03Save').disabled=on;
  submit.disabled=on||!stored||!approve.checked||(publicRecord?.status==='withdrawn');
  withdrawing.disabled=on;
 };
 async function saveCopy(){
  if(busy)return;
  lock(true);
  try{
   if($('researchPreview').classList.contains('hidden'))throw Error('Review the public copy before saving.');
   if(publicRecord?.status==='withdrawn')throw Error('Withdrawn papers cannot be republished through this workflow.');
   const reviewed=reviewCopy();
   const result=await drafts.saveMine(reviewed,stored?{
      id:stored.id,expectedRevision:stored.revision
   }:{});
   const readBack=await drafts.getMine(result.id);
   if(!readBack||!same(reviewed,readBack)||readBack.revision!==result.revision)
    throw Error('Private copy could not be verified after save. Check your private drafts before trying again.');
   stored={id:readBack.id,revision:readBack.revision};
   lastPreview=reviewed;
   savedLabel.textContent='Saved private copy verified · revision '+stored.revision+
     (publicRecord?' · next public edition requires fresh consent':' · not publicly published');
   resetConsent();
   say('Your private draft is saved. Review the visible paper and tick the explicit publication agreement before publishing.');
  }catch(e){
   stored=null;lastPreview=null;resetConsent();
   say(String(e?.message||'Private draft save failed. Do not retry automatically.'));
  }finally{lock(false)}
 }
 async function publishCopy(){
  if(busy)return;
  lock(true);
  try{
   if(approve.checked!==true||!stored||!lastPreview)
    throw Error('Review the saved edition and approve publication first.');
   if(publicRecord?.status==='withdrawn')throw Error('This paper is withdrawn.');
   const reviewed=reviewCopy();
   if(!same(reviewed,lastPreview))throw Error('Draft changed since private save; save and review again.');
   const confirmed=await drafts.getMine(stored.id);
   if(!confirmed||confirmed.revision!==stored.revision||!same(confirmed,lastPreview))
    throw Error('The saved draft changed in another session. Review the latest version.');
   const result=await publish.publishDraft({
    draftId:stored.id,revision:stored.revision,
    paperId:publicRecord?.paperId||null,
    edition:publicRecord?.edition||null,consent:true
   });
   publicRecord=result;
   stored=null;lastPreview=null;
   resetConsent();
   withdrawArea.hidden=false;
   savedLabel.textContent='Published edition '+result.edition+' · private source remains unchanged';
   say('Edition '+result.edition+' confirmed published on the TEST service. Public paper ID: '+result.paperId);
  }catch(e){
   resetConsent();
   say(String(e?.message||'Publication not confirmed. Check the paper before retrying.'));
  }finally{lock(false)}
 }
 async function withdrawPaper(){
  if(busy)return;
  lock(true);
  try{
   if(!publicRecord||publicRecord.status!=='published')
    throw Error('No active published paper is selected.');
   if(withdrawText.value!=='WITHDRAW'||withdrawConsent.checked!==true)
    throw Error('Type WITHDRAW and confirm the withdrawal before continuing.');
   const result=await publish.withdrawPaper({
    paperId:publicRecord.paperId,edition:publicRecord.edition,consent:true
   });
   publicRecord=result;stored=null;lastPreview=null;
   withdrawArea.hidden=true;resetConsent();
   say('Withdrawal confirmed on the TEST service. The paper and all public editions are now hidden; author history is retained.');
  }catch(e){
   say(String(e?.message||'Withdrawal could not be verified; check the paper state.'));
  }finally{lock(false)}
 }
 $('researchM03Save').addEventListener('click',()=>{void saveCopy()});
 submit.addEventListener('click',()=>{void publishCopy()});
 withdrawing.addEventListener('click',()=>{void withdrawPaper()});
 approve.addEventListener('change',()=>{
  submit.disabled=busy||!approve.checked||!stored||publicRecord?.status==='withdrawn';
 });
 $('researchForm').addEventListener('submit',()=>{
  stored=null;lastPreview=null;resetConsent();
  if(publicRecord?.status==='published'){
    savedLabel.textContent='The current public edition is unchanged. Save this corrected copy as a new private draft revision before proposing an update.';
  }else{
    savedLabel.textContent='Nothing saved publicly. Save a private copy to begin an approved publication.';
  }
 });
 $('clearDraft').addEventListener('click',()=>{
  stored=null;lastPreview=null;publicRecord=null;
  withdrawArea.hidden=true;resetConsent();
  savedLabel.textContent='No saved research is linked to this empty preview.';
  say('Publication workflow reset. Private drafts and existing public papers were not deleted.');
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
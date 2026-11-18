/* Community Research M03 | consented server-snapshot API | STAGED AND DISABLED.
 * No W.NE edits, no direct public row writes, no auto-publish.
 * Only the approved test host can activate after a separate test-db configuration.
 * Live production website cannot enable this adapter through flags or URL params.
 */
(()=>{
'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const flags=window.DD_COMMUNITY_FEATURES||{};
const testHost=location.hostname==='localhost'||location.hostname==='127.0.0.1'||
 /^deploy-preview-\d+--uap-disclosure-desk\.netlify\.app$/.test(location.hostname);
const enabled=testHost&&cfg.environment==='test'&&flags.communityResearchBackend===true
 &&flags.communityResearchPublishing===true&&flags.researchPublishing===false
 &&/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(String(cfg.url||''))
 &&/^sb_publishable_[A-Za-z0-9_-]+$/.test(String(cfg.publishableKey||''));
if(!enabled){
 window.DDCommunityResearchPublication=Object.freeze({enabled:false});
 return;
}
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let db;
function client(){
 if(db)return db;
 if(typeof window.supabase?.createClient!=='function')throw Error('Research account service is unavailable.');
 db=window.supabase.createClient(cfg.url,cfg.publishableKey,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
 });
 return db;
}
async function author(){
 const {data,error}=await client().auth.getUser();
 const user=data?.user;
 if(error||!user||user.is_anonymous===true||!idPattern.test(String(user.id)))
  throw Error('Sign in using a registered research account to publish or withdraw.');
 return user.id;
}
function validPositive(v){return Number.isSafeInteger(v)&&v>=1&&v<=100000}
function checked(response){
 const obj=response?.data;
 if(response?.error)throw Error('The publication action was rejected. '+String(response.error.message||'').slice(0,140));
 if(!obj||!idPattern.test(obj.paper_id)||!validPositive(obj.edition)
   ||!['published','withdrawn'].includes(obj.status))
  throw Error('The publication response could not be verified. Check your papers before retrying.');
 return Object.freeze({paperId:obj.paper_id,edition:obj.edition,status:obj.status});
}
async function publishDraft({draftId,revision,paperId=null,edition=null,consent=false}={}){
 if(consent!==true)throw Error('You must explicitly approve the exact saved research edition before publishing.');
 if(!idPattern.test(String(draftId||''))||!validPositive(revision))
  throw Error('A current, saved private draft and revision are required.');
 if((paperId===null)!==(edition===null)||
    (paperId!==null&&(!idPattern.test(String(paperId))||!validPositive(edition))))
  throw Error('Revising requires the existing paper and its last confirmed edition.');
 await author();
 const response=await client().rpc('dd_cr_publish_copy',{
  p_draft_id:draftId,
  p_expected_revision:revision,
  p_confirm_publication:true,
  p_paper_id:paperId,
  p_expected_edition:edition
 });
 const result=checked(response);
 if(result.status!=='published'||(edition===null&&result.edition!==1)||
    (edition!==null&&(result.paperId!==paperId||result.edition!==edition+1)))
  throw Error('Server publication state did not match the expected edition; do not retry automatically.');
 return result;
}
async function withdrawPaper({paperId,edition,consent=false}={}){
 if(consent!==true)throw Error('You must explicitly approve the withdrawal of this specific publication.');
 if(!idPattern.test(String(paperId||''))||!validPositive(edition))
  throw Error('A previously confirmed paper and its exact edition are required.');
 await author();
 const result=checked(await client().rpc('dd_cr_withdraw_paper',{
  p_paper_id:paperId,
  p_expected_edition:edition,
  p_confirm_withdrawal:true
 }));
 if(result.paperId!==paperId||result.edition!==edition||result.status!=='withdrawn')
  throw Error('Server withdrawal state is unexpected; check the paper before retrying.');
 return result;
}
window.DDCommunityResearchPublication=Object.freeze({enabled:true,publishDraft,withdrawPaper});
})();
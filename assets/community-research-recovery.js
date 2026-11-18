/* Community Research M04: owner-only recoverable paper index and RLS edition reader.
 * OFF on production and before separate test Supabase approval.
 * No browser persistence, no W.NE source reads, no public-paper mutations.
 */
(()=>{
'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{},flags=window.DD_COMMUNITY_FEATURES||{};
const testHost=location.hostname==='localhost'||location.hostname==='127.0.0.1'
 ||/^deploy-preview-\d+--uap-disclosure-desk\.netlify\.app$/.test(location.hostname);
const productionHost=/^(?:www\.)?uapdisclosuredesk\.com$/.test(location.hostname)||
 location.hostname==='uap-disclosure-desk.netlify.app';
const productionPilot=productionHost&&cfg.environment==='production'&&cfg.communityResearchPilot===true
 &&cfg.url==='https://omqxizswzcwgzqaczlhe.supabase.co';
const isolatedTest=testHost&&cfg.environment==='test'&&cfg.communityResearchTestDatabase===true
 &&cfg.url!=='https://omqxizswzcwgzqaczlhe.supabase.co';
const enabled=(productionPilot||isolatedTest)
 &&/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(String(cfg.url||''))
 &&flags.communityResearchBackend===true&&flags.communityResearchPublishing===true
 &&flags.communityResearchRecovery===true&&flags.researchPublishing===false
 &&/^sb_publishable_[A-Za-z0-9_-]+$/.test(String(cfg.publishableKey||''));
if(!enabled){
 window.DDCommunityResearchRecovery=Object.freeze({enabled:false});return;
}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
let db;
function client(){
 if(db)return db;
 if(typeof window.supabase?.createClient!=='function')
  throw Error('Research account service is unavailable.');
 db=window.supabase.createClient(cfg.url,cfg.publishableKey,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
 });
 return db;
}
async function isPilot(){
 if(!productionPilot)return true;
 try{
  const {data,error}=await client().auth.getUser();
  if(error||!data?.user||data.user.is_anonymous===true)return false;
  const check=await client().rpc('dd_cr_pilot_status');
  return check?.error==null&&check.data===true;
 }catch{return false;}
}
async function account(){
 const {data,error}=await client().auth.getUser();
 const user=data?.user;
 if(error||!user||user.is_anonymous===true||!uuid.test(String(user.id)))
  throw Error('Sign in with a registered account to view My Research.');
 if(productionPilot&&!(await isPilot()))throw Error('My Research is currently restricted to approved beta researcher accounts.');
 return user.id;
}
function positiveInt(v,min,max){return Number.isSafeInteger(v)&&v>=min&&v<=max}
function cleanResult(r){
 if(r?.error)throw Error('My Research service unavailable. '+String(r.error.message||'').slice(0,100));
 if(!Array.isArray(r?.data))throw Error('Unable to verify your published papers from the server.');
 const rows=r.data;
 if(rows.length>25)throw Error('Unexpected number of recovered papers.');
 return rows.map(p=>{
  if(!p||!uuid.test(String(p.paper_id))||
   (p.draft_id!==null&&!uuid.test(String(p.draft_id)))||
   !['published','withdrawn'].includes(p.status)||
   !positiveInt(p.current_edition,1,100000)||
   typeof p.title!=='string'||p.title.length>140||
   typeof p.abstract!=='string'||p.abstract.length>600||
   !['case','archive','hypothesis','methods'].includes(p.paper_type)||
   typeof p.published_at!=='string'||!Number.isFinite(Date.parse(p.published_at))||
   !positiveInt(p.source_count,0,12)
  )throw Error('The recovered publication metadata did not pass validation.');
  return Object.freeze({
   paperId:p.paper_id,draftId:p.draft_id,status:p.status,
   currentEdition:p.current_edition,title:p.title,abstract:p.abstract,
   type:p.paper_type,sourceCount:p.source_count,
   publishedAt:p.published_at,changedAt:p.changed_at
  });
 });
}
async function listMyPapers({page=0,pageSize=20}={}){
 if(!positiveInt(page,0,25)||!positiveInt(pageSize,1,20)||
    page*pageSize>500)throw Error('Invalid research page number.');
 await account();
 return cleanResult(await client().rpc('dd_cr_my_papers',{
  p_limit:pageSize,p_offset:page*pageSize
 }));
}
async function listEditions(paperId,{page=0,pageSize=20}={}){
 if(!uuid.test(String(paperId||''))||!positiveInt(page,0,50)||
    !positiveInt(pageSize,1,20)||page*pageSize>1000)
   throw Error('Invalid research paper or version page.');
 await account();
 const {data,error}=await client().from('dd_cr_editions')
  .select('edition,title,abstract,body,paper_type,source_urls,published_at')
  .eq('paper_id',paperId)
  .order('edition',{ascending:false}).range(page*pageSize,page*pageSize+pageSize-1);
 if(error)throw Error('Unable to load paper history. '+String(error.message||'').slice(0,100));
 if(!Array.isArray(data)||data.length>pageSize)throw Error('Version history could not be verified.');
 return data.map(x=>{
  if(!x||!positiveInt(x.edition,1,100000)||typeof x.body!=='string'||
    x.body.length>30000||typeof x.title!=='string'||x.title.length>140||
    typeof x.abstract!=='string'||x.abstract.length>600||
    !Array.isArray(x.source_urls)||x.source_urls.length>12||
    x.source_urls.some(v=>typeof v!=='string'||!v.startsWith('https://')||v.length>1000))
   throw Error('A research edition contained unexpected data.');
  return Object.freeze({edition:x.edition,title:x.title,abstract:x.abstract,
   body:x.body,type:x.paper_type,sourceUrls:x.source_urls.slice(),publishedAt:x.published_at});
 });
}
window.DDCommunityResearchRecovery=Object.freeze({enabled:true,isPilot,account,listMyPapers,listEditions});
})();
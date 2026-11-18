/* Disclosure Desk Community Research M02 — private draft adapter, OFF by default.
 * No public publish capability. No W.NE access. No local storage of draft text.
 * RLS in the yet-to-be-reviewed M02 schema is the only authorization boundary.
 * This module is inert until an explicit test-host backend flag is approved.
 */
(()=>{
 'use strict';
 const cfg=window.DD_COMMUNITY_TEST_CONFIG||{},flags=window.DD_COMMUNITY_FEATURES||{};
 const allowedHost=location.hostname==='localhost'||location.hostname==='127.0.0.1'
  ||/^deploy-preview-\d+--uap-disclosure-desk\.netlify\.app$/.test(location.hostname);
 const productionHost=/^(?:www\.)?uapdisclosuredesk\.com$/.test(location.hostname)||
   location.hostname==='uap-disclosure-desk.netlify.app';
 const productionPilot=productionHost&&cfg.environment==='production'
  &&cfg.communityResearchPilot===true
  &&cfg.url==='https://omqxizswzcwgzqaczlhe.supabase.co';
 const isolatedTest=allowedHost&&cfg.environment==='test'&&cfg.communityResearchTestDatabase===true
  &&cfg.url!=='https://omqxizswzcwgzqaczlhe.supabase.co';
 const enabled=(productionPilot||isolatedTest)&&flags.communityResearchBackend===true
  &&flags.researchPublishing===false&&!!cfg.url&&!!cfg.publishableKey;
 if(!enabled){
  window.DDCommunityResearchDrafts=Object.freeze({enabled:false});
  return;
 }
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const validTypes=new Set(['case','archive','hypothesis','methods']);
 const columns='id,title,abstract,body,paper_type,source_urls,revision,created_at,updated_at';
 let db;
 function client(){
  if(db)return db;
  if(typeof window.supabase?.createClient!=='function')throw Error('Research account service is unavailable.');
  db=window.supabase.createClient(cfg.url,cfg.publishableKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
  });
  return db;
 }
 async function isPilot(){
  if(!productionPilot)return true; // Isolated fixture mode retains old M02 tests.
  try{
   const {data,error}=await client().auth.getUser();
   if(error||!data?.user||data.user.is_anonymous===true)return false;
   const check=await client().rpc('dd_cr_pilot_status');
   return check?.error==null&&check.data===true;
  }catch{return false;}
 }
 async function registered(){
  const {data,error}=await client().auth.getUser();
  if(error||!data?.user||data.user.is_anonymous===true)throw Error('Sign in to a registered Disclosure Desk account first.');
  const user=data.user;
  if(!uuid.test(user.id))throw Error('Research account cannot be verified.');
  if(productionPilot&&!(await isPilot()))throw Error('Community Research is currently available only to approved beta researchers.');
  return user;
 }
 function safeLink(raw){
  try{
   if(typeof raw!=='string'||raw.length>1000)return null;
   const u=new URL(raw);
   if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||
      !u.hostname.includes('.')||u.hostname.length>240||
      /(?:^|\.)(?:localhost|local|internal|test)$/i.test(u.hostname)||
      /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname))return null;
   return u.href;
  }catch{return null}
 }
 function clean(paper){
  if(!paper||typeof paper!=='object'||Array.isArray(paper))throw Error('Research draft is invalid.');
  const title=String(paper.title||'').trim();
  const abstract=String(paper.abstract||'').trim();
  const body=String(paper.body||'');
  const paper_type=String(paper.paper_type||'case');
  const urls=Array.isArray(paper.source_urls)?paper.source_urls:[];
  if(title.length<8||title.length>140||abstract.length>600||body.length>30000||
     !validTypes.has(paper_type)||urls.length>12)
     throw Error('Draft title, abstract, content, type or references exceed the permitted limits.');
  const source_urls=urls.map(safeLink);
  if(source_urls.some(u=>u===null))throw Error('Draft sources must be valid public HTTPS links.');
  return {title,abstract,body,paper_type,source_urls:[...new Set(source_urls)]};
 }
 const queryError=(error)=>{if(error)throw Error('Private research service unavailable. '+String(error.message||'').slice(0,100))};
 async function listMine(){
  const user=await registered();
  const {data,error}=await client().from('dd_cr_drafts').select(columns)
   .eq('author_id',user.id).order('updated_at',{ascending:false}).limit(50);
  queryError(error);
  return Array.isArray(data)?data:[];
 }
 // Enumerate ALL private drafts in bounded pages instead of silently stopping at 50.
 // Return metadata only. The full manuscript is fetched on demand by getMine().
 async function listMinePaged({page=0,pageSize=20}={}){
  if(!Number.isSafeInteger(page)||page<0||page>50000||
     !Number.isSafeInteger(pageSize)||pageSize<1||pageSize>20||
     page*pageSize>1000000)throw Error('Invalid private-draft page bounds.');
  const user=await registered();
  const offset=page*pageSize;
  const summary='id,title,abstract,paper_type,revision,created_at,updated_at';
  const {data,error}=await client().from('dd_cr_drafts').select(summary)
   .eq('author_id',user.id)
   .order('updated_at',{ascending:false})
   .order('id',{ascending:false})
   .range(offset,offset+pageSize);
  queryError(error);
  const after=await registered();
  if(after.id!==user.id)throw Error('Account changed during private draft retrieval. Refresh this account.');
  if(!Array.isArray(data)||data.length>pageSize+1)throw Error('Invalid private-draft page response.');
  const items=data.slice(0,pageSize);
  if(items.some(x=>!x||!uuid.test(String(x.id))||typeof x.title!=='string'||
     !Number.isSafeInteger(x.revision)||x.revision<1))
   throw Error('Private draft metadata failed verification.');
  return Object.freeze({items,hasMore:data.length>pageSize,page});
 }
 async function getMine(id){
  if(!uuid.test(id))throw Error('A valid private draft ID is required.');
  const user=await registered();
  const {data,error}=await client().from('dd_cr_drafts').select(columns)
   .eq('id',id).eq('author_id',user.id).maybeSingle();
  queryError(error);
  return data||null;
 }
 async function saveMine(paper,{id=null,expectedRevision=null}={}){
  const user=await registered(),value=clean(paper);
  if(id===null){
   const {data,error}=await client().from('dd_cr_drafts').insert(value).select(columns).single();
   queryError(error);
   if(!data||!uuid.test(data.id)||data.revision!==1)throw Error('New private draft could not be verified.');
   return data;
  }
  if(!uuid.test(id)||!Number.isSafeInteger(expectedRevision)||expectedRevision<1)
   throw Error('A valid private draft ID and saved revision are required.');
  const {data,error}=await client().from('dd_cr_drafts')
   .update(value).eq('id',id).eq('author_id',user.id).eq('revision',expectedRevision)
   .select(columns).maybeSingle();
  queryError(error);
  if(!data)throw Error('Draft changed elsewhere or is no longer yours. Reload your private drafts before editing.');
  if(data.id!==id||data.revision!==expectedRevision+1)throw Error('The updated draft revision could not be verified.');
  return data;
 }
 async function deleteMine(id){
  if(!uuid.test(id))throw Error('A valid private draft ID is required.');
  const user=await registered();
  const {data,error}=await client().from('dd_cr_drafts').delete()
   .eq('id',id).eq('author_id',user.id).select('id').maybeSingle();
  queryError(error);
  if(!data||data.id!==id)throw Error('Draft is missing or cannot be deleted from this account.');
  return true;
 }
 window.DDCommunityResearchDrafts=Object.freeze({enabled:true,isPilot,listMine,listMinePaged,getMine,saveMine,deleteMine});
})();

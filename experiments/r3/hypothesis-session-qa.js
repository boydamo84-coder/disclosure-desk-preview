'use strict';
/* R3 DRAFT PREVIEW QA, opt-in and read-only. No credentials, JWTs, plaintext
 * research, analytics, account creation, cloud writes, or data export.
 * Only functional on Netlify deploy previews or local CI localhost.
 */
(()=>{
 const host=location.hostname;
 const preview=/^deploy-preview-[0-9]+--uap-disclosure-desk\.netlify\.app$/.test(host);
 const local=host==='localhost'||host==='127.0.0.1';
 if(!(preview||local)||new URLSearchParams(location.search).get('dd_r3_qa')!=='1')return;
 const $=id=>document.getElementById(id);
 const pane=$('r3QaPanel');
 if(!pane)return;
 pane.hidden=false;
 const config=window.DD_COMMUNITY_TEST_CONFIG||{};
 const db=window.supabase?.createClient&&config.url&&config.publishableKey?
  window.supabase.createClient(config.url,config.publishableKey,{
   auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
  }):null;
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 let owner=null,ownExists=null,foreignResult='NOT RUN',busy=false;
 const report=()=>[
  'Disclosure Desk R3 – browser signed-session read-only QA',
  'Verified session: '+(owner?'YES':'NO'),
  'Own encrypted notebook backup present: '+(ownExists===null?'NOT CHECKED':ownExists?'YES':'NO'),
  'Other account row query: '+foreignResult,
  'Notes: No credentials, user IDs, tokens, ciphertext or personal data included.',
  'The other-account result is meaningful only when that account separately confirms its own backup exists.'
 ].join('\n');
 const show=(message,error=false)=>{
  $('r3QaStatus').textContent=message;
  $('r3QaStatus').classList.toggle('error',error);
  $('r3QaResults').textContent=report();
 };
 const activate=()=>{
  $('r3QaCopyId').disabled=!owner;
  $('r3QaOtherCheck').disabled=!owner;
  $('r3QaVerify').disabled=busy;
 };
 async function currentUser(){
  if(!db)throw Error('Supabase client is not available in this preview');
  const {data,error}=await db.auth.getUser();
  if(error)throw Error('Supabase Auth did not verify the current session');
  const user=data?.user;
  return user&&!user.is_anonymous&&uuid.test(String(user.id||''))?user:null;
 }
 const lock=()=>{owner=null;ownExists=null;foreignResult='NOT RUN';$('r3QaOwnId').value='';activate()};
 if(db)db.auth.onAuthStateChange(event=>{
  if(['SIGNED_OUT','SIGNED_IN','USER_UPDATED','PASSWORD_RECOVERY'].includes(event)){
   lock();show('Session changed. Press Verify again before any access test.');
  }
 });
 const verify=async()=>{
  if(busy)return;busy=true;activate();lock();
  try{
   const user=await currentUser();
   if(!user){show('Guest session. Sign in through the preview Boards tab, then return here. Cloud tests are disabled.');return}
   const {data,error}=await db.from('dd_r3_private_notebooks')
    .select('owner_user_id').eq('owner_user_id',user.id).maybeSingle();
   if(error)throw Error('Your own encrypted-backup query failed. Account or API setup needs inspection.');
   const after=await currentUser();
   if(after?.id!==user.id)throw Error('Session changed during the query. Retry after signing in.');
   owner=user.id;ownExists=!!data;
   $('r3QaOwnId').value=user.id;
   show('Verified a real Supabase session. '+(ownExists?'Your own encrypted cloud backup exists.':
    'No encrypted cloud backup for this account yet. Use fictional Lab data and manual Backup first.'));
  }catch(err){lock();show(err.message,true)}
  finally{busy=false;activate()}
 };
 const other=async()=>{
  if(busy||!owner)return;
  const id=$('r3QaOtherId').value.trim().toLowerCase();
  if(!uuid.test(id)||id===owner){show('Enter the DIFFERENT account’s copied test ID, not your own.',true);return}
  busy=true;activate();
  try{
   const before=await currentUser();
   if(before?.id!==owner)throw Error('Session changed; verify again.');
   // Read-only query. Never update or delete another account's backup.
   const {data,error}=await db.from('dd_r3_private_notebooks')
    .select('owner_user_id').eq('owner_user_id',id).maybeSingle();
   if(error)throw Error('Cross-account read returned an API error; verify RLS setup.');
   const after=await currentUser();
   if(after?.id!==owner)throw Error('Session changed during access test; result discarded.');
   foreignResult=data?'FAIL – ANOTHER ACCOUNT ROW WAS VISIBLE':'DENIED – ZERO OTHER-ACCOUNT ROWS';
   show(data?'SECURITY FAILURE: this session could see another account’s record. Stop testing and do not release.':
    'No other-account row was visible. Confirm the other account already uploaded its fictional encrypted backup before calling this a PASS.',!!data);
  }catch(err){foreignResult='ERROR – TEST INCOMPLETE';show(err.message,true)}
  finally{busy=false;activate()}
 };
 async function copy(value,label){
  try{await navigator.clipboard.writeText(value);show(label)}
  catch{show('Copy unavailable in this browser. Select and copy from the field instead.',true)}
 }
 $('r3QaVerify').addEventListener('click',verify);
 $('r3QaOtherCheck').addEventListener('click',other);
 $('r3QaCopyId').addEventListener('click',()=>{if(owner)void copy(owner,'Test ID copied. Paste it into the other account’s check field.')});
 $('r3QaCopyResults').addEventListener('click',()=>void copy(report(),'Privacy-safe status summary copied. No IDs or session tokens.'));
 activate();show('Read-only QA is ready. Sign in through Boards, then choose Verify session.');
})();

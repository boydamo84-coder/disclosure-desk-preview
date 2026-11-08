/* Disclosure Desk Android only. Native messaging bridge is origin restricted
 * to the first-party MAIN frame; no service-role key is present here. */
(()=>{'use strict';
const native=window.DDAndroid,config=window.DD_COMMUNITY_TEST_CONFIG;
if(!native||!window.supabase||!config?.url||!config?.publishableKey)return;
const client=window.supabase.createClient(config.url,config.publishableKey,
 {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
let active='',token='',registration='';
const uuid=id=>/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(String(id||''));
function tellNative(id){
 try{native.postMessage(JSON.stringify({type:'account',user_id:uuid(id)?id:null}))}catch(_){}
}
async function register(){
 if(!uuid(active)||!token||registration===active+'|'+token)return;
 try{
  const {data:{session}}=await client.auth.getSession();
  if(!session||session.user?.id!==active||session.user.is_anonymous)return;
  const {error}=await client.functions.invoke('dd-chat-push-device',{
   body:{operation:'register',token}
  });
  if(error)throw error;
  registration=active+'|'+token;
 }catch(_){
  // Push stays optional. Chat inside the site still works if FCM is unavailable.
 }
}
function authChange(session){
 const id=session?.user&&!session.user.is_anonymous&&uuid(session.user.id)?session.user.id:'';
 if(id!==active){registration='';active=id;if(!id)token=''}
 tellNative(id);
 if(id&&token)void register();
}
document.addEventListener('dd-android-token',event=>{
 const value=String(event?.detail||'');
 if(value.length<40||value.length>4096)return;
 token=value;registration='';void register();
});
client.auth.onAuthStateChange((_event,session)=>{authChange(session)});
void client.auth.getSession().then(({data})=>authChange(data?.session||null)).catch(()=>tellNative(null));
})();

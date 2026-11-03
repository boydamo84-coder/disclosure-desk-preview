/* Research Library cloud read adapter: original local data stays separate. */
(()=>{'use strict';
const originalFetch=window.fetch.bind(window);
const supa=window.supabase;
if(!supa?.createClient)return;
const db=supa.createClient('https://omqxizswzcwgzqaczlhe.supabase.co','sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
window.fetch=async(input,init)=>{
 const address=new URL(typeof input==='string'?input:input.url,location.href);
 if(address.pathname==='/api/research/references'||address.pathname==='/api/research/references/backup'){
  try{
   const {data:auth,error:authError}=await db.auth.getUser();
   if(authError||!auth?.user)return reply({error:'Sign in to Research Edition first.'},401);
   const project=address.pathname.endsWith('/backup')?String(JSON.parse(init?.body||'{}').projectId||''):String(address.searchParams.get('project')||'');
   if(!/^(legacy|p_[A-Za-z0-9_-]{1,76})$/.test(project))return reply({error:'Invalid research project identifier'},400);
   if(address.pathname.endsWith('/backup')){
    if((init?.method||'GET').toUpperCase()!=='POST')return reply({error:'POST required'},405);
    const body=JSON.parse(init?.body||'{}'),entries=body.entries;
    if(!Array.isArray(entries)||entries.length<1||entries.length>500||!entries.every(x=>x&&typeof x.title==='string'&&typeof x.url==='string'))return reply({error:'Invalid reference entries'},400);
    const {error}=await db.from('research_reference_backups').insert({user_id:auth.user.id,project_id:project,entries});
    if(error)throw error;
    return reply({ok:true,exists:true,count:entries.length});
   }
   const {data,error}=await db.from('research_reference_backups').select('entries').eq('project_id',project).maybeSingle();
   if(error)throw error;
   return reply(data?{exists:true,entries:data.entries}:{exists:false,entries:[]});
  }catch(e){return reply({error:'Cloud reference backup unavailable: '+(e.message||e)},400)}
 }
 if(!address.pathname.startsWith('/api/research/boards'))return originalFetch(input,init);
 const method=(init?.method||'GET').toUpperCase();
 if(method!=='GET')return reply({error:'Cloud Board changes are not enabled from Research Library. Existing local copies are unchanged.'},501);
 try{
  const {data:auth,error:authError}=await db.auth.getUser();
  if(authError||!auth?.user)return reply({error:'Sign in to your Research Edition account first.'},401);
  const base='/api/research/boards',isList=address.pathname===base;
  let q=db.from('investigation_boards').select(isList?'id,name,updated_at':'id,name,content').order('updated_at',{ascending:false}).limit(100);
  if(!isList){const id=decodeURIComponent(address.pathname.slice(base.length+1));if(!/^[0-9a-f-]{36}$/i.test(id))return reply({error:'Invalid Board ID'},400);q=q.eq('id',id)}
  const {data,error}=await q;
  if(error)throw error;
  if(isList)return reply({boards:(data||[]).map(b=>({id:b.id,name:b.name,savedAt:b.updated_at}))});
  const item=data?.[0];if(!item)return reply({error:'Board not found in this account'},404);
  return reply({board:{...item.content,id:item.id,name:item.name}});
 }catch(e){return reply({error:e.message||'Private Board lookup failed'},400)}
};
})();
/* Canonical W.NE Research Edition browser compatibility adapter.
 * Unpublished integration. Only explicitly mapped routes are serviced.
 * Every cloud write uses the existing authenticated Supabase RPC with expected revision.
 * Never emulate unsupported API success or silently overwrite documents.
 */
(()=>{
'use strict';
const url='https://omqxizswzcwgzqaczlhe.supabase.co';
const key='sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X';
if(!window.supabase?.createClient){document.documentElement.dataset.wneBridge='unavailable';return}
const db=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const originalFetch=window.fetch.bind(window);
const state={owner:null,id:null,revision:null,document:null,saved:null};
const json=(payload,status=200)=>new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const fail=(message,status=400)=>json({error:message},status);
function valid(doc){
 if(!doc||doc.version!==2||typeof doc.bookTitle!=='string'||!Array.isArray(doc.chapters)||doc.chapters.length<1||doc.chapters.length>500)return false;
 const ids=new Set;
 for(const c of doc.chapters){if(!c||typeof c.id!=='string'||typeof c.title!=='string'||typeof c.html!=='string'||!c.id||ids.has(c.id))return false;ids.add(c.id)}
 return ids.has(doc.active)&&['Georgia','Arial','Times New Roman','Courier New'].includes(doc.font)&&Number.isInteger(doc.size);
}
async function user(){
 const {data,error}=await db.auth.getUser();if(error||!data?.user)throw Error('Please sign in through the Research Edition cloud library');
 if(state.owner&&data.user.id!==state.owner){state.id=null;state.document=null;state.revision=null;throw Error('Account changed. Reload Research Edition.')}
 state.owner=data.user.id;return data.user;
}
async function load(id){
 await user();
 const {data,error}=await db.from('research_documents').select('id,title,content,revision,updated_at').eq('id',id).single();
 if(error)throw error;
 if(!valid(data.content))throw Error('Document incompatible with original W.NE manuscript structure. No data was changed.');
 state.id=data.id;state.document=structuredClone(data.content);state.revision=data.revision;state.saved=data.updated_at;
 // Preserve the last *actually opened and owner-verified* document.
 // Research entry checks RLS again before resuming; no account data leaves this device.
 try{localStorage.setItem('wne-research-last-document:'+state.owner,state.id)}catch(_){}
 return data;
}
async function ensureLoaded(){
 await user();
 if(state.document)return;
 const search=new URLSearchParams(location.search),id=search.get('id');
 if(!id)throw Error('Open a research document from your cloud library first');
 if(!/^[0-9a-f-]{36}$/i.test(id))throw Error('Invalid document identifier');
 await load(id);
}
async function list(){
 await user();
 const {data,error}=await db.from('research_documents').select('id,title,revision,updated_at').order('updated_at',{ascending:false}).limit(100);
 if(error)throw error;
 return {active_id:state.id,items:(data||[]).map(d=>({id:d.id,title:d.title,chapters:0,chapter_label:'Cloud document',saved:d.updated_at,last_opened:d.updated_at,active:d.id===state.id,mode:'study'}))};
}
async function manuscript(method,input){
 await ensureLoaded();
 if(method==='GET')return {revision:state.revision,saved:state.saved,manuscript:structuredClone(state.document),remote_seq:0,phone_editing:false};
 if(!input||!valid(input.manuscript)||!Number.isInteger(input.expected_revision)||input.expected_revision!==state.revision)throw Error('Save conflict or invalid manuscript. Export an emergency copy before reloading.');
 if(input.remote_seq!==0)throw Error('Remote command support is unavailable in web edition.');
 const {data,error}=await db.rpc('research_save_document',{p_id:state.id,p_expected_revision:state.revision,p_title:input.manuscript.bookTitle,p_content:input.manuscript});
 if(error)throw error;
 if(!Array.isArray(data)||data.length!==1||!Number.isInteger(Number(data[0].saved_revision))||Number(data[0].saved_revision)!==state.revision+1)throw Error('Unconfirmed cloud revision. Keep the editor open and export a copy.');
 state.revision=Number(data[0].saved_revision);state.document=structuredClone(input.manuscript);state.saved=new Date().toISOString();
 return {ok:true,revision:state.revision,saved:state.saved,remote_seq:0};
}
// Explicit, non-destructive export of the user's own PRIVATE cloud library.
// The file is generated in this browser; no Google Drive permissions are used.
async function makeLibraryZip(){
 const account=await user();
 if(typeof window.JSZip!=='function')throw Error('ZIP library unavailable. Check your connection and try again; your research has not changed.');
 const rows=[],pageSize=100,needsReview=[];
 for(let offset=0;offset<1000;offset+=pageSize){
  const {data,error}=await db.from('research_documents')
   .select('id,user_id,title,content,revision,created_at,updated_at')
   .order('created_at',{ascending:true}).range(offset,offset+pageSize-1);
  if(error)throw error;
  for(const row of data||[]){
   if(row.user_id!==account.id)throw Error('Account mismatch while preparing backup. No file was created.');
   // Preserve incompatible/old saved data in the backup, without auto-restoring it.
   if(!valid(row.content))needsReview.push({id:row.id,title:row.title});
   rows.push(row);
  }
  if((data||[]).length<pageSize)break;
  if(offset+pageSize>=1000)throw Error('Library exceeds 1,000 documents. Contact support for a larger export.');
 }
 if(!rows.length)throw Error('No saved cloud research documents to back up yet.');
 // Keep a fully usable backup for supported documents. Incompatible content
 // goes in a separate manual-review folder and is NEVER offered for automatic restore.
 const restorable=rows.filter(row=>valid(row.content));
 const zip=new window.JSZip();
 const exported=new Date().toISOString(),manifest={
  format:'disclosure-desk-wne-research-backup-v1',
  exported_at:exported,document_count:restorable.length,
  documents:restorable.map(({id,title,revision,updated_at})=>({id,title,revision,updated_at})),
  manual_review_count:needsReview.length
 };
 zip.file('README.txt','Disclosure Desk W.NE Research Edition backup\\n'
 +'Includes only the research documents belonging to the signed-in account.\\n'
 +'Original document IDs are included for reference; restoring should create NEW copies.\\n'
 +'Private browser-only Boards, image files outside the manuscript, and Google Drive are not included.\\n'
 +'Store this ZIP privately. It may include sensitive, unpublished work.\\n');
 zip.file('manifest.json',JSON.stringify(manifest,null,2));
 let characters=0;
 for(const row of rows){
  const data=JSON.stringify({
   id:row.id,title:row.title,revision:row.revision,created_at:row.created_at,
   updated_at:row.updated_at,document:row.content
  });
  characters+=data.length;
  if(characters>60*1024*1024)throw Error('The research library is too large for one browser ZIP (60 MB limit). No file created.');
  zip.file((valid(row.content)?'documents/':'manual-review/')+row.id+'.json',data);
 }
 if(needsReview.length)zip.file('WARNING-MANUAL-REVIEW.txt',
  'Older or incompatible documents were preserved as raw JSON in manual-review/. Only documents/ are valid for automatic restore.\n'
  +'No account data has been migrated, deleted or overwritten.\n\n'
  +needsReview.map(row=>row.id+' - '+String(row.title||'Untitled')).join('\n'));
 const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:4}});
 if(!blob?.size)throw Error('The ZIP archive could not be generated.');
 const stamp=exported.slice(0,10);
 return {blob,filename:'Disclosure-Desk-WNE-Research-'+stamp+'.zip',documentCount:rows.length,needsManualReview:needsReview.length};
}
async function libraryAction(input){
 await user();
 if(input?.action==='open'){
  if(!/^[0-9a-f-]{36}$/i.test(String(input.id||'')))throw Error('Invalid cloud document');
  await load(input.id);
  return {ok:true,id:state.id};
 }
 if(input?.action==='create'){
  const title=String(input.title||'').trim();
  if(!title||title.length>150)throw Error('Invalid document title');
  const sid='s-'+crypto.randomUUID();
  const content={version:2,bookTitle:title,active:sid,chapters:[{id:sid,title:'Section 1',html:'<p></p>'}],font:'Georgia',size:12};
  const result=await db.from('research_documents').insert({user_id:state.owner,title,content}).select('id,title').single();
  if(result.error)throw result.error;
  return {id:result.data.id,title:result.data.title};
 }
 if(input?.action==='import-cloud-copy'){
  if(!valid(input.document))throw Error('Invalid cloud copy');
  const {data,error}=await db.from('research_documents').insert({user_id:state.owner,title:String(input.document.bookTitle).slice(0,150)+' (Cloud Copy)',content:input.document}).select('id,title').single();
  if(error)throw error;return {id:data.id,title:data.title,created_copy:true};
 }
 throw Error('This library action is not yet connected to cloud storage. No changes made.');
}
async function researchBoards(path,method){
 await user();
 if(method!=='GET')throw Error('Cloud Boards are read-only in this integration. No changes made.');
 const prefix='/api/research/boards/';
 if(path==='/api/research/boards'){
  const {data,error}=await db.from('investigation_boards').select('id,name,updated_at').order('updated_at',{ascending:false}).limit(100);
  if(error)throw error;
  return {boards:(data||[]).map(row=>({id:row.id,name:row.name,savedAt:row.updated_at}))};
 }
 const id=decodeURIComponent(path.slice(prefix.length));
 if(!/^[0-9a-f-]{36}$/i.test(id))throw Error('Invalid Board identifier');
 const {data,error}=await db.from('investigation_boards').select('id,name,content').eq('id',id).single();
 if(error)throw error;
 return {board:{...data.content,id:data.id,name:data.name}};
}
async function archiveSearch(search){
 const q=(search.searchParams.get('q')||'').trim().toLocaleLowerCase();
 if(q.length<2)throw Error('Enter at least two characters');
 const response=await originalFetch('./data/curated-public-cases.json',{cache:'no-store'});
 if(!response.ok)throw Error('Public archive index unavailable');
 const data=await response.json();
 if(!Array.isArray(data))throw Error('Invalid public archive index');
 const matched=data.filter(c=>[c.id,c.title,c.year,c.source,c.category,c.description].some(x=>String(x||'').toLocaleLowerCase().includes(q)));
 return {cases:matched.slice(0,80),total:matched.length,archiveCount:data.length,source:'Disclosure Desk curated public case index'};
}
async function recovery(path,method,body){
 await ensureLoaded(); // Includes signed-in user and current owner/RLS checks.
 if(path==='/api/snapshots'){
  if(method!=='GET')throw Error('Recovery history is read-only');
  const {data,error}=await db.from('research_document_revisions')
    .select('id,revision,saved_at').eq('document_id',state.id)
    .order('saved_at',{ascending:false}).limit(40);
  if(error)throw error;
  return {items:(data||[]).map(row=>({
    id:row.id,revision:row.revision,saved:row.saved_at,
    reason:'Automatic cloud checkpoint'
  }))};
 }
 if(path.startsWith('/api/snapshot/')){
  if(method!=='GET')throw Error('Recovery preview is read-only');
  const id=path.slice('/api/snapshot/'.length);
  if(!/^[0-9a-f-]{36}$/i.test(id))throw Error('Invalid checkpoint');
  const {data,error}=await db.from('research_document_revisions')
   .select('content').eq('id',id).eq('document_id',state.id).single();
  if(error)throw error;
  if(!valid(data?.content))throw Error('Checkpoint content could not be read safely');
  return {manuscript:data.content};
 }
 if(path==='/api/recovery/copy'){
  if(method!=='POST'||!/^[0-9a-f-]{36}$/i.test(String(body?.id||'')))throw Error('Choose a valid checkpoint first');
  const {data,error}=await db.from('research_document_revisions')
   .select('title,content').eq('id',body.id).eq('document_id',state.id).single();
  if(error)throw error;
  if(!valid(data?.content))throw Error('Checkpoint is unavailable or invalid');
  const title=(String(data.title||'Recovered research').slice(0,175)+' (Recovered)').slice(0,200);
  const {data:created,error:writeError}=await db.from('research_documents')
   .insert({user_id:state.owner,title,content:data.content})
   .select('id,title').single();
  if(writeError)throw writeError;
  if(!created?.id)throw Error('Recovery copy creation was not confirmed');
  return {id:created.id,title:created.title,created_copy:true};
 }
 throw Error('Unsupported recovery operation');
}
async function route(input,init){
 const requested=new URL(input instanceof Request?input.url:String(input),location.href);
 const path=requested.pathname;
 if(!path.startsWith('/api/'))return null;
 const method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
 const supported=['/api/manuscript','/api/library'];
 const boardRoute=path==='/api/research/boards'||path.startsWith('/api/research/boards/');
 if(path==='/api/writer/live-spelling'){
  if(method!=='POST')return fail('Spelling checks require POST',405);
  try{
   // The Edge Function verifies the JWT with Supabase Auth. Avoid a redundant
   // network getUser() round trip on every typing pause.
   const {data:{session}}=await db.auth.getSession();
   if(!session?.access_token)throw Error('Please sign in to use LanguageTool');
   const raw=init?.body||(input instanceof Request?await input.clone().text():null);
   const body=typeof raw==='string'?JSON.parse(raw):raw||{};
   if(typeof body.text!=='string'||body.text.length>4000||body.text.length<1||!['en-GB','en-US'].includes(body.language))
    return fail('English text required (1–4000 characters)',400);
   const upstream=await originalFetch(url+'/functions/v1/wne-live-spelling',{
     method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':key},
     body:JSON.stringify({language:body.language,text:body.text}),cache:'no-store'
   });
   const payload=await upstream.json();
   return json(payload,upstream.status);
  }catch(e){return fail(e.message||'Spelling gateway unavailable',503)}
 }
 if(path==='/api/research/archive-search'){
  if(method!=='GET')return fail('Archive search is read only',405);
  try{return json(await archiveSearch(requested))}catch(e){return fail(e.message||'Archive search unavailable',400)}
 }
 if(path==='/api/snapshots'||path==='/api/recovery/copy'||path.startsWith('/api/snapshot/')){
  try{
   let body={};
   if(method!=='GET'){
    const raw=init?.body||(input instanceof Request?await input.clone().text():null);
    body=typeof raw==='string'?JSON.parse(raw):raw||{};
   }
   return json(await recovery(path,method,body));
  }catch(e){return fail(e.message||'Recovery history unavailable',400)}
 }
 if(path==='/api/backup'){
  if(method!=='GET')return fail('Backup is read only',405);
  try{
   await ensureLoaded();
   const payload=JSON.stringify(state.document,null,2);
   return new Response(payload,{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Content-Disposition':'attachment; filename="WNE-research-backup.json"'}});
  }catch(e){return fail(e.message||'Backup unavailable',400)}
 }
 if(!supported.includes(path)&&!boardRoute)return fail('This original W.NE feature still needs a cloud adapter. No changes made.',501);
 try{
  let body={};if(method!=='GET'){const raw=init?.body||(input instanceof Request?await input.clone().text():null);body=typeof raw==='string'?JSON.parse(raw):raw||{}}
  if(boardRoute)return json(await researchBoards(path,method));
  if(path==='/api/manuscript')return json(await manuscript(method,body));
  if(path==='/api/library')return json(method==='GET'?await list():await libraryAction(body));
 }catch(e){return fail(e.message||'Cloud request failed',/conflict/i.test(e.message||'')?409:400)}
}
window.fetch=async(input,init)=>{
 const api=await route(input,init);return api||originalFetch(input,init);
};
db.auth.onAuthStateChange((event)=>{
 if(event==='SIGNED_OUT'){
  state.owner=null;state.id=null;state.revision=null;state.document=null;state.saved=null;
  const editor=document.getElementById('editor');
  if(editor)editor.contentEditable='false';
  document.documentElement.dataset.wneBridge='signed-out';
 }
});
window.WNECloudIntegration=Object.freeze({getStatus:()=>({authenticated:!!state.owner,activeDocument:state.id,revision:state.revision}),readSavedDocument:async()=>{await ensureLoaded();return structuredClone(state.document)},makeLibraryZip,recoveryList:async()=>recovery('/api/snapshots','GET'),recoveryPreview:async id=>recovery('/api/snapshot/'+encodeURIComponent(id),'GET'),recoveryCopy:async id=>recovery('/api/recovery/copy','POST',{id})});
document.documentElement.dataset.wneBridge='limited';
})();
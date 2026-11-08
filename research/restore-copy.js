/* Single-JSON Research recovery. Reuse the vetted ZIP document HTML rules.
 * Never overwrite the original; INSERT only under the confirmed current owner.
 * A possibly interrupted insert must not invite an automatic duplicate retry.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const message=text=>{$('status').textContent=text};
const db=window.supabase?.createClient('https://omqxizswzcwgzqaczlhe.supabase.co',
 'sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X',
 {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let candidate=null,busy=false;
function compatible(doc){
 const validator=window.DDResearchZipRestore?.validateDocument;
 if(typeof validator!=='function')throw Error('Secure document inspection is unavailable. No data was submitted.');
 return validator(doc);
}
$('backup').onchange=async()=>{
 if(busy)return;
 candidate=null;$('restore').disabled=true;
 try{
  const file=$('backup').files?.[0];
  if(!file)return;
  if(file.size<=0||file.size>8*1024*1024)throw Error('Backup exceeds the 8MB document limit.');
  const doc=JSON.parse(await file.text());
  if(!compatible(doc))throw Error('This backup contains invalid or unsafe Research document HTML. No changes were made.');
  candidate=doc;
  $('preview').textContent='Document: '+doc.bookTitle+' · '+doc.chapters.length+
   ' sections. Existing documents will not change.';
  message('Backup checked. Ready to create a NEW cloud copy.');
 }catch(e){
  candidate=null;$('preview').textContent='No valid backup selected.';
  message(e?.message||'Could not read or validate this document.');
 }
 $('restore').disabled=!candidate;
};
$('restore').onclick=async()=>{
 if(!candidate||busy)return;
 if(!db)return message('Account service unavailable. Nothing was restored.');
 busy=true;
 $('restore').disabled=true;
 const doc=candidate;
 // Force the user to reselect after any uncertain operation; it might have
 // been inserted even if a network timeout obscured the confirmation.
 candidate=null;$('backup').value='';
 let insertStarted=false;
 try{
  const first=await db.auth.getUser();
  if(first.error||!uuid.test(String(first.data?.user?.id||'')))
   throw Error('Sign in to Research Studio before restoring.');
  const owner=first.data.user.id;
  if(!compatible(doc))throw Error('Backup failed a final safety check.');
  const second=await db.auth.getUser();
  if(second.error||second.data?.user?.id!==owner)
   throw Error('Account changed during validation. No document was submitted.');
  const title=(doc.bookTitle.trim().slice(0,132)+' (Recovered Copy)').slice(0,150);
  const content=structuredClone(doc);content.bookTitle=title;
  insertStarted=true;
  const {data:created,error}=await db.from('research_documents')
   .insert({user_id:owner,title,content}).select('id,title').single();
  if(error||!uuid.test(String(created?.id||'')))
   throw Error(error?.message||'Cloud did not confirm the newly created copy.');
  const latest=await db.auth.getUser();
  if(latest.error||latest.data?.user?.id!==owner)
   throw Error('Account changed after saving. The new copy may exist; check your library.');
  message('Recovered as a NEW private cloud document: '+(created.title||title)+
   '. Existing documents and the original backup were not overwritten.');
 }catch(e){
  message('Restore could not be confirmed: '+(e?.message||'Unknown cloud error')+
   (insertStarted?' Check Research Studio Home before retrying; a new copy may already exist.':
    ' No cloud document was submitted.')+
   ' Your existing documents were not intentionally changed.');
 }finally{
  busy=false;$('restore').disabled=true;
 }
};
})();

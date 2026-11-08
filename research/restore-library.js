/* Hosted backup restorer. No writes before explicit user selection and confirmation. */
(()=>{'use strict';
const $=id=>document.getElementById(id),status=text=>{$('status').textContent=text};
const client=window.supabase?.createClient('https://omqxizswzcwgzqaczlhe.supabase.co',
 'sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X',
 {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
let loaded=null,busy=false;
const selected=()=>[...$('documents').querySelectorAll('input[type="checkbox"]:checked')].map(input=>input.value);
function updateButton(){
 const count=selected().length;
 $('restore').disabled=busy||!loaded||!count||count>25;
 $('restore').textContent=count>25?'Choose no more than 25 documents':'Restore '+count+' selected as NEW copies';
}
function render(){
 const parent=$('documents');parent.replaceChildren();
 for(const doc of loaded.documents){
  const label=document.createElement('label'),input=document.createElement('input'),span=document.createElement('span');
  input.type='checkbox';input.value=doc.sourceId;
  input.addEventListener('change',updateButton);
  span.textContent=doc.title;label.append(input,span);parent.append(label);
 }
 $('restorePanel').hidden=false;updateButton();
}
$('archive').addEventListener('change',async()=>{
 if(busy)return;loaded=null;$('restorePanel').hidden=true;$('results').replaceChildren();
 const file=$('archive').files?.[0];if(!file)return;
 busy=true;status('Checking ZIP structure, content and document sizes…');
 try{
  loaded=await window.DDResearchZipRestore.inspect(file,window.JSZip);
  $('preview').textContent=loaded.documents.length+' documents found · exported '+(loaded.exportedAt||'date unknown');
  render();status('Backup checked. Select the documents you wish to restore.');
 }catch(e){
  loaded=null;$('preview').textContent='Backup not accepted. No cloud documents changed.';
  status(e?.message||'Could not read this backup.');
 }finally{busy=false;updateButton();}
});
$('restore').addEventListener('click',async()=>{
 if(!loaded||busy)return;const ids=selected();
 if(!ids.length||ids.length>25)return status('Select between 1 and 25 documents.');
 if(!client)return status('Account service unavailable. Nothing restored.');
 if(!window.confirm('Create '+ids.length+' NEW cloud document copies? Existing documents will stay unchanged.'))return;
 busy=true;updateButton();status('Checking account and saving new copies…');
 let count=0;
 try{
  const restored=await window.DDResearchZipRestore.restore(client,loaded.documents,ids,(done,total)=>{
   count=done;status('Created '+done+' of '+total+' new document copies…');
  });
  $('results').replaceChildren();
  const heading=document.createElement('h2');heading.textContent='Restored documents';$('results').append(heading);
  for(const row of restored){
   const a=document.createElement('a');a.textContent=row.title;
   a.href='./research-workspace.html?id='+encodeURIComponent(row.id);$('results').append(a);
  }
  loaded.documents=loaded.documents.filter(doc=>!ids.includes(doc.sourceId));
  if(loaded.documents.length)render();
  else{$('restorePanel').hidden=true;loaded=null;}
  status('Restored '+restored.length+' as new private cloud copies. Your existing work and the original ZIP were not changed.');
 }catch(e){
  // After an interrupted batch, a retry could duplicate some successful inserts.
  // Require reselecting the file and checking the cloud library first.
  loaded=null;$('restorePanel').hidden=true;
  status('Restore paused after '+count+' confirmed new copies. '+(e?.message||'Cloud error')+
   ' Check your Research Studio documents before retrying to avoid duplicates. Existing documents were not overwritten.');
 }finally{busy=false;updateButton();}
});
})();

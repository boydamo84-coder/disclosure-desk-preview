/* W.NE Research Edition DOCX import: touch-safe inline picker, never a 404 route.
 * Creates a NEW owner-scoped research document; never overwrites current work.
 */
(()=>{
'use strict';
const MAX=14*1024*1024;
let busy=false;
const input=document.createElement('input');
input.type='file';input.id='dd-research-docx-file';
input.accept='.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
input.hidden=true;input.setAttribute('aria-label','Choose a Word DOCX to import as a new research document');
document.body.appendChild(input);
function fail(message){
 const messageText='Word import not completed: '+String(message||'Unknown error').slice(0,230)+
  '\nYour existing document and original Word file were not replaced.';
 const notice=document.getElementById('toast');
 if(notice){notice.textContent=messageText;notice.classList.remove('hidden')}
 if(window.WNEDialogs?.notice)void window.WNEDialogs.notice(messageText,{title:'Word import'});else window.alert(messageText);
}
function valid(documentData){
 if(documentData?.version!==2||!Array.isArray(documentData.chapters)||!documentData.chapters.length
  ||documentData.chapters.length>500)return false;
 if(typeof documentData.bookTitle!=='string'||!documentData.bookTitle.trim())return false;
 const ids=new Set();
 for(const part of documentData.chapters){
  if(!part||typeof part.id!=='string'||typeof part.title!=='string'||typeof part.html!=='string'
   ||!part.id||ids.has(part.id))return false;
  ids.add(part.id);
 }
 return ids.has(documentData.active);
}
async function confirmImport(title,chapters,warnings){
 const dialog=document.createElement('dialog');dialog.className='dd-m34-dialog';
 dialog.setAttribute('aria-label','Review Word import');
 const h=document.createElement('h2');h.textContent='Import Word document';
 const body=document.createElement('p');body.textContent='Create a separate private research document: '+title;
 const detail=document.createElement('p');detail.textContent=chapters+' section(s) will be imported. Your open report and original DOCX will stay unchanged.';
 const warn=document.createElement('p');warn.textContent=warnings
  ?warnings+' Word formatting warning(s). Please review the new copy after import.'
  :'The original Word document remains on your device.';
 const feedback=document.createElement('p');feedback.textContent='The import will be saved to your cloud library only after you confirm.';
 const menu=document.createElement('menu');
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';
 const ok=document.createElement('button');ok.type='submit';ok.textContent='Create imported copy';
 menu.append(cancel,ok);dialog.append(h,body,detail,warn,feedback,menu);document.body.append(dialog);
 return new Promise(resolve=>{
  let complete=false;
  const done=value=>{if(complete)return;complete=true;dialog.close();dialog.remove();resolve(value)};
  cancel.addEventListener('click',()=>done(false));ok.addEventListener('click',()=>done(true));
  dialog.addEventListener('cancel',e=>{e.preventDefault();done(false)});
  dialog.showModal();
 });
}
async function importFile(file){
 if(busy)return;
 busy=true;
 try{
  if(!file||!/\.docx$/i.test(file.name)||file.size<=0||file.size>MAX)
   throw Error('Choose a Word DOCX file smaller than 14 MB.');
  const save=window.wneSaveBeforeNavigation;
  if(typeof save!=='function'||await save('before importing DOCX')!==true)
   throw Error('Save of your open report was not confirmed. Use Save or Emergency Copy before importing.');
  const parser=window.DDResearchDocx?.importFile;
  if(typeof parser!=='function')throw Error('Word import tools did not load. Reconnect and retry.');
  const parsed=await parser(file);
  const result=parsed?.document||{};
  const chapters=(result.chapters||[]).map((part,index)=>({
   id:'import-'+crypto.randomUUID(),
   title:String(part.title||'Section '+(index+1)).slice(0,150),
   html:String(part.html||'')
  }));
  const title=String(result.bookTitle||file.name.replace(/\.docx$/i,'')).trim().slice(0,150);
  const documentData={version:2,bookTitle:title,chapters,active:chapters[0]?.id,font:'Georgia',size:12};
  if(!valid(documentData))throw Error('The Word file could not be turned into safe report sections.');
  const warnings=Array.isArray(parsed?.warnings)?parsed.warnings.length:0;
  const accepted=await confirmImport(title,chapters.length,warnings);
  if(!accepted)return;
  const response=await fetch('/api/library',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({action:'import-cloud-copy',document:documentData})
  });
  let created;try{created=await response.json()}catch(_){created={}}
  if(!response.ok||!created?.id||!/^[0-9a-f-]{36}$/i.test(String(created.id)))
   throw Error(created?.error||'The cloud did not confirm a new document. No navigation occurred.');
  // This is a new independently saved owner-scoped document, not a replace operation.
  window.top.location.assign('/research/research-workspace.html?id='+encodeURIComponent(created.id));
 }catch(error){fail(error.message||error)}
 finally{busy=false;input.value=''}
}
input.addEventListener('change',()=>{const file=input.files?.[0];if(file)void importFile(file)});
window.DDResearchImport=Object.freeze({
 open(){if(busy)return false;input.click();return true}
});
})();

/* Private Disclosure Desk W.NE Research ZIP restore.
 * Inspect a locally selected backup, then INSERT new copies under the verified
 * signed-in owner. Never update/delete existing documents or import a source ID.
 */
(()=>{'use strict';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORMAT='disclosure-desk-wne-research-backup-v1';
const MAX_ZIP=25*1024*1024,MAX_DOC=8*1024*1024,MAX_TOTAL=60*1024*1024,MAX_FILES=1000;
const FONTS=['Georgia','Arial','Times New Roman','Courier New'];
function valid(doc){
 if(!doc||doc.version!==2||typeof doc.bookTitle!=='string'||!doc.bookTitle.trim()
 ||!Array.isArray(doc.chapters)||!doc.chapters.length||doc.chapters.length>500
 ||!FONTS.includes(doc.font)||!Number.isInteger(doc.size)||doc.size<8||doc.size>72)return false;
 const ids=new Set();
 for(const c of doc.chapters){
  if(!c||typeof c.id!=='string'||!c.id||ids.has(c.id)
  ||typeof c.title!=='string'||typeof c.html!=='string')return false;
  ids.add(c.id);
 }
 return ids.has(doc.active);
}
// Reject executable/active HTML rather than silently rewriting a manuscript.
function safeMarkup(html){
 if(html.length>MAX_DOC)return false;
 if(/<\s*\/?\s*(script|iframe|frame|frameset|object|embed|svg|math|style|link|meta|base|form|input|button|template|video|audio|source)\b/i.test(html))return false;
 if(/\bon[a-z]+\s*=/i.test(html)||/\b(srcdoc|srcset|formaction|xlink:href)\s*=/i.test(html))return false;
 if(/\b(javascript|vbscript|file)\s*:/i.test(html)||/@import\b|expression\s*\(|url\s*\(/i.test(html))return false;
 if(typeof DOMParser!=='function')throw Error('Safe HTML verification is unavailable in this browser.');
 const parsed=new DOMParser().parseFromString(html,'text/html');
 const allowed=new Set(['P','DIV','SPAN','B','STRONG','I','EM','U','S','STRIKE','SUB','SUP','BR','HR','H1','H2','H3','H4','H5','H6','UL','OL','LI','PRE','CODE','BLOCKQUOTE','TABLE','THEAD','TBODY','TFOOT','TR','TD','TH','A','IMG','FIGURE','FIGCAPTION','MARK','SMALL','FONT']);
 for(const node of parsed.body.querySelectorAll('*')){
  if(!allowed.has(node.tagName))return false;
  for(const attribute of node.attributes){
   const key=attribute.name.toLowerCase(),value=attribute.value.trim();
   if(key.startsWith('on')||key.includes(':'))return false;
   if(key==='href'||key==='src'){
    const embedded=key==='src'&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(value)&&value.length<=450000;
    if(!embedded&&!/^https:\/\//i.test(value)&&!(key==='href'&&value.startsWith('#')))return false;
   }else if(key==='data-wne-font-size'){
    if(node.tagName!=='SPAN'||!/^(10|11|12|13|14|15|16|18|20|22|24)$/.test(value))return false;
   }else if(key==='style'){
    if(/url\s*\(|expression\s*\(|@import|behavior\s*:|position\s*:|z-index\s*:|--/.test(value.toLowerCase()))return false;
   }else if(!['class','id','title','alt','width','height','colspan','rowspan','align','color','face','size','start'].includes(key)){
    return false;
   }
  }
 }
 return true;
}
async function inspect(file,zipLibrary){
 if(!file||file.size<=0||file.size>MAX_ZIP)throw Error('Choose a ZIP under 25 MB.');
 if(!zipLibrary?.loadAsync)throw Error('ZIP reader unavailable. Please reconnect and retry.');
 const zip=await zipLibrary.loadAsync(file,{checkCRC32:true,createFolders:false});
 const manifestEntry=zip.file('manifest.json');
 if(!manifestEntry||manifestEntry._data?.uncompressedSize>MAX_DOC)throw Error('Missing or oversized backup manifest.');
 const manifest=JSON.parse(await manifestEntry.async('string'));
 if(manifest.format!==FORMAT||!Number.isInteger(manifest.document_count)||manifest.document_count<1||manifest.document_count>MAX_FILES
 ||!Array.isArray(manifest.documents)||manifest.documents.length!==manifest.document_count)
  throw Error('Not a compatible Disclosure Desk Research ZIP backup.');
 const entries=Object.keys(zip.files).filter(name=>name.startsWith('documents/')&&name.endsWith('.json')&&!zip.files[name].dir);
 if(entries.length!==manifest.document_count)throw Error('Backup document count does not match its manifest.');
 const seen=new Set(),documents=[];
 let bytes=0;
 for(const item of manifest.documents){
  if(!item||!UUID.test(String(item.id||''))||seen.has(item.id))throw Error('Duplicate or invalid document ID in manifest.');
  seen.add(item.id);
  const name='documents/'+item.id+'.json',entry=zip.file(name);
  if(!entry)throw Error('A document is missing from this backup.');
  const declared=entry._data?.uncompressedSize;
  if(!Number.isSafeInteger(declared)||declared<1||declared>MAX_DOC)throw Error('Invalid or oversized ZIP document.');
  bytes+=declared;if(bytes>MAX_TOTAL)throw Error('Backup exceeds 60 MB unpacked.');
  const content=await entry.async('string');
  if(content.length>MAX_DOC)throw Error('A document exceeds the recovery limit.');
  const row=JSON.parse(content);
  if(row.id!==item.id||!valid(row.document)||row.title!==item.title)throw Error('Backup document failed integrity checks.');
  for(const chapter of row.document.chapters)if(!safeMarkup(chapter.html))throw Error('Document contains unsupported or unsafe HTML. No copies have been created.');
  documents.push({sourceId:item.id,title:row.document.bookTitle,document:row.document});
 }
 if(entries.some(name=>!seen.has(name.slice('documents/'.length,-'.json'.length))))throw Error('Backup contains unexpected documents.');
 return {exportedAt:String(manifest.exported_at||''),documents};
}
async function restore(db,documents,selectedIds,onProgress){
 if(!Array.isArray(documents)||!documents.length||!Array.isArray(selectedIds)||!selectedIds.length
 ||selectedIds.length>25)throw Error('Select 1–25 documents per restore batch.');
 const selected=new Set(selectedIds);
 if(selected.size!==selectedIds.length)throw Error('Selected documents changed. Reopen the backup.');
 const chosen=documents.filter(d=>selected.has(d.sourceId));
 if(chosen.length!==selected.size)throw Error('Selected documents changed. Reopen the backup.');
 const first=await db.auth.getUser();
 if(first.error||!first.data?.user?.id)throw Error('Sign in to Research Studio before restoring.');
 const owner=first.data.user.id,results=[];
 for(const doc of chosen){
  const current=await db.auth.getUser();
  if(current.error||current.data?.user?.id!==owner)throw Error('Account changed. Restore stopped; earlier created copies remain separate.');
  if(!valid(doc.document))throw Error('The selected document is invalid.');
  const content=structuredClone(doc.document);
  const title=(content.bookTitle.trim().slice(0,132)+' (Restored Copy)').slice(0,150);
  content.bookTitle=title;
  const {data,error}=await db.from('research_documents')
   .insert({user_id:owner,title,content}).select('id,title').single();
  if(error||!UUID.test(String(data?.id||'')))throw Error('Restore stopped after '+results.length+' copy/copies: '+(error?.message||'cloud confirmation missing'));
  results.push({id:data.id,title:data.title});
  if(typeof onProgress==='function')onProgress(results.length,chosen.length);
 }
 return results;
}
function validateDocument(doc){
 return valid(doc)&&doc.chapters.every(chapter=>safeMarkup(chapter.html));
}
window.DDResearchZipRestore=Object.freeze({inspect,restore,valid,validateDocument});
})();

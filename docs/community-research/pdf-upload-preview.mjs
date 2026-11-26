// Loopback-only manual PDF review. No upload or publication endpoint.
// Original bytes stay in memory. Canvas rendering is not a malware verdict.
const MAX_BYTES=5_000_000,MAX_PAGES=100,MAX_POINTS=14400;
const loopback=()=>['127.0.0.1','localhost'].includes(location.hostname)&&['http:','https:'].includes(location.protocol);
const categories=['Case analysis','Document analysis','Scientific research','Historical research','FOIA research','Other research'];
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value);if(cls)n.className=cls;return n};
const btn=(label,action)=>{const b=el('button',label,'outline');b.type='button';b.onclick=action;return b};
const has=value=>value instanceof Map||value instanceof Set?value.size>0:Array.isArray(value)?value.length>0:value&&typeof value==='object'?Object.keys(value).length>0:!!value;
const finitePage=v=>Number.isFinite(v.width)&&Number.isFinite(v.height)&&v.width>0&&v.height>0&&v.width<=MAX_POINTS&&v.height<=MAX_POINTS;
async function bytesOf(file){
 if(!file||typeof file.name!=='string'||!/\.pdf$/i.test(file.name)||!['','application/pdf','application/octet-stream'].includes(file.type))throw Error('Choose a PDF document.');
 if(file.size<16||file.size>MAX_BYTES)throw Error('The PDF must be no larger than 5 MB.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes.length!==file.size||bytes.length>MAX_BYTES)throw Error('The selected file changed.');
 const text=new TextDecoder('latin1');
 if(!/^%PDF-(?:1\.[0-7]|2\.0)(?:\r|\n)/.test(text.decode(bytes.slice(0,16))))throw Error('This file does not have a valid PDF header.');
 const tail=text.decode(bytes.slice(-2048));
 if(!/%%EOF[\x00\x09\x0a\x0c\x0d\x20]*$/.test(tail))throw Error('This PDF is incomplete or has unexpected trailing content.');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 return {bytes,hash,size:file.size,name:file.name.slice(0,200)};
}
let library;
async function pdfLibrary(){
 if(!loopback())throw Error('PDF development review is available only on this device.');
 if(!library){
  library=import('/node_modules/pdfjs-dist/build/pdf.mjs').then(pdf=>{
   if(pdf.version!=='6.5.438')throw Error('Unexpected PDF preview library version.');
   pdf.GlobalWorkerOptions.workerSrc=new URL('/node_modules/pdfjs-dist/build/pdf.worker.mjs',location.origin).href;
   return pdf;
  });
  library.catch(()=>{library=null});
 }
 return library;
}
function timed(promise,ms,onTimeout){
 let timer;
 return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>{
  try{onTimeout?.()}catch{}reject(Error('PDF preview exceeded the local processing limit.'));
 },ms)})]).finally(()=>clearTimeout(timer));
}
async function checkDocument(pdfDoc,alive){
 if(!Number.isInteger(pdfDoc.numPages)||pdfDoc.numPages<1||pdfDoc.numPages>MAX_PAGES)throw Error('Choose a PDF containing 1–100 pages.');
 if(pdfDoc.isPureXfa)throw Error('Interactive or XFA forms are not allowed in this pilot.');
 const [js,attachments,forms,open,meta]=await Promise.all([pdfDoc.getJSActions(),pdfDoc.getAttachments(),pdfDoc.getFieldObjects(),pdfDoc.getOpenAction(),pdfDoc.getMetadata()]);
 if(!alive())throw Error('Local review closed.');
 if(has(js)||has(attachments)||has(forms)||has(open)||meta?.info?.IsAcroFormPresent||meta?.info?.IsXFAPresent||meta?.info?.EncryptFilterName)throw Error('Interactive actions, forms, embedded files and encrypted PDFs are not allowed.');
 for(let i=1;i<=pdfDoc.numPages;i++){
  if(!alive())throw Error('Local review closed.');
  const p=await pdfDoc.getPage(i),v=p.getViewport({scale:1});
  if(!finitePage(v))throw Error('A page exceeds the supported dimensions.');
  const [pageJs,annotations]=await Promise.all([p.getJSActions(),p.getAnnotations({intent:'any'})]);
  if(has(pageJs)||!Array.isArray(annotations)||annotations.some(a=>a.subtype!=='Link'||has(a.actions)||a.action||a.attachment||
   (a.unsafeUrl&&!/^https:\/\//i.test(a.unsafeUrl))||(a.url&&!/^https:\/\//i.test(a.url))))throw Error('Interactive or unsupported PDF annotations are not allowed.');
 }
}
export function mountPdfReview(host){
 if(!loopback()||!host?.isConnected)throw Error('Local PDF preview unavailable.');
 const panel=el('section',undefined,'dd-profile-card');panel.id='ddCRPdfReview';panel.setAttribute('aria-label','Manual PDF research review');
 panel.style.cssText='margin:12px 0;min-width:0;max-width:100%;overflow-wrap:anywhere';
 const title=el('input');title.type='text';title.maxLength=160;title.className='field';
 const abstract=el('textarea');abstract.rows=3;abstract.maxLength=1500;abstract.className='field';
 const category=el('select');category.className='field';
 for(const c of ['',...categories]){const o=el('option',c||'Choose category');o.value=c;category.append(o)}
 const picker=el('input');picker.type='file';picker.accept='.pdf,application/pdf';picker.className='field';
 const fileInfo=el('p','No PDF selected.','muted small');
 const status=el('p','Choose a PDF for local review.','muted small');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const preview=el('div');preview.hidden=true;
 const canvas=el('canvas');canvas.setAttribute('aria-label','PDF page preview');canvas.style.cssText='display:block;max-width:100%;height:auto;background:#fff;border-radius:6px;border:1px solid #556';
 const pageText=el('p','');
 const previous=btn('Previous PDF page',()=>void renderPage(pageNumber-1)),next=btn('Next PDF page',()=>void renderPage(pageNumber+1));
 const pager=el('div',undefined,'dd-cr-actions');pager.append(previous,pageText,next);
 preview.append(pager,canvas,el('p','Visual preview only. PDF links and actions are not interactive.','muted small'));
 const wrap=(text,input)=>{const label=el('label');label.style.cssText='display:grid;gap:4px;margin:8px 0;min-width:0';label.append(el('span',text),input);return label};
 const rights=el('input');rights.type='checkbox';const privacy=el('input');privacy.type='checkbox';
 const yes=(text,input)=>{const label=el('label');label.style.cssText='display:block;margin:8px 0';label.append(input,document.createTextNode(' '+text));return label};
 const review=btn('Confirm local PDF review',()=>confirmReview());review.disabled=true;
 const result=el('p','');result.setAttribute('role','status');
 const disabled=btn('Upload unavailable until secure scanning is ready',()=>{});disabled.disabled=true;
 const closeButton=btn('Close PDF review',()=>close());
 panel.append(el('h3','Upload Research · PDF'),el('p','Development preview only · PDF up to 5 MB and 100 pages. The original file stays on this device; no scanning, uploading or publication occurs.','muted small'),
  closeButton,wrap('Research title',title),wrap('Research abstract',abstract),wrap('Research category',category),wrap('Select a PDF document',picker),fileInfo,status,
  preview,yes('I have the right to publish this exact PDF.',rights),yes('I reviewed the visible pages and checked for confidential or personal data.',privacy),
  review,result,disabled);
 host.append(panel);
 let generation=0,task=null,doc=null,pdf=null,renderJob=null,selected=null,pageNumber=0,closed=false,busy=false;
 const viewed=new Set();
 const active=g=>!closed&&g===generation&&panel.isConnected;
 const update=()=>{
  review.disabled=busy||!selected||!doc||!pageNumber||viewed.size!==doc.numPages||!title.value.trim()||!abstract.value.trim()||!categories.includes(category.value)||!rights.checked||!privacy.checked;
  previous.disabled=busy||!doc||pageNumber<=1;next.disabled=busy||!doc||pageNumber>=doc.numPages;
 };
 const changed=()=>{rights.checked=false;privacy.checked=false;result.textContent='';update()};
 for(const n of [title,abstract,category])n.addEventListener('input',changed);
 for(const n of [rights,privacy])n.addEventListener('input',()=>{result.textContent='';update()});
 function drop(){
  ++generation;renderJob?.cancel();renderJob=null;
  const old=task;task=null;if(old)void old.destroy().catch(()=>{});
  doc=null;pdf=null;selected=null;pageNumber=0;viewed.clear();busy=false;preview.hidden=true;canvas.width=0;canvas.height=0;
  changed();fileInfo.textContent='No PDF selected.';status.textContent='Choose a PDF for local review.';
 }
 function close(){if(closed)return;closed=true;drop();picker.value='';title.value='';abstract.value='';category.value='';panel.remove();}
 picker.onchange=()=>void load(picker.files?.[0]);
 async function load(file){
  drop();if(!file)return;
  const gen=generation;busy=true;update();status.textContent='Checking and rendering the selected PDF…';
  let passwordRequired=false;
  try{
   const source=await bytesOf(file);if(!active(gen))return;
   const lib=await pdfLibrary();if(!active(gen))return;
   pdf=lib;
   const path=new URL('/node_modules/pdfjs-dist/',location.origin);
   const options={data:source.bytes,stopAtErrors:true,enableXfa:false,disableRange:true,disableStream:true,disableAutoFetch:true,
    isEvalSupported:false,enableScripting:false,useWasm:false,useSystemFonts:false,disableFontFace:true,disableWorkerRendering:true,enableHWA:false,enableWebGPU:false,
    maxImageSize:16_000_000,canvasMaxAreaInBytes:16_000_000,cMapUrl:new URL('cmaps/',path).href,standardFontDataUrl:new URL('standard_fonts/',path).href};
   const loaded=task=lib.getDocument(options);
   // Reject password requests immediately; never prompt for a password.
   let rejectPassword;
   const passwordBlocked=new Promise((_,reject)=>{rejectPassword=reject});
   loaded.onPassword=()=>{passwordRequired=true;rejectPassword(Error('Password-protected PDF'));void loaded.destroy().catch(()=>{})};
   const parsed=await timed(Promise.race([loaded.promise,passwordBlocked]),15000,()=>void loaded.destroy().catch(()=>{}));
   if(!active(gen))return;
   await timed(checkDocument(parsed,()=>active(gen)),20000,()=>void loaded.destroy().catch(()=>{}));
   if(!active(gen))return;
   doc=parsed;selected={name:source.name,size:source.size,hash:source.hash};
   fileInfo.textContent=selected.name+' · '+(selected.size/1_000_000).toFixed(2)+' MB · '+doc.numPages+' page(s)';
   busy=false;await renderPage(1);
   if(active(gen)&&pageNumber===1)status.textContent='Local PDF preview ready. Review all pages before confirming. Not security scanned.';
  }catch(e){if(active(gen)){drop();picker.value='';status.textContent=passwordRequired?'Password-protected PDFs are not allowed.':(e?.message||'PDF could not be previewed.').slice(0,180);}}
  finally{if(active(gen)){busy=false;update();}}
 }
 async function renderPage(number){
  if(closed||!doc||busy||!Number.isInteger(number)||number<1||number>doc.numPages)return;
  const gen=generation;busy=true;update();
  try{
   const page=await doc.getPage(number);if(!active(gen))return;
   const base=page.getViewport({scale:1});if(!finitePage(base))throw Error('Page exceeds supported size.');
   const scale=Math.min(2,1500/base.width,1800/base.height);
   const viewport=page.getViewport({scale});canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   const current=renderJob=page.render({canvas,viewport,annotationMode:pdf.AnnotationMode.DISABLE,background:'#ffffff'});
   await timed(current.promise,15000,()=>current.cancel());
   if(!active(gen))return;
   pageNumber=number;viewed.add(number);pageText.textContent='PDF page '+number+' of '+doc.numPages+' · '+viewed.size+' reviewed';preview.hidden=false;
  }catch{if(active(gen)){drop();picker.value='';status.textContent='PDF page could not be rendered safely for local review.';}}
  finally{if(active(gen)){renderJob=null;busy=false;update();}}
 }
 function confirmReview(){
  if(review.disabled||closed||!selected||!doc)return;
  // Review binds to original bytes and the manually entered metadata only.
  result.textContent='Local PDF review complete: '+title.value.trim()+' · '+category.value+' · '+doc.numPages+' page(s). SHA-256 '+selected.hash+'. Nothing was uploaded.';
 }
 update();
 return {close};
}

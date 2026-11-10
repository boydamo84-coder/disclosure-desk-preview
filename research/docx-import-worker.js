/* Untrusted DOCX conversion stays off the editor thread. No account/network APIs. */
'use strict';
importScripts('./vendor-jszip-3.10.1.js','./vendor-mammoth-1.12.3.js');
self.onmessage=async event=>{
 try{
  const buffer=event.data?.buffer;
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength>14*1024*1024)throw Error('Choose a DOCX smaller than 14 MB.');
  const zip=await self.JSZip.loadAsync(buffer);
  const entries=Object.values(zip.files).filter(entry=>!entry.dir);
  if(!zip.file('[Content_Types].xml')||!zip.file('word/document.xml'))throw Error('This file is not a supported Word document.');
  if(entries.length>4000)throw Error('This Word document contains too many embedded files.');
  let total=0;
  for(const entry of entries){
   const size=entry._data?.uncompressedSize;
   if(!Number.isSafeInteger(size)||size<0||size>16*1024*1024||(total+=size)>64*1024*1024)throw Error('This Word document expands beyond the safe import size.');
  }
  const result=await self.mammoth.convertToHtml({arrayBuffer:buffer},{
   externalFileAccess:false,includeEmbeddedStyleMap:false,
   styleMap:["p[style-name='Title'] => h1:fresh"],
   convertImage:self.mammoth.images.imgElement(async image=>{
    if(!['image/png','image/jpeg'].includes(image.contentType))return {alt:'Unsupported Word image omitted: '+image.contentType};
    const base64=await image.read('base64');
    if(base64.length>7*1024*1024)throw Error('Embedded Word image is too large.');
    return {src:'data:'+image.contentType+';base64,'+base64,alt:'Imported research image'};
   })
  });
  if(result.value.length>16*1024*1024)throw Error('Converted Word content is too large.');
  self.postMessage({value:result.value,messages:result.messages.map(row=>({message:String(row.message).slice(0,600)})).slice(0,15)});
 }catch(error){self.postMessage({error:String(error?.message||'Word import failed.').slice(0,250)})}
};

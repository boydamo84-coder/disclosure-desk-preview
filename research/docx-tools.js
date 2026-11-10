/* Browser DOCX tooling: no server transfer. Verify formatting against original. */
window.DDResearchDocx=(()=>{
'use strict';
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const importWorkerUrl=new URL('./docx-import-worker.js',document.currentScript?.src||location.href).href;
async function convertWord(file){
 if(typeof Worker!=='function')throw Error('This browser cannot safely import Word files. Try a current browser.');
 const buffer=await file.arrayBuffer();
 return new Promise((resolve,reject)=>{
  const worker=new Worker(importWorkerUrl);
  const finish=(error,result)=>{clearTimeout(timer);worker.terminate();error?reject(error):resolve(result)};
  const timer=setTimeout(()=>finish(Error('Word import took too long. Your original file is unchanged.')),30000);
  worker.onmessage=event=>{
   const result=event.data;
   if(result?.error)return finish(Error(result.error));
   if(typeof result?.value!=='string'||result.value.length>16*1024*1024||!Array.isArray(result.messages))return finish(Error('Word conversion could not be verified.'));
   finish(null,result);
  };
  worker.onerror=event=>{event.preventDefault();finish(Error('Word conversion could not finish. Your original file is unchanged.'))};
  worker.postMessage({buffer},[buffer]);
 });
}
async function importFile(file){
 if(!/\.docx$/i.test(file.name)||file.size>14*1024*1024)throw Error('Choose a DOCX smaller than 14 MB');
 const result=await convertWord(file);
 const sanitised=window.DOMPurify.sanitize(result.value,{ALLOWED_TAGS:['p','br','b','strong','i','em','u','h1','h2','h3','ul','ol','li','table','tbody','thead','tr','td','th','a','blockquote','div','span','figure','figcaption','img'],ALLOWED_ATTR:['href','colspan','rowspan','title','src','alt','width','height','data-wne-font-size']});
 const temp=document.createElement('div');temp.innerHTML=sanitised;
 const segments=[],headings=[...temp.querySelectorAll('h1,h2,h3')];
 if(!headings.length)segments.push({id:'docx-1',title:'Section 1',html:sanitised});
 else{
  let current={id:'docx-1',title:'Section 1',html:''};
  for(const node of [...temp.childNodes]){
   if(node.nodeType===1&&/^H[123]$/.test(node.nodeName)){
    if(current.html.trim())segments.push(current);
    current={id:'docx-'+(segments.length+1),title:(node.textContent||'Section').slice(0,150),html:''};
   }else current.html+=node.outerHTML||esc(node.textContent);
  }
  if(current.html.trim()||!segments.length)segments.push(current);
 }
 return {document:{version:2,bookTitle:file.name.replace(/\.docx$/i,'').slice(0,180),chapters:segments,font:'Georgia',size:12},warnings:result.messages.map(x=>x.message).slice(0,15)};
}

function inlineRuns(node){
 const d=window.docx;
 const out=[];
 function visit(n,style={}){
  if(n.nodeType===3){if(n.nodeValue)out.push(new d.TextRun({text:n.nodeValue,...style}));return}
  if(n.nodeType!==1)return;
  const tag=n.tagName.toLowerCase();
  if(tag==='img'){out.push(imageRun(n));return}
  if(tag==='br'){out.push(new d.TextRun({break:1}));return}
  const next={...style};
  if(['b','strong'].includes(tag))next.bold=true;
  if(['i','em'].includes(tag))next.italics=true;
  if(tag==='u')next.underline={};
  if(tag==='span'){
   const selectedSize=n.getAttribute('data-wne-font-size')||'';
   if(/^(10|11|12|13|14|15|16|18|20|22|24)$/.test(selectedSize)){
    // Stored value is CSS px; Word TextRun.size uses half-points.
    next.size=Math.round(Number(selectedSize)*1.5);
   }
  }
  if(['s','del','strike'].includes(tag))next.strike=true;
  if(tag==='a'&&/^https?:\/\//i.test(n.getAttribute('href')||'')){
   const children=[new d.TextRun({text:n.textContent||n.getAttribute('href'),color:'16658A',underline:{}})];
   out.push(new d.ExternalHyperlink({link:n.getAttribute('href'),children}));return;
  }
  for(const child of n.childNodes)visit(child,next);
 }
 for(const child of node.childNodes)visit(child);
 return out.length?out:[new d.TextRun('')];
}
function imageRun(node){
 const src=node.getAttribute('src')||'';
 const m=/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/i.exec(src);
 if(!m)throw Error('Word copy needs embedded PNG/JPEG images. Convert this image before export; no incomplete Word file was downloaded.');
 const bin=atob(m[2]);if(bin.length>5*1024*1024)throw Error('Image too large for Word export.');
 const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
 const width=Math.max(1,Number(node.getAttribute('width'))||360),height=Math.max(1,Number(node.getAttribute('height'))||240);
 const ratio=Math.min(1,500/width,650/height);
 return new window.docx.ImageRun({data:bytes,type:m[1].toLowerCase()==='jpeg'?'jpg':'png',
  transformation:{width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))}});
}
function paragraph(node,heading){
 const d=window.docx;
 const opts={children:inlineRuns(node),spacing:{after:120}};
 if(heading)opts.heading=heading;
 return new d.Paragraph(opts);
}
function tableBlock(node){
 const d=window.docx;
 const rows=[...node.querySelectorAll(':scope > tr, :scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr')];
 if(!rows.length)throw Error('Empty comparison table');
 if(rows.length>300)throw Error('Comparison table has too many rows for safe DOCX export');
 const cols=Math.max(...rows.map(row=>[...row.children].reduce((n,c)=>n+Math.max(1,Number(c.getAttribute('colspan'))||1),0)));
 if(cols>16)throw Error('Comparison table exceeds 16 columns');
 // Default A4/Letter with 1-inch margins has at least ~9,000 twips of
 // writable width. Word must not stretch three equal columns or let long
 // source addresses silently resize the Field column.
 const pageWidth=9000;
 const comparison=cols===3 && /^field$/i.test((rows[0].children[0]?.textContent||'').trim());
 const widths=comparison?[1800,3600,3600]:Array.from({length:cols},(_,i)=>{
  const first=Math.floor(pageWidth/cols);return i===cols-1?pageWidth-first*(cols-1):first;
 });
 const hasHeading=[...rows[0].children].some(c=>c.tagName==='TH');
 const matrix=rows.map((row,rowIndex)=>{
  const cells=[...row.children].filter(n=>/^(TH|TD)$/.test(n.tagName));
  if(cells.some(c=>Number(c.getAttribute('rowspan')||1)>1||Number(c.getAttribute('colspan')||1)>1))
   throw Error('Merged comparison cells require PDF/HTML export; DOCX export stopped without losing data');
  const isHeading=hasHeading&&rowIndex===0;
  const result=Array.from({length:cols},(_,column)=>{
   const cell=cells[column]||document.createElement('span');
   const cellText=isHeading?[new d.TextRun({text:cell.textContent||'',bold:true})]:inlineRuns(cell);
   return new d.TableCell({
    children:[new d.Paragraph({children:cellText,spacing:{before:0,after:0,line:250}})],
    width:{size:widths[column],type:d.WidthType.DXA},
    verticalAlign:d.VerticalAlignTable.TOP,
    shading:isHeading?{fill:'E8EDF2'}:(comparison&&column===0?{fill:'F4F6F8'}:undefined)
   });
  });
  return new d.TableRow({children:result,cantSplit:true,tableHeader:isHeading});
 });
 return new d.Table({
  rows:matrix,
  width:{size:pageWidth,type:d.WidthType.DXA},
  columnWidths:widths,
  layout:d.TableLayoutType.FIXED,
  margins:{top:85,bottom:85,left:110,right:110},
  borders:{
   top:{style:d.BorderStyle.SINGLE,size:4,color:'A8B5BF'},
   bottom:{style:d.BorderStyle.SINGLE,size:4,color:'A8B5BF'},
   left:{style:d.BorderStyle.SINGLE,size:4,color:'A8B5BF'},
   right:{style:d.BorderStyle.SINGLE,size:4,color:'A8B5BF'},
   insideHorizontal:{style:d.BorderStyle.SINGLE,size:4,color:'C4CDD4'},
   insideVertical:{style:d.BorderStyle.SINGLE,size:4,color:'C4CDD4'}
  }
 });
}
function blocks(html){
 const root=document.createElement('div');
 if(String(html||'').includes('<img') && !String(html||'').includes('data:image/'))throw Error('Unsupported image source. Embed a PNG or JPEG image before Word export.');
 root.innerHTML=window.DOMPurify.sanitize(html||'',{ALLOWED_TAGS:['p','br','b','strong','i','em','u','s','h1','h2','h3','ul','ol','li','table','thead','tbody','tfoot','tr','td','th','a','blockquote','div','span','figure','figcaption','img'],ALLOWED_ATTR:['href','colspan','rowspan','title','src','alt','width','height','data-wne-font-size']});
 const d=window.docx,items=[];
 function visit(node){
  if(node.nodeType===3){if(node.textContent.trim())items.push(new d.Paragraph({text:node.textContent}));return}
  if(node.nodeType!==1)return;
  const tag=node.tagName.toLowerCase();
  if(tag==='table'){items.push(tableBlock(node));return}
  if(tag==='img'){
   const src=node.getAttribute('src')||'';
   const m=/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/i.exec(src);
   if(!m)throw Error('This image cannot be exported: only embedded PNG/JPEG data images are supported.');
   const bin=atob(m[2]);if(bin.length>5*1024*1024)throw Error('Image too large for Word export.');
   const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
   const naturalWidth=Number(node.getAttribute('width'))||360,naturalHeight=Number(node.getAttribute('height'))||240;
   const ratio=Math.min(1,500/Math.max(1,naturalWidth),650/Math.max(1,naturalHeight));
   items.push(new d.Paragraph({children:[new d.ImageRun({data:bytes,type:m[1].toLowerCase()==='jpeg'?'jpg':'png',transformation:{width:Math.max(1,Math.round(naturalWidth*ratio)),height:Math.max(1,Math.round(naturalHeight*ratio))}})]}));return;
  }
  if(['p','h1','h2','h3','li','blockquote'].includes(tag)){
   const heading={h1:d.HeadingLevel.HEADING_1,h2:d.HeadingLevel.HEADING_2,h3:d.HeadingLevel.HEADING_3}[tag];
   items.push(paragraph(node,heading));return;
  }
  if(tag==='br'){items.push(new d.Paragraph(''));return}
  for(const child of node.childNodes)visit(child);
 }
 for(const node of root.childNodes)visit(node);
 return items;
}
async function exportFile(doc){
 const d=window.docx;
 if(!d?.Document||!d?.Packer||!d?.Table)throw Error('DOCX export library unavailable');
 if(!doc||!Array.isArray(doc.chapters))throw Error('Invalid research document');
 const contents=[new d.Paragraph({text:String(doc.bookTitle||'Research Document'),heading:d.HeadingLevel.TITLE})];
 for(const section of doc.chapters){
  contents.push(new d.Paragraph({text:String(section.title||'Section'),heading:d.HeadingLevel.HEADING_2}));
  contents.push(...blocks(section.html));
 }
 const word=new d.Document({sections:[{children:contents}]});
 return await d.Packer.toBlob(word);
}
return {importFile,exportFile};
})();

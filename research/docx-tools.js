/* Browser DOCX tooling: no server transfer. Verify formatting against original. */
window.DDResearchDocx=(()=>{
'use strict';
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
async function importFile(file){
 if(!window.mammoth)throw Error('Word import library unavailable');
 if(!/\.docx$/i.test(file.name)||file.size>14*1024*1024)throw Error('Choose a DOCX smaller than 14 MB');
 const result=await window.mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()},{
  convertImage:window.mammoth.images.imgElement(async image=>{
   if(!['image/png','image/jpeg'].includes(image.contentType))return {alt:'Unsupported Word image omitted: '+image.contentType};
   const base64=await image.read('base64');
   return {src:'data:'+image.contentType+';base64,'+base64,alt:'Imported research image'};
  })
 });
 const sanitised=window.DOMPurify.sanitize(result.value,{ALLOWED_TAGS:['p','br','b','strong','i','em','u','h1','h2','h3','ul','ol','li','table','tbody','thead','tr','td','th','a','blockquote','div','span','figure','figcaption','img'],ALLOWED_ATTR:['href','colspan','rowspan','title','src','alt','width','height']});
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
  if(tag==='br'){out.push(new d.TextRun({break:1}));return}
  const next={...style};
  if(['b','strong'].includes(tag))next.bold=true;
  if(['i','em'].includes(tag))next.italics=true;
  if(tag==='u')next.underline={};
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
 const matrix=rows.map(row=>{
  const cells=[...row.children].filter(n=>/^(TH|TD)$/.test(n.tagName));
  if(cells.some(c=>Number(c.getAttribute('rowspan')||1)>1||Number(c.getAttribute('colspan')||1)>1))throw Error('Merged comparison cells require PDF/HTML export; DOCX export stopped without losing data');
  return Array.from({length:cols},(_,i)=>new d.TableCell({children:[paragraph(cells[i]||document.createElement('span'))],shading:cells[i]?.tagName==='TH'?{fill:'E9EEF2'}:undefined}));
 });
 return new d.Table({rows:matrix.map(cells=>new d.TableRow({children:cells})),width:{size:100,type:d.WidthType.PERCENTAGE},borders:{top:{style:d.BorderStyle.SINGLE,size:4,color:'9AA9B5'},bottom:{style:d.BorderStyle.SINGLE,size:4,color:'9AA9B5'},left:{style:d.BorderStyle.SINGLE,size:4,color:'9AA9B5'},right:{style:d.BorderStyle.SINGLE,size:4,color:'9AA9B5'},insideHorizontal:{style:d.BorderStyle.SINGLE,size:4,color:'9AA9B5'},insideVertical:{style:d.BorderStyle.SINGLE,size:4,color:'9AA9B5'}}});
}
function blocks(html){
 const root=document.createElement('div');
 if(String(html||'').includes('<img') && !String(html||'').includes('data:image/'))throw Error('Unsupported image source. Embed a PNG or JPEG image before Word export.');
 root.innerHTML=window.DOMPurify.sanitize(html||'',{ALLOWED_TAGS:['p','br','b','strong','i','em','u','s','h1','h2','h3','ul','ol','li','table','thead','tbody','tfoot','tr','td','th','a','blockquote','div','span','figure','figcaption','img'],ALLOWED_ATTR:['href','colspan','rowspan','title','src','alt','width','height']});
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
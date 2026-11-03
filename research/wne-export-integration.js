/* Export adapter for the EXISTING W.NE Research Edition File menu.
   Uses the last confirmed Supabase save; original Python exporter remains unchanged.
   Images/tables follow the already developed browser DOCX module and regression tests.
*/
(()=>{
'use strict';
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function printDocument(doc){
 const clean=window.DOMPurify?.sanitize;
 if(!clean)throw Error('HTML sanitizer unavailable; PDF export refused');
 const body=doc.chapters.map(c=>'<h2>'+esc(c.title)+'</h2>'+clean(c.html,{ALLOWED_TAGS:['p','br','b','strong','i','em','u','s','blockquote','h1','h2','h3','ul','ol','li','table','thead','tbody','tr','td','th','a','div','span','hr','img','figure','figcaption'],ALLOWED_ATTR:['href','colspan','rowspan','src','alt','width','height']})).join('');
 return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(doc.bookTitle)+'</title><style>@page{size:A4;margin:18mm}*{box-sizing:border-box}body{font:12pt Georgia,serif;margin:0 auto;max-width:920px;padding:26px;background:#081927;color:#ebdfca}header{border-bottom:2px solid #b79a64;padding:6px 0 18px;margin-bottom:28px;display:flex;gap:12px;align-items:center}.monogram{border:1px solid #b79a64;border-radius:7px;padding:10px;font:bold 15px Georgia;color:#d6b47d}.brand{color:#e3c18a;font:700 13px Georgia;letter-spacing:2px}.sub{font:9px Georgia;color:#b7ad97;letter-spacing:1px}h1,h2{color:#dfbd81;break-after:avoid}h1{font-size:24pt}h2{font-size:16pt}a{color:#eed09a;overflow-wrap:anywhere}.dd-comparison-block,figure{border:1px solid #475968;border-radius:9px;padding:12px;margin:18px 0;break-inside:avoid}.dd-comparison-block{background:#10293c}.dd-comparison-block:before{content:"CASE COMPARISON";display:block;color:#dec28d;font:bold 10px Georgia;letter-spacing:2px;margin-bottom:12px}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9pt;overflow-wrap:anywhere}th,td{border:1px solid #4f6a7a;padding:8px;vertical-align:top}th{background:#29495f;color:#e7c990}td{background:#152d3f}img{max-width:100%;height:auto}figcaption{font-size:9pt;color:#c9b68c}@media screen{.print-controls{padding:12px;background:#233d50;margin-bottom:20px}.print-controls button{padding:8px 14px;margin-right:12px}}@media print{body{padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.print-controls{display:none!important}}</style></head><body><div class="print-controls"><button onclick="window.print()">Print / Save as PDF</button><span>Dark report · use your browser print settings to enable background graphics</span></div><header><span class="monogram">DD</span><span><span class="brand">DISCLOSURE DESK</span><br><span class="sub">RESEARCH STUDIO · INVESTIGATION REPORT</span></span></header><h1>'+esc(doc.bookTitle)+'</h1>'+body+'</body></html>';
}
function download(blob,filename){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000)}
window.WNEHostedExport=async path=>{
 const api=window.WNECloudIntegration;
 if(!api?.readSavedDocument)throw Error('Cloud integration is unavailable');
 const doc=await api.readSavedDocument();
 if(path==='/api/research/export-docx'){
  if(!window.DDResearchDocx?.exportFile)throw Error('Word export module unavailable');
  const blob=await window.DDResearchDocx.exportFile(doc);
  download(blob,'WNE-Research-Report.docx');return;
 }
 if(path==='/research-print'){
  const url=URL.createObjectURL(new Blob([printDocument(doc)],{type:'text/html'}));
  const w=window.open(url,'_blank','noopener');
  if(!w){URL.revokeObjectURL(url);throw Error('Allow popups to open the print/PDF preview')}
  setTimeout(()=>URL.revokeObjectURL(url),120000);return;
 }
 throw Error('Unrecognised export');
};
})();

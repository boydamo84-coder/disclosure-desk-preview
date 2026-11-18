/* W.NE Research Edition -> Disclosure Desk community publication PREVIEW only.
 * This never publishes, modifies original research, uploads media or changes cloud permissions.
 * Inserts only in File menu and only on preview/local hosts. No production activation.
 */
(()=>{
 'use strict';
 const host=location.hostname;
 const previewHost=host==='localhost'||host==='127.0.0.1'||/^deploy-preview-\d+--uap-disclosure-desk\.netlify\.app$/.test(host);
 if(!previewHost||window.DD_COMMUNITY_FEATURES?.communityResearchPreview!==true)return;
 const KEY='dd-community-research-preview-copy-v1';
 const MAX_LENGTH=30000;
 const mk=(tag,text)=>{
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=String(text);
  return node;
 };
 function textFromHtml(raw){
  const parser=new DOMParser();
  const doc=parser.parseFromString(String(raw||''),'text/html');
  const out=[],block=new Set(['P','DIV','BR','H1','H2','H3','H4','LI','TR','BLOCKQUOTE']);
  function visit(node){
   if(node.nodeType===Node.TEXT_NODE){out.push(node.nodeValue||'');return}
   if(node.nodeType!==Node.ELEMENT_NODE)return;
   if(['SCRIPT','STYLE','SVG','IMG','IFRAME','FORM','NOSCRIPT'].includes(node.tagName))return;
   if(block.has(node.tagName))out.push('\n');
   for(const child of node.childNodes)visit(child);
   if(block.has(node.tagName))out.push('\n');
  }
  for(const node of doc.body.childNodes)visit(node);
  return out.join('').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
 }
 async function saved(){
  if(typeof window.wneSaveBeforeNavigation!=='function')throw Error('W.NE save check is not available. Stay in the editor.');
  const ok=await window.wneSaveBeforeNavigation('prepare optional community research preview');
  if(ok!==true)throw Error('Save was not confirmed. Remain in W.NE and check your cloud save or backup.');
  if(!window.WNECloudIntegration?.readSavedDocument||!window.WNECloudIntegration?.verifiedOwner)throw Error('W.NE cloud read-back is unavailable.');
  await window.WNECloudIntegration.verifiedOwner();
  const doc=await window.WNECloudIntegration.readSavedDocument();
  if(!doc||!Array.isArray(doc.chapters)||!doc.chapters.length||typeof doc.bookTitle!=='string')throw Error('The saved report could not be verified. No publication copy made.');
  return doc;
 }
 function dialog(){
  let node=document.getElementById('wneCommunityResearchDialog');
  if(node)return node;
  node=mk('dialog');node.id='wneCommunityResearchDialog';node.setAttribute('aria-labelledby','wneCommunityResearchTitle');
  const title=mk('h2','Prepare a Community Research preview');title.id='wneCommunityResearchTitle';
  node.append(title,mk('p','Choose one saved section to copy as plain text. Your original report, images, document history and private account stay unchanged. This is not a public submission.'));
  const label=mk('label','Saved report section');label.htmlFor='wneCommunitySection';
  const select=mk('select');select.id='wneCommunitySection';label.append(select);node.append(label);
  const result=mk('p','');result.id='wneCommunityStatus';result.setAttribute('role','status');node.append(result);
  const row=mk('div');row.className='wne-community-actions';
  const cancel=mk('button','Cancel');cancel.type='button';cancel.onclick=()=>node.close();
  const advance=mk('button','Review publication copy');advance.type='button';advance.id='wneCommunityContinue';advance.className='wne-community-primary';row.append(cancel,advance);node.append(row);
  document.body.append(node);
  const style=mk('style');style.textContent='#wneCommunityResearchDialog{width:min(460px,calc(100vw - 22px));max-height:83dvh;overflow:auto;padding:22px;background:#172c3d;color:#f3f0e9;border:1px solid #d9bd8b;border-radius:15px;box-shadow:0 17px 60px #0009;font:14px/1.55 system-ui}#wneCommunityResearchDialog::backdrop{background:#020d16bd}#wneCommunityResearchDialog h2{color:#f0d7a5;margin:0 0 10px;font-size:22px}#wneCommunityResearchDialog p{color:#c6d4dc;margin-bottom:15px}#wneCommunityResearchDialog label{display:block;color:#f0dcc0;font-weight:700}#wneCommunityResearchDialog select{width:100%;padding:11px;border-radius:9px;background:#081923;color:#f6efe2;margin:7px 0;border:1px solid #8da3b3;min-height:45px}#wneCommunityResearchDialog button{border-radius:9px;min-height:44px;padding:11px 14px;background:#273f50;color:#f0dfc2;border:1px solid #738899;font:700 13px system-ui;cursor:pointer}.wne-community-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}#wneCommunityResearchDialog .wne-community-primary{background:#e2c48f;color:#162737;border-color:#f0d5a0}';
  document.head.append(style);
  return node;
 }
 async function choose(){
  const launch=document.getElementById('wneCommunityPublishMenu');const original=launch.textContent;
  launch.disabled=true;launch.textContent='Checking saved W.NE report…';
  try{
   const doc=await saved();
   const dlg=dialog(),select=document.getElementById('wneCommunitySection');
   select.replaceChildren();
   for(const c of doc.chapters){
    if(!c||typeof c.id!=='string'||typeof c.html!=='string'||typeof c.title!=='string')continue;
    const opt=mk('option',c.title);opt.value=c.id;select.append(opt);
   }
   if(!select.options.length)throw Error('No saved report sections are available.');
   document.getElementById('wneCommunityStatus').textContent='Preview only — not published. Pick a section and review what would be shared.';
   const advance=document.getElementById('wneCommunityContinue');
   advance.onclick=async()=>{
    if(advance.disabled)return;
    advance.disabled=true;
    try{
     // Recheck after the user selected a section; never export an earlier unsaved revision.
     const current=await saved();
     const chosen=current.chapters.find(c=>c.id===select.value);
     if(!chosen||typeof chosen.html!=='string')throw Error('This section changed or is unavailable. Please reopen the menu.');
     const body=textFromHtml(chosen.html);
     if(body.length<150)throw Error('This section is too short for a research paper (minimum 150 characters).');
     if(body.length>MAX_LENGTH)throw Error('This section is longer than 30,000 characters. Split it into a shorter W.NE section before previewing.');
     const title=(current.bookTitle+' — '+chosen.title).slice(0,140);
     const handoff={version:1,createdAt:Date.now(),origin:'wne',title,body};
     const top=window.top;
     if(top.location.origin!==location.origin)throw Error('The Research workspace is not on the same trusted site.');
     top.sessionStorage.setItem(KEY,JSON.stringify(handoff));
     top.location.assign(location.origin+'/community-research.html#compose');
    }catch(err){
     document.getElementById('wneCommunityStatus').textContent=String(err?.message||'Unable to prepare the preview.');
     advance.disabled=false;
    }
   };
   dlg.showModal();
  }catch(err){
   const text=String(err?.message||'Could not verify the saved report.');
   if(window.WNEDialogs?.notice)void window.WNEDialogs.notice(text,{title:'Community preview unavailable'});
   else window.alert(text);
  }finally{launch.disabled=false;launch.textContent=original}
 }
 function mount(){
  const menu=document.getElementById('wne-file-menu');
  if(!menu||document.getElementById('wneCommunityPublishMenu'))return;
  const button=mk('button');button.id='wneCommunityPublishMenu';button.type='button';button.setAttribute('role','menuitem');
  button.append(document.createTextNode('📖 Community Research preview'));
  button.append(mk('small','Make an unsent copy of one saved section · original protected'));
  button.addEventListener('click',()=>{void choose()});
  const protective=[...menu.querySelectorAll('p')].find(x=>x.textContent?.includes('PROTECT YOUR RESEARCH'));
  if(protective)menu.insertBefore(button,protective);
  else menu.append(button);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
 window.DDWNECommunityPreview=Object.freeze({textFromHtml}); // offline testing helper; no remote publishing
})();
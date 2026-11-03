/* W.NE v0.9.74 — preserve real paragraph / line boundaries in Writer spelling.
 * CSS Custom Highlight never changes editor DOM, preserving formatting and cursor.
 * Hosted Research Edition sends bounded text to the authenticated Supabase spelling relay.
 */
(()=>{'use strict';
const editor=document.getElementById('editor');
const select=document.getElementById('wne-language');
const toggle=document.getElementById('wne-spellcheck');
const panel=document.getElementById('wne-spell-panel');
const label=document.getElementById('wne-spell-word');
const options=document.getElementById('wne-spell-choices');
const add=document.getElementById('wne-spell-add');
const dismiss=document.getElementById('wne-spell-dismiss');
const bar=document.getElementById('wne-language-bar');
if(!editor||!select||!toggle||!panel||!bar)return;
const supportsHighlight=Boolean(window.CSS&&CSS.highlights&&window.Highlight&&window.Range);
const status=document.createElement('span');status.id='wne-spell-status';status.setAttribute('role','status');
const retry=document.createElement('button');retry.type='button';retry.textContent='↻ Recheck writing';
retry.title='Retry LanguageTool writing checks';retry.style.cssText='padding:5px 8px;border-radius:7px;border:1px solid #a9926d;background:transparent;color:inherit;font-size:12px';
bar.append(status,retry);
let matches=[],timer=0,generation=0,selected=null,requestActive=false,serviceUnavailable=false;
function statusMessage(message){status.textContent=message;}
function clearHighlights(){if(supportsHighlight){CSS.highlights.delete('wne-spelling');CSS.highlights.delete('wne-grammar');CSS.highlights.delete('wne-punctuation');}matches=[];}
function hidePanel(){panel.hidden=true;selected=null;}
function enabled(){return toggle.checked && ['en-GB','en-US'].includes(select.value) && editor.getAttribute('contenteditable')==='true';}
function nodes(){const list=[],walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);while(walker.nextNode())list.push(walker.currentNode);return list;}
// Writer's contenteditable stores Enter as <div>/<p>/<br> boundaries.
// element.textContent silently joins adjacent blocks ("shop" + "Dr" => "shopDr").
// Build a *read-only* spelling snapshot that includes these visible line breaks.
// Track each text node's virtual and original UTF-16 offsets, so no extra
// newlines are ever inserted into the manuscript or into the correction range.
function spellingSnapshot(){
  let text='',rawPosition=0;const spans=[];
  const block=/^(?:DIV|P|LI|UL|OL|BLOCKQUOTE|H[1-6]|PRE|SECTION|ARTICLE|TABLE|TR|TD)$/;
  function lineBreak(){if(text.length&&!text.endsWith('\n'))text+='\n';}
  function walk(node){
    if(node.nodeType===Node.TEXT_NODE){
      const value=node.nodeValue||'';
      if(value){const vStart=text.length;text+=value;
        spans.push({vStart,vEnd:text.length,rStart:rawPosition,rEnd:rawPosition+value.length});}
      rawPosition+=value.length;return;
    }
    if(node.nodeType!==Node.ELEMENT_NODE)return;
    if(node.tagName==='BR'){lineBreak();return;}
    const isBlock=node!==editor&&block.test(node.tagName);
    if(isBlock)lineBreak();
    for(const child of node.childNodes)walk(child);
    if(isBlock)lineBreak();
  }
  for(const child of editor.childNodes)walk(child);
  return {text,raw:editor.textContent||'',spans};
}
function mapSpellingMatch(item,snapshot){
  const a=snapshot.spans.find(s=>item.start>=s.vStart&&item.start<s.vEnd);
  const b=snapshot.spans.find(s=>item.end>s.vStart&&item.end<=s.vEnd);
  if(!a||!b)return null;
  const start=a.rStart+item.start-a.vStart;
  const end=b.rStart+item.end-b.vStart;
  // Reject a match that traverses a visually separate paragraph / line.
  if(start<0||end<=start||snapshot.raw.slice(start,end)!==item.word)return null;
  return {...item,start,end};
}
function atOffset(index,all,preferNext=false){let cursor=0;for(let i=0;i<all.length;i++){const n=all[i],end=cursor+n.nodeValue.length;if(index>=cursor&&(index<end||(index===end&&(!preferNext||i===all.length-1))))return {node:n,index:index-cursor};cursor=end;}return null;}
function makeRange(first,last,all){const a=atOffset(first,all,true),b=atOffset(last,all,false);if(!a||!b)return null;try{const r=document.createRange();r.setStart(a.node,a.index);r.setEnd(b.node,b.index);return r;}catch{return null;}}
function paint(snapshot,items){clearHighlights();if(!enabled()||editor.textContent!==snapshot.raw)return;
  const all=nodes(),valid=[],ranges={Spelling:[],Grammar:[],Punctuation:[]};
  for(const item of items){if(!Number.isInteger(item.start)||!Number.isInteger(item.end)||item.start<0||item.end<=item.start||item.end>snapshot.text.length)continue;
    if(snapshot.text.slice(item.start,item.end)!==item.word)continue;
    const mapped=mapSpellingMatch(item,snapshot);
    if(!mapped)continue;
    const r=makeRange(mapped.start,mapped.end,all);if(!r||r.toString()!==mapped.word)continue;
    const category=['Spelling','Grammar','Punctuation','Style'].includes(mapped.category)?mapped.category:'Spelling';
    valid.push({...mapped,category});ranges[category==='Style'?'Grammar':category].push(r);
  }
  matches=valid;
  if(supportsHighlight){
    if(ranges.Spelling.length)CSS.highlights.set('wne-spelling',new Highlight(...ranges.Spelling));
    if(ranges.Grammar.length)CSS.highlights.set('wne-grammar',new Highlight(...ranges.Grammar));
    if(ranges.Punctuation.length)CSS.highlights.set('wne-punctuation',new Highlight(...ranges.Punctuation));
  }
  statusMessage(`${matches.filter(m=>m.category==='Spelling').length} spelling · ${matches.filter(m=>m.category==='Grammar').length} grammar · ${matches.filter(m=>m.category==='Punctuation').length} punctuation · ${matches.filter(m=>m.category==='Style').length} style`);
}
function schedule(ms=700,retain=false){clearTimeout(timer);generation++;if(!retain)clearHighlights();hidePanel();
  if(!toggle.checked){statusMessage('Spellcheck off');return;}
  if(!['en-GB','en-US'].includes(select.value)){statusMessage('Browser dictionary for this language');return;}
  if(!supportsHighlight){statusMessage('Coloured underlines unsupported in this browser; native spelling remains enabled');return;}
  if(serviceUnavailable){statusMessage('LanguageTool not ready — tap ↻ Check spelling');return;}
  if(editor.getAttribute('contenteditable')!=='true'){statusMessage('Waiting for Writer to unlock');return;}
  const snapshot=spellingSnapshot();if(snapshot.text.length<2){statusMessage('Ready · checks as you type');return;}
  const gen=generation;const language=select.value;
  timer=setTimeout(()=>scan(snapshot,language,gen,retain),ms);
}
async function scan(snapshot,language,gen,retain){
  // Keep background typing snappy. Do not spam multiple LanguageTool calls.
  if(requestActive){if(gen===generation)schedule(300,retain);return;}
  requestActive=true;statusMessage('Checking writing securely…');
  const limited=snapshot.text.slice(0,4000);
  try{
    const response=await fetch('/api/writer/live-spelling',{method:'POST',credentials:'same-origin',cache:'no-store',
       headers:{'Content-Type':'application/json'},body:JSON.stringify({text:limited,language})});
    const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||'Spelling service unavailable');
    if(gen!==generation||!enabled()||editor.textContent!==snapshot.raw||spellingSnapshot().text!==snapshot.text||select.value!==language)return;
    paint(snapshot,result.matches||[]);
    if(snapshot.text.length>4000)statusMessage(`${matches.length} findings · first 4,000 characters checked`);
  }catch(err){if(gen!==generation)return;
    serviceUnavailable=true;clearHighlights();statusMessage('LanguageTool unavailable · tap ↻ to retry');
  }finally{requestActive=false;}
}
function caretAtPoint(x,y){
  try{
    if(document.caretRangeFromPoint){const r=document.caretRangeFromPoint(x,y);if(r)return {node:r.startContainer,index:r.startOffset};}
    if(document.caretPositionFromPoint){const p=document.caretPositionFromPoint(x,y);if(p)return {node:p.offsetNode,index:p.offset};}
  }catch{}
  return null;
}
function globalOffset(at){if(!at||!editor.contains(at.node))return -1;let n=0;
  for(const node of nodes()){if(node===at.node)return n+at.index;n+=node.nodeValue.length;}
  return -1;
}
function show(item){selected={...item,snapshot:editor.textContent};label.textContent=`${item.category||'Spelling'} · ${item.word}`;options.replaceChildren();
  const explanation=panel.querySelector('p');if(explanation)explanation.textContent=item.message||'Suggestions from LanguageTool. Nothing changes without your approval.';
  for(const replacement of item.suggestions||[]){const btn=document.createElement('button');btn.type='button';btn.className='wne-spell-suggestion';btn.textContent=replacement;
    btn.addEventListener('click',()=>replace(item,replacement));options.append(btn);}
  if(!options.childElementCount){const p=document.createElement('span');p.textContent='No suggested replacement; edit the word manually.';options.append(p);}
  panel.hidden=false;
}
let wneCorrecting=false;

function retainOtherHighlights(item,replacement,before){
  const expected=before.slice(0,item.start)+replacement+before.slice(item.end);
  if(editor.textContent!==expected){
    clearHighlights();
    return false;
  }

  const delta=replacement.length-(item.end-item.start);
  const all=nodes(),kept=[],ranges={Spelling:[],Grammar:[],Punctuation:[]};

  for(const m of matches){
    if(m===item || (m.start<item.end && m.end>item.start))continue;

    const shift=m.start>=item.end?delta:0;
    const next={...m,start:m.start+shift,end:m.end+shift};
    const range=makeRange(next.start,next.end,all);

    if(!range || range.toString()!==next.word){
      clearHighlights();
      return false;
    }

    kept.push(next);
    ranges[['Grammar','Style'].includes(next.category)?'Grammar':next.category==='Punctuation'?'Punctuation':'Spelling'].push(range);
  }

  matches=kept;
  for(const [category,key] of [['Spelling','wne-spelling'],['Grammar','wne-grammar'],['Punctuation','wne-punctuation']]){
    if(ranges[category].length)CSS.highlights.set(key,new Highlight(...ranges[category]));
    else CSS.highlights.delete(key);
  }
  return true;
}

function replace(item,replacement){
  if(!selected||!enabled()||editor.textContent!==selected.snapshot){hidePanel();schedule(0);return;}
  const r=makeRange(item.start,item.end,nodes());if(!r||r.toString()!==item.word){hidePanel();schedule(0);return;}
  editor.focus({preventScroll:true});const selection=window.getSelection();selection.removeAllRanges();selection.addRange(r);
  // Browser edit command sends an input event, so Writer's existing autosave,
  // character formatting and undo chain remain in control of the edit.
  const before=editor.textContent;
  let edited=false;
  wneCorrecting=true;
  try{
    edited=document.execCommand('insertText',false,replacement);
  }finally{
    wneCorrecting=false;
  }

  hidePanel();
  if(!edited){
    clearHighlights();
    statusMessage('Could not safely replace text — please type the correction manually');
    schedule(0);
    return;
  }

  lastText=editor.textContent||'';
  const retained=retainOtherHighlights(item,replacement,before);
  schedule(150,retained);
}
editor.addEventListener('click',(event)=>{
  if(!matches.length||!enabled()||!supportsHighlight)return;
  const point=caretAtPoint(event.clientX,event.clientY),pos=globalOffset(point);
  const choice=matches.find(m=>pos>=m.start&&pos<=m.end);
  if(choice)show(choice);else hidePanel();
});
editor.addEventListener('input',()=>{if(!wneCorrecting)schedule(700)});
editor.addEventListener('compositionstart',()=>{clearTimeout(timer);generation++;clearHighlights();hidePanel()});
editor.addEventListener('compositionend',()=>schedule(850));
select.addEventListener('change',()=>{serviceUnavailable=false;schedule(400)});
toggle.addEventListener('change',()=>{serviceUnavailable=false;schedule(400)});
retry.addEventListener('click',()=>{serviceUnavailable=false;schedule(0)});
dismiss.addEventListener('click',hidePanel);
add.addEventListener('click',async()=>{
  const item=selected;if(!item)return;
  try{
    const response=await fetch('/api/proofread/dictionary',{method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'add',word:item.word})});
    const payload=await response.json();if(!response.ok||!payload.ok)throw Error(payload.error||'Dictionary not saved');
    hidePanel();serviceUnavailable=false;schedule(100);statusMessage(`Added “${item.word}” to personal dictionary`);
  }catch(err){statusMessage(err.message||'Dictionary error');}
});
// Switching chapters replaces editor contents outside input events.
// A MutationObserver notices only changes to actual chapter text, not CSS highlights.
let lastText='';const observer=new MutationObserver(()=>{
  const current=editor.textContent;
  if(current!==lastText){lastText=current;schedule(700);}
});
observer.observe(editor,{childList:true,characterData:true,subtree:true});
setTimeout(()=>{lastText=editor.textContent||'';schedule(500)},1200);
})();

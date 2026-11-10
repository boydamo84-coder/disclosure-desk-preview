/* M70: one shared visual/action ordering contract for existing community rails.
 * Re-uses actual bound controls — never fabricates votes, comments or actions.
 * All existing RPC/auth, save-to-Board, Share, Reply and moderation handlers
 * remain owned by their modules; moving DOM nodes preserves those listeners.
 */
(()=>{'use strict';
const selector='.dd-action-rail, .dd-witness-action-rail';
const ranks=Object.freeze({vote:0,comments:1,board:2,share:3,extra:4,reply:5,spacer:6});
function role(node){
 if(!node?.matches)return 'extra';
 if(node.matches('.dd-forum-spacer'))return 'spacer';
 if(node.matches('.dd-community-votes,.dd-forum-votes,[data-news-article-votes],.dd-news-article-vote-controls,.dd-forum-vote,.dd-community-vote-button,.dd-news-article-vote-button'))return 'vote';
 if(node.matches('.dd-inline-comments-toggle,.dd-forum-comments-action,.dd-hearing-comments-toggle,[data-clip-action="discuss"],[data-discuss-archive],[data-news-discussion],#ddCommentsToggle'))return 'comments';
 if(node.matches('.dd-action-board,.dd-forum-star-action,.dd-case-bookmark,[data-save-archive],[data-save-news]'))return 'board';
 if(node.matches('.dd-action-share,.dd-forum-share-action,[data-share-news],[data-share-archive]'))return 'share';
 if(node.matches('.dd-comment-reply-button,.dd-forum-reply-action'))return 'reply';
 return 'extra';
}
function normalise(rail){
 if(!rail?.isConnected||!rail.matches(selector))return;
 rail.classList.add('dd-unified-rail');
 if(rail.matches('.dd-witness-action-rail'))rail.classList.add('dd-action-rail');
 rail.dataset.ddRailType=rail.closest('.dd-comment-card,.dd-forum-reply-card')?'comment':'post';
 if(!rail.hasAttribute('role'))rail.setAttribute('role','group');
 if(!rail.hasAttribute('aria-label'))rail.setAttribute('aria-label',
  rail.dataset.ddRailType==='comment'?'Comment actions':'Post actions');
 const children=Array.from(rail.children);
 const ordered=children.map((el,i)=>({el,i,slot:role(el)}))
  .sort((a,b)=>ranks[a.slot]-ranks[b.slot]||a.i-b.i);
 for(const item of ordered)item.el.dataset.ddActionSlot=item.slot;
 if(ordered.some((item,i)=>item.el!==children[i])){
  // Mutating the DOM is safe: original button objects and listeners are reused.
  // Do not replaceChildren/innerHTML here: drafts, votes and pending actions live.
  for(const item of ordered)rail.appendChild(item.el);
 }
}
const pending=new Set();let scheduled=false;
function flush(){scheduled=false;const rails=Array.from(pending);pending.clear();for(const rail of rails)normalise(rail)}
function queue(rail){
 if(!rail?.matches?.(selector))return;
 pending.add(rail);
 if(!scheduled){scheduled=true;Promise.resolve().then(flush)}
}
function scan(root){
 if(!root)return;
 if(root.matches?.(selector))queue(root);
 root.querySelectorAll?.(selector).forEach(queue);
}
function init(){
 scan(document);
 const observer=new MutationObserver(records=>{
  for(const record of records){
   const root=record.target;
   queue(root?.closest?.(selector));
   for(const item of record.addedNodes){
    if(item.nodeType!==1)continue;
    scan(item);
    queue(item.parentElement?.closest?.(selector));
   }
  }
 });
 observer.observe(document.body,{childList:true,subtree:true});
}
window.DDUnifiedActionRails=Object.freeze({normalise,role,scan});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();

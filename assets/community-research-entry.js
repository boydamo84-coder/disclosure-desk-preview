/* M01: preview-only bridge in existing Discussions. Never add or replace a dock tab. */
(()=>{
 'use strict';
 function mount(){
  const card=document.getElementById('ddForumCommunityResearchLink');
  if(!card)return;
  const ready=window.DD_COMMUNITY_FEATURES?.communityResearchPreview===true
   &&(location.hostname==='localhost'||location.hostname==='127.0.0.1'
      ||/^deploy-preview-\d+--uap-disclosure-desk\.netlify\.app$/.test(location.hostname));
  card.hidden=!ready;
  card.style.display=ready?'flex':'none';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
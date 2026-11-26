'use strict';
// Development-only adapter. A caller must supply a freshly fetched PUBLIC row.
// Never transfer a private draft, moderation record, attachment or arbitrary URL.
(function(root){
 const canonical='https://uapdisclosuredesk.com/';
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 function source(row){
  if(!row||row.status!=='published'||!uuid.test(String(row.id||'')))throw Error('Published research is unavailable');
  if(!Number.isInteger(row.version_no)||row.version_no<1||row.version_no>100)throw Error('Invalid publication version');
  const title=typeof row.title==='string'?row.title.trim():'';
  const author=typeof row.author_label==='string'?row.author_label.trim():'';
  if(!title||title.length>160||!author||author.length>80)throw Error('Invalid public research metadata');
  const url=new URL(canonical);url.searchParams.set('dd_tab','communityResearchPage');url.searchParams.set('dd_publication',row.id.toLowerCase());
  const label=title+' · v'+row.version_no;
  return Object.freeze({id:row.id.toLowerCase(),title:label.slice(0,160),boardTitle:label.slice(0,120),url:url.href,publisher:author+' · Community Research'});
 }
 async function transfer(id,action,adapters){
  if(!uuid.test(String(id||'')))throw Error('Invalid publication ID');
  if(!['board','citation','share'].includes(action))throw Error('Invalid research action');
  if(!adapters||typeof adapters.fetchPublic!=='function'||typeof adapters[action]!=='function')throw Error('Research action unavailable');
  const row=await adapters.fetchPublic(id.toLowerCase());
  const record=source(row);
  if(record.id!==id.toLowerCase())throw Error('Publication identity mismatch');
  const result=await adapters[action](record);
  if(result===false)throw Error('Research action could not be completed');
  return record;
 }
 const api=Object.freeze({source,transfer});
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DDCommunityResearchTransfer=api;
})(typeof window==='undefined'?null:window);

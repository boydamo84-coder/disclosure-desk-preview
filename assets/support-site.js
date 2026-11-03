/* Disclosure Desk - voluntary Ko-fi support, dormant until a real owner profile exists.
 * No Ko-fi account has yet been created. Do not invent donation addresses.
 * No payment capture or third-party iframe in Disclosure Desk.
 */
(()=>{'use strict';
const VERIFIED_KOFI_PAGE_URL=''; // Set only to user-confirmed active Ko-fi creator profile.
function validateSupportUrl(input){
 if(!input||typeof input!=='string')return null;
 try{
  const url=new URL(input);
  if(url.protocol!=='https:'||url.hostname!=='ko-fi.com'||url.username||
     url.password||url.search||url.hash||
     !/^\/[a-z0-9_-]{3,60}\/?$/i.test(url.pathname))return null;
  return url.origin+url.pathname.replace(/\/$/,'');
 }catch{return null;}
}
function link(label,url){
 const a=document.createElement('a');a.textContent=label;a.href=url;
 a.className='outline';a.target='_blank';a.rel='noopener noreferrer';return a;
}
function initialise(){
 const url=validateSupportUrl(VERIFIED_KOFI_PAGE_URL);
 if(!url)return; // Never show fake links or a nonfunctional donate action.
 const header=document.querySelector('header.top');
 if(header){
  const support=link('☕ Support',url);
  support.classList.add('dd-header-support');
  support.setAttribute('aria-label','Support Disclosure Desk voluntarily on Ko-fi');
  support.title='Voluntary support · Ko-fi';
  const word=document.createElement('span');
  word.className='dd-support-word';
  word.textContent='Support';
  support.replaceChildren(document.createTextNode('☕ '),word);
  const profile=header.querySelector('#ddProfileShortcut');
  if(profile)profile.before(support);else header.append(support);
 }
 const footer=document.querySelector('.dd-site-footer-actions');
 if(footer)footer.append(link('☕ Support Disclosure Desk',url));
 const about=document.querySelector('#about .section');
 if(!about)return;
 const card=document.createElement('div');card.className='card';
 const body=document.createElement('div');body.className='card-body';
 const tag=document.createElement('div');tag.className='tag';
 tag.textContent='VOLUNTARY · INDEPENDENT RESEARCH';
 const heading=document.createElement('h3');
 heading.textContent='Help keep Disclosure Desk independent';
 const copy=document.createElement('p');
 copy.textContent='If the research tools are useful, you can voluntarily support the project. All research tools remain free and contributions never grant special privileges.';
 body.append(tag,heading,copy,link('☕ Support on Ko-fi',url));
 card.append(body);about.append(card);
}
window.DDSupportSite=Object.freeze({validateSupportUrl});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialise);
else initialise();
})();
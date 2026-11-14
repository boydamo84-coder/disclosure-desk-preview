/* Disclosure Desk M10 — contextual page help. Public-only, no storage or tracking. */
(function(){
 'use strict';
 if(window.DDPageHelp)return;
 const topics={
 discover:{title:'News and discoveries',guide:'news',tour:'basics',steps:['Search headlines or choose a news view, then open the original publisher.','Use a star to save a useful source for private Board research.','Check event dates, publication dates and corrections separately.']},
 archivePage:{title:'Evidence Archive',guide:'archive',tour:'evidence',steps:['Search by case, year or publisher. Open a case to inspect its source links.','Use Case Connections and Compare as research leads, not proof cases are related.','Expand Evidence DNA for source statements, the Source Lineage Desk, Contradiction Radar and a documented relationship graph. Check each original page.']},
 researchStudio:{title:'W.NE Research Studio',guide:'studio',tour:'studio',steps:['Choose your signed-in research workspace or the guest preview.','Organise reports with original sources and citations.','Export and verify a private backup before relying on the beta.']},
 mapPage:{title:'Disclosure Map',guide:'map',tour:'basics',steps:['Choose map and year filters to explore published records.','Open a pin for its public case and linked source.','Pin positions are approximate; never infer a witness address.']},
 livePage:{title:'LIVE hearings',guide:'videos',tour:'community',steps:['Find official upcoming or archived hearing records.','Open the original hearing source to check schedules and recordings.','Comments and archived chat are not evidence of the testimony being true.']},
 clips:{title:'Videos',guide:'videos',tour:'basics',steps:['Browse and filter videos, then review the original uploader.','Check context, recording date and whether a clip is edited.','Use comments to discuss—not to verify—claims.']},
 boards:{title:'Investigation Boards',guide:'boards',tour:'research',steps:['Create a private collection for each investigation.','Save cases, links, dated notes and explicit uncertainties.','Confirm local/cloud storage and make a tested backup.']},
 witness:{title:'Witness reports',guide:'witness',tour:'community',steps:['Record your observations with date and approximate town.','Do not include precise locations or anyone’s private details.','Review carefully before choosing to publish.']},
 watchRead:{title:'Watch & Read',guide:'videos',tour:'basics',steps:['Browse documentaries, books and podcasts.','Use publisher links to check original descriptions.','Distinguish a documentary’s argument from independently checked evidence.']},
 profilePage:{title:'Profile and Research Hub',guide:'profile',tour:'safety',steps:['Manage your public display name and chat preferences.','Review your private Boards and account settings.','Check backups before changing or deleting information.']},
 hub:{title:'Explore Disclosure Desk',guide:'start',tour:'basics',steps:['Pick a research workflow or browse the searchable handbook.','Use the tours to learn News, Archive, W.NE and community tools.','Use the ⓘ control at the top of any page for contextual help.']},
 discussionsPage:{title:'Community Discussions',guide:'community',tour:'community',steps:['Read the combined feed or browse discussion sections.','Filter Popular, New or Top, or star favourite subjects.','Cite sources and respect the community rules.']},
 chatPage:{title:'Private Chat',guide:'community',tour:'community',steps:['Start a conversation request with another member.','People can accept or decline; protect private information.','Change discoverability and request settings in Profile.']},
 cases:{title:'Case explorer',guide:'archive',tour:'evidence',steps:['Browse case cards and read the original references.','Save records to a private Investigation Board.','Do not confuse similar descriptions with confirmed connections.']},
 rabbitHole:{title:'Research pathways',guide:'workflows',tour:'research',steps:['Choose a topic or question to explore.','Keep original sources and interpretations distinct.','Save research leads to a Board for later checking.']},
 resources:{title:'Source documents',guide:'archive',tour:'evidence',steps:['Open official document collections and reference pages.','Check the date, author, collection and reference number.','A public listing confirms a record, not every claim recorded.']},
 podcasts:{title:'Podcasts',guide:'videos',tour:'basics',steps:['Browse published shows and original episodes.','Identify interviewees and any claims made by the presenter.','Check testimony against original documents where possible.']},
 about:{title:'About Disclosure Desk',guide:'start',tour:'basics',steps:['Learn how the platform separates sourced records from unverified ideas.','Review the privacy and community policies.','Use the help guide or send a research correction.']},
 people:{title:"Who's Who in Disclosure",guide:'people',tour:'evidence',steps:['Search people by name, role or category and open a public profile.','Check the involvement label: testimony, reporting, analysis or later publication.','Follow the linked case and original citation; involvement is not automatic verification.']},
 investigations:{title:'Original research dossiers',guide:'evidence-dna',tour:'evidence',steps:['Choose an original research investigation and read the source ledger.','Separate official documents, reported accounts, explanations and open questions.','Open a linked Archive record for further Evidence DNA tools.']},
 dossier:{title:'Research dossier',guide:'evidence-dna',tour:'evidence',steps:['Read the documented record and check the cited section or report.','Use the link to open the underlying Archive case.','Keep uncertainties and rival explanations visible.']},
 sources:{title:'Public source directory',guide:'archive',tour:'evidence',steps:['Open a government or archive collection by its publisher link.','Record the exact collection or document reference.','A listing is not the same as a confirmed eyewitness report.']},
 guide:{title:'How-to guide',guide:'start',tour:'basics',steps:['Choose a topic using the sidebar or search box.','Follow the worked examples for cases, evidence and private Boards.','Return to your previous page without losing your research.']},
 communityRules:{title:'Community rules',guide:'community',steps:['Check posting, chat, evidence and privacy expectations.','Report inappropriate content without posting private details.','Use original sources and distinguish claims from facts.']},
 privacy:{title:'Privacy',guide:'profile',steps:['Review how local, cloud and account data are handled.','Check what is public before sharing a witness report.','Export and verify backups of important private research.']},
 terms:{title:'Terms and conditions',guide:'start',steps:['Review account, content and moderation terms.','Check rights before reusing others’ articles and images.','Contact the desk with questions about an item.']}
 };
 const staticTopics={'who-is-who':'people','investigations':'investigations','rendlesham-forest-1980':'dossier','roswell-1947':'dossier','sources':'sources','guide':'guide','community-rules':'communityRules','privacy':'privacy','terms':'terms','research-edition':'researchStudio'};
 const names=['discover','archivePage','researchStudio','mapPage','livePage','clips','boards','witness','watchRead','profilePage','hub','discussionsPage','chatPage','cases','rabbitHole','resources','podcasts','about'];
 const style=document.createElement('style');
 style.textContent='.dd-help-bar{display:flex;justify-content:flex-end;align-items:center;min-height:45px;padding:4px 12px 4px 6px;box-sizing:border-box}.dd-help-trigger{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;min-width:40px;padding:7px 11px;background:#162e40;border:1px solid #b99c69;border-radius:22px;color:#f1d49c;font:700 12px/1.25 system-ui,sans-serif;letter-spacing:.1px;cursor:pointer}.dd-help-trigger:hover{background:#24445b}.dd-help-trigger:focus-visible,.dd-help-dialog button:focus-visible,.dd-help-dialog a:focus-visible{outline:3px solid #f6dba7;outline-offset:2px}.dd-help-glyph{display:inline-grid;place-items:center;width:21px;height:21px;border:1.5px solid currentColor;border-radius:100%;font:800 14px/1 Georgia,serif}.dd-help-dialog{position:fixed;inset:0;margin:auto;width:min(94vw,510px);max-width:510px;max-height:min(84dvh,720px);padding:0;border:1px solid #c5a16a;border-radius:17px;overflow:auto;background:#102232;color:#eff4f6;box-shadow:0 25px 75px #000b;font:14px/1.65 system-ui,sans-serif}.dd-help-dialog::backdrop{background:#010912b8}.dd-help-card{padding:23px}.dd-help-card h2{margin:3px 0 10px;font-size:clamp(21px,4vw,27px);color:#f4d49b;line-height:1.25}.dd-help-card h3{margin:15px 0 8px;color:#e8cfab;font-size:14px}.dd-help-card ol{padding-left:23px;margin:10px 0}.dd-help-card li{margin:9px 0;color:#dce7ed}.dd-help-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:17px}.dd-help-actions a,.dd-help-actions button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:9px 13px;border-radius:10px;border:1px solid #a79b80;text-decoration:none;font-weight:700;font-size:12px;color:#f4d49b;background:#1c364a;cursor:pointer}.dd-help-close{float:right;min-width:42px;min-height:42px;border:1px solid #647b8b;border-radius:9px;background:#193345;color:white;cursor:pointer}.dd-help-muted{color:#beced8;font-size:12px}.dd-help-header-control{margin-left:10px;flex:none}.dd-help-header-control.dd-help-trigger{min-width:42px;padding:6px 9px}@media(max-width:430px){.dd-help-bar{padding-right:9px}.dd-help-trigger{font-size:11px}.dd-help-card{padding:17px}.dd-help-dialog{max-height:86dvh}}';
 document.head.append(style);
 const modal=document.createElement('dialog');modal.id='ddPageHelpDialog';modal.className='dd-help-dialog';modal.setAttribute('aria-labelledby','ddPageHelpTitle');
 modal.innerHTML='<div class="dd-help-card"><button class="dd-help-close" type="button" aria-label="Close page help">✕</button><div class="dd-help-muted">DISCLOSURE DESK · PAGE HELP</div><h2 id="ddPageHelpTitle"></h2><p class="dd-help-muted">Quick guide for this page</p><ol id="ddPageHelpSteps"></ol><p class="dd-help-muted">Research tip: a linked source, an eyewitness account and an established fact are different things.</p><div class="dd-help-actions"><a id="ddPageHelpGuide" href="/guide">Read the full guide ↗</a><button id="ddPageHelpTour" type="button">Take a guided tour</button><button class="dd-help-done" type="button">Back to page</button></div></div>';
 document.body.append(modal);
 let returnFocus=null;
 function close(){if(modal.open)modal.close();}
 modal.querySelector('.dd-help-close').addEventListener('click',close);
 modal.querySelector('.dd-help-done').addEventListener('click',close);
 modal.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null});
 modal.addEventListener('click',event=>{if(event.target===modal)close()});
 function open(topic,trigger){
  const data=topics[topic]||topics.discover;
  returnFocus=trigger||document.activeElement;
  modal.querySelector('#ddPageHelpTitle').textContent=data.title;
  const list=modal.querySelector('#ddPageHelpSteps');list.replaceChildren();
  for(const item of data.steps){const li=document.createElement('li');li.textContent=item;list.append(li)}
  modal.querySelector('#ddPageHelpGuide').href='/guide#'+(data.guide||'start');
  const tour=modal.querySelector('#ddPageHelpTour');
  tour.hidden=typeof window.DDStartTour!=='function';
  tour.onclick=()=>{close();window.DDStartTour?.(data.tour||'basics')};
  modal.showModal();modal.querySelector('.dd-help-close').focus();
 }
 function control(topic,compact=false){
  const button=document.createElement('button');button.type='button';
  button.className='dd-help-trigger'+(compact?' dd-help-header-control':'');
  button.setAttribute('aria-label','How to use '+topics[topic].title);
  button.setAttribute('aria-haspopup','dialog');
  button.setAttribute('aria-controls','ddPageHelpDialog');
  const glyph=document.createElement('span');glyph.className='dd-help-glyph';glyph.textContent='i';glyph.setAttribute('aria-hidden','true');
  const copy=document.createElement('span');copy.textContent=compact?'':'How to use';
  button.append(glyph,copy);button.addEventListener('click',()=>open(topic,button));return button;
 }
 let inserted=0;
 // Only the single-page app has these tab IDs. Static guide sections reuse
 // IDs such as boards and witness, but must receive their header help icon.
 if(document.querySelector('.nav .tab'))for(const name of names){
  const section=document.getElementById(name);
  if(!section||section.querySelector(':scope > .dd-help-bar'))continue;
  const bar=document.createElement('div');bar.className='dd-help-bar';
  bar.append(control(name));section.prepend(bar);inserted++;
 }
 const file=location.pathname.split('/').pop().replace(/\.html$/,'');
 const topic=staticTopics[file];
 if(topic&&inserted===0){
  const header=document.querySelector('header');
  if(header){const host=header.querySelector('.top,.top-inner,.top-in')||header;host.append(control(topic,true))}
  else {const bar=document.createElement('div');bar.className='dd-help-bar';bar.append(control(topic));document.body.prepend(bar)}
 }
 const caseHeader=document.querySelector('#archiveCaseDialog .evidence-shell header');
 if(caseHeader)caseHeader.append(control('archivePage',true));
 window.DDPageHelp=Object.freeze({open:topic=>open(topic,null),topics:Object.keys(topics)});
})();

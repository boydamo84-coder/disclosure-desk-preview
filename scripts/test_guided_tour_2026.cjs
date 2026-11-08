'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const archive=fs.readFileSync('assets/live-hearings.js','utf8');
const chat=fs.readFileSync('assets/live-chat.js','utf8');
for(const label of ["id:'community',label:'Community & LIVE'","data-start-tour=\"community\"","title:'Witness reports'","title:'LIVE and archived hearings'","title:'My Research Hub and Profile'","title:'Watch & Read'"])assert.ok(html.includes(label),'Missing updated tour: '+label);
assert.ok(html.indexOf("title:'Videos'")<html.indexOf("title:'LIVE and archived hearings'"),'Videos should precede LIVE in tour');
assert.match(html,/dd-welcome-tour-choice-v2/);
for(const label of ["title:'Historical Satellite Research'","target:'#ddArchiveSatelliteTab'","title:'How-to & FAQ: your researcher handbook'","target:'.dd-explore-guide-link'","title:'Chat & Discussions are in phone beta'"]){
 assert.ok(html.includes(label),'New satellite, guide or beta route is missing from guided tours: '+label);
}
assert.match(html,/href="\/guide\.html"/,'The guide must be reachable from Explore');
assert.match(html,/if\(\$\('appTourDialog'\)\?\.open\|\|document\.querySelector\('dialog\[open\]'\)\)return/,'Welcome prompt must not interrupt an existing modal or tour');
assert.match(html,/if\(!document\.querySelector\('\.tab\[data-tab="discover"\]\.active'\)\)return/,'New-tour invite must not interrupt navigation away from News');
assert.match(archive,/dd_live_events/);
assert.match(archive,/event\.hasArchivedChat&&window\.ddLiveChatMount/);
assert.match(archive,/This recording predates the Disclosure Desk LIVE chat archive/);
assert.match(chat,/dd_public_hearing_chat/);
assert.match(chat,/form\.hidden=archived\|\|!user/);
console.log('PASS: updated full and focused tour, official hearing archive and read-only saved chat');

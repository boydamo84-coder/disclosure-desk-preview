'use strict';
// M90 NO-DEPLOY: the only change is overview partitioning; same Discussions data/actions.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),js=read('assets/community-discussions.js'),css=read('assets/community-polish.css');
const panel=html.indexOf('<div id="ddForumSectionsPane">'),feed=html.indexOf('id="ddForumFeedView"'),directory=html.indexOf('id="ddForumDirectoryView"'),detail=html.indexOf('id="ddForumThreadPane"');
assert(panel>0&&panel<feed&&feed<directory&&directory<detail,'Feed and Sections are separate overview panels before the existing detail pane');
assert.match(html,/<div id="ddForumViewTabs"[^>]+role="tablist"[^>]+aria-label="Discussions overview views">/);
assert.match(html,/id="ddForumFeedTab"[^>]+role="tab"[^>]+aria-selected="true"[^>]+aria-controls="ddForumFeedView"/);
assert.match(html,/id="ddForumSectionsTab"[^>]+role="tab"[^>]+aria-selected="false"[^>]+aria-controls="ddForumDirectoryView"/);
assert.match(html,/id="ddForumDirectoryView" role="tabpanel"[^>]+hidden>/);
assert.match(html,/id="ddForumFeedView" role="tabpanel"/);
assert(html.indexOf('id="ddForumGlobalPanel"')>feed&&html.indexOf('id="ddForumGlobalPanel"')<directory,'Popular feed only in Feed tab');
assert(html.indexOf('id="ddForumSections"')>directory,'Subject directory only in Sections tab');
assert(html.includes('assets/community-discussions.js?v=m89-global-popular-feed&drawer=v1&m90=tabs'),'M90 script cache key preserves prior versions');
assert(html.includes('assets/community-polish.css?v=m74&m80=web-reply-parity&m86=on-demand&m87=news-reply-indent&m89=global-feed&drawer=v1&m90=tabs'),'M90 CSS cache key preserves prior versions');
for(const fragment of ["DD_FORUM_VIEW_KEY='dd-forum-overview-tab-v1:'","function discussionViewKey()","function savedDiscussionView()","function showDiscussionView(","showDiscussionView(savedDiscussionView(),false,false)","showDiscussionView(discussionView,false,false)","localStorage.setItem(discussionViewKey(),next)","aria-selected","'ArrowLeft','ArrowRight','Home','End'"]){
 assert(js.includes(fragment),'Missing remembered/accessible tabs: '+fragment);
}
for(const id of ['ddForumSubjectsMenu','ddForumSubjectsDrawer','ddForumDrawerList','ddForumDrawerFavouriteGroup'])assert(html.includes('id="'+id+'"'),'Drawer unchanged '+id);
for(const name of ['function renderDiscussionCard(','renderDiscussionCard(list,row,true)','renderDiscussionCard(list,row)','function actionsFor(','function openGlobalThread(','function appendReplyCard('])assert(js.includes(name),'Reuse existing cards/comments '+name);
assert(js.includes('let expanded=true; // All available comments appear automatically when opening a post.'),'Nested comments remain auto-open');
for(const marker of ['#discussionsPage .dd-community-view-tabs','#discussionsPage .dd-community-view-tab[aria-selected=true]','#discussionsPage #ddForumFeedView[hidden]','#discussionsPage #ddForumDirectoryView[hidden]'])assert(css.includes(marker),'Missing responsive layout '+marker);
console.log('PASS M90 isolated Feed/Sections tabs, persistent preference, return paths, existing actions, comments and drawer (NO DEPLOY)');

'use strict';
// M89 NO-DEPLOY contract: global forum posts keep existing actions, permissions and comments.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),js=read('assets/community-discussions.js'),css=read('assets/community-polish.css');
const sql=read('supabase/migrations/20261111221500_dd_discussions_global_feed.sql');
assert.match(html,/<div id="ddForumSectionsPane">[\s\S]*?id="ddForumGlobalPanel"/);
assert.match(html,/<select[^>]+id="ddForumGlobalSort"[^>]*>[\s\S]*?<option value="popular">Popular<\/option><option value="new">New<\/option><option value="top">Top<\/option>/);
for(const x of ['id="ddForumGlobalFeed"','id="ddForumGlobalLoadMore"','id="ddForumGlobalStatus"'])assert(html.includes(x),x);
assert.ok(js.includes("rpc('dd_discussions_global_feed',{p_limit:10,p_offset:offset,p_sort:mode})"),'One read-only feed RPC');
assert.ok(js.includes("renderDiscussionCard(list,row,true)")&&js.includes("renderDiscussionCard(list,row)"),'Same exact post cards');
assert.ok(js.includes("if(!section&&isId(row.section_id))await openGlobalThread(row)"),'Comment actions open correct section');
assert.ok(js.includes("await openThread(row); // Existing post detail retains automatic nested replies."),'Existing detail is unchanged');
assert.ok(js.includes('let expanded=true; // All available comments appear automatically when opening a post.'),'Discussions comments auto-open');
assert.ok(js.includes("globalReturn=true")&&js.includes("if(globalReturn){$('ddForumBackSections').click();return}"),'Back to global feed');
assert.ok(js.includes('++globalRequest')&&js.includes('globalRows=[]'),'Account switch invalidates stale result');
assert.ok(css.includes('#discussionsPage .dd-community-global')&&css.includes('#discussionsPage .dd-community-global-subject'));
assert.ok(html.includes('community-discussions.js?v=m89-global-popular-feed'));
assert.match(sql,/where t\.status='published' and s\.status='published'/i);
assert.match(sql,/revoke all on function public\.dd_discussions_global_feed\(integer,integer,text\) from public/i);
assert.match(sql,/grant execute on function public\.dd_discussions_global_feed\(integer,integer,text\) to anon,authenticated/i);
for(const fragment of ["'popular'","'new'","'top'","auth.uid()","t.section_id","dd_forum_votes","dd_forum_replies"]){
 assert.ok(sql.includes(fragment),'SQL must include '+fragment);
}
assert.ok(html.includes('id="ddForumSections"')&&html.includes('id="ddForumSubjectNav"'),'Original subjects preserved');
console.log('PASS M89 global Discussions feed, Popular/New/Top, original actions and auto-open reply flow; NO DEPLOY');

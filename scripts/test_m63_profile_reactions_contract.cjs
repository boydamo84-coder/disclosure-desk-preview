'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('index.html'),hub=read('assets/research-hub.js'),
      css=read('assets/community-polish.css'),
      sql=read('supabase/migrations/20261110150000_profile_reactions_received_m63.sql');
for(const id of ['ddProfileLikesReceived','ddProfileDislikesReceived','ddProfileReactionBreakdown']){
 assert(html.includes('id="'+id+'"'),'Profile includes '+id);
}
assert.match(html,/Community reactions received/);
assert.match(html,/Likes received/);
assert.match(html,/Dislikes received/);
assert.match(html,/assets\/research-hub\.js\?v=m74-branded-confirm/);
assert.match(html,/assets\/community-polish\.css\?v=m74/);
assert.match(css,/\.dd-profile-reactions\{display:flex/);
assert.match(css,/flex-wrap:wrap/,'Reaction row can wrap on narrow screens');
assert.match(html,/<details class="dd-profile-reaction-info">/,'Breakdown stays optional');
assert.doesNotMatch(html,/dd-profile-reaction-grid/,'No large reaction cards');
assert.match(hub,/c\.rpc\('dd_profile_received_reactions'\)/,'Counts must come from the server');
assert.match(hub,/reactionNonce/,'Discard out-of-order responses');
assert.match(hub,/userId!==current/,'Discard responses after account switch');
assert.match(hub,/setInterval\(\(\)=>void refreshReactions\(\),45000\)/,'Refresh while profile is visible');
assert.match(hub,/document\.hidden/,'Do not poll hidden browser tab');
assert.match(hub,/Reaction totals are temporarily unavailable/,'Never invent success/zero on RPC error');
assert.match(hub,/clearReactions\('Sign in to view reactions received/,'Clear previous user totals on sign-out');
assert.match(hub,/post_likes/,'post_likes returned from server');
for(const status of ["t.status='published'","s.status='published'","r.status='published'","c.status='approved'","w.status='published'"]){
 assert(sql.includes(status),'Only approved/public content contributes: '+status);
}
assert.equal((sql.match(/v\.voter_id<>v_actor/g)||[]).length,4,'All four sources exclude self-votes');
assert.match(sql,/Registered account required/);
assert.match(sql,/revoke all on function public\.dd_profile_received_reactions\(\) from public,anon,authenticated;/);
assert.match(sql,/grant execute on function public\.dd_profile_received_reactions\(\) to authenticated;/);
assert.doesNotMatch(sql,/dd_news_article_votes|dd_media_votes|p_user_id/,'News publisher votes and product ratings must not become member likes');
console.log('PASS M63/M64: compact profile row, privacy and lifecycle, fresh server totals, 4 public-only author sources, no self-votes, account isolation, responsive UI, cache bust');

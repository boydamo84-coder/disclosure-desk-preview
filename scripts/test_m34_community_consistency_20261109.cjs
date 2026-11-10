'use strict';
// M34 exact owner UX: consistent bottom article actions + 5-flag moderation.
// Source-only contract; it does not test or mutate real user content.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const page=read('index.html'),news=read('assets/inline-news-comments.js'),
 forum=read('assets/community-discussions.js'),votes=read('assets/community-votes.js'),
 article=read('assets/news-article-votes.js'),live=read('assets/live-chat.js'),
 build=read('scripts/build_public_release.cjs'),
 sql=read('supabase/migrations/20261109044411_dd_news_article_voting_m34_20261109.sql'),
 harden=read('supabase/COMMENT_SECURITY_HARDENING_REVIEW.sql');
assert.match(page,/assets\/news-article-votes\.js/);
assert.match(build,/'news-article-votes\.js'/);
assert.match(page,/class="dd-news-main-actions dd-action-rail"/);
assert.match(page,/data-news-article-votes=/);
assert.doesNotMatch(page,/class="dd-news-tools"/,'Compare now belongs to the single action bar');
assert.match(page,/class="outline dd-news-compare-action" data-compare-news=/,'The Compare action is in the existing news rail');
assert.match(page,/#newsGrid article>\.dd-news-actions>\.dd-news-main-actions/);
assert.match(news,/querySelector\('\.dd-news-main-actions, \.dd-media-actions'\)/);
assert.match(news,/container\.append\(form,entries,message\)/);
assert.match(news,/toggle\.onclick=\(\)=>/);
assert.match(news,/body\.focus\(\{preventScroll:true\}\)/);
assert.match(news,/parent_id:replyingTo\?\.id\|\|null/);
assert.match(forum,/function chooseReply\(target,focusComposer=false\)/);
assert.match(forum,/pane\.after\?\.\(replyForm\)/);
assert.match(forum,/replyForm\.hidden=true/);
assert.match(forum,/submit\.textContent=replyParent\?'Post reply':'Post comment'/);
assert.match(forum,/p_parent_id:parent/);
assert.match(forum,/▲ /);assert.match(forum,/▼ /);
assert.match(votes,/header\.append\(flag\)/);
assert.match(votes,/rail\.append\(reply\)/);
assert.match(live,/meta\.append\(flag\)/);
assert.match(live,/dd-live-chat-messages/);
assert.match(live,/dd-live-chat-form/);
assert.match(live,/const archived=event\.status==='ended'/);
assert.match(page,/id="dd-m34-adjacent-votes"/,'owner-approved adjacent vote style loaded');
assert.match(page,/\.dd-comment-card \.dd-comment-action-rail \.dd-community-votes\{[\s\S]*?flex:0 0 auto!important/,'comment vote pair is a compact left group');
assert.match(page,/\.dd-comment-card \.dd-comment-action-rail \.dd-comment-reply-button\{[\s\S]*?margin-left:auto!important/,'comment Reply at the far right');
assert.match(page,/#newsGrid article \.dd-news-article-vote-controls\{[\s\S]*?justify-content:flex-start!important/,'News article vote pair adjacent');
assert.match(page,/#discussionsPage \.dd-forum-reply-card \.dd-forum-actions>\.dd-forum-reply-action\{[\s\S]*?margin-left:auto!important/,'Discussion reply at far right');
assert.match(page,/\.dd-live-chat-room/);
assert.match(article,/dd_news_article_vote_summary/);
assert.match(article,/dd_news_article_vote_set/);
assert.match(article,/SHA-256/);
assert.match(article,/is_anonymous/);
assert.match(article,/Article voting not yet available/);
assert.match(sql,/enable row level security/);
assert.match(sql,/revoke all on table public\.dd_news_article_votes from public,anon,authenticated/);
assert.match(sql,/p_value not in \(-1,0,1\)/);
assert.match(sql,/Daily article voting limit reached/);
assert.match(harden,/dd_guard_comment_flag/);
assert.match(forum,/dd_discussions_flag/);
assert.doesNotMatch(news,/👍|👎/);
assert.doesNotMatch(forum,/👍|👎/);
assert.doesNotMatch(article,/👍|👎/);
console.log('PASS M34: one News bottom bar with ▲▼, Comments→Post composer, Share, parent Replies, top-right Flags, LIVE chat, isolated vote RPC');

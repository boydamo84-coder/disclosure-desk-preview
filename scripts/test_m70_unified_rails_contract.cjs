'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('index.html'),shared=read('assets/unified-action-rails.js'),css=read('assets/community-polish.css');
const inline=read('assets/inline-news-comments.js'),caseComments=read('assets/case-discussions.js'),votes=read('assets/community-votes.js'),forum=read('assets/community-discussions.js'),watch=read('assets/watch-read.js');
assert.match(html,/unified-action-rails\.js\?v=m70-shared-order/);
assert.match(html,/inline-news-comments\.js\?v=m71-secondary-views/);
assert.match(html,/community-polish\.css\?v=m71/);
assert.match(shared,/Object\.freeze\(\{vote:0,comments:1,board:2,share:3,extra:4,reply:5,spacer:6\}\)/);
for(const type of ['.dd-inline-comments-toggle','.dd-forum-comments-action','.dd-action-board','.dd-forum-star-action','.dd-action-share','.dd-forum-share-action','.dd-comment-reply-button','.dd-forum-reply-action','.dd-community-votes','.dd-forum-vote']){
 assert(shared.includes(type),'Shared rail recognises existing action '+type);
}
assert.match(shared,/rail\.appendChild\(item\.el\)/,'Existing button/listener objects must be reused');
assert.doesNotMatch(shared,/\.innerHTML\s*=|\.replaceChildren\(/,'Never destroy existing forms/votes or old handlers');
assert.match(shared,/MutationObserver/,'Dynamic News/Watch/Archive/Video re-renders need re-normalising');
assert.match(shared,/dd-unified-rail/);
for(const name of ['dd-news-main-actions','dd-forum-actions','dd-comment-action-rail','dd-media-actions','clip-utility-actions','dd-archive-action-rail','dd-witness-action-rail']){
 assert(css.includes(name),'Shared CSS covers '+name);
}
assert.match(css,/M70 — single site-wide action rail/);
assert.match(css,/dd-unified-rail/,'Common style is applied to every normalised rail');
assert.match(css,/dd-comment-action-rail\.dd-action-rail\.dd-unified-rail/);
assert.match(css,/transparent!important/,'Forum/comment replies remain transparent');
assert.match(inline,/body\.rows=1/,'Every news/media comment starts in single-line mode');
assert.match(inline,/Math\.min\(94,Math\.max\(44,body\.scrollHeight\)\)/,'Expands up to three lines');
assert.match(inline,/state\.replyTo/,'Existing target-specific nested Reply preserved');
assert.match(caseComments,/id="ddCaseDiscussionBody"[^>]*rows="1"/,'Case/Hearing dialog uses the same single-line composer');
assert.match(caseComments,/function fitCaseComposer/,'Case replies expand to three lines');
assert.match(css,/#ddCaseDiscussionDialog #ddCaseDiscussionBody/,'Case composer uses shared Reply styling');
assert(html.includes('assets/case-discussions.js?v=m70-reply-parity'),'Case/Hearing current script must bypass stale browser cache');
assert.match(votes,/dd_vote_set/,'Only existing real comment votes');
assert.match(forum,/dd_discussions_vote/,'Discussions continues to use its real voting backend');
assert.match(watch,/dd-media-recommend/,'Title recommendation remains separate from comment/post vote');
assert.doesNotMatch(shared,/dd_vote_set|dd_news_article_vote_set|\.rpc\(/,'Presentation cannot invent/synthesize vote APIs');
console.log('PASS M70 source contract: single action ordering, dynamic controls, preserved handlers, comment composer parity and no fake votes');

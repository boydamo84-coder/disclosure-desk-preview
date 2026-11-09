'use strict';
// Milestone 35 owner-selected site-wide rail: source-contract only, not a live-user test.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const page=read('index.html'),forum=read('assets/community-discussions.js'),
 news=read('assets/inline-news-comments.js'),votes=read('assets/community-votes.js'),
 cases=read('assets/case-discussions.js'),studio=read('research/research-workspace.html'),
 researchNav=read('research/research-site-nav.js');
for(const p of ['assets/community-discussions.js','assets/community-votes.js',
  'assets/inline-news-comments.js','assets/case-discussions.js',
  'assets/news-article-votes.js','research/research-site-nav.js']){
 new vm.Script(read(p),{filename:p});
}
// Exact News card: one star, IN THE bottom bar, not a second Board control.
const start=page.indexOf("$(\'newsGrid\').innerHTML=results.map");
const end=page.indexOf("document.querySelectorAll('.news-headline-link')",start);
assert.ok(start>=0&&end>start,'News card renderer present');
const tpl=page.slice(start,end),bar=tpl.indexOf('dd-news-main-actions dd-action-rail');
assert.ok(bar>0,'News main rail class present');
assert.ok(tpl.indexOf('data-save-news=',bar)>bar,'News Board star is inside the action bar');
assert.ok(tpl.indexOf('data-news-article-votes=',bar)>bar,'News voting begins the action bar');
assert.ok(tpl.indexOf('data-news-article-votes=',bar)<tpl.indexOf('data-save-news=',bar));
assert.ok(tpl.indexOf('data-save-news=',bar)<tpl.indexOf('data-share-news=',bar));
assert.doesNotMatch(tpl.slice(tpl.indexOf('dd-news-tools'),bar),/data-save-news=/,
 'No duplicate News Board button above the bar');
assert.match(tpl,/data-star-icon/);
assert.match(page,/id="dd-m35-one-action-rail"/);
assert.match(page,/#newsGrid article>\.dd-news-actions>\.dd-news-main-actions\.dd-action-rail/);
assert.match(page,/\.dd-comment-card \.dd-comment-action-rail\.dd-action-rail/);
assert.match(page,/#discussionsPage \.dd-forum-actions\.dd-action-rail/);
assert.match(page,/dd-action-share[^\n]*\{margin-left:auto!important/);
// The SAME set of controls is consistently available where backed by existing RPCs.
assert.match(forum,/dd-forum-actions dd-action-rail/);
assert.match(forum,/dd-forum-star-action/);
assert.match(forum,/dd-forum-share-action/);
assert.match(forum,/parent\.append\(comments\)/);
assert.match(votes,/dd-comment-action-rail dd-action-rail/);
assert.match(votes,/dd-action-board/);
assert.match(votes,/dd-action-share/);
assert.match(votes,/dd_comment/);
assert.match(page,/window\.DDSavePublicLinkToBoard=/);
assert.match(page,/window\.DDSharePublicLink=/);
// Comment open and replies: reachable immediately, single movable draft form near target.
assert.match(news,/function scan\(\)\{document\.querySelectorAll\('\[data-news-comments\]'\)/);
assert.match(news,/toggle\.onclick=\(\)=>/);
assert.match(news,/form\.hidden=!state\.expanded/);
assert.match(news,/target\.after\(form\)/);
assert.match(news,/body\.focus\(\{preventScroll:true\}\)/);
assert.match(news,/parent_id:replyingTo\?\.id\|\|null/);
assert.match(cases,/anchor\?\.after\(form\)/);
assert.match(cases,/input\.focus\(\{preventScroll:true\}\)/);
assert.match(cases,/params\.get\('dd_discussion'\)/);
assert.match(forum,/\$\('ddForumReplies'\)\?\.querySelector/);
assert.match(forum,/input\.focus\(\{preventScroll:true\}\)/);
assert.match(forum,/p_parent_id:parent/);
// W.NE keeps user's explicit view, navigation doesn't briefly show site home.
assert.match(studio,/dd-research-studio-view-choice-v1/);
assert.match(studio,/localStorage\.setItem\(preferredViewKey,mode\)/);
assert.match(studio,/allowed\.includes\(explicit\)/);
assert.match(researchNav,/window\.top\.location\.assign\(destination\(tab\)\)/);
assert.match(page,/id="dd-m35-early-route"/);
assert.match(page,/document\.documentElement\.classList\.remove\('dd-navigation-pending'\)/);
// Preserve existing top-right report and private Board/RLS hooks.
assert.match(votes,/header\.append\(flag\)/);
assert.match(forum,/dd_discussions_flag/);
assert.match(cases,/dd_case_comment_flags/);
console.log('PASS M35 static contracts: matching News/Forum/Comment rail, functional Board & Share, inline replies, W.NE preferences and no home flash (NO LIVE DATA)');

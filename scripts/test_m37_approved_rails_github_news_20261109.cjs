'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const home=read('index.html'),forum=read('assets/community-discussions.js'),
 news=read('assets/inline-news-comments.js'),votes=read('assets/community-votes.js'),
 witness=read('assets/witness-community.js');
for(const f of ['assets/community-discussions.js','assets/inline-news-comments.js',
 'assets/community-votes.js','assets/witness-community.js'])
 new vm.Script(read(f),{filename:f});
const pos=home.indexOf('dd-news-main-actions dd-action-rail');
assert.ok(pos>0,'News cards use shared actions');
const card=home.slice(pos,pos+1700);
assert.ok(card.indexOf('data-news-article-votes')<card.indexOf('data-save-news'));
assert.ok(card.indexOf('data-save-news')<card.indexOf('data-share-news'));
assert.match(card,/data-star-icon/);
assert.match(card,/aria-label="Share news story"/);
assert.match(news,/rail\.insertBefore\(toggle,star\)/,'News comment bubble between votes and Board');
assert.match(news,/toggle\.textContent='💬 '/);
assert.match(forum,/parent\.insertBefore\(comments,star\)/);
assert.match(forum,/setActionIcon\(share,'share','⤴'\)/);
assert.match(forum,/setActionIcon\(shared,'share','⤴'\)/);
assert.match(forum,/starIcon\.dataset\.starIcon=''/);
assert.match(forum,/boardIcon\.dataset\.starIcon=''/);
assert.match(home,/#discussionsPage \.dd-action-rail \.dd-forum-danger\{margin-left:auto!important\}/);
assert.match(home,/#newsGrid \.dd-action-rail \.dd-action-share,[\s\S]*?\{margin-left:0!important\}/);
assert.match(votes,/shareSvg\.setAttribute\('viewBox','0 0 24 24'\)/);
assert.match(votes,/header\.append\(flag\)/);
assert.match(votes,/rail\.append\(reply\)/);
assert.match(witness,/const actionBar=make\('div','dd-witness-action-rail dd-action-rail'\)/);
assert.match(witness,/topbar\.append\(flagBox\)/);
assert.match(witness,/DDSharePublicLink\?\.\(title,link\)/);
assert.match(witness,/DDSavePublicLinkToBoard\?\.\(title,link\)/);
assert.match(witness,/publicDeepLinkOpened=true;open\(pendingWitnessId\)/);
assert.match(home,/dd-witness-report \.dd-witness-action-rail/);
assert.match(home,/DD_NEWS_REMOTES=\[/,'Use both GitHub-hosted feeds');
assert.match(home,/dev\/mobile-video-performance-oct31\/data\/news-alerts\.json/,'Active GitHub feed remains available');
assert.match(home,/main\/data\/news-alerts\.json/,'Main GitHub mirror remains available');
assert.match(home,/interestStories=localInterestMatches\(stories,myInterests\)/);
assert.doesNotMatch(home,/fetch\(['"]\/\.netlify\/functions\/interests/);
assert.match(home,/no extra search or deploy/);
const workflow=read('.github/workflows/news-alerts.yml');
assert.match(workflow,/scripts\/update_news_alerts\.py/);
assert.match(workflow,/gh workflow run pages\.yml --ref main/);
console.log('PASS M37 source: screenshot order, safe Witness report actions, GitHub-only News Interests, no Netlify function');

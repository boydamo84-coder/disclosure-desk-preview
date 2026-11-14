'use strict';
// Public editorial "Who's Who" data contract; no network or account access.
const fs=require('node:fs'),assert=require('node:assert/strict');
const dir=JSON.parse(fs.readFileSync('data/public-people-directory.json','utf8'));
const page=fs.readFileSync('who-is-who.html','utf8');
const app=fs.readFileSync('assets/people-directory.js','utf8');
const home=fs.readFileSync('index.html','utf8');
const bundle=fs.readFileSync('scripts/build_public_release.cjs','utf8');
const isSafe=url=>{try{let u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}};
const ids=new Set(),names=new Set();
assert.equal(dir.version,1);
assert.equal(dir.people.length,7);
assert.equal(dir.status,'research-copy-edit-needed','Not verified/approved without source checks');
let videos=0,socials=0,cites=0;
for(const p of dir.people){
 assert(/^[a-z0-9-]+$/.test(p.id)&&!ids.has(p.id),'Unique safe direct profile ID');
 assert(!names.has(p.name),'Unique public identity');ids.add(p.id);names.add(p.name);
 assert(Array.isArray(p.category)&&p.category.length>=1);
 assert(Array.isArray(p.biography)&&p.biography.length>=3&&p.biography.every(x=>x.length>=100),
  'Detailed editorial biography, not a thin scraped stub: '+p.name);
 assert(Array.isArray(p.milestones)&&p.milestones.length>=3&&p.milestones.every(x=>x.title&&x.date&&isSafe(x.source)),
  'Dated public involvement timeline with working-type source URLs: '+p.name);
 assert(Array.isArray(p.articles)&&p.articles.length>=2&&p.articles.every(x=>isSafe(x.url)&&x.publisher),
  'Publisher/source coverage for '+p.name);
 assert(Array.isArray(p.videos)&&p.videos.length>=1&&p.videos.every(x=>/^[\w-]{11}$/.test(x.youtubeId)&&
   /testimony|interview|analysis|reconstruction|report|documentary|programme|discussion/i.test(x.type)&&x.context.length>40),
  'Only attributed, type-labelled published YouTube videos: '+p.name);
 assert(Array.isArray(p.socialPages));
 assert(p.socialPages.every(x=>isSafe(x.url)&&x.kind),'No invented personal account without publisher attribution');
 assert(p.photo===null,'No unlicensed portrait downloads or false rights claims');
 assert(Array.isArray(p.sources)&&p.sources.every(x=>isSafe(x.url)),'Primary public sources');
 videos+=p.videos.length;socials+=p.socialPages.length;cites+=p.milestones.length+p.articles.length;
}
for(const token of ['id="profileBiography"','id="profileTimeline"','id="profileArticles"','id="profileSocials"',
                    'id="profileVideoPlayers"','id="directoryBack"','id="peopleSearch"','id="peopleCategory"'])
 assert(page.includes(token),'Directory exposes '+token);
assert(page.includes('analytics-consent.js')&&!page.includes('googletagmanager.com'),
 'Public profile entry uses consent-gated analytics');
assert(page.includes('href="/"')&&home.includes('href="/who-is-who"'),'Visible Home and directory navigation');
assert(page.includes('https://uapdisclosuredesk.com/who-is-who'),'Canonical public directory');
assert(page.includes('Video')&&page.includes('Profiles'),'Accessible user-facing profile sections');
assert(bundle.includes("'who-is-who.html'")&&bundle.includes("'public-people-directory.json'")&&
  bundle.includes("'people-directory.js'"),'Strict website-only bundler explicitly allows three new items');
assert(app.includes('www.youtube-nocookie.com/embed/')&&app.includes("addEventListener('click'"),
 'Embeds load only after visitor clicks');
assert(!/autoplay=1|youtube\.com\/embed\//.test(app),'No automatic video start or cookie-rich YouTube embed');
assert(app.includes("history.pushState")&&app.includes("window.addEventListener('popstate'"),
 'Shareable individual ?person links with Back behaviour');
assert(!page.match(/<iframe\b/i),'No publisher trackers in initial HTML');
assert(app.includes('esc('),'Escaped public-sourced content rather than raw HTML injection');
console.log('PASS Who’s Who R2: '+dir.people.length+' sourced detailed biographies, '+cites+' dated/source references, '+
 videos+' context-labelled videos, '+socials+' attributed social links, 0 unlicensed headshots; click-to-play, shareable profiles and public-only packaging');

'use strict';
// M59: real mobile News was showing repeated syndicated headlines because
// Google News returned distinct RSS URL/IDs for the same publisher story.
// Strictly local source test; no Google, GitHub, user data or Netlify requests.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
function snippet(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Missing site News integration '+start);
 return html.slice(a,b);
}
const ctx={Date};
vm.createContext(ctx);
vm.runInContext(snippet('function ddNewsHeadlineKey(headline){','function ddNewsRows(rows,origin){'),ctx);
const row=(headline,source,url,date='2026-11-10T03:00:00Z')=>({headline,source,url,date,id:url.split('/').pop()});
const duplicates=[
 row('Retired Navy admiral warns of decades-long UAP cover-up','Fox News','https://news.google.com/rss/articles/a'),
 row('Retired Navy admiral warns of decades-long UAP “cover-up”','AOL','https://news.google.com/rss/articles/b'),
 row('Retired Navy admiral warns of decades-long UAP cover-up','Yahoo','https://news.google.com/rss/articles/c'),
 row('Pentagon releases report on UFO sightings','BBC','https://example.org/report-x'),
 row('Pentagon releases report on UFO sightings','BBC','https://example.org/report-x'),
 row('Pentagon releases NEW report on UFO sightings','BBC','https://example.org/report-y')
];
const got=vm.runInContext('ddNewsDeduplicate',ctx)(duplicates);
assert.equal(got.length,3,'three same-title syndication cards collapse to one, exact URL collapsed');
assert.equal(got[0].source,'Fox News','first sourced article remains with correct publisher');
assert.equal(got[0].url,duplicates[0].url,'original publisher link remains intact');
assert.equal(got[0].id,duplicates[0].id,'social/vote ID of retained article remains intact');
assert.equal(got[2].headline,duplicates[5].headline,'substantively different report stays independent');
const caseVariants=[
 row('UAP witnesses describe a UFO','Publisher A','https://example.org/1'),
 row('uap — witnesses describe a UFO!','Publisher B','https://example.org/2')
];
assert.equal(vm.runInContext('ddNewsDeduplicate',ctx)(caseVariants).length,1,'Unicode punctuation and case variants collapse');
assert.equal(vm.runInContext('ddNewsDeduplicate',ctx)([
 row('Long-running UFO investigation returns','Publisher A','https://example.org/old','2026-10-01T03:00:00Z'),
 row('Long-running UFO investigation returns','Publisher B','https://example.org/new','2026-11-10T03:00:00Z')
]).length,2,'a later fresh investigation with identical headline is not hidden');
assert.match(snippet('function ddNewsRows(rows,origin){','async function loadLiveNews(force=false){'),/const deduped=ddNewsDeduplicate\(valid\.filter\(/);
assert.match(snippet('function ddNewsRows(rows,origin){','async function loadLiveNews(force=false){'),/window\.ddNewsTickerRows=deduped/,'ticker also deduplicates');
assert.match(snippet('function news(){','document.querySelectorAll\(\x27\.news-headline-link\x27\)'),/const combined=ddNewsDeduplicate\(\[\.\.\.interestStories,\.\.\.stories\]\)/,'interest matches cannot reinsert duplicates');
console.log('PASS M59: syndicated Google RSS duplicates removed, distinct publisher reporting retained, story IDs and links preserved, ticker/interest/news deduped (NO DEPLOY)');

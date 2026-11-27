'use strict';
// Offline editorial-draft contract check, not a submission, W.NE import or approval.
// The public-text helper is the same local preview projection exercised by W.NE.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {publicTextPayload}=require('../research/community-publication-preview.js');
const samples=[
 {name:'01-tremonton-great-falls.md',category:'Historical research',ids:['1003323','1003345','PR159'],confirmed:['https://www.dvidshub.net/video/1023402/dow-uap-pr159-historical-film-reported-ufos-utah-1952'],limitation:'footage itself was not reviewed'},
 {name:'02-range-fouler-comparison.md',category:'Case analysis',ids:['D089','D090','D091','PR106','PR112','PR116'],confirmed:[
  'https://www.dvidshub.net/video/1014104/dow-uap-pr106-unresolved-uap-report-eastern-united-states-2020',
  'https://www.dvidshub.net/video/1014128/dow-uap-pr112-unresolved-uap-report-eastern-united-states-2019',
  'https://www.dvidshub.net/video/1014124/dow-uap-pr116-unresolved-uap-report-atlantic-ocean-2020'
 ],limitation:'video footage itself was not inspected'}
];
for(const sample of samples){
 const content=fs.readFileSync('docs/community-research/seed-drafts/'+sample.name,'utf8');
 assert.match(content,/AI-assisted draft/);
 assert.match(content,/not published/);
 const title=content.match(/^# (.+)$/m)[1];
 const headings=[...content.matchAll(/^## (.+)$/gm)];
 const blocks=headings.map((h,i)=>({title:h[1],text:content.slice(h.index+h[0].length,headings[i+1]?.index??content.length).trim()}));
 const abstract=blocks.shift();
 assert.equal(abstract.title,'Abstract');
 const source=blocks.at(-1);assert.equal(source.title,'Sources and access notes');
 const cites=[...source.text.matchAll(/^\d+\. \[([^\]]+)\]\((https:\/\/[^)]+)\)/gm)].map(m=>({title:m[1],url:m[2]}));
 assert.equal(cites.length,6);assert.equal(new Set(cites.map(c=>c.url)).size,6);
 assert.ok(sample.confirmed.every(url=>cites.some(c=>c.url===url)));
 // Keep access limitations, AI disclosure and community question in a reviewed
 // copy; internal workflow/archive keys are not part of the public snapshot.
 source.text=source.text.replace(/^Internal archive keys:.*$/m,'').trim();
 const payloadInput={title,abstract:abstract.text,category:sample.category,sections:[
  {title:'Editorial status',text:'AI-assisted research draft for human editorial review. Not a community member submission.'},
  ...blocks
 ],citations:cites,privateNote:'PRIVATE_DRAFT_TEST_SENTINEL'};
 assert.throws(()=>publicTextPayload(payloadInput,false),/Explicit publication consent/);
 // true is fixture-only to exercise payload shape; never persists or submits.
 const out=publicTextPayload(payloadInput,true);
 assert.deepEqual(Object.keys(out).sort(),['abstract','body_text','category','consent','references_text','title']);
 assert.equal(out.title,title);
 assert.ok(out.body_text.includes(sample.limitation));
 assert.ok(out.body_text.includes('AI-assisted research draft'));
 assert.ok(out.body_text.includes('Question for the community'));
 assert.ok(sample.ids.every(id=>out.body_text.includes(id)));
 assert.ok(sample.confirmed.every(url=>out.references_text.includes(url)));
 assert.ok(!JSON.stringify(out).includes('PRIVATE_DRAFT_TEST_SENTINEL'));
 assert.ok(!out.body_text.includes('Internal archive keys:'));
 const prior=fs.readFileSync('docs/community-research/seed-drafts/'+sample.name,'utf8');
 assert.equal(content,prior);
 console.log('PASS editorial draft text projection: '+sample.name+', six unique citations, explicit consent, limitations retained, private sentinel excluded');
}

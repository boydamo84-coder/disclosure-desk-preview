'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const gapFinder=require('../experiments/r3/research-gap-finder.cjs');
const lab=require('../experiments/r3/hypothesis-lab.cjs');
const {createBridge}=require('../experiments/r3/research-gap-bridge.cjs');
const bridge=createBridge({gapFinder,notebookEngine:lab});
const records=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../data/curated-historical-cases.json'),'utf8'));
const t=i=>'2026-11-14T23:45:'+String(i).padStart(2,'0')+'.000Z';
const cases=bridge.caseCatalogue(records);
assert.equal(records.length,12,'Catalogue expected 12 entries');
assert.equal(cases.length,3,'Only three source-linked incident investigations, not research guides');
assert.deepEqual(cases.map(c=>c.id),
 ['featured-rendlesham-1980','featured-nimitz-2004','featured-roswell-1947']);
const all=cases.flatMap(c=>bridge.candidates(records,c.id));
assert.equal(all.length,12,'12 tentative, case-specific prompts, not global absence statements');
assert(all.every(q=>q.status==='research-question-not-evidence'));
assert(all.every(q=>q.scope==='Current catalogue entry only'));
assert(all.every(q=>q.source.url.startsWith('https://')));
assert(all.every(q=>q.reason&&q.nextAction&&q.dataset==='data/curated-historical-cases.json'));
assert.equal(bridge.candidates(records,'uk-mod-research-guide').length,0,
 'Do not present catalogue research guides as specific incidents');
const selected=cases[0],candidates=bridge.candidates(records,selected.id);
assert(candidates.some(x=>x.key==='sighting-position-not-verified'&&
 x.reason.includes('approximate')));
assert(candidates.every(x=>x.caseId===selected.id));
assert(Object.isFrozen(candidates)&&Object.isFrozen(candidates[0].source));
const before=lab.createNotebook({
 workspaceId:'test-private-workspace',caseId:selected.id,
 title:'Source questions for a catalogue investigation',at:t(0)
});
const linkedContent={
 title:'Testable fictional explanation',explanation:'A researcher-authored synthetic hypothesis.',
 assumptions:['Catalogue fields are not independently verified'],
 predictions:[{id:'prediction-1',predictedObservation:'An independent original record would be findable',
 ifObserved:'Prompts additional source verification',ifNotObserved:'Prompts re-examination',
 howToTest:'Inspect original documents'}],
 disconfirmingTests:[{id:'disconfirm-1',
 potentiallyDisconfirmingObservation:'An original, contradictory document',
 howToCheck:'Compare provenance'}],
 alternativeInterpretations:['A different synthetic explanation may be possible'],
 sources:[]
};
const withHyp=lab.addHypothesis(before,{workspaceId:before.workspaceId,id:'h-source',
 content:linkedContent,at:t(1)});
const accepted=bridge.recordQuestion(withHyp,{
 workspaceId:withHyp.workspaceId,records,gapId:candidates[0].id,
 relatedHypothesisId:'h-source',reviewerNote:'Review source records before concluding anything.',
 at:t(2)
});
assert.equal(accepted.gapReviews.length,1);
const saved=accepted.gapReviews[0];
assert.equal(saved.status,'research-question-not-evidence');
assert.equal(saved.id,candidates[0].id);
assert.equal(saved.source.url,candidates[0].source.url);
assert.equal(saved.relatedHypothesisId,'h-source');
assert.match(saved.reviewerNote,/Review source records/);
assert.equal(accepted.visibility,'private');
assert.equal(accepted.updatedAt,t(2));
assert.deepEqual(lab.revision(accepted,{workspaceId:withHyp.workspaceId,id:'h-source'}),
 lab.revision(withHyp,{workspaceId:withHyp.workspaceId,id:'h-source'}),
 'Linking a research question must not overwrite the existing hypothesis');
assert.equal(withHyp.gapReviews,undefined,'Original notebook remains untouched');
assert.equal(before.gapReviews,undefined,'Earlier snapshots cannot be changed');
assert(Object.isFrozen(accepted)&&Object.isFrozen(accepted.gapReviews));
assert.equal(bridge.recordedQuestions(accepted,{workspaceId:accepted.workspaceId}).length,1);
const parsed=JSON.parse(lab.serializePrivateDraft(accepted,{workspaceId:accepted.workspaceId}));
assert.equal(parsed.gapReviews[0].source.url,saved.source.url,
 'Explicit encrypted-vault serialization retains sourced questions');
assert.throws(()=>bridge.recordQuestion(accepted,{
 workspaceId:accepted.workspaceId,records,gapId:candidates[0].id,at:t(3)
}),/already added/i);
assert.throws(()=>bridge.recordQuestion(accepted,{
 workspaceId:'another-workspace',records,gapId:candidates[1].id,at:t(3)
}),/workspace/);
assert.throws(()=>bridge.recordQuestion(accepted,{
 workspaceId:accepted.workspaceId,records,
 gapId:bridge.candidates(records,cases[1].id)[0].id,at:t(3)
}),/not supported/i,'Cross-case proposals cannot leak into unrelated notebooks');
assert.throws(()=>bridge.recordQuestion(accepted,{
 workspaceId:accepted.workspaceId,records,gapId:candidates[1].id,
 relatedHypothesisId:'h-not-in-this-notebook',at:t(3)
}),/must exist/);
assert.throws(()=>bridge.recordQuestion(accepted,{
 workspaceId:accepted.workspaceId,records,gapId:candidates[1].id,at:t(1)
}),/later/);
assert.throws(()=>bridge.recordQuestion(accepted,{
 workspaceId:accepted.workspaceId,records,gapId:candidates[1].id,at:t(3),
 reviewerNote:'x'.repeat(1000)
}),/too long/);
const dangerous=[{id:'fictional-dossier',kind:'Case report',
 title:'Unsourced synthetic case',url:'http://127.0.0.1/private',
 sources:[{title:'Private file',url:'http://localhost/private'}]}];
assert.equal(bridge.caseCatalogue(dangerous).length,0);
assert.equal(bridge.candidates(dangerous,'fictional-dossier').length,0);
assert.throws(()=>bridge.recordQuestion(before,{
 workspaceId:before.workspaceId,records:dangerous,gapId:'fictional-dossier:event-year-not-indexed',
 at:t(4)
}),/not supported/i);
const noSource=[{id:'test-case-source',kind:'Case report',
 title:'Case with no valid HTTPS original source',url:'https://example.org/official',
 sources:[],eventMonth:3,eventDay:1,year:2001}];
const safe=bridge.candidates(noSource,'test-case-source');
assert(safe.length>0);
const httpOnly=[{id:'test-http-only',kind:'Case report',title:'Not HTTPS',
 url:'http://example.org/catalogue'}];
assert.equal(bridge.caseCatalogue(httpOnly).length,0);
assert.equal(bridge.candidates(httpOnly,'test-http-only').length,0);
const changed=bridge.recordQuestion(accepted,{
 workspaceId:accepted.workspaceId,records,gapId:candidates[1].id,at:t(4)
});
assert.equal(changed.gapReviews.length,2);
assert.equal(accepted.gapReviews.length,1,'Append only, earlier reviews immutable');
assert.equal(changed.gapReviews[0].reviewedAt,t(2));
console.log('PASS R3 Gap Bridge: 12 source-linked prompts from 3 real catalogue investigations, private append-only opt-in questions, no cross-case leakage, old version preserved, unverified labels');

'use strict';
// R3 private-only contract tests; no real accounts, live network or deployment.
const assert=require('node:assert/strict');
const {
 createNotebook,addHypothesis,reviseHypothesis,revision,
 compareHypotheses,serializePrivateDraft,SCHEMA_VERSION
}=require('../experiments/r3/hypothesis-lab.cjs');
const at=(seconds)=>'2026-11-14T22:00:'+String(seconds).padStart(2,'0')+'.000Z';
const workspaceId='private-test-workspace';
const caseId='synthetic-incident';
const hypothesis=(name,description,source=true)=>({
 title:name,explanation:description,
 assumptions:['The recorded observation can be reviewed without presuming its cause'],
 predictions:[{
  id:'prediction-1',
  predictedObservation:'A comparison record has the same recurring measurable pattern',
  ifObserved:'Would provide a testable consistency question, not proof',
  ifNotObserved:'Would require revisiting this explanation, not automatically disproving it',
  howToTest:'Compare time-stamped original records and instrument limitations'
 }],
 disconfirmingTests:[{
  id:'test-1',
  potentiallyDisconfirmingObservation:'A sufficiently documented contrary measurement exists',
  howToCheck:'Review and cite the original instrument record and its limitations'
 }],
 alternativeInterpretations:['Another ordinary mechanism might fit the same available information'],
 ...(source?{sources:[{label:'Synthetic original record',url:'https://example.org/synthetic-record',
  locator:'Section 2 (fictional fixture)'}]}:{})
});
let book=createNotebook({workspaceId,caseId,title:'Private competing explanations',at:at(0)});
assert.equal(SCHEMA_VERSION,1);
assert.equal(book.visibility,'private');
assert(Object.isFrozen(book)&&Object.isFrozen(book.hypotheses));
assert.equal(book.hypotheses.length,0);
const originalBook=book;
book=addHypothesis(book,{workspaceId,id:'h-environment',
 content:hypothesis('Environmental hypothesis','A researcher-generated testable working explanation'),at:at(1)});
assert.equal(originalBook.hypotheses.length,0,'Pure operation cannot rewrite original notebook');
book=addHypothesis(book,{workspaceId,id:'h-instrument',
 content:hypothesis('Instrument hypothesis','An alternative working explanation',false),at:at(2)});
assert.equal(book.hypotheses.length,2);
assert.equal(revision(book,{workspaceId,id:'h-environment'}).revision,1);
assert.equal(revision(book,{workspaceId,id:'h-instrument'}).content.citationStatus,'references-needed');
assert.equal(revision(book,{workspaceId,id:'h-environment'}).content.citationStatus,
 'references-provided-not-independently-verified');
const beforeRevision=book;
const changed=hypothesis('Environmental hypothesis — revised','Revised after hypothetical new information');
changed.predictions[0].predictedObservation='A new synthetic observation would be independently reproducible';
book=reviseHypothesis(book,{workspaceId,id:'h-environment',content:changed,at:at(3)});
const first=revision(book,{workspaceId,id:'h-environment',number:1});
const second=revision(book,{workspaceId,id:'h-environment',number:2});
assert.equal(first.recordedAt,at(1));
assert.equal(second.recordedAt,at(3));
assert.equal(first.content.predictions[0].predictedObservation,
 'A comparison record has the same recurring measurable pattern',
 'Original falsifiable prediction must stay unchanged after later revision');
assert.equal(beforeRevision.hypotheses[0].revisions.length,1,
 'Old versioned notebook must remain unmodified');
assert.equal(book.hypotheses[0].revisions.length,2);
assert(Object.isFrozen(book)&&Object.isFrozen(first.content.predictions)&&Object.isFrozen(second));
changed.predictions[0].predictedObservation='Edited mutable input after save';
assert.notEqual(second.content.predictions[0].predictedObservation,
 changed.predictions[0].predictedObservation,'Nested content must be safely copied');
const comparison=compareHypotheses(book,{workspaceId,ids:['h-environment','h-instrument']});
assert.equal(comparison.hypotheses.length,2);
assert.equal(comparison.visibility,'private');
assert.equal(comparison.comparisonType,'side-by-side-not-ranked');
assert(!Object.hasOwn(comparison,'winner'));
assert(!Object.hasOwn(comparison,'probability'));
assert.deepEqual(comparison.hypotheses.map(h=>h.id),['h-environment','h-instrument']);
const serialized=serializePrivateDraft(book,{workspaceId});
const parsed=JSON.parse(serialized);
assert.equal(parsed.visibility,'private');
assert.equal(parsed.hypotheses[0].revisions.length,2);
assert(!serialized.includes('publicUrl'));
assert(!serialized.includes('shareToken'));
assert.throws(()=>addHypothesis(book,{workspaceId:'other-private-workspace',
 id:'another',content:hypothesis('Other','No'),at:at(4)}),/workspace mismatch/);
assert.throws(()=>revision(book,{workspaceId:'other-private-workspace',id:'h-environment'}),/workspace mismatch/);
assert.throws(()=>compareHypotheses(book,{workspaceId,ids:['h-environment','h-environment']}),/distinct/);
assert.throws(()=>addHypothesis(book,{workspaceId,id:'h-instrument',
 content:hypothesis('Duplicate','Cannot overwrite history'),at:at(4)}),/duplicate/);
assert.throws(()=>reviseHypothesis(book,{workspaceId,id:'h-environment',
 content:hypothesis('Backdated','Cannot silently rewrite history'),at:at(2)}),/later than prior/);
assert.throws(()=>createNotebook({workspaceId,caseId,title:'Public',at:at(0),visibility:'public'}),/private/);
assert.throws(()=>addHypothesis(book,{workspaceId,id:'h-public',
 content:{...hypothesis('Public','Explicitly invalid'),visibility:'public'},at:at(4)}),/public/);
assert.throws(()=>addHypothesis(book,{workspaceId,id:'h-probability',
 content:{...hypothesis('Confidence','Unsupported scoring'),alienProbability:0.99},at:at(4)}),/probabilities/);
assert.throws(()=>addHypothesis(book,{workspaceId,id:'h-no-disconfirm',
 content:{...hypothesis('No test','Cannot be challenged'),disconfirmingTests:[]},at:at(4)}),/disconfirmingTests/);
assert.throws(()=>addHypothesis(book,{workspaceId,id:'h-no-alternative',
 content:{...hypothesis('No alternatives','Must account for them'),alternativeInterpretations:[]},at:at(4)}),/alternativeInterpretations/);
const unsafe=hypothesis('Invalid citation','Reject unsafe links');
unsafe.sources=[{label:'private endpoint',url:'http://127.0.0.1/secret'}];
assert.throws(()=>addHypothesis(book,{workspaceId,id:'h-unsafe-url',
 content:unsafe,at:at(4)}),/public HTTPS/);
const cloned=JSON.parse(serializePrivateDraft(book,{workspaceId}));
assert.deepEqual(revision(cloned,{workspaceId,id:'h-instrument'}),
 revision(book,{workspaceId,id:'h-instrument'}),'Explicit private local JSON roundtrip maintains revision history');
console.log('PASS R3 Hypothesis Lab alpha: 2 competing private hypotheses, append-only revisions, disconfirmation, citations, isolated projects and no ranking/publishing');

/* Evidence DNA — public case source provenance (R2 alpha, not deployed).
 * Library only: never fetches or uploads, never labels URLs independent witnesses.
 * Supports Node tests and browser UI via window.DDEvidenceDNA.
 */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DDEvidenceDNA = api;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  const relationTypes = new Set(['quotes', 'cites', 'repeats', 'derived_from', 'contrasts']);
  const reviewStates = new Set(['proposed', 'reviewed', 'disputed']);
  const str = value => String(value == null ? '' : value).trim();

  function publicUrl(value) {
    try {
      const u = new URL(str(value));
      return (u.protocol === 'https:' || u.protocol === 'http:') &&
        !u.username && !u.password && !!u.hostname && !['localhost', '127.0.0.1'].includes(u.hostname);
    } catch (_) { return false; }
  }
  function canonicalUrl(value) {
    if (!publicUrl(value)) return null;
    const u = new URL(str(value));
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid|msclkid)$/i.test(key)) u.searchParams.delete(key);
    }
    u.hostname = u.hostname.toLowerCase();
    u.pathname = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, '') : u.pathname;
    return u.toString();
  }
  function sourceInventory(record) {
    if (!record || typeof record !== 'object') return {items:[], citations:0, duplicateReferences:0, hasOnlyCollectionMetadata:true};
    const inputs = [
      {title: str(record.title || 'Catalogue source'), url: record.url, type: 'Archive catalogue link'},
      ...(Array.isArray(record.sources) ? record.sources.map(source => ({
        title:str(source && source.title || 'Additional source'), url:source && source.url,
        type:str(source && source.type || 'Source reference')
      })) : [])
    ];
    const map = new Map();
    let citations = 0;
    for (const source of inputs.slice(0, 200)) {
      const key = canonicalUrl(source.url);
      if (!key) continue;
      citations++;
      if (!map.has(key)) map.set(key, {
        id:'ref-'+map.size, canonicalUrl:key, url:str(source.url), title:source.title,
        type:source.type, repeatedReferences:0, labels:[source.title]
      });
      else {
        const existing = map.get(key);
        existing.repeatedReferences++;
        if (!existing.labels.includes(source.title)) existing.labels.push(source.title);
      }
    }
    const items = [...map.values()];
    return {
      items, citations, duplicateReferences:citations-items.length,
      hasOnlyCollectionMetadata:!items.some(x => /first.hand|original witness|sensor reading|direct measurement/i.test(x.type))
    };
  }
  // A reviewed edge requires a document-specific citation and locator. A link
  // to a general agency homepage without a page/section does not verify lineage.
  function parseGraph(raw) {
    const issues = [];
    if (!raw || raw.schemaVersion !== 1) return {valid:false,issues:['Unsupported or absent provenance schema'],documents:[],claims:[],edges:[]};
    const rawDocs=Array.isArray(raw.documents)?raw.documents:[];
    const rawClaims=Array.isArray(raw.claims)?raw.claims:[];
    const rawEdges=Array.isArray(raw.edges)?raw.edges:[];
    if(rawDocs.length>5000||rawEdges.length>20000||rawClaims.length>5000)issues.push('Graph exceeds validated safety limits');
    const documents=[],docIds=new Set();
    for (const d of rawDocs.slice(0,5000)) {
      if(!d||!str(d.id)||docIds.has(str(d.id))||!publicUrl(d.url)) {issues.push('Invalid, duplicated or unlinked document');continue;}
      const id=str(d.id);docIds.add(id);
      documents.push({id,title:str(d.title).slice(0,240)||'Untitled source',url:str(d.url),
        author:str(d.author).slice(0,150),published:str(d.published).slice(0,40),
        originStatus: d.originStatus==='documented-firsthand'?'documented-firsthand':'unassessed',
        originEvidence: d.originEvidence && publicUrl(d.originEvidence.url) && str(d.originEvidence.locator)
          ? {url:str(d.originEvidence.url),locator:str(d.originEvidence.locator).slice(0,160)}:null});
    }
    const claims=[],claimIds=new Set();
    for (const c of rawClaims.slice(0,5000)) {
      if(!c||!str(c.id)||claimIds.has(str(c.id))||!str(c.text)) {issues.push('Invalid or duplicated claim');continue;}
      const ids=[...new Set((Array.isArray(c.documentIds)?c.documentIds:[]).map(str))];
      if(ids.some(id=>!docIds.has(id))) {issues.push('Claim references unknown document');continue;}
      // Citations attach individual claims to specific documents and locators.
      // A citation is a finding aid, NOT confirmation that the claim is true.
      const citations=[];
      const sourceCites=Array.isArray(c.citations)?c.citations:[];
      if(sourceCites.length>30)issues.push('Too many claim citations');
      for(const cite of sourceCites.slice(0,30)){
        const doc=documents.find(d=>d.id===str(cite?.documentId));
        const url=canonicalUrl(cite?.url);
        if(!doc||!ids.includes(doc.id)||!url||url!==canonicalUrl(doc.url)||
           !str(cite.locator)||str(cite.locator).length>320){
          issues.push('Claim citation missing a matching document and precise locator');continue;
        }
        citations.push({documentId:doc.id,url:doc.url,
          locator:str(cite.locator).slice(0,320),
          context:str(cite.context).slice(0,320),
          reviewStatus:cite.reviewStatus==='reviewed'?'reviewed':'draft-needs-review'});
      }
      claimIds.add(str(c.id));
      claims.push({id:str(c.id),text:str(c.text).slice(0,550),documentIds:ids,
       editorialStatus:c.editorialStatus==='reviewed'?'reviewed':'draft-needs-review',
       citations});
    }
    const edges=[];
    for(const edge of rawEdges.slice(0,20000)) {
      if(!edge||!docIds.has(str(edge.from))||!docIds.has(str(edge.to))||edge.from===edge.to||
         !relationTypes.has(edge.relation)||!reviewStates.has(edge.status)){
        issues.push('Invalid provenance edge or unknown relation');continue;
      }
      const evidence=edge.evidence||{};
      if(edge.status==='reviewed'&&(!publicUrl(evidence.url)||!str(evidence.locator))){
        issues.push('Reviewed relation missing precise published citation');continue;
      }
      edges.push({from:str(edge.from),to:str(edge.to),relation:edge.relation,status:edge.status,
        evidence:publicUrl(evidence.url)&&str(evidence.locator)?{
          url:str(evidence.url),locator:str(evidence.locator).slice(0,160)
        }:null});
    }
    return {valid:issues.length===0,issues,documents,claims,edges};
  }
  function traceClaim(rawGraph, claimId) {
    const g=parseGraph(rawGraph);
    if(!g.valid)return {valid:false,issues:g.issues,documentCount:0,reviewedDependencyCount:0,originCount:null,
      independentWitnessCount:null,unresolvedDocuments:[],cycles:[]};
    const claim=g.claims.find(c=>c.id===str(claimId));
    if(!claim)return {valid:false,issues:['Claim ID not found'],documentCount:0,reviewedDependencyCount:0,
      originCount:null,independentWitnessCount:null,unresolvedDocuments:[],cycles:[]};
    // Only explicitly reviewed 'derived_from'/'repeats' relations are followed.
    const dependencies=new Map();
    for(const e of g.edges) {
      if(e.status!=='reviewed'||!['derived_from','repeats'].includes(e.relation))continue;
      if(!dependencies.has(e.from))dependencies.set(e.from,[]);
      dependencies.get(e.from).push(e.to);
    }
    const docs=new Map(g.documents.map(d=>[d.id,d]));
    const unresolved=new Set(),originIds=new Set(),cycles=[];
    const visited=new Set(),stack=new Set(),usedEdges=new Set();
    function walk(id) {
      if(stack.has(id)){cycles.push(id);return}
      if(visited.has(id))return;
      visited.add(id);stack.add(id);
      const upstream=dependencies.get(id)||[];
      if(!upstream.length) {
        const d=docs.get(id);
        if(d && d.originStatus==='documented-firsthand' && d.originEvidence)originIds.add(id);
        else unresolved.add(id);
      } else {
        for(const parent of upstream) {
          usedEdges.add(id+'>'+parent);
          walk(parent);
        }
      }
      stack.delete(id);
    }
    for(const id of claim.documentIds)walk(id);
    return {
      valid:true,issues:[],claim:claim.text,documentCount:claim.documentIds.length,
      reviewedDependencyCount:usedEdges.size,
      // This is origin-document provenance only, NOT independent witnesses.
      originCount:cycles.length?null:originIds.size,
      documentedOriginIds:[...originIds],unresolvedDocuments:[...unresolved],
      cycles:[...new Set(cycles)],
      independentWitnessCount:null,
      status:cycles.length?'ambiguous-cycle':unresolved.size?'partially-unresolved':'traceable',
      evidenceEdges:g.edges.filter(e=>e.status==='reviewed' && usedEdges.has(e.from+'>'+e.to))
    };
  }
  // Contradiction Radar alpha: a source-context comparison, never an automated
  // allegation of contradiction. These are editorial summaries, NOT quotations.
  function compareClaims(rawGraph, firstId, secondId) {
    const parsed=parseGraph(rawGraph);
    if(!parsed.valid)return {valid:false,issues:parsed.issues};
    const first=parsed.claims.find(c=>c.id===str(firstId));
    const second=parsed.claims.find(c=>c.id===str(secondId));
    if(!first||!second||first.id===second.id)
      return {valid:false,issues:['Choose two distinct claims from the same source-reviewed case graph']};
    if(!first.citations.length||!second.citations.length)
      return {valid:false,issues:['Both statements require traceable original source citations']};
    const firstUrls=[...new Set(first.citations.map(c=>canonicalUrl(c.url)).filter(Boolean))];
    const secondUrls=new Set(second.citations.map(c=>canonicalUrl(c.url)).filter(Boolean));
    const sharedSourceUrls=firstUrls.filter(url=>secondUrls.has(url));
    return {
      valid:true,status:'human-comparison-only',
      first:{id:first.id,text:first.text,editorialStatus:first.editorialStatus,citations:first.citations},
      second:{id:second.id,text:second.text,editorialStatus:second.editorialStatus,citations:second.citations},
      sharedSourceUrls,
      sourceRelationship:sharedSourceUrls.length?'same-cited-source-page':'different-cited-source-pages-unassessed',
      contradictionEstablished:false,independentCorroborationEstablished:false,
      caution:'Two research-draft summaries are shown for source comparison. They are not verbatim quotations. A difference in wording or source pages does not establish a contradiction, dishonesty or independent corroboration. Read the original passages and context before drawing conclusions.'
    };
  }
  // Explicit cross-case reading aid. It NEVER assigns truth or detects dishonesty.
  function compareSelections(caseGraphs, selectionA, selectionB) {
    const entries=Array.isArray(caseGraphs)?caseGraphs.slice(0,50):[];
    function pick(selection) {
      if(!selection||!str(selection.caseId)||!str(selection.claimId))return null;
      const graph=entries.find(g=>g&&str(g.caseId)===str(selection.caseId));
      if(!graph)return null;
      const parsed=parseGraph(graph);
      if(!parsed.valid)return null;
      const claim=parsed.claims.find(c=>c.id===str(selection.claimId));
      if(!claim||!claim.citations.length)return null;
      return {caseId:str(graph.caseId),id:claim.id,text:claim.text,
        citations:claim.citations,editorialStatus:claim.editorialStatus};
    }
    const first=pick(selectionA),second=pick(selectionB);
    if(!first||!second||first.caseId===second.caseId&&first.id===second.id)
      return {valid:false,issues:['Select two distinct, source-linked statements from the curated public cases']};
    const secondUrls=new Set(second.citations.map(c=>canonicalUrl(c.url)).filter(Boolean));
    const sharedSourceUrls=[...new Set(first.citations.map(c=>canonicalUrl(c.url)).filter(Boolean))]
      .filter(url=>secondUrls.has(url));
    return {valid:true,first,second,sharedSourceUrls,
      sourceRelationship:sharedSourceUrls.length?'same-cited-source-page':'different-cited-source-pages-unassessed',
      contradictionEstablished:false,independentCorroborationEstablished:false,status:'human-comparison-only',
      caution:'These are editorial summaries, not verbatim quotations or verified competing eyewitness reports. The source pages may describe different questions, events or reporting scopes. A comparison cannot establish a contradiction, dishonesty or independent corroboration. Read the cited original context.'};
  }
  function analyse(record, graph) {
    const inventory=sourceInventory(record);
    if(!graph)return {inventory,trace:null,claims:[],state:'source-inventory-only',
      caution:'Listed source URLs are not independent witnesses. No source-to-source dependency has been verified for this case.'};
    const parsed=parseGraph(graph);
    if(!parsed.valid)return {inventory,trace:null,claims:[],state:'invalid-provenance',issues:parsed.issues,
      caution:'Provenance metadata failed checks; no independence conclusion can be shown.'};
    return {inventory,trace:null,claims:parsed.claims.map(c=>({id:c.id,text:c.text,
        citations:c.citations,editorialStatus:c.editorialStatus,
        result:traceClaim(graph,c.id)})),state:parsed.claims.length?'claim-lineage':'source-inventory-only',
      caution:'Only explicitly documented relationships are traced. Independent witness counts are never inferred from URL counts.'};
  }
  return Object.freeze({version:'0.2',publicUrl,canonicalUrl,sourceInventory,parseGraph,traceClaim,compareClaims,compareSelections,analyse});
});
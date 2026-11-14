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
  const relationTypes = new Set(['quotes', 'cites', 'mentions', 'repeats', 'derived_from', 'contrasts']);
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
      // A checked reference must be shown ON the document said to be
      // quoting / mentioning / repeating another. A third-party blog about
      // both documents cannot certify a direct dependency between them.
      const citedUrl=canonicalUrl(evidence.url);
      const referring=documents.find(d=>d.id===str(edge.from));
      if(edge.status==='reviewed'&&(!citedUrl||!str(evidence.locator)||
           str(evidence.locator).length>320||citedUrl!==canonicalUrl(referring?.url))){
        issues.push('Reviewed relation requires exact locator on the referring source document');continue;
      }
      edges.push({from:str(edge.from),to:str(edge.to),relation:edge.relation,status:edge.status,
        evidence:citedUrl&&str(evidence.locator)?{
          url:str(evidence.url),locator:str(evidence.locator).slice(0,320),
          context:str(evidence.context).slice(0,480)
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
  // M9 Source Lineage Desk: assess exact reviewed *references* separately
  // from supported copying/derivation. Never infer origins or witnesses by URL count.
  function sourceLineageAudit(rawGraph) {
    const graph=parseGraph(rawGraph);
    if(!graph.valid)return {valid:false,issues:graph.issues,documents:[],reviewedReferences:[],
      reviewedDependencies:[],unreviewedCandidates:[],independentWitnessCount:null};
    const docs=new Map(graph.documents.map(d=>[d.id,d]));
    const asRelation=e=>({fromId:e.from,toId:e.to,
      from:docs.get(e.from)?.title||e.from,to:docs.get(e.to)?.title||e.to,
      relation:e.relation,status:e.status,evidence:e.evidence});
    const dependencies=graph.edges.filter(e=>
      ['derived_from','repeats'].includes(e.relation));
    const reviewedDependencies=dependencies.filter(e=>e.status==='reviewed').map(asRelation);
    const reviewedReferences=graph.edges.filter(e=>
      e.status==='reviewed'&&!['derived_from','repeats'].includes(e.relation)).map(asRelation);
    const unreviewedCandidates=graph.edges.filter(e=>
      e.status!=='reviewed').map(asRelation);
    const knownUpstream=new Set(reviewedDependencies.map(e=>e.fromId));
    const unresolved=graph.documents.filter(d=>!knownUpstream.has(d.id)&&
      !(d.originStatus==='documented-firsthand'&&d.originEvidence))
      .map(d=>({id:d.id,title:d.title,url:d.url}));
    const firstHandDocuments=graph.documents.filter(d=>
      d.originStatus==='documented-firsthand'&&d.originEvidence)
      .map(d=>({id:d.id,title:d.title,evidence:d.originEvidence}));
    return {
      valid:true,issues:[],documents:graph.documents.map(d=>({id:d.id,title:d.title,url:d.url,
       published:d.published,originStatus:d.originStatus})),
      reviewedReferences,reviewedDependencies,unreviewedCandidates,
      unresolvedDocuments:unresolved,firstHandDocuments,
      reviewedReferenceCount:reviewedReferences.length,
      reviewedDependencyCount:reviewedDependencies.length,
      unreviewedCandidateCount:unreviewedCandidates.length,
      independentWitnessCount:null,
      copyingEstablished:reviewedDependencies.length>0,
      caution:'A reviewed mention or citation only confirms that one published document refers to another. It does not establish copied reporting, an original eyewitness, agreement between claims, or independent corroboration. A confirmed reuse relationship must be separately demonstrated with a passage-level source locator.'};
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
  // A bounded public-only graph of *catalogued* claims and cited pages.
  // It does not infer physical events, independent witnesses or case agreement.
  function buildRelationshipGraph(caseGraphs, selectedCaseId, publicPersonLinks=[]) {
    const input=Array.isArray(caseGraphs)?caseGraphs.slice(0,20):[];
    const cases=input.filter(g=>g&&str(g.caseId)&&(selectedCaseId==='all'||str(g.caseId)===str(selectedCaseId)));
    const nodes=[],edges=[],sources=new Map(),edgeIds=new Set(),issues=[];
    const title=id=>id==='featured-rendlesham-1980'?'Rendlesham Forest (1980)':
      id==='featured-roswell-1947'?'Roswell (1947)':str(id).slice(0,80);
    const addNode=node=>{if(nodes.length>=100)return false;nodes.push(node);return true;};
    const addEdge=edge=>{
      if(edges.length>=260)return;
      const key=[edge.from,edge.to,edge.relation,edge.evidence?.locator||''].join('|');
      if(!edgeIds.has(key)){edgeIds.add(key);edges.push(edge);}
    };
    for(const graph of cases){
      const parsed=parseGraph(graph);
      if(!parsed.valid){issues.push('Invalid case provenance graph: '+title(graph.caseId));continue;}
      const caseNode='case:'+str(graph.caseId);
      if(!addNode({id:caseNode,type:'case',label:title(graph.caseId),reviewStatus:'editorial-draft'}))break;
      const documents=new Map(parsed.documents.map(d=>[d.id,d]));
      const usedDocuments=new Map();
      for(const claim of parsed.claims.slice(0,35)){
        if(!claim.citations.length)continue;
        const claimNode='claim:'+str(graph.caseId)+':'+claim.id;
        if(!addNode({id:claimNode,type:'claim',label:claim.text.slice(0,100),
           caseId:str(graph.caseId),reviewStatus:claim.editorialStatus}))break;
        addEdge({from:caseNode,to:claimNode,relation:'catalogues-editorial-summary',
         reviewStatus:'context-only',evidence:null});
        for(const cite of claim.citations.slice(0,12)){
          const doc=documents.get(cite.documentId);
          const url=canonicalUrl(cite.url);
          if(!doc||!url||url!==canonicalUrl(doc.url))continue;
          let sourceId=sources.get(url);
          if(!sourceId) {
            sourceId='document:'+sources.size;
            if(!addNode({id:sourceId,type:'document',label:doc.title,
              url:doc.url,reviewStatus:'source-page-unassessed'}))break;
            sources.set(url,sourceId);
          }
          usedDocuments.set(doc.id,sourceId);
          addEdge({from:claimNode,to:sourceId,relation:'cites-source-page',
            reviewStatus:cite.reviewStatus,evidence:{url:cite.url,locator:cite.locator,context:cite.context}});
        }
      }
      // Preserve only actually cited and source-evidenced document relations.
      for(const edge of parsed.edges){
        const from=usedDocuments.get(edge.from),to=usedDocuments.get(edge.to);
        if(!from||!to||from===to||!edge.evidence)continue;
        addEdge({from,to,relation:edge.relation,reviewStatus:edge.status,evidence:edge.evidence});
      }
    }
    // Optional M8 public-role links carry original citations, but they are NOT
    // a judgement that the associated sighting happened or that two cases connect.
    const attributed=Array.isArray(publicPersonLinks)?publicPersonLinks.slice(0,80):[];
    const knownPeople=new Map();
    for(const item of attributed){
      if(!item||!item.caseId||!item.personId||!item.source?.url||!item.source.locator||
         item.reviewStatus!=='editorial-draft'||item.eventVerified!==false||!publicUrl(item.source.url)||
         (selectedCaseId!=='all'&&str(item.caseId)!==str(selectedCaseId)))continue;
      const caseNode='case:'+str(item.caseId);
      if(!nodes.some(n=>n.id===caseNode)&&!addNode({id:caseNode,type:'case',
         label:str(item.caseLabel).slice(0,120),reviewStatus:'editorial-draft'}))break;
      let personNode=knownPeople.get(str(item.personId));
      if(!personNode){
        personNode='person:'+str(item.personId);
        if(!addNode({id:personNode,type:'person',label:str(item.personName).slice(0,120),
          personId:str(item.personId),reviewStatus:'editorial-draft'}))break;
        knownPeople.set(str(item.personId),personNode);
      }
      const url=canonicalUrl(item.source.url);
      if(!url)continue;
      let docNode=sources.get(url);
      if(!docNode){
        docNode='document:'+sources.size;
        if(!addNode({id:docNode,type:'document',label:str(item.source.publisher).slice(0,140),
          url:str(item.source.url),reviewStatus:'source-page-unassessed'}))break;
        sources.set(url,docNode);
      }
      const citation={url:str(item.source.url),locator:str(item.source.locator),
        context:str(item.context)};
      addEdge({from:personNode,to:caseNode,relation:'attributed-public-involvement',
        role:str(item.role),roleLabel:str(item.roleLabel),reviewStatus:'editorial-draft',evidence:citation});
      addEdge({from:personNode,to:docNode,relation:'attribution-source-page',
        reviewStatus:'editorial-draft',evidence:citation});
    }
    const lineageReferences=edges.filter(e=>['mentions','cites','quotes','contrasts'].includes(e.relation)&&e.reviewStatus==='reviewed').length;
    const lineageReuse=edges.filter(e=>['derived_from','repeats'].includes(e.relation)&&e.reviewStatus==='reviewed').length;
    const kinds=type=>nodes.filter(n=>n.type===type).length;
    const caseNodes=kinds('case'),claimNodes=kinds('claim'),documentNodes=kinds('document'),personNodes=kinds('person');
    return {valid:!issues.length,issues,nodes,edges,caseCount:caseNodes,claimCount:claimNodes,
      documentCount:documentNodes,personCount:personNodes,reviewedSourceReferences:lineageReferences,reviewedReuseDependencies:lineageReuse,selectedCaseId:str(selectedCaseId||'all'),
      verifiedCaseToCaseEdges:0,independentWitnessCount:null,
      truncated:nodes.length>=100||edges.length>=260,
      caution:'This maps draft citations and source-attributed public roles, not independently verified extraordinary events. A documented statement or authorship shows what somebody said or published; it does not verify the event, prove corroboration, or establish a link between incidents.'};
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
  return Object.freeze({version:'0.3',publicUrl,canonicalUrl,sourceInventory,parseGraph,traceClaim,sourceLineageAudit,compareClaims,compareSelections,buildRelationshipGraph,analyse});
});
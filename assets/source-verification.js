/* M40 source verification and international outreach: manually maintained public status only.
   No automatic inbox access, user identifiers, inferred agency receipt or scoring. */
(()=>{
  'use strict';
  const root=document.getElementById('sourceVerification');
  const list=document.getElementById('ddVerificationList');
  const update=document.getElementById('ddVerificationUpdated');
  if(!root||!list||!update)return;
  const el=(tag,className,text)=>{
    const item=document.createElement(tag);
    if(className)item.className=className;
    if(text!==undefined)item.textContent=String(text);
    return item;
  };
  const strictDate=value=>{
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const date=new Date(value+'T00:00:00Z');
    return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value?value:null;
  };
  const longDate=value=>{
    const date=strictDate(value);
    return date?new Date(date+'T12:00:00Z').toLocaleDateString('en-GB',{
      day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):'Date not verified';
  };
  const href=url=>{
    try{
      const u=new URL(String(url));
      const hosts=['www.archives.gov','reaganlibrary.archives.gov',
      'documents2.theblackvault.com','projectaquarius.mufon.com',
      'www.esd.whs.mil','zenodo.org','www.gov.br','www.canada.ca'];
      return u.protocol==='https:'&&!u.username&&!u.password&&hosts.includes(u.hostname)?u.href:null;
    }catch{return null;}
  };
  const allowedStatuses=new Set(['sent_unacknowledged','acknowledged','response_received','closed_with_unresolved_questions']);
  const statusLabels={
    sent_unacknowledged:'Enquiry sent · acknowledgement not verified',
    acknowledged:'Acknowledged by agency',
    response_received:'Reply received · scope described below',
    closed_with_unresolved_questions:'Response reviewed · questions remain'
  };
  const mandatoryString=(v,max=650)=>typeof v==='string'&&v.trim().length>0&&v.length<=max?v:null;
  function renderRecord(r){
    const doc=el('article','dd-verification-card');
    doc.dataset.enquiryId=r.id;
    const head=el('div','dd-verification-header');
    const main=el('div');
    main.append(el('span','dd-verification-category',r.category),el('h3','',r.title),
      el('p','dd-verification-agency',r.agency));
    const chip=el('span','dd-verification-state',statusLabels[r.status]);
    chip.setAttribute('data-status',r.status);
    head.append(main,chip);doc.append(head);
    doc.append(el('p','dd-verification-question',r.question));
    const dates=el('p','dd-verification-dates',
      'Enquiry sent: '+(r.dateSent?longDate(r.dateSent):'Exact date not verified')+' · Last documented: '+longDate(r.lastVerified));
    doc.append(dates);
    doc.append(el('p','dd-verification-detail',r.statusDetail));
    const trail=el('ol','dd-verification-timeline');
    for(const t of r.timeline){
      const item=el('li','');
      const when=el('time','',longDate(t.date));
      when.dateTime=t.date;
      item.append(when,el('strong','',t.title),el('p','',t.detail));
      trail.append(item);
    }
    doc.append(trail);
    const details=el('details','dd-verification-sources');
    details.append(el('summary','', 'Original records, limitations and verification criteria'));
    const inner=el('div','dd-verification-expand');
    inner.append(el('p','','Why we asked: '+r.sourceWarning),
       el('p','','What would verify the answer: '+r.evidenceRequirement));
    const sources=el('ul','dd-verification-links');
    for(const source of r.publicSources){
      const safe=href(source.url);if(!safe)continue;
      const li=el('li','');
      const a=el('a','',source.label);a.href=safe;a.target='_blank';a.rel='noopener noreferrer';
      li.append(a,el('p','',source.purpose));sources.append(li);
    }
    inner.append(sources);
    details.append(inner);doc.append(details);
    return doc;
  }
  fetch('/data/public-source-verification.json',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw Error('Could not load public verification record');return r.json();})
    .then(d=>{
      if(d.schemaVersion!==1||!Array.isArray(d.records)||d.records.length<1||d.records.length>25||
         !strictDate(d.lastUpdated)||!d.disclosure?.outgoingMailAcceptedNotAgencyReceipt||
         d.disclosure?.agencyResponseConfirmed!==true||
         d.disclosure?.noFormalFOIAFilingEstablished!==true)throw Error('Invalid tracker contract');
      const ids=new Set(),cards=[];
      for(const r of d.records){
        if(!r||typeof r.id!=='string'||!(/^[a-z0-9-]{4,80}$/).test(r.id)||ids.has(r.id)||
          !allowedStatuses.has(r.status)||(r.dateSent!==null&&!strictDate(r.dateSent))||!strictDate(r.lastVerified)||
          !mandatoryString(r.title)||!mandatoryString(r.agency)||
          !mandatoryString(r.category)||!mandatoryString(r.question)||
          !mandatoryString(r.statusDetail)||!mandatoryString(r.sourceWarning)||
          !mandatoryString(r.evidenceRequirement)||!Array.isArray(r.timeline)||
          r.timeline.length<1||r.timeline.length>12||!Array.isArray(r.publicSources)||
          r.publicSources.length<1||r.publicSources.length>12)throw Error('Invalid public research record');
        if(r.timeline.some(t=>!strictDate(t.date)||!mandatoryString(t.title)||
          !mandatoryString(t.detail)))throw Error('Invalid timeline');
        ids.add(r.id);cards.push(renderRecord(r));
      }
      // Replace skeleton atomically; no HTML parsing from external JSON.
      list.replaceChildren(...cards);
      update.textContent='Research log last updated '+longDate(d.lastUpdated)+
        ' · Status verified manually, not live government tracking.';
    }).catch(error=>{
      console.warn('Source verification tracker unavailable:',error);
      list.replaceChildren(el('p','dd-verification-error',
        'The verification log could not be loaded. No agency response status can be confirmed here. Please check the original source links below.'));
      update.textContent='Research log temporarily unavailable; do not infer a reply or a case decision.';
    });
})();

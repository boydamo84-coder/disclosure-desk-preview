/* M57 prototype only: weighted personal evidence worksheet, NO vote storage/API/account.
   Future member votes must be implemented server-side after separate security review. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DDWhoMemberEvidenceWorksheet=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const criteria=Object.freeze([
  Object.freeze({id:'original',label:'Original record and context',max:25}),
  Object.freeze({id:'independent',label:'Independent corroboration',max:30}),
  Object.freeze({id:'direct',label:'Direct records and measurements',max:25}),
  Object.freeze({id:'testable',label:'Methodology and testability',max:10}),
  Object.freeze({id:'alternatives',label:'Alternatives and uncertainty',max:10})
 ]);
 const maximum=criteria.reduce((n,c)=>n+c.max,0);
 function calculate(answers){
  if(!answers||typeof answers!=='object'||Array.isArray(answers))throw new TypeError('Answers must be an object');
  const validIds=new Set(criteria.map(c=>c.id));
  if(Object.keys(answers).some(k=>!validIds.has(k)))throw new RangeError('Unknown assessment category');
  let answered=0,subTotal=0,maxAnswered=0;
  const rows=criteria.map(c=>{
   if(!Object.prototype.hasOwnProperty.call(answers,c.id)||answers[c.id]===null){
    return {id:c.id,max:c.max,score:null,status:'not_enough_information'};
   }
   const score=answers[c.id];
   if(!Number.isInteger(score)||score<0||score>c.max)throw new RangeError('Invalid '+c.id+' points');
   answered++;subTotal+=score;maxAnswered+=c.max;
   return {id:c.id,max:c.max,score,status:'assessed'};
  });
  return Object.freeze({
   answered,unanswered:criteria.length-answered,
   points:answered===criteria.length?subTotal:null,
   possible:maximum,
   assessedSubtotal:subTotal,
   assessedMaximum:maxAnswered,
   complete:answered===criteria.length,
   rows
  });
 }
 return Object.freeze({criteria,maximum,calculate});
});
'use strict';
// Parse executable inline JS in the actual allowlisted HTML. External-module
// checks alone do not protect the homepage or embedded editor from parse errors.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const pages=['index.html','guide.html','sources.html','privacy.html','community-rules.html','research-edition.html',
 ...fs.readdirSync('research').filter(p=>p.endsWith('.html')).map(p=>'research/'+p)];
let count=0;
for(const file of pages){
 const html=fs.readFileSync(file,'utf8');
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  const attrs=match[1];
  if(/\bsrc\s*=/i.test(attrs)||/type\s*=\s*["'](?:application\/ld\+json|application\/json|importmap)["']/i.test(attrs))continue;
  const line=html.slice(0,match.index).split('\n').length;
  new vm.Script(match[2],{filename:file+':'+line});count++;
 }
}
console.log('PASS '+count+' executable inline scripts parsed across '+pages.length+' published HTML pages');

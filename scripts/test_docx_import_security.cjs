'use strict';
// Actual distributed parser in a disposable worker-like VM; no account or network.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const JSZip=require('../research/vendor-jszip-3.10.1.js');
const source=fs.readFileSync('research/docx-import-worker.js','utf8');
const context={ArrayBuffer,Uint8Array,TextDecoder,TextEncoder,Blob,setTimeout,clearTimeout,setImmediate,clearImmediate,console};
context.self=context;
vm.createContext(context);
context.importScripts=(...names)=>{for(const name of names){assert.match(name,/^\.\/vendor-(jszip-3\.10\.1|mammoth-1\.12\.3)\.js$/);vm.runInContext(fs.readFileSync('research/'+name.slice(2),'utf8'),context)}};
vm.runInContext(source,context);
async function convert(buffer){let answer;context.postMessage=value=>{answer=value};await context.onmessage({data:{buffer}});assert(answer,'Worker must answer');return answer}
async function word(extra){
 const zip=new JSZip();
 zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 zip.file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>SAFE IMPORT SENTINEL</w:t></w:r></w:p></w:body></w:document>');
 zip.file('word/styles.xml','<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="__proto__"><w:name w:val="pollution-sentinel"/></w:style></w:styles>');
 zip.file('mammoth/style-map','p[style-name="unterminated');
 if(extra)extra(zip);
 return zip.generateAsync({type:'arraybuffer',compression:'DEFLATE'});
}
(async()=>{
 const safe=await convert(await word());assert.equal(safe.error,undefined);assert.match(safe.value,/SAFE IMPORT SENTINEL/);assert.equal(vm.runInContext('Object.prototype.styleId',context),undefined);assert.equal(vm.runInContext('Object.prototype.name',context),undefined);
 console.log('PASS DOCX actual parser converts text, rejects prototype style keys and ignores embedded style map');
 const notWord=await convert(await new JSZip().file('hello.txt','hello').generateAsync({type:'arraybuffer'}));assert.match(notWord.error,/not a supported Word/);
 const packed=await convert(new ArrayBuffer(14*1024*1024+1));assert.match(packed.error,/smaller than 14 MB/);
 const expanded=await convert(await word(zip=>zip.file('word/oversized.xml','x'.repeat(16*1024*1024+1))));assert.match(expanded.error,/safe import size/);
 const many=await convert(await word(zip=>{for(let i=0;i<4001;i++)zip.file('word/extra-'+i+'.xml','x')}));assert.match(many.error,/too many embedded files/);
 console.log('PASS DOCX worker rejects non-Word, oversized input, oversized expansion and excessive entries');
 assert.match(fs.readFileSync('research/docx-tools.js','utf8'),/worker\.terminate\(\)/);assert.match(source,/externalFileAccess:false,includeEmbeddedStyleMap:false/);
 console.log('PASS DOCX worker is terminated after conversion and external files remain disabled');
})().catch(error=>{console.error(error);process.exitCode=1});

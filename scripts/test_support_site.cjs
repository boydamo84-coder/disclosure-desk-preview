'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('assets/support-site.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert.doesNotThrow(()=>new Function(code));
const sandbox={window:{},URL,document:{readyState:'loading',addEventListener:()=>{}}};
vm.createContext(sandbox);vm.runInContext(code,sandbox);
const validate=sandbox.window.DDSupportSite.validateSupportUrl;
assert.equal(validate(''),null,'No account, no link');
assert.equal(validate('https://ko-fi.com/realpage'),'https://ko-fi.com/realpage');
for(const bad of ['http://ko-fi.com/person','https://ko-fi.com.evil.org/person',
 'https://ko-fi.com/','https://ko-fi.com/person/checkout','https://ko-fi.com/person?x=1',
 'javascript:alert(1)','https://bad:credentials@ko-fi.com/person']){
 assert.equal(validate(bad),null,'Reject untrusted destination');
}
assert.match(code,/const VERIFIED_KOFI_PAGE_URL='';/,'Do not invent an account URL');
assert.match(code,/if\(!url\)return/,'No support link until owner verifies account');
assert.match(code,/\.dd-site-footer-actions/);
assert.match(code,/#about \.section/);
assert.match(code,/All research tools remain free/);
assert.match(code,/noopener noreferrer/);
assert.match(html,/assets\/support-site\.js\?v=/);
const nav=html.match(/<nav\s+class="nav"[\s\S]*?<\/nav>/i)?.[0]||'';
assert.equal((nav.match(/class="tab(?: active)?"/g)||[]).length,11);
console.log('PASS dormant Ko-fi support link, validated HTTPS profile, voluntary copy, footer/About and 11 tabs.');
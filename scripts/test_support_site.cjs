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
assert.match(code,/header\.top/,'Visible sticky header receives voluntary support link after account creation');
assert.match(code,/dd-header-support/,'Distinct small header link class');
assert.match(code,/#ddProfileShortcut/,'Header support link stays beside profile shortcut');
assert.match(code,/Support Disclosure Desk voluntarily on Ko-fi/);
assert.match(code,/#about \.section/);
assert.match(code,/All research tools remain free/);
assert.match(code,/noopener noreferrer/);
assert.match(html,/assets\/support-site\.js\?v=/);
assert.match(html,/\.top \.dd-header-support/,'Match gold-and-navy header design');
assert.match(html,/@media\(max-width:430px\)\{\.top \.dd-header-support/,'Compact icon on small screens');
const nav=html.match(/<nav\s+class="nav"[\s\S]*?<\/nav>/i)?.[0]||'';
assert.equal((nav.match(/class="tab(?: active)?"/g)||[]).length,11);
console.log('PASS dormant Ko-fi support link, validated HTTPS profile, voluntary copy, footer/About and 11 tabs.');
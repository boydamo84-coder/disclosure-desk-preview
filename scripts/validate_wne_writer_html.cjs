'use strict';
// Fail a W.NE Android APK build if the real Writer HTML would print JavaScript
// below the document or swallow its menu scripts inside an unclosed stylesheet.
// This adds a small static gate; separate real-browser CI verifies interactions.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('research/wne.html','utf8');
const count=re=>(html.match(re)||[]).length;
assert.equal(count(/<style\b/gi),count(/<\/style>/gi),'Unclosed W.NE <style>');
assert.equal(count(/<script\b/gi),count(/<\/script>/gi),'Unclosed W.NE <script>');
assert.equal(count(/<\/body>/gi),1,'W.NE body must end only once');
assert.equal(count(/<\/html>/gi),1,'W.NE html must end only once');
const bodyClose=html.indexOf('</body>'),htmlClose=html.indexOf('</html>');
assert(bodyClose>0&&htmlClose>bodyClose,'Missing final Writer body/html closure');
assert(/^\s*$/.test(html.slice(htmlClose+'</html>'.length)),
 'Late toolbar scripts/styles MUST NOT appear as visible text after </html>');
const ribbon=html.indexOf('<script id="dd-word-ribbon-v1">');
assert(ribbon>0&&ribbon<bodyClose,'Ribbon script must be inside Writer body');
const originalStyle=html.indexOf('<style>');
const nextStyle=html.indexOf('<style',originalStyle+1);
const initialEnd=html.indexOf('</style>',originalStyle);
assert(originalStyle>0&&originalStyle<initialEnd&&initialEnd<nextStyle,
 'The base stylesheet must close before subsequent scripts or styles');
assert(html.indexOf('const toolbar=document.querySelector(\'.formatbar\')',ribbon)>ribbon,
 'Expected working Word-style ribbon code absent');
console.log('PASS Writer HTML is structurally closed with executable ribbon in body');

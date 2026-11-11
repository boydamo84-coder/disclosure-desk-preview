'use strict';
// M78: inspect actual Java-injected JS and assert Profile settings placement.
// No Supabase, user data, or WebView bridge network calls.
const assert=require('node:assert/strict'),fs=require('node:fs');
const main=fs.readFileSync('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java','utf8');
const html=fs.readFileSync('index.html','utf8');
const begin=main.indexOf('private void installProfileNotificationControl(){');
const finish=main.indexOf('private void showFirstRunAlertsPrompt(){',begin);
assert(begin>=0&&finish>begin,'Native Profile injection method found');
const block=main.slice(begin,finish);
assert(block.includes("var settings=document.getElementById('ddProfileSettings');"),
 'Control belongs to existing Profile settings, not page heading');
assert(!block.includes('dd-profile-heading'),'No standalone above-profile notification card');
assert(block.includes("var panel=document.createElement('details')"),'Collapsible nested subsection');
assert(block.includes("meta.insertAdjacentElement('afterend',panel)"),'Under Profile details metadata');
assert(block.includes("summary.append(label,chevron)"),'Matching existing profile accordion');
assert(block.includes("window.DDAndroid.postMessage(JSON.stringify({type:'open_notification_settings'}))"),
 'Native origin-restricted bridge remains unchanged');
assert(block.includes("if(!settings||document.getElementById('ddAndroidAlertsSettings'))return"),
 'Repeated page loads do not duplicate settings');
assert(html.includes('id="ddProfileSettings"'),'Real profile settings exist');
assert(html.includes('class="dd-profile-settings-meta"'),'Expected insertion anchor exists');
assert(main.includes('Enable available alerts'),'One-time opt-in retained');
assert(main.includes('prefs.getBoolean(FIRST_RUN_ALERTS_CHOICE,false)'),'Opt-in remains one-time');
assert(!main.includes('root.addView(notifications,bell)'),'No floating notification bell');
assert(main.includes('PLAY_BILLING_APPROVED = false'),'Unverified billing still gated');
const scriptExpression=block.slice(block.indexOf('String javascript='),block.indexOf('web.evaluateJavascript(javascript,null)'));
const encoded=[...scriptExpression.matchAll(/"(?:\\.|[^"\\])*"/g)].map(m=>m[0]);
assert(encoded.length>=12,'Extracted all Java string pieces');
const injectedJs=encoded.map(x=>JSON.parse(x)).join('');
new Function(injectedJs);
assert(injectedJs.includes('ddProfileSettings'),'Real injected JS targets Profile settings');
assert(injectedJs.includes('ddAndroidAlertsSettings'),'Nested UI has stable ID');
assert(!injectedJs.includes('dd-profile-heading'),'No top-level placement');
module.exports={getInjectedJs:()=>injectedJs};
if(require.main===module)console.log('PASS M78 real native-injected JS parsed; notification control nested under Profile settings; previous prompts intact.');

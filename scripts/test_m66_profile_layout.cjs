'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('index.html'),style=read('assets/community-polish.css'),avatar=read('assets/profile-avatars.js');
const start=html.indexOf('<section id="profilePage"'),end=html.indexOf('<section id="ddProfileAdmin"',start);
assert(start>=0&&end>start,'Real profile region present');
const page=html.slice(start,end);
function where(label,marker){const at=page.indexOf(marker);assert(at>=0,'Missing '+label);return at}
const sequence=[
 ['photo and name','id="ddProfileIdentityCard"'],
 ['profile picture','id="ddAvatarPanel"'],
 ['username','id="ddProfileDisplayName"'],
 ['received likes','id="ddProfileLikesReceived"'],
 ['received dislikes','id="ddProfileDislikesReceived"'],
 ['cloud summaries','id="ddProfileFilesCount"'],
 ['board summaries','id="ddProfileBoardsCount"'],
 ['witness summaries','id="ddProfileWitnessCount"'],
 ['cloud documents section','id="ddProfileFilesList"'],
 ['Boards section','id="ddProfileBoardsList"'],
 ['witness reports section','id="ddProfileWitnessList"'],
 ['comments section','id="ddProfileCommentsList"'],
 ['private chat section','id="ddProfileChatPanel"'],
 ['collapsed settings section','id="ddProfileSettings"'],
 ['photo settings','id="ddAvatarSettings"'],
 ['username settings','id="ddProfileUsername"'],
 ['account security','id="ddProfilePasswordForm"']
];
const at=sequence.map(([name,marker])=>where(name,marker));
for(let i=1;i<at.length;i++)
 assert(at[i]>at[i-1],'Profile order mismatch at '+sequence[i][0]);
const top=page.slice(0,where('settings','id="ddProfileSettings"'));
assert(!top.includes('id="ddAvatarFile"'),'Profile header must show photo, NOT photo picker');
assert(!top.includes('id="ddAvatarRemove"'),'Profile header must show photo, NOT remove button');
assert(!top.includes('id="ddProfileEmail"'),'Email should be in private Profile Settings');
const settings=page.slice(where('settings','id="ddProfileSettings"'));
for(const id of ['ddAvatarFile','ddAvatarRemove','ddAvatarSave','ddAvatarVisible','ddAvatarStatus','ddProfileEmail','ddProfileVerification','ddProfileSignOut']){
 assert(settings.includes('id="'+id+'"'),'Settings must preserve '+id);
}
for(const id of ['ddAvatarPanel','ddAvatarImage','ddAvatarFallback','ddAvatarFile','ddAvatarRemove','ddAvatarSave','ddAvatarVisible','ddAvatarStatus','ddProfileRefresh','ddProfileLikesReceived','ddProfileDislikesReceived']){
 assert.equal(page.split('id="'+id+'"').length-1,1,'Unique required control '+id);
}
assert.match(page,/<details id="ddProfileSettings"[^>]*>/,'Settings remain collapsed by default');
assert.match(page,/<details id="ddAvatarSettings"[^>]* hidden>/,'Avatar controls hidden until signed in');
assert.match(page,/<label[^>]+for="ddAvatarFile"[^>]*>Change photo<input[^>]+id="ddAvatarFile"/,'Change-photo label opens the existing upload input');
assert.match(page,/id="ddAvatarPhotoRequirements"/,'Photo sizes/formats are accessible on demand');
assert.match(page,/id="ddProfileReactionBreakdown"/,'Keep M64 optional reaction detail');
assert.match(avatar,/settingsPanel\.hidden=false/,'Avatar settings available after own-account auth');
assert.match(avatar,/settingsPanel\.hidden=true/,'Avatar settings hidden after sign-out');
assert.match(avatar,/if\(!confirm\('Remove your account profile photo/,'Photo removal still asks for confirmation');
assert.match(avatar,/await uploadPending\(\)/,'Photo selection still auto-saves');
assert.match(style,/#profilePage \.dd-profile-identity-main\{display:flex/);
assert.match(style,/@media\(max-width:360px\)/);
assert.match(style,/#profilePage \.dd-avatar-file-trigger input\[type=file\]/);
assert.match(html,/assets\/profile-avatars\.js\?v=m66-profile-identity/);
assert.match(html,/assets\/community-polish\.css\?v=m67/);
console.log('PASS M66 profile: photo+name+received stats first, cloud/Boards/witness order, controls in collapsed Settings, secured photo auto-save/remove, mobile styles');

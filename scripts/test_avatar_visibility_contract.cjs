'use strict';
const fs=require('fs'),assert=require('assert/strict');
const sql=fs.readFileSync('supabase/migrations/20261108_dd_member_avatars_visible_by_default.sql','utf8');
const config=fs.readFileSync('assets/community-test-config.js','utf8');
assert.match(sql,/create table if not exists public\.dd_avatar_profiles/);
assert.match(sql,/public_key uuid not null unique default gen_random_uuid\(\)/);
assert.match(sql,/visible boolean not null default true/);
assert.match(sql,/false,1048576,array\['image\/webp'\]::text\[\]/);
assert.match(sql,/revoke all on public\.dd_avatar_profiles from PUBLIC, anon, authenticated/);
assert.equal((sql.match(/create policy dd_avatar_/g)||[]).length,5);
for(const term of ['dd_avatar_my_settings','dd_avatar_set_visibility','dd_avatar_public_keys',
 'dd_avatar_is_owner_path','dd_avatar_is_visible_path'])assert.match(sql,new RegExp(term));
assert.match(sql,/n\.is_public and a\.visible/);
assert.match(sql,/public\.dd_avatar_is_visible_path\(name\)/);
assert.match(sql,/storage\.allow_any_operation\(array\['object\.get_authenticated','object\.get_authenticated_info'\]\)/);
assert.doesNotMatch(sql,/public\.dd_avatar_profiles.*grant select.*anon/i);
assert.match(config,/profileAvatars:false/,'Live site must stay gated');
console.log('PASS: opaque-avatar-key metadata, default-visible uploads, server-backed opt-out, owner-only writes, limited anonymous read for opted-in public aliases.');

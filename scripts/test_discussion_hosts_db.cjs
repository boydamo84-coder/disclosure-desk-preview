'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const {PGlite} = require('@electric-sql/pglite');
const queue = require('../docs/research-release/discussion-host-queue.json');
const migration = fs.readFileSync('supabase/DISCUSSION_HOSTS_TRIAL_DRAFT_NOT_APPLIED.sql', 'utf8');

const owner = '7d4e05c0-6329-4ee0-b62f-307cae42740f';
const member = '2a2299cb-a794-4060-a0df-3cb546a3c656';
const sections = [...new Set(queue.map(post => post.sectionKey))];
const db = new PGlite();
const q = (sql, params) => db.query(sql, params);
const read = async (sql, params) => (await q(sql, params)).rows[0]?.result;
const claim = async (role, id, anonymous = false) => {
  await db.exec('reset role');
  await q("select set_config('dd_test.user', $1, false), set_config('dd_test.anon', $2, false)", [id || '', String(anonymous)]);
  await db.exec('set role ' + role);
};

(async () => {
  assert.equal(queue.length,42);
  assert.equal(new Set(queue.map(post => post.host)).size,5);
  assert.equal(new Set(queue.map(post => post.title.toLowerCase().trim())).size,42);
  for (let day=1; day<=14; day++) assert.equal(queue.filter(post => post.day===day).length,3);

  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('dd_test.user',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('is_anonymous',current_setting('dd_test.anon',true))$$;
    create table public.dd_forum_sections (id uuid primary key default gen_random_uuid(), name_key text unique, title text, status text default 'published');
    create table public.dd_forum_owner_admins (user_id uuid primary key);
    create table public.dd_forum_threads (
      id uuid primary key,section_id uuid references public.dd_forum_sections(id),author_id uuid,title text,body text,
      link_url text,post_tone text,status text default 'published',updated_at timestamptz default now()
    );
  `);
  await q('insert into public.dd_forum_owner_admins values ($1)', [owner]);
  for (const name of sections) await q('insert into public.dd_forum_sections(name_key,title) values ($1,$1)',[name]);
  await db.exec(migration);
  assert.equal(await read('select dd_host_private.seed($1) result', [JSON.stringify(queue)]),42);
  await assert.rejects(q('select dd_host_private.seed($1)',[JSON.stringify(queue)]), /disabled 42-post trial/);
  const dayOne = await read("select ((now() at time zone 'UTC')::date+1)::text result");
  const due = dayOne + 'T09:00:00Z';
  assert.equal(await read('select dd_host_private.publish_due($1) result',[due]),null);

  await claim('anon');
  await assert.rejects(q('select public.dd_host_admin_queue()'), /permission denied/);
  await assert.rejects(q('select dd_host_private.publish_due()'), /permission denied/);
  await claim('authenticated',member);
  await assert.rejects(q('select public.dd_host_admin_queue()'), /owner access/);
  await assert.rejects(q("select public.dd_host_admin_control('pause')"), /owner access/);
  await claim('authenticated',owner,true);
  await assert.rejects(q('select public.dd_host_admin_queue()'), /owner access/);

  await claim('authenticated',owner);
  const before = await read('select public.dd_host_admin_queue() result');
  assert.equal(before.trial.enabled_by_operator,false);
  assert.equal(before.posts.length,42);
  const [first,second,third,fourth] = before.posts;
  const edit = (post, title, source = post.source) => q(
    'select public.dd_host_admin_edit($1,$2,$3,$4,$5,$6)',
    [post.id,title,post.body,source,post.section_key,post.minute]
  );
  await assert.rejects(edit(first,second.title), /unique/);
  await assert.rejects(edit(first,first.title,'https://example.org/disallowed'), /source_check/);
  await edit(first,'A trial-specific edited prompt');
  await q("select public.dd_host_admin_control('schedule',$1)",[dayOne]);
  for (const post of [first,second,third,fourth]) await q("select public.dd_host_admin_post($1,'approve')",[post.id]);
  await q("select public.dd_host_admin_post($1,'cancel')",[third.id]);
  await assert.rejects(q("select public.dd_host_admin_control('resume')"), /operator activation/);

  await db.exec('reset role; update dd_host_private.trial set enabled_by_operator=true;');
  assert.equal(await read('select dd_host_private.publish_due($1) result',[due]),null,'paused');
  await claim('authenticated',owner);
  await q("select public.dd_host_admin_control('resume')");
  await db.exec('reset role');
  const results = await Promise.all(Array.from({length:3}, () => read('select dd_host_private.publish_due($1) result',[due])));
  assert.equal(results.filter(id => id===first.id).length,1);
  assert.equal(results.filter(id => id===null).length,2);
  assert.equal(await read('select count(*)::integer result from public.dd_forum_threads'),1);
  assert.match(await read('select body result from public.dd_forum_threads where id=$1',[first.id]), /^Automated discussion host · The Investigator/);
  assert.equal(await read('select author_id result from public.dd_forum_threads where id=$1',[first.id]),null);
  await claim('anon');
  assert.deepEqual((await q('select * from public.dd_discussions_host_labels($1)',[[first.id,second.id]])).rows,
    [{id:first.id,host:'investigator'}]);
  await claim('authenticated',owner);
  await q("select public.dd_host_admin_post($1,'remove')",[first.id]);
  await q("select public.dd_host_admin_control('pause')");
  await db.exec('reset role');
  assert.equal(await read('select status result from public.dd_forum_threads where id=$1',[first.id]),'removed');
  assert.equal(await read('select dd_host_private.publish_due($1) result',[dayOne+'T13:30:00Z']),null);
  await claim('authenticated',owner);
  await q("select public.dd_host_admin_control('resume')");
  await db.exec('reset role');
  assert.equal(await read('select dd_host_private.publish_due($1) result',[dayOne+'T14:45:00Z']),null,'stale slot does not catch up');
  assert.equal(await read('select dd_host_private.publish_due($1) result',[dayOne+'T19:00:00Z']),null,'cancelled');
  const dayFifteen = await read("select ($1::date+14)::text result",[dayOne]);
  assert.equal(await read('select dd_host_private.publish_due($1) result',[dayFifteen+'T09:00:00Z']),null);
  assert.equal(await read('select count(*)::integer result from dd_host_private.queue where state in (\'approved\',\'draft\')'),0);
  assert.equal(await read('select paused result from dd_host_private.trial'),true);
  await claim('anon');
  assert.deepEqual((await q('select * from public.dd_discussions_host_labels($1)',[[first.id]])).rows,[]);
  console.log('PASS 42 drafts, owner and guest boundaries, pause, schedule, retries, expiry, removal and genuine labels in disposable PostgreSQL');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>db.close());

'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');const {PGlite}=require('@electric-sql/pglite');
(async()=>{
 const db=new PGlite();try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema dd_host_private;
    create table dd_host_private.trial(singleton boolean primary key,enabled_by_operator boolean,paused boolean,starts_on date);
    insert into dd_host_private.trial values(true,true,false,(now() at time zone 'UTC')::date);
    create table dd_host_private.queue(id uuid primary key);
    create table public.dd_forum_sections(id uuid primary key,status text);
    create table public.dd_forum_threads(id uuid primary key,section_id uuid,author_id uuid,title text,post_tone text,status text,created_at timestamptz);
    insert into public.dd_forum_sections values('00000000-0000-4000-8000-000000000001','published'),('00000000-0000-4000-8000-000000000002','hidden');`);
  const valid='00000000-0000-4000-8000-000000000111',bot='00000000-0000-4000-8000-000000000112',human='00000000-0000-4000-8000-000000000999';
  for(const [id,section,author,title,tone,state] of [
   [valid,1,human,'Evidence and sources','serious','published'],
   [bot,1,null,'FOIA archives','serious','published'],
   ['00000000-0000-4000-8000-000000000113',1,human,'Research and evidence','serious','hidden'],
   ['00000000-0000-4000-8000-000000000114',2,human,'Research and evidence','serious','published'],
   ['00000000-0000-4000-8000-000000000115',1,human,'Research and evidence','fun','published'],
   ['00000000-0000-4000-8000-000000000116',1,human,'Unrelated chat','serious','published']
  ])await db.query("insert into public.dd_forum_threads values($1,$2,$3,$4,$5,$6,now())",[id,section===1?'00000000-0000-4000-8000-000000000001':'00000000-0000-4000-8000-000000000002',author,title,tone,state]);
  await db.query('insert into dd_host_private.queue values($1)',[bot]);
  await db.exec(fs.readFileSync('supabase/DISCUSSION_HOST_PUBLIC_PICKS_20261127.sql','utf8'));
  const read=async role=>{await db.exec('reset role; set role '+role);let result=(await db.query('select public.dd_host_public_picks() result')).rows[0].result;await db.exec('reset role');return result};
  for(const role of ['anon','authenticated']){
    const value=await read(role);assert.equal(value.active,true);assert.deepEqual(value.discussions,[{id:valid,host:'investigator'}]);
  }
  await db.exec('update dd_host_private.trial set paused=true;');assert.deepEqual((await read('anon')).discussions,[]);assert.equal((await read('anon')).active,false);
  await db.exec("update dd_host_private.trial set paused=false,starts_on=(now() at time zone 'UTC')::date-14;");assert.equal((await read('anon')).active,false);
  await db.exec("update dd_host_private.trial set starts_on=(now() at time zone 'UTC')::date+1;");assert.equal((await read('anon')).active,false);
  await db.exec("set role service_role;");await assert.rejects(db.query('select public.dd_host_public_picks()'),/permission denied/);await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int num from public.dd_forum_threads')).rows[0].num,6);
  console.log('PASS isolated DB: public read-only, members only, published serious threads, excludes bots, hidden and fun posts, pause and expiry');
 }finally{await db.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

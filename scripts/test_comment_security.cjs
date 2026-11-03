'use strict';
// Source contract ONLY; SQL role acceptance is separately checked by rollback SQL.
const assert=require('node:assert/strict'),fs=require('node:fs');
const sql=fs.readFileSync('supabase/COMMENT_SECURITY_HARDENING_REVIEW.sql','utf8');
const base=fs.readFileSync('supabase/migrations/20261031_case_comments_foundation.sql','utf8');
const comments=sql.split('create or replace function public.dd_guard_comment_insert()')[1]?.split('create or replace function public.dd_guard_comment_flag()')[0]||'';
const flags=sql.split('create or replace function public.dd_guard_comment_flag()')[1]||'';
assert.match(sql,/drop policy if exists dd_comments_submit/);
assert.match(sql,/drop policy if exists dd_flags_insert/);
assert.match(sql,/coalesce\(\(auth\.jwt\(\)->>'is_anonymous'\)::boolean,false\)=false/g,'Both write policies must block anonymous auth sessions');
assert.match(sql,/c\.author_id<>\(select auth\.uid\(\)\)/,'No self-flags at RLS policy layer');
assert.match(comments,/Registered account required to comment/);
assert.match(flags,/Registered account required to flag a comment/);
assert.match(flags,/c\.author_id<>auth\.uid\(\)/,'Trigger also blocks self flags');
assert.match(comments,/pg_advisory_xact_lock\(hashtext\('dd-comment-user:'\|\|new\.author_id::text\)\)/);
assert.match(flags,/pg_advisory_xact_lock\(hashtext\('dd-comment-flag-user:'\|\|new\.reporter_id::text\)\)/);
assert.match(flags,/pg_advisory_xact_lock\(hashtext\('dd-comment-flags:'\|\|new\.comment_id::text\)\)/,'Fifth flag concurrency requires per-item lock BEFORE insertion');
assert.match(comments,/>=5/);
assert.match(comments,/>=40/);
assert.match(flags,/>=12/);
assert.match(comments,/Duplicate comment/);
assert.match(base,/unique \(comment_id,reporter_id\)/i,'Existing one-flag-per-account unique key preserved');
assert.match(sql,/revoke all on function public\.dd_guard_comment_insert\(\) from public,anon,authenticated/);
assert.match(sql,/revoke all on function public\.dd_guard_comment_flag\(\) from public,anon,authenticated/);
assert.doesNotMatch(sql,/grant\s+(?:insert|update|delete)\s+on\s+public\.dd_case_comments\s+to\s+anon/i);
console.log('PASS: staged comment/flag security patch enforces registered-only, no self-flags, per-user rate locks, and restricted triggers');

// Browser copy is equally important: never pretend a rejected post/flag was accepted.
const caseUi=fs.readFileSync('assets/case-discussions.js','utf8');
const newsUi=fs.readFileSync('assets/inline-news-comments.js','utf8');
assert.match(caseUi,/item\.is_mine/,'Case UI uses privacy-safe is_mine from public RPC');
assert.match(caseUi,/You cannot flag your own comment/);
assert.match(newsUi,/You have already flagged this comment/);
assert.match(newsUi,/Sign in with a registered account to comment/);
assert.match(caseUi,/You have already posted this comment/);
assert.match(newsUi,/Posting limit reached/);

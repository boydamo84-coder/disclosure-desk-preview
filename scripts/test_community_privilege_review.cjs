'use strict';
/* GitHub-only static preflight; never connects to a live Supabase project.
 * A no-op rollback rehearsal SQL is reviewed before an explicitly approved
 * migration, and the browser's owner-controlled operations are retained. */
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('supabase/COMMUNITY_EXTRA_PRIVILEGES_REVIEW.sql','utf8');
const web=fs.readFileSync('assets/research-hub.js','utf8');
const document=fs.readFileSync('docs/COMMUNITY_ROLE_PRIVILEGE_AUDIT_2026-11-04.md','utf8');
const runnable=source.replace(/^\s*--[^\n]*$/gm,'').trim();
assert.match(runnable,/^BEGIN;[\s\S]*ROLLBACK;$/i,'Review must be rolled back, never committed');
assert.doesNotMatch(runnable,/\bCOMMIT\s*;/i,'No commit allowed in review-only SQL');
assert.doesNotMatch(runnable,/\bDROP\s+TABLE\b|\bDELETE\s+FROM\b|\bTRUNCATE\s+TABLE\b|\bINSERT\s+INTO\b/i,
  'No destructive or data-creating statements are allowed');
assert.match(runnable,/SET LOCAL lock_timeout\s*=/i,'Bound lock waits even on a clone');
assert.match(runnable,/SET LOCAL statement_timeout\s*=/i,'Bound query run time');
const revoke=runnable.match(/REVOKE TRUNCATE, TRIGGER ON TABLE([\s\S]*?)FROM anon, authenticated;/i);
assert.ok(revoke,'Revoke only TRUNCATE and TRIGGER from client roles');
const tables=Array.from(revoke[1].matchAll(/public\.([a-z_]+)\b/g),m=>m[1]);
const expected=["dd_case_comment_flags","dd_case_comments","dd_email_backup_limit","dd_media_votes","dd_public_names","investigation_boards","research_assets","research_documents","research_reference_backups","video_progress"];
assert.deepEqual(tables,expected,'Exact ten audited public-schema tables only');
assert.doesNotMatch(runnable,/\bREVOKE\s+(?:SELECT|INSERT|UPDATE|DELETE)\b/i,
  'Do not break UI and owner moderation operations');
assert.doesNotMatch(revoke[0],/\bservice_role\b|\bpostgres\b/i,'Privileged server roles unchanged');
assert.match(runnable,/has_table_privilege\('anon',[^\n]+, 'TRUNCATE'\)/i);
assert.match(runnable,/has_table_privilege\('authenticated',[^\n]+, 'TRIGGER'\)/i);
assert.match(runnable,/has_table_privilege\('authenticated','public\.dd_witness_reports','DELETE'\)/i);
assert.match(web,/from\('dd_witness_reports'\)\.delete\(\)\.eq\('id',r\.id\)\.eq\('author_id',user\.id\)\.select\('id'\)/,
  'Existing authenticated owner delete stays scoped to report author');
assert.match(web,/rpc\('dd_edit_my_comment'/,'Comment editor remains available');
assert.match(web,/rpc\('dd_delete_my_comment'/,'Owner comment removal remains available');
for(const op of ['research_trash_document','research_restore_document','research_purge_trashed_document'])
 assert.ok(web.includes(op),'Existing owner document action '+op);
assert.match(document,/NOT APPLIED TO LIVE/i);
assert.match(document,/Data API/i,'Clarify that SQL grants do not directly grant browser arbitrary SQL');
assert.match(document,/rollback/i,'Review and future deployment are separate');
console.log('PASS: 10-table least-privilege SQL REVIEW ONLY; all owner operations and live data untouched');

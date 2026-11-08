// Milestone 26 — pure SPECIFICATION / test model, not a deployed Auth policy.
// PostgreSQL write-fence draft uses the same state / role decision rules.
export const FROZEN_PHASES=Object.freeze([
  "approved","forum_redacted","storage_cleared","auth_removed","complete"
]);
export const AUDITED_OWNER_TABLES=Object.freeze({
  dd_avatar_profiles:["user_id"],
  dd_case_comment_flags:["reporter_id"],
  dd_case_comments:["author_id"],
  dd_chat_blocks:["blocker_id","blocked_id"],
  dd_chat_messages:["author_id"],
  dd_chat_owner_admins:["user_id"],
  dd_chat_pairs:["inviter_id","invitee_id"],
  dd_chat_reports:["reporter_id"],
  dd_comment_moderators:["user_id"],
  dd_content_votes:["voter_id"],
  dd_email_backup_limit:["user_id"],
  dd_forum_audit:["actor_id"],
  dd_forum_escalations:["submitted_by"],
  dd_forum_flags:["reporter_id"],
  dd_forum_owner_admins:["user_id"],
  dd_forum_replies:["author_id"],
  dd_forum_sections:["creator_id","steward_id"],
  dd_forum_threads:["author_id"],
  dd_forum_votes:["voter_id"],
  dd_live_chat_flags:["reporter_id"],
  dd_live_chat_messages:["author_id"],
  dd_media_titles:["submitted_by"],
  dd_media_votes:["user_id"],
  dd_public_names:["user_id"],
  dd_witness_deleted_quota:["author_id"],
  dd_witness_report_flags:["reporter_id"],
  dd_witness_reports:["author_id"],
  investigation_boards:["user_id"],
  research_assets:["user_id"],
  research_document_revisions:["user_id"],
  research_document_trash:["user_id"],
  research_documents:["user_id"],
  research_reference_backups:["user_id"]
});
export function mayWriteForAccount({actorId, jobs, role="authenticated", cleanupLease=null, now=0}){
  if(!actorId)return true;
  const job=jobs?.[actorId];
  if(!job||job.phase==="prepared")return true;
  if(!FROZEN_PHASES.includes(job.phase))return false;
  return role==="service_role" && job.phase!=="complete" &&
    typeof cleanupLease==="string" && cleanupLease.length>0 &&
    cleanupLease===job.lease && Number.isFinite(job.expiresAt) &&
    job.expiresAt>now;
}
export function shouldBlockRowWrite({table,oldRow=null,newRow=null,actorId=null,jobs,role,cleanupLease,now}){
  const cols=AUDITED_OWNER_TABLES[table];
  if(!cols)throw Error("unregistered_owner_table");
  const ids=new Set(actorId?[actorId]:[]);
  for(const col of cols) {
    if(oldRow?.[col])ids.add(oldRow[col]);
    if(newRow?.[col])ids.add(newRow[col]);
  }
  for(const id of ids)
    if(!mayWriteForAccount({actorId:id,jobs,role,cleanupLease,now}))return true;
  return false;
}

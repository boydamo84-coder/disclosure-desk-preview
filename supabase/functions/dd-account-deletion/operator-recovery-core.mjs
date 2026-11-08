// Private operator recovery coordinator — NEVER imported into any public website.
// No public HTTP endpoint. Requires a DBA-created one-use approval ticket.
// All backends are server-side injected; no Supabase credentials or user data in this file.
import { executeApprovedDeletion, validateApprovedJob, DeletionGuardError } from "./execution-core.mjs";

const uuid = value => typeof value==="string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
function requireCondition(ok, reason) {
  if (!ok) throw new DeletionGuardError(reason);
}
const eligiblePhases = Object.freeze([
  "approved", "forum_redacted", "storage_cleared", "auth_removed"
]);
const requiredMethods = Object.freeze([
  "assertStagingEnvironment",
  "readPrivateJob",
  "verifyWriteFreeze",
  "reclaimWithDbaTicket",
  "makeExecutionAdapter"
]);

// Operator-only. An API user, an expired intent, or merely knowing an account
// UUID cannot authorise a resume; the SQL RPC atomically consumes an approval
// inserted into dd_deletion_private by a separate DBA after two-person review.
export async function resumeDeletionWithOperatorApproval(
  { accountId, approvalTicketId, leaseId }, backend
) {
  requireCondition(uuid(accountId) && uuid(approvalTicketId) && uuid(leaseId),
    "invalid_recovery_identifiers");
  requireCondition(backend && requiredMethods.every(n=>typeof backend[n]==="function"),
    "operator_backend_missing");
  requireCondition(await backend.assertStagingEnvironment()===true,
    "staging_environment_required");

  const before=await backend.readPrivateJob(accountId);
  requireCondition(before?.account_id===accountId &&
    eligiblePhases.includes(before.phase), "not_recoverable");
  requireCondition(before.intent_digest===null && !!before.confirmed_at &&
    !!before.reauthenticated_at, "unapproved_original_deletion");
  // Reject malformed/foreign-object manifests BEFORE consuming a DBA ticket.
  validateApprovedJob({
    account_id:before.account_id, phase:before.phase,
    lease_token:before.lease_token,manifest:before.manifest,
    one_time_intent_consumed:before.intent_digest===null,
    reauthentication_verified:!!before.reauthenticated_at,
    confirmation_verified:!!before.confirmed_at
  });
  const expires=Date.parse(before.lease_expires_at || "");
  requireCondition(Number.isFinite(expires) && expires<Date.now(), "existing_lease_not_expired");
  // This must be verified by an actual server-enforced write freeze, not a UI
  // checkbox or an operator's unsupported assertion. Until staging has that
  // mechanism, backend.verifyWriteFreeze must return false.
  requireCondition(await backend.verifyWriteFreeze(accountId)===true,
    "write_freeze_not_verified");

  // Database function does ALL authority checks, including private DBA ticket,
  // expected phase, two reviewers, single-use consumption and expired lease.
  const reclaimed=await backend.reclaimWithDbaTicket(accountId,approvalTicketId,leaseId);
  requireCondition(reclaimed===true,"recovery_approval_refused");

  const job=await backend.readPrivateJob(accountId);
  requireCondition(job?.account_id===accountId && job.phase===before.phase &&
    job.lease_token===leaseId, "recovery_lease_mismatch");
  const activeUntil=Date.parse(job.lease_expires_at||"");
  requireCondition(Number.isFinite(activeUntil) && activeUntil>Date.now(),
    "recovery_lease_expired");
  // Verify original consent from the durable job, never from request JSON.
  const approved={
    account_id:job.account_id,phase:job.phase,lease_token:job.lease_token,
    manifest:job.manifest,one_time_intent_consumed:job.intent_digest===null,
    reauthentication_verified:!!job.reauthenticated_at,
    confirmation_verified:!!job.confirmed_at
  };
  validateApprovedJob(approved);
  const adapter=await backend.makeExecutionAdapter(job);
  const result=await executeApprovedDeletion(approved,adapter);
  requireCondition(result?.complete===true, "recovery_incomplete");
  return Object.freeze({complete:true, source:"operator-approved-recovery"});
}

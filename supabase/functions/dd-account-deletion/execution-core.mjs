// Disclosure Desk deletion execution core. SERVER-ONLY: not exposed to browsers.
// Pure adapter-driven coordinator so tests cannot reach real Supabase/Auth/Storage.
export const STAGES = Object.freeze([
  "approved", "forum_redacted", "storage_cleared", "auth_removed", "complete"
]);
export const BUCKETS = Object.freeze(["dd-profile-avatars", "research-images"]);
export const REDACTED_THREAD = Object.freeze({
  title: "Account deleted",
  body: "This post was removed by its author.",
  link_url: null,
  image_url: null
});
export const REDACTED_REPLY = "This reply was removed by its author.";

export class DeletionGuardError extends Error {
  constructor(code) { super(code); this.name = "DeletionGuardError"; this.code = code; }
}
const uuid = v => typeof v === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
function assert(condition, code) {
  if (!condition) throw new DeletionGuardError(code);
}
export function validateManifest(entries, targetId) {
  assert(uuid(targetId), "invalid_account");
  assert(Array.isArray(entries) && entries.length <= 2000, "manifest_invalid");
  const seen = new Set(), result = [];
  for (const item of entries) {
    assert(item && typeof item === "object" && !Array.isArray(item), "manifest_invalid");
    const { bucket_id, name, owner_id } = item;
    assert(BUCKETS.includes(bucket_id), "bucket_not_approved");
    assert(owner_id === targetId, "foreign_storage_owner");
    assert(typeof name === "string" && name.length > 0 && name.length <= 800
      && !name.startsWith("/") && !name.includes("\\")
      && !name.split("/").some(part => part === "." || part === ".." || !part),
      "storage_path_invalid");
    const key = bucket_id + "\n" + name;
    assert(!seen.has(key), "duplicate_storage_key");
    seen.add(key);
    result.push({ bucket_id, name, owner_id });
  }
  return result;
}
export function validateApprovedJob(job) {
  assert(job && uuid(job.account_id), "invalid_account");
  assert(uuid(job.lease_token), "missing_claim_lease");
  assert(STAGES.includes(job.phase), "invalid_phase");
  assert(job.one_time_intent_consumed === true, "intent_not_consumed");
  assert(job.reauthentication_verified === true, "fresh_reauth_required");
  assert(job.confirmation_verified === true, "confirmation_required");
  assert(job.phase !== "complete", "already_complete");
  return validateManifest(job.manifest, job.account_id);
}

// Each step is idempotent and checkpointed with compare-and-set on server.
// Safe to resume after failure ONLY with a fresh, server-authorised operator lease.
// No end-user self-retry or client-supplied account ID is accepted.
export async function executeApprovedDeletion(job, adapter) {
  const manifest = validateApprovedJob(job);
  const id = job.account_id;
  let phase = job.phase;
  const advance = async next => {
    await adapter.advancePhase(id, job.lease_token, phase, next);
    phase = next;
  };
  if (phase === "approved") {
    await adapter.assertNotPrivilegedOwner(id);
    await adapter.redactOwnForumText(id, REDACTED_THREAD, REDACTED_REPLY);
    await advance("forum_redacted");
  }
  if (phase === "forum_redacted") {
    await adapter.assertNotPrivilegedOwner(id);
    for (const {bucket_id, name, owner_id} of manifest) {
      assert(owner_id === id, "foreign_storage_owner");
      await adapter.removeOwnedObject(id, bucket_id, name);
    }
    // Catch both untracked orphan objects and objects uploaded since PREPARE.
    const remaining = validateManifest(await adapter.enumerateOwnedObjects(id), id);
    assert(remaining.length === 0, "storage_objects_remaining");
    await advance("storage_cleared");
  }
  if (phase === "storage_cleared") {
    await adapter.assertNotPrivilegedOwner(id);
    const remaining = validateManifest(await adapter.enumerateOwnedObjects(id), id);
    assert(remaining.length === 0, "storage_objects_remaining");
    const existsBefore = await adapter.accountExists(id);
    assert(typeof existsBefore === "boolean", "auth_state_unverified");
    if (existsBefore) await adapter.deleteAuthAccount(id);
    const existsAfter = await adapter.accountExists(id);
    assert(existsAfter === false, "auth_deletion_unverified");
    await advance("auth_removed");
  }
  if (phase === "auth_removed") {
    const stillExists = await adapter.accountExists(id);
    assert(stillExists === false, "auth_deletion_unverified");
    const remaining = validateManifest(await adapter.enumerateOwnedObjects(id), id);
    assert(remaining.length === 0, "storage_objects_remaining");
    await advance("complete");
  }
  assert(phase === "complete", "incomplete_execution");
  return Object.freeze({ complete: true, deletedAccountVerified: true });
}

"use strict";
// Offline non-destructive deletion preflight tests. NEVER touch Supabase accounts.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

(async () => {
  const dir = path.resolve(__dirname, "../supabase/functions/dd-account-deletion");
  const { makeDeletionPreflight, DELETION_CONFIRMATION } =
    await import(pathToFileURL(path.join(dir, "preflight-core.mjs")).href);
  const src = fs.readFileSync(path.join(dir, "index.ts"), "utf8");
  let passed = 0;
  const test = (label, fn) => { fn(); passed++; console.log("PASS " + label); };

  const countsA = { documents: 2, revisions: 4, researchImages: 1, boards: 3,
    avatarProfiles: 1, forumThreads: 1, forumReplies: 2,
    chatMessages: 6, witnessReports: 1 };
  const countsB = { documents: 8, revisions: 9, researchImages: 0, boards: 1,
    avatarProfiles: 0, forumThreads: 2, forumReplies: 0,
    chatMessages: 20, witnessReports: 2 };
  const make = (counts, extra = {}) => makeDeletionPreflight({
    verifiedAccount: true, confirmedEmail: true, counts, ...extra
  });
  test("valid personal preview is NOT executable", () => {
    const r = make(countsA);
    assert.equal(r.eligible, true);
    assert.equal(r.executionAvailable, false);
    assert.equal(r.requiresRecentReauthentication, true);
    assert.equal(r.requiresTypedConfirmation, DELETION_CONFIRMATION);
    assert.equal(r.counts.documents, 2);
  });
  test("two synthetic accounts are isolated", () => {
    const a = make(countsA), b = make(countsB);
    assert.equal(a.counts.documents, 2);
    assert.equal(b.counts.documents, 8);
    assert.notDeepEqual(a.counts, b.counts);
  });
  test("last / any forum owner is protected", () => {
    const a = make(countsA, { ownerRoles: { forumOwner: true } });
    assert.equal(a.eligible, false); assert.equal(a.reason, "protected_moderator_account");
  });
  test("Chat owner and moderation roles are also protected", () => {
    assert.equal(make(countsA, { ownerRoles: { chatOwner: true } }).eligible, false);
    assert.equal(make(countsA, { ownerRoles: { commentModerator: true } }).eligible, false);
  });
  test("anonymous/unsigned accounts are blocked", () => {
    assert.equal(makeDeletionPreflight({ counts: countsA }).eligible, false);
    assert.equal(make(countsA, { isAnonymous: true }).eligible, false);
    assert.equal(make(countsA, { confirmedEmail: false }).eligible, false);
  });
  test("partial or bad metadata refuses rather than guesses", () => {
    assert.equal(make({ documents: 1 }).reason, "incomplete_preflight");
    assert.equal(make({ ...countsA, forumThreads: NaN }).eligible, false);
    assert.equal(make({ ...countsA, researchImages: -1 }).eligible, false);
  });
  test("public preview contains only counts, not account identifiers, email or keys", () => {
    const r = JSON.stringify(make(countsA));
    assert.equal(r.includes("user_id"), false);
    assert.equal(r.includes("email"), false);
    assert.equal(r.includes("storage_key"), false);
    assert.equal(r.includes("public_key"), false);
  });
  test("explicit privacy warnings and backups exist", () => {
    const r = make(countsA);
    assert.equal(r.requiresDataExportOffer, true);
    assert.ok(r.warnings.some(s => /other members.*replies/i.test(s)));
    assert.ok(r.warnings.some(s => /historical backups/i.test(s)));
  });
  test("function is OFF unless the dedicated flag is true", () => {
    assert.match(src, /DD_ACCOUNT_DELETION_PREFLIGHT_ENABLED/);
    assert.match(src, /!== "true"/);
  });
  test("server verifies Auth token, not a supplied user ID", () => {
    assert.match(src, /auth\.getUser\(accessToken\)/);
    assert.match(src, /Object\.keys\(body\)\.length !== 1/);
    assert.match(src, /action !== "preflight"/);
    assert.match(src, /countMine\("research_documents", "user_id"\)/);
    assert.match(src, /\.eq\(column, user\.id\)/);
  });
  test("ONLY non-destructive table counts are called", () => {
    assert.doesNotMatch(src, /\.insert\s*\(/);
    assert.doesNotMatch(src, /\.update\s*\(/);
    assert.doesNotMatch(src, /\.delete\s*\(/);
    assert.doesNotMatch(src, /\.remove\s*\(/);
    assert.doesNotMatch(src, /admin\.deleteUser\s*\(/);
    assert.doesNotMatch(src, /auth\.admin\.deleteUser\s*\(/);
    assert.doesNotMatch(src, /execute\s*:\s*true/);
  });
  test("preflight protects individual owners and named public authors", () => {
    ["dd_forum_owner_admins", "dd_chat_owner_admins", "dd_comment_moderators",
     "dd_forum_threads", "dd_forum_replies", "dd_chat_messages", "dd_witness_reports",
     "dd_avatar_profiles", "research_assets"].forEach(name => assert.ok(src.includes('"' + name + '"')));
  });
  test("preflight neither publishes nor calls a deletion endpoint", () => {
    assert.doesNotMatch(src, /fetch\s*\(/);
    assert.doesNotMatch(src, /storage\.from\s*\(/);
    assert.match(src, /"no-store"/);
  });
  console.log("Deletion preflight (non-destructive): " + passed + " groups passed");
})().catch(err => { console.error(err); process.exitCode = 1; });

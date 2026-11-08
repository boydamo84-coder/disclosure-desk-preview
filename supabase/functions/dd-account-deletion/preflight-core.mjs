// Disclosure Desk: deliberately NON-DESTRUCTIVE account-deletion preflight.
export const DELETION_CONFIRMATION = "DELETE MY ACCOUNT";
const safeCount = n => Number.isSafeInteger(n) && n >= 0 ? n : null;
export function makeDeletionPreflight({ verifiedAccount, isAnonymous = false, confirmedEmail = false, ownerRoles = {}, counts = {} } = {}) {
  if (!verifiedAccount || isAnonymous || !confirmedEmail) {
    return { eligible: false, reason: "verified_account_required", executionAvailable: false };
  }
  const protectedOwner = Boolean(ownerRoles.forumOwner || ownerRoles.chatOwner || ownerRoles.commentModerator);
  const safeCounts = {};
  for (const name of [
    "documents", "revisions", "researchImages", "boards", "avatarProfiles",
    "forumThreads", "forumReplies", "chatMessages", "witnessReports"
  ]) {
    safeCounts[name] = safeCount(counts[name]);
    if (safeCounts[name] === null) {
      return { eligible: false, reason: "incomplete_preflight", executionAvailable: false };
    }
  }
  return {
    eligible: !protectedOwner,
    reason: protectedOwner ? "protected_moderator_account" : "preflight_only",
    executionAvailable: false,
    requiresRecentReauthentication: true,
    requiresTypedConfirmation: DELETION_CONFIRMATION,
    requiresDataExportOffer: true,
    warnings: [
      "Cloud Research documents, backups, private Boards and chat may be permanently lost.",
      "Your public discussion text must be redacted without removing other members' replies.",
      "Downloads, local browser copies, emails and encrypted historical backups require separate handling."
    ],
    counts: safeCounts
  };
}

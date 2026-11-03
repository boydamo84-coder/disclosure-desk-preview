# Disclosure Desk — Community Discussions roadmap

**Requested / approved:** 3 November 2026  
**Status:** FRONTEND STAGED AND OFF; REVIEW-ONLY BACKEND SQL STAGED BUT UNAPPLIED; NOT DEPLOYED  
**Canonical status log:** [MASTER_HANDOVER.md](../MASTER_HANDOVER.md)

## Goal and navigation

Add **Discussions** as a distinct, twelfth main website tab at the next approved consolidated release (the current *live* release still has **11**). Proposed location in the navigation: **after Witness, before Watch & Read**. The community can create its own sections ("communities" or topic forums), then write posts, share source links and reply to one another within those sections. This is a moderated discussion space, not another news comments widget and not the private 1:1 Profile Chat feature.

Responsive top level: community directory/search, sections a user follows, recently active/new posts, discover/trending posts and a straightforward "Create section" entry for eligible registered members. Keep the entire discussions flow reachable under the main Discussions tab, with usable mobile back/scroll behavior and deep links for sharing.

## Product behavior

1. **Section creation:** Registered verified users can create a uniquely named section, summary, description, category/tags and plain-language rules consistent with site-wide Community Rules. Include safe name/slug policy, reserved names, duplicate handling, abuse throttling and a minimum-account standing requirement to deter spam. Other registered users can join/follow, browse and publish; public guests can **read only** if content is approved and not hidden. No private/exclusive sections or invitation-only gatekeeping in v1.
2. **Posts/threads:** Any eligible registered member can create a titled text post or link post in any public section, with context and optional source URL. A section is not a silo owned by its creator: its steward cannot require approval of ordinary member posts. Allow edit/delete of the author's own posts with reasonable time/history safeguards; show edited status; preserve meaningful moderation records.
3. **Replies:** Threaded replies, reply counts, newest/active/top sorting and a clear return-to-thread state; safe rich text/Markdown only if sanitised; links open safely and have visible destinations. No arbitrary embedded scripts/HTML, unsolicited uploads or unsafe external embeds in v1.
4. **Community signals:** Existing registered-user like/dislike and self-flagging model, with a vote per account and separate abuse flags. **Five distinct registered flags** temporarily hide a post/reply for the owner admin's review, never automatically permanently delete it. Dislikes do not count as flags. Rate limits and duplicate-account abuse guards should reflect existing backend design.
5. **Discovery:** Search sections and posts, section-level filters, topics, links and citations; meaningful timestamps; sticky follow state and notifications only for opted-in users. Avoid treating popularity as truth — sensitive UAP claims should have an obvious source/unsourced distinction, not an automatic credibility score.
6. **Ownership:** Every post/reply belongs to its author; each section has a **section steward** (original creator). Stewards can transfer/step down via a controlled flow or be replaced by overall administrator on inactivity/abuse.

## Governance: section stewards, not unchecked gatekeepers

**Site owner is the final administrator** for all sections and moderation policy. Section creation grants a **limited, scoped steward role** in that section only — no site-wide privileges, no ability to expose private identities or read private 1:1 messages.

**Stewards CAN:**
- Edit their section's description, topic tags and section-specific guidelines **only within the platform's universal rules**; no contradictory restrictive policies.
- Pin/unpin a small fixed number of useful posts (suggest maximum three), add/remove organisational topic labels, and propose curated resource/link collections.
- Flag abusive/spam/private-information posts like any other member; one steward's flag counts as **one**, not five.
- Use an **Escalate to site admin** action with a reason and optional contextual note. Urgent privacy/threats cases enter a higher-priority queue for the owner; require reason codes and audit entries.
- Request assistance (e.g., temporary slow mode for a flood of spam); optionally use **narrow, rate-limited emergency safety hold** for clear doxxing/threats, **subject to explicit owner review, automatic expiry, immediate appeal, action logging and abuse controls**. This emergency power is *proposed for security design review*, not an unrestricted v1 entitlement.

**Stewards CANNOT:**
- Ban, silence, shadow-ban or permanently block another user from posting because of disagreement.
- Unilaterally delete/edit another user's content, overturn an independent five-flag result, or erase moderation evidence.
- Require preapproval of ordinary posts, privatise a section or make themselves unremovable.
- Promote co-admins or obtain database administrator privileges without owner-controlled delegation.
- Alter the site-wide Community Rules or cancel the user's appeal path.

**Anti-power-abuse protections:** Transparent public moderation status (not reporter identities), automatic audit of steward actions, reason-required interventions, owner appeal/reversal, role revocation and rate limits. Consider community feedback on steward misuse, but prevent coordinated harassment and mob rule. Overall site owner can remove a steward while leaving their section and other members' posts intact. A steward's account suspension must not delete the section.

**Emergency reports:** Severe threats, doxxing, child-safety issues or illegal content need immediate report routing independently of the routine five-flag threshold. No obligation to wait for five flags before reaching the owner. Ensure statutory safety/reporting requirements and real operating capacity are reviewed before launch.

## Technical/privacy/security requirements

- Scope all section, post, reply, reaction, flag and steward permissions server-side with Supabase RLS/RPCs; verify users cannot spoof `section_id`, `steward_id`, `status`, vote totals or flags via direct API.
- Reuse current Auth, `dd_public_names` alias rules, community vote/flag semantics and existing discussion UI patterns as appropriate. **Do not reuse private Profile Chat or LIVE hearing chat storage.** Never expose emails, raw account IDs or private W.NE documents/Boards.
- Authenticated registered users create sections, posts, replies, votes and flags. Guests browse published material read-only. Site owner moderation supersedes steward controls and is separately permissioned.
- Handle URL safety, phishing link labels, safe previews, text/length limits, XSS, script injection, bots, cross-account leakage, denials-of-service and simple duplicate detection.
- Make section/steward action logs tamper-evident to normal community accounts. Record provenance for admin review and respect user data retention/deletion rights.
- If a flagged post/thread is hidden, ensure nested replies, direct links, counters and notifications handle the hidden state safely. Rate-limit action creation and follow-up mentions to prevent dogpiling.
- Update site Community Rules, privacy notices, reporting/appeals, site tour and accessible UI guidance before release. No public beta/community feature should require moderators to see private one-to-one chats.

## Acceptance tests before release

- User A makes Section A and becomes steward ONLY there; another user B makes Section B; neither obtains stewardship of the other's section or site-owner admin rights.
- Signed-in user C can create a post, reply and share a link in either section without steward preapproval. Guests read only. Posts are visible to both desktop and Android-ready mobile UI.
- Authors can edit/delete only their own content within rules; steward can edit only their section metadata and scoped pins/tags; prohibited unilateral bans/deletes fail **with direct RLS/API requests**, not only hidden buttons.
- Five **different** registered reports hide an item pending review; 1–4 flags do not; dislikes are not flags; creator flags do not secretly count extra. Urgent escalation reaches owner without making the steward judge/jury.
- Owner can audit, override, restore and remove a steward; community member can appeal a decision; records survive steward departure.
- Test search/filter/sort, large reply threads, accessibility, responsive scroll, escaped text, links, rate limits, privacy and duplication checks. No cross-account data leak.
- GitHub-only CI first; authorised unified site preview plus Samsung user acceptance; explicit owner approval before production. Port to Android after website parity, then signed Play internal testing.

## Delivery status and guardrails

Only the **design is approved**; no implementation, Supabase migration, live deploy or Android change has been carried out as part of this planning entry. It belongs to the consolidated website roadmap alongside the new Profile Chat feature. Work on the unpublished development branch, update MASTER_HANDOVER.md **after every milestone** with changed paths/SHA, tests and actual release state. Do not spend Netlify credits on individual incremental previews.

## Frontend staging milestone (3 November 2026)
The unpublished website branch has gated `assets/community-discussions.js` and a hidden `discussionsPage` shell in `index.html`, including section/topic/reply views, creator form and limited steward organisation. It remains **disabled** by `discussions:false`, so the public website and W.NE dock still have 11 tabs and none of the future server RPCs exist yet. See the master handover for CI and backend follow-up. Do not enable without security and user testing.

## Backend candidate checkpoint (3 November 2026)
`supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` now contains an **unapplied** RLS/RPC design and `scripts/test_discussions_sql.cjs` checks the permission contract statically. Candidate includes registered creation/replies/votes, public pseudonymous projections, section-scoped stewardship without user bans, five distinct flags temporarily hiding posts, and a separate site-owner review allowlist. No database tables, new privileges, populated sections or visible 12th tab exist. **This SQL is not a migration or deployment authorisation.** Isolated database and actual account testing are required before any activation.

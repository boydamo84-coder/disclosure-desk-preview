# Disclosure Desk — Private one-to-one Chat roadmap
**Approved:** 3 November 2026  
**Status:** PLANNED / NOT BUILT / NOT DEPLOYED  
**Master handover:** [MASTER_HANDOVER.md](../MASTER_HANDOVER.md) — authoritative; update after every milestone.

## Core experience
- Accessible from the existing **Profile → My Research Hub → Chat** expandable section, no new page or main navigation tab.
- **One-to-one only. No group chats.**
- Sections inside Chat: **Accepted chats** and **Pending requests**, showing **Received** and **Sent** request views.
- Selecting an accepted chat opens an **inline scrollable message history and composer in the same Profile Chat section**, not a separate route. Responsive on mobile and desktop.
- Incoming pending request displays **the sender's public opted-in username and exactly one initial message as a preview**, with **Accept** and **Decline** actions.
- The request's initial message is held as pending content; **neither party can exchange further chat messages before recipient acceptance**. On acceptance, it becomes the first message in the new conversation. On denial, no conversation opens.
- Outbound requests show pending/accepted/declined state without revealing a decline reason. Prevent sender from bypassing deny/block by sending another invite; add deliberate cooldown/resume policy.
- Accepted chats: newest activity, unread indicator, accessible message composer, and optional user-controlled mute/archive. Include a prominent **Block** and **Report** action.

## Identity, privacy, moderation and trust
- Registered signed-in accounts only; no guest/anonymous access to private messaging.
- Reuse existing Supabase Auth and unique `dd_public_names` public alias logic, with **explicit opt-in to discoverability/contact requests**. Having a public comment alias alone must not automatically expose anyone for unsolicited chat.
- Never expose private email, raw auth UUID, exact location, identifying device metadata, private investigation Boards or W.NE documents to the other participant or community.
- Strict server-enforced participant-only RLS for requests, messages and state transitions. Prevent user impersonation, cross-account lookup, editing another user's state, unauthorized invitation acceptance, blocked re-invites and direct Data API bypass.
- Rate limit initial requests/messages, avoid duplicate requests, handle bidirectional simultaneous requests consistently, enforce one invitation/recipient pair, and apply abuse signals without making all private chat history readable to site moderators.
- Reporting: allow the recipient to report abusive preview requests and participants to report conversations/messages; limit moderator visibility to content explicitly submitted for a report, subject to documented policy, retention and user privacy disclosures.
- Use safe text rendering, content limits, link-safety and input sanitisation; **no file attachments or bulk messaging in v1**. Provide user controls to block, leave/archive/delete own conversation view and manage notifications; handle deletion/retention consistently.
- Appropriate account deletion, data export, retention and privacy-policy updates required before launch. Opt-in app push notifications may be considered after privacy QA.

## Acceptance criteria / test plan
1. Registered A sends one introduction to opted-in registered B; B sees only request preview and Accept/Decline, while A cannot send more.
2. B accepts: conversation appears in both accepted lists, initial message becomes first history item, two-way chat now works inline in Profile.
3. B declines: request does not open a chat; A cannot immediately retry, escalate or bypass via another request.
4. Pending Received and Sent, accepted chat list, unread state, text history, time ordering, navigation persistence and responsive layout all work.
5. Only two participants can read their messages. Guests, nonparticipants, blocked accounts and anonymous sign-ins cannot read, post or transition requests using direct HTTP/JWT requests.
6. Block/report paths, rate limits, duplicate/simultaneous request guards, spam resistance and safe previews pass synthetic multi-account tests; do not modify real user messages.
7. Existing News/Archive/W.NE/Map/Videos/LIVE/Boards/Witness/Watch & Read/Explore/Profile, original W.NE save rules and all Supabase private Boards remain intact.
8. Successful GitHub-only CI and privacy review, approved combined staging, Samsung device acceptance and a separately approved production launch. Android parity and Google Play internal AAB testing follow website approval.

## Development boundary
- Plan only until current staged QA fixes are stable. Do not merge, deploy, migrate database or start messaging users solely because of this roadmap.
- Do not reuse a *public LIVE chat data store* for private conversations. Inspect existing public alias/auth, LIVE chat and Hub UI code before writing new components; reuse principles safely, without duplicating identity/auth flows.
- After every milestone update `MASTER_HANDOVER.md` with actual SHA, tested status, production/preview/backend/Android state and the next action.

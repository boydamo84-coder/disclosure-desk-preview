# Disclosure Desk LIVE chat schedule transitions — 4 November 2026

**Status: CODE STAGED + SYNTHETIC RUNTIME QA PENDING; NOT DEPLOYED.** This file describes an incremental correction to the existing verified official LIVE scheduling and preserved hearing replay experience. It does not authorise or create a hearing, upload videos, publish a Netlify site or change a Supabase table.

## Bug and fix
In the current LIVE page, the **hearing countdown updates each second**, but the chat room was mounted only once when the event card rendered. The five-minute event-source refresh explicitly avoids rebuilding identical cards (to protect playing videos), so leaving LIVE open from more than 45 minutes before a scheduled hearing could leave **“chat opens 45 minutes before”** visible indefinitely even after the correct opening time. It could likewise leave the LIVE chat visibly mounted after the approved posting window closed, with backend RLS correctly rejecting posts.

The staged `assets/live-schedule.js` fix uses the existing one-second countdown callback to check a **single, trusted, approved event**'s chat eligibility. It opens at `startsAt - 45 minutes` and closes at the earlier of an explicit valid `endsAt` or `startsAt + 4 hours`. Calls to `ddLiveChatMount` occur **only on actual state transitions**, never every second. It disposes closed rooms and preserves the existing event card / its official video player. The existing guard still requires `chatAvailable` from the approved feed or public Supabase event, and the posting backend—not this timer—makes the final authorisation decision.

## Acceptance
- CI runs `scripts/test_live_chat_window_runtime.cjs`, evaluating actual source with a fake DOM, synthetic time, and fake chat mount. No internet or database. At T−46 the room stays closed, at T−44 it opens once, at T−39 it is not duplicated, at T+4 hours it disposes once and stays closed. Hearing card identity remains stable throughout.
- Existing LIVE archive test checks saved read-only replay, public-safe messages and no old hearing chat fabrication. Existing confirmed-hearing tests reject date-only timestamps, unsafe official URLs and a banner older than 48 hours.
- **Still pending:** integrated preview and Samsung real-browser QA, a genuinely announced hearing with source verification, signed-in JWT chat send/flag tests and recorded replay after an actual event. No real event was added to `data/approved-live-events.json` or posted to Supabase.
- Original 11-tab production website, private Finance Centre, canonical W.NE, Our Cinema, live Supabase and Netlify remain untouched.

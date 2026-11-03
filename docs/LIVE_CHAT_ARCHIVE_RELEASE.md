# Saved LIVE chat beside Congressional hearing recordings

Product requirement (approved by owner): chats are attached to each official LIVE event ID, readable permanently with the official hearing recording after the event ends (subject to privacy takedowns/account erasure). After live window, archive is read-only; no posting into past hearings. Guests can read approved chat with public opt-in aliases, no account UUID disclosure. Registered users can flag messages. Five distinct flags hide pending moderator review; old flags are reset as a baseline if moderator restores.

`supabase/LIVE_HEARINGS_CHAT_REVIEW.sql` remains staged until transaction-rollback QA passes. Database did not previously have LIVE chat tables. The attached recording URL must be from a verified official source; this site links/embeds the official video rather than copying video files.

Initial archive must not suggest there were historical chats for hearings that predate chat launch. Dynamic, verified ended `dd_live_events` can be added alongside existing bundled Congressional hearing recordings.

Schedule-refresh safety: The global LIVE-only chat cleanup skips archival replay components; closing the recording itself disposes its archived chat. This prevents a 5-minute LIVE schedule refresh from erasing the replay transcript while the user watches the official recording.

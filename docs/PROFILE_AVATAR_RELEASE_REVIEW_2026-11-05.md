# Disclosure Desk — profile photo release acceptance (5 Nov 2026)

**Current state: backend policy candidate staged only. No live Supabase bucket, no user uploads, no Netlify release.**

User-approved account feature: members must be able to upload, change and remove their account photo. Owner-only private account storage comes first. Public visibility beside Discussions/Chat is NOT implied by uploading a private photo and needs an explicit public-opt-in workflow.

- Storage: dedicated **private** `dd-profile-avatars` bucket, only WebP up to 1 MiB; one object named `<auth uid>/avatar.webp`; no anonymous/public bucket reads.
- Processing: browser canvas resizes/crops to 512×512 and re-encodes local JPEG/PNG/WebP to WebP, dropping EXIF. Decline oversize/unsupported images.
- Auth: owner can SELECT/INSERT/UPDATE/DELETE only their own canonical key, no direct grant to other users, no elevated service role in browser.
- UX: photo preview, Upload/Change, Remove with confirmation, loading/error states, default icon, session changes clear any prior account photo.
- Release blockers: confirm bucket and policies via separate A/B Supabase Auth sessions, owner only delete/replace, mobile camera gallery behavior, privacy notice, account-deletion Storage cleanup and quota, secured backup/restore.
- Never reuse `research_assets` or expose private investigation Boards. User must expressly opt into any future public avatar appearance.

Source review candidate: `supabase/PROFILE_AVATARS_PRIVATE_REVIEW.sql`. This is intentionally **outside migrations**. Real database changes require explicit backup/release gate.

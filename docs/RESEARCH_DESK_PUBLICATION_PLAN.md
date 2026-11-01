# Research Desk × W.NE — community publication plan (draft)

**Status:** preparation only; not deployed, database migration NOT applied.

## Established foundations
Disclosure Desk already supports saved Investigation Boards, account-separated local data, and explicitly initiated Supabase cloud transfer/recovery. Preserve and regression-test these behaviours instead of replacing them. The new Research Desk prototype is a separate local-only draft.

## Release sequence
1. Add multiple local dossiers, robust restore/backups, and safe source citations (2–10-file comparison; preserve each catalogue ID and original URL).
2. Integrate the existing account and boards cloud workflow using a separately versioned dossier format; prove cross-device save/restore with dummy entries, failed transfers, account isolation, and conflicts.
3. Add optional **OneDrive and Dropbox exports/imports** through user-authorised provider flows, not hard-coded account credentials. Start with portable JSON backup download/upload; native provider connectors require implementation, permissions and security review. No silent sync or overwrite.
4. Publish to a separate **Research Library** section. Explicit states: Private → Submitted → Published/Rejected → Withdrawn. An author always owns the source document and chooses publication; submission does not make it public.
5. Public reading without login; signed-in, non-author readers can rate one-to-five stars once per dossier and edit/remove their rating. Display average **with sample size**; add report-abuse and moderator queues before launch.
6. Canonical permanent URLs, document revision history, visible corrections, original archive citations, date and credited author/username; prevent SEO publication of unapproved drafts.
7. Rate limits, spam prevention, takedown process, rights and witness-privacy checks, admin-only moderation and audit logs; limit reproduction of licensed or restricted content.

## Design
The full W.NE app remains an independent product. **Research Desk — Powered by W.NE** borrows the distraction-free editor, note structure, reliable backup principles, report formatting and word count. Do not put novel project settings or unrelated W.NE databases into Disclosure Desk.

## Migration precautions
The SQL under supabase/migrations is a **review draft**, not an instruction to paste into production now. Before running it, examine grants, RLS, author draft update RPC, publication moderation service role, anonymous aggregate rating access, spam limits, data deletion and schema rollback. No Netlify production deployment until review and end-to-end tests pass.

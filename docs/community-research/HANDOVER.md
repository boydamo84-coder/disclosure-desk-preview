# Community Research — Issue #18

Status: local prototype only. Based on tested production commit 7173c044fe1da200bafe71119de1a2265446c330. No public activation or database changes.

- `library-preview.html` is a standalone simulated library; no real accounts, reactions, comments, boards, uploads or network calls.
- `publication-draft.js` projects explicit text fields only; initial validation checks executed in tool runtime, not a substitute for browser/security testing.
- `research/community-publication-preview.js` integrates a localhost-only W.NE preview, with opt-in section selection. No publishing endpoint. The development file is deliberately not on the public release allowlist yet; do not promote this branch as-is.
- Next: browser acceptance of preview, unify core module, design and test server-side publication permissions, versioning, moderation, reactions, public comments, board/citation integration and safe uploads with quotas. Confirm file scanning and cost before uploads; text-only first is an option. Test isolated database and Android, obtain release approval. Preserve `researchPublishing:false` until acceptance.

## Subsequent release: Discussion Hosts (#17)
Owner wants to turn on the five clearly labelled automated discussion hosts after Community Research. Existing 42-post queue (14 days, three posts daily) and admin controls are already staged. Keep inactive until genuine guest/member/owner authorization tests, scheduler/idempotency/automatic stop checks, quota verification and separate activation approval. No automated votes, replies, DMs or fabricated member activity. Do not enable a live job from this branch.

## Isolated data model and automated QA

Added `SCHEMA_DRAFT_NOT_APPLIED.sql` in this documentation directory (not a migration): pending text snapshots, public read after approval, reactions and comments with row-level policies, column-level grants, and no direct client moderation or visibility changes. The disposable PostgreSQL test checks consent, guest/author/member boundaries, private IDs, reactions and withdrawal. The local browser prototype test checks simulated interactions at three widths and no external network requests. Workflow `community-research-no-deploy.yml` runs these on the feature branch. Do not treat a green run as production acceptance: author labels are still user-supplied in this draft, moderation is operator-only in the fixture, no real account tests, rate limits, version/withdrawal API, threaded replies, Board/W.NE integration or secure attachment scanner exist yet. The text-only draft is not deployed; no Supabase project has been modified.

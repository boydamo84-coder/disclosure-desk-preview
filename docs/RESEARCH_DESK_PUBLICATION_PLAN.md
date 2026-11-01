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

## Research Bible and Ideas Vault adaptation (approved direction)
Adapt W.NE concepts rather than copying the novel Story Bible data model.

**Research Bible sections**
- **Sources & links:** canonical archive URL, issuing organisation, document ID, source type, access/reuse notes, date accessed and linked board/case. Keep originals unaltered.
- **Cases & caseboards:** attach existing Investigation Boards with a read-only reference pane initially; selecting a case opens its saved links, notes, timeline, comparisons and connections without switching away from the editor.
- **People & organisations:** witness/researcher/agency roles, attribution and privacy flags. Do not expose private identities or sensitive contact details when publishing.
- **Evidence & claims:** distinguish direct observation, reported account, document statement, interpretation and speculation; associate each claim with source citations and optional confidence/verification state.
- **Timeline:** explicit event date, report date, document date and publication date; preserve uncertainty and contradictory dates.
- **Open questions & contradictions:** source-linked discrepancies, unresolved leads and plausible alternative explanations.
- **Research Ideas Vault:** quick-capture hypotheses, leads and research to-dos with states Unreviewed, Investigating, Supported, Contradicted, Unresolved, Archived. An idea is not a fact.

**Editor workflow**
- Desktop/tablet: resizable split view (writing editor | board/source sidebar), optional three-pane mode (source PDF/link | writing | Research Bible). Remember pane state per dossier.
- Mobile: one editor view plus a bottom sheet or switchable source drawer; never cram three columns onto a phone.
- One tap **Insert source citation**, **Add source to Research Bible**, **Create research note from board**, **Compare selected sources** (2–10).
- Carry source ID and original URL through citations, exported reports and publish revisions. Never automatically imply evidential confirmation.
- Private-by-default drafts; board-linked sources should remain readable without accidentally disclosing unpublished/private board notes when publishing.
- Preserve existing cloud board backups; investigate cross-device syncing and recovery as separate versioned data with isolated restoration tests. Optional Dropbox and OneDrive backups are later integration stages.

**Implementation progression**
1. Introduce Research Bible and Ideas Vault as an editor-side panel with durable local draft storage and portable JSON backup.
2. Use existing Investigation Boards' stable identifiers and source references for a side-by-side *read-only* view; only then implement deliberate source insertion / note copying.
3. Add device/account-scoped cloud sync with conflict-safe recovery testing. Avoid silently merging or overwriting unrelated user records.
4. Integrate citations into published dossier review and privacy filters.

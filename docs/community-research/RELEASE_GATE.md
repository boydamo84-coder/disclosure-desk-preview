# Community Research release gate — issue #18

Decision as of 26 November 2026: **NO-GO for production activation.** The owner wants to get this deployed; the text-only feature is not yet an end-to-end release candidate. Green no-deploy jobs verify the isolated draft, fictional browser fixtures and genuine authentication on a disposable local stack, not production authentication. Keep both `researchPublishing:false` and `discussionHosts:false`.

## Baseline verified before Stage 7B.5

- The actual `production` branch is `7173c044fe1da200bafe71119de1a2265446c330` (also the consolidated Research & Collaboration branch head). GitHub comparison against the verified Stage 7B.4 head `389a710c9620856f241bdd05a548246cba167ef7` shows 43 commits ahead, zero behind. Recheck against the exact candidate immediately before promotion. Do not use the divergent default `main` branch for this release.
- Production branch is reported unprotected; issue #14 remains an independent release-safety gate. Preserve the existing approved rollback reference and verify the live manifest before any production build.
- The public builder intentionally rejects unknown assets. The new reader and localhost publication-preview scripts are unapproved, explicitly referenced only by the feature candidate, and not on the release allowlist. Do not loosen the guard or publish the development fixture. The feature's no-deploy CI does not establish that the public packaging suite passes.

## Prioritised acceptance gates (no extra hosted project presumed)

| Order | Gate | Current evidence and missing work |
| --- | --- | --- |
| 1 | Real isolated Auth/API acceptance | Stage 8A genuine Auth/PostgREST read smoke passed at 7686333b; fictional accounts and draft data only. Stage 8B confirmed genuine draft submission and withdrawal permissions at 84d87adb. Stage 8C exercises the actual preview through a fixed fictional runner-local binding only. Verify exact-head results; account switching, expired/revoked sessions and complete owner-only operation acceptance remain. Do not route tests to production. |
| 2 | Initial publication transport | W.NE projects and reviews six text fields; private SQL lookup and duplicate rejection exist. There is no real submit/retry/receipt endpoint connected to W.NE. Review a narrowly scoped authenticated interface with exact payload/identity binding and idempotency, then test failure/timeout/reconnect and two-device concurrency. Never expose private helper schemas or use privileged browser credentials. |
| 3 | Member/author/moderator functions | Native reader supports public lookup, deep links, Board/citation/share. Stage 9A adds read-only public reaction totals and paginated comments to the native reader; genuine local engagement permission QA is included. Member write controls, flags, author revision/withdrawal and moderator queue remain unwired in the native interface. Add and test rate limits, report-specific visibility, revision links, author privacy/username lifecycle, safe rendering, abuse reporting and removals. |
| 4 | Release packaging and device | Remove localhost simulations from public build; review new runtime allowlist and explicit routes, preserve all other release guards. Run full production-context packaging, browser and security QA on exact candidate and separate beta APK test on Gary's Galaxy S24 Ultra; test login/restart, back navigation, accessibility and existing W.NE/Boards workflows. |
| 5 | Controlled production promotion | Confirm no unapproved storage/scan or scheduled job costs; review migrations, RLS/function grants and database advisors in isolated environment; preserve rollback/feature kill switch. Obtain owner approval of the tested exact release candidate before applying production schema or enabling the feature. Verify published manifest and monitor. |

Attachments are deferred: do not enable PDF/DOCX until file scanning, quarantine, quotas, sanitisation, download policy and cost are approved. Discussion Hosts (#17), claim voting, advertising and other unrelated gates are not activated by issue #18. No automated seed member identities or fake engagement.

**Stop doing isolated simulation-only stages as a proxy for deployment readiness.** The next meaningful step is a reviewed production-capable text-only interface and remaining genuine-Auth/API acceptance, not more simulated publication controls. Where tooling or permission prevents that, report the precise blocker; do not bypass a rejected operation or use the live backend as a test substitute.

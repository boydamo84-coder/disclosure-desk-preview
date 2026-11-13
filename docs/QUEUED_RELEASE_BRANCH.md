# DD-WEB-R3 — Hypothesis & Discovery

**Version type:** staged development track (NOT a ready-to-deploy website build)
**Branch:** `queue/dd-web-r3-hypothesis-discovery`
**Release dependency:** DD-WEB-R2 must be deployed to production, verified and approved before DD-WEB-R3 can be proposed for publication.
**Status on creation (13 November 2026):** SCOPE APPROVED; FEATURES NOT BUILT; NO QA PASS CLAIMED; NO DEPLOY AUTHORISED.

## Approved functionality

Hypothesis Lab (falsifiable predictions and competing theories); Research Gap Finder (source-linked missing evidence and research opportunities)

Complete acceptance and research/source-safety requirements are in `docs/RELEASE_R3_HYPOTHESIS_DISCOVERY_SCOPE.md`. The overall queue, rollback policy, branch promotion steps and other version statuses are in `docs/RELEASE_TRAIN_2026-11-13.md`.

## Initial branch note

This branch was created from the **current R1 source/documentation snapshot**, strictly to isolate future feature work and keep the handover discoverable. It does **not** contain completed DD-WEB-R3 features or a valid deploy candidate. In particular, it inherits *unpublished* R1 website changes for continuity; do not publish it or merge it to `production` before its predecessor is verified. Upon publication of DD-WEB-R2, **reconcile/rebase** on the verified live version (not a stale branch or guessed commit). Re-run all relevant no-deploy tests on the final merged SHA.

## Quality / release checklist

- [ ] Requirements and UI approved; research source and privacy implications reviewed
- [ ] Feature code implemented with citations and independently testable matching rules
- [ ] Unit tests cover positive and negative cases without inventing claims
- [ ] Existing navigation, archive, user accounts, Community and W.NE unaffected
- [ ] Real mobile and desktop usability/security tests passed
- [ ] Rebased/reconciled with predecessor's VERIFIED live production commit
- [ ] Exact merged SHA reviewed and full no-deploy CI green
- [ ] Owner explicitly approves deploying DD-WEB-R3; post-deploy acceptance verified

**No automatic Netlify preview/build or AdSense action requested.**

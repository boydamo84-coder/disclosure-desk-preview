# M53 — Who’s Who source-link return and Archive person/case provenance
_Date: 17 November 2026 (Europe/London) · Branch `prep/who-m53-source-return-case-lineage-20261117` · NO DEPLOY_

## Result

M53 continues the verified GitHub M52 preparation head. The 50-person directory still contains 23 claim-specific evidence dossiers (84 summary evidence links, 11 source-lineage families) and 27 activity/role-only entries. This milestone does not publish claim scores, votes, new portraits, Netlify changes, database changes or an Android APK.

### Fourth sourced person/case relationship

Added Kevin Knuth → `featured-nimitz-2004` using **Knuth, Powell and Reali (2019), _Estimating Flight Characteristics of Anomalous Unidentified Aerial Vehicles_, Entropy 21(10), article 939**, [original publisher page](https://www.mdpi.com/1099-4300/21/10/939), sections 2.4.1–2.4.3. The paper's conditional models use publicly reported Nimitz observations and assumed timing, size and range inputs. The published analysis is NOT an additional 2004 eyewitness, an original raw radar file, an independent camera/range calibration or objective proof of the asserted acceleration. The article link has also been added to Knuth’s own Who’s Who profile `articles` so the relationship uses a source found on the linked profile itself.

The draft `data/public-person-case-links.json` now has **four** records: David Fravor → Nimitz, Kevin Knuth → Nimitz, Nick Pope → Rendlesham and Larry Warren → Rendlesham. Their roles are clearly different:
- Fravor: `firsthand-statement` about his encounter in a 2023 congressional hearing, not independent verification of all flight-performance estimates.
- Knuth: `published-commentary` as a later coauthor who analyses reported observations, explicitly **not** a 2004 witness.
- Pope: `published-commentary`, coauthorship of a later book, not eyewitness participation in the 1980 incident.
- Warren: `retrospective-claim` whose presence and account remain contested, not accepted as independently verified fact.

The current person/case graph generator exposes all four sources and does not fabricate event relationships. Its `independentWitnessCount` remains `null`, `verifiedCaseToCaseEdges` remains zero, and each link remains `reviewStatus:'editorial-draft', eventVerified:false`. No Roswell person linkage was added without matching evidence.

### Browser and navigation testing prepared

The existing Who reader opens external evidence anchors in new tabs with HTTPS validation, `target="_blank"` and `rel="noopener noreferrer"`. Its Archive-case click handler already stores an explicit `dd-who-case-return-v1` session return marker and appends `dd_from=who` only for supported same-origin case routes. No new browser hooks or automatic scroll overrides were introduced (that might otherwise make mobile navigation worse).

A new local-only Playwright script `scripts/test_who_m53_source_return_chromium.cjs` is wired to check at **320, 393 and 820 px**:
1. Open Knuth’s Who profile and see his attributable Nimitz relation.
2. Expand the evidence summary and open his original publisher citation in a **mocked external tab**; the publisher route is fulfilled with a synthetic response, without visiting the real website.
3. Verify the original Who tab retains its profile and expanded evidence section after the popup closes.
4. Intercept the internal Archive link only for testing while allowing the existing case-departure click handler to record `personId`, `caseId`, profile URL and scroll anchor.
5. Check that the destination is marked `dd_from=who`, reload the original profile to exercise the saved-return lookup, then use the on-page Back button and confirm the 14-tab navigation is retained.
6. Reject JavaScript errors or any unexpected active rating controls.

**Limit:** A Chromium mobile-width test does *not* establish that Android WebView, Chrome Custom Tabs, Samsung Browser, Android physical Back gesture or the Play Store APK performs an external-app round trip correctly. A real Samsung Android device test remains required before release. The mocked publisher URL is not a renewed live URL reachability check. GitHub Actions is configured to run the test, but no verified exact-HEAD pass result has been retrieved.

### Static tests and release safety

- Updated the longstanding `scripts/test_person_case_links.cjs` contract from 3 to 4 sourced associations. The existing graph must now have 4 people and 7 document nodes, with 4 person/case and 4 person/source edges; the Nimitz-only graph has 2 people, 2 documentary sources and no invented historical claim.
- Added `scripts/test_who_m53_case_lineage_contract.cjs` checking the specific publisher paper, attribution category, source evidence presence, no independent-witness inference, withheld rating/second-editor approval, unchanged 50/23/27 people counts and safe contextual navigation.
- Extended `.github/workflows/who-m40-policy-worklist-no-deploy.yml` on the isolated M53 branch: run inherited M26–M52 source/package/browsers, the legacy person/case graph test, the M53 static test and the M53 mocked external-link/browser test. There is **no deployment job or write credential**. The internal Markdown report is excluded from the strict public package.

### M53 status and M54 handover

**Committed to GitHub as preparation.** No new file should be described as production-live, and the available GitHub push-workflow status has not been independently verified. The master handover points to this report and lists required follow-up.

**M54 next:** Independently inspect the final GitHub Actions run and repair any actual failing jobs; complete Android hardware testing of an approved staging APK or local build; audit case return behaviour when the app has backgrounded or its WebView has been recreated. Keep publishing blocked until the owner approves a significant update and the independent second-editor/source, security, account/RLS and real-community-voting gates are satisfied. Preserve the difference between a verified original source *publication* and a verified extraordinary *event*.

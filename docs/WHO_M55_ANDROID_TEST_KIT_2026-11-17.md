# M55 — Real website Who ↔ Archive regression and Samsung local public-web test kit
_17 November 2026 · Preparation branch: `prep/who-m55-site-flow-and-android-test-kit-20261117` · NO LIVE DEPLOY_

## Objective

M54 added the context-sensitive **← Back to Who’s Who profile** button. Its initial browser test only exercised a synthetic HTML control fixture, and M53 had separately mocked an external publisher. M55 adds an integrated test against the actual locally served `who-is-who.html` **and** `index.html`, and gates a downloadable **local public-site website ZIP** on the GitHub Actions tests passing. This milestone does **not** build or sign an Android APK and does not activate a production Netlify deploy.

## Exact inherited state

- **50** public profiles: **23** claim-specific provisional evidence dossiers and **27** documented role/activity records.
- **84** evidence-summary links with hosting labels; **23** source-lineage explanations and **28** tags linking repeated references to **11** source families.
- **Four** source-attributed person ↔ Archive-case records: David Fravor / Nimitz (firsthand hearing statement), Kevin Knuth / Nimitz (later published modelling; not an eyewitness), Larry Warren / Rendlesham (contested retrospective account) and Nick Pope / Rendlesham (later published commentary, not an original eyewitness).
- All case involvements are `editorial-draft`, `eventVerified:false`, with no inferred independent witness count. All claim scores, signed editorial approvals, community votes and photo rights approvals stay withheld.

## Real-site local Chromium test

`scripts/test_who_m55_real_site_flow_chromium.cjs` runs with a local `python3 -m http.server 4173` and a real headless Chrome browser, **not mocked Who/Archive pages**. Every third-party HTTP request is blocked; the site can only read localhost fixture/site assets.

At **393px**, it opens each of these paths:

1. `/who-is-who.html?person=kevin-knuth` → Nimitz.
2. `/who-is-who.html?person=david-fravor` → Nimitz.
3. `/who-is-who.html?person=larry-warren` → Rendlesham.
4. `/who-is-who.html?person=nick-pope` → Rendlesham.

For each, it checks the exact person, one cited person/case relation, the correct Archive route, a same-tab navigation into the **real** local home/Archive page with `dd_from=who`, a real open case dialog whose `data-archive-case-id` matches, the newly visible contextual Back control, the stored validated person/case destination, actual Back click to the original profile URL and preserved 14-tab premium navigation. It also requires the contextual marker be consumed, and no horizontal overflow. It then visits a Nimitz Archive deep-link **without** `dd_from=who` to ensure the contextual control remains hidden. At **320px**, it repeats the Knuth round trip and direct Archive check.

This is a real integration attempt rather than a test of the helper alone. **Do not assert a test pass without reading actual CI output.** It does not prove Android hardware/browser tab handoff or external publisher reachability. Other optional third-party services are deliberately blocked and irrelevant errors from them are not counted as a Who return failure.

`scripts/test_who_m55_site_flow_contract.cjs` is a fast static contract for all four relationships, unchanged 50/23/27/84 numbers, unchanged rating/second-editor gates, correct in-app paths, guarded return conditions, public allowlisting and the no-deploy artifact dependency.

## Conditional local-public-site test ZIP — NOT AN APK

The inherited `.github/workflows/who-m40-policy-worklist-no-deploy.yml` now includes:
- An M55 branch push trigger and new static/browser integration tests.
- A separate `m55-android-local-preview-artifact` job, **only on this M55 branch** and **only after both** `source-and-package` and `chromium-phone-tablet-desktop` have succeeded. It rebuilds and rechecks the strict public site allowlist, then `actions/upload-artifact@v4` uploads the **website files** under `disclosure-desk-m55-local-web-qa` for 7 days.
- Zero GitHub or Netlify production publishing job, Supabase account provisioning, payment, user logging, ratings or APK signing. The ZIP can only be obtained if GitHub Actions runs and passes; we have **not** confirmed such a run from the available connector.

The local website is a public-site smoke-test build. It may contain external image/video URLs and client code that ordinarily invokes online services. **For an offline public-research UI test, keep Android offline/airplane mode and do not sign in or submit comments.** Some remote imagery, ads, videos, map tiles and third-party scripts may be missing offline. This is expected and is not a substitute for the final real APK QA.

## Samsung Galaxy S24 Ultra — simple Termux test steps (once a CI artifact exists)

1. In GitHub open your repo's **Actions** page → **Who source reviews and directory QA NO DEPLOY** → the successful M55 branch run → **Artifacts** → download `disclosure-desk-m55-local-web-qa.zip`. If there is no successful run or no artifact, **there is no test ZIP yet**; do not download an old release or use the live website as a substitute.
2. On your phone open **Termux** and run `termux-setup-storage` if it has not been authorised. Then `pkg install python unzip -y`, followed by:
   ```sh
   mkdir -p ~/dd-m55-web
   unzip -o ~/storage/downloads/disclosure-desk-m55-local-web-qa.zip -d ~/dd-m55-web
   cd ~/dd-m55-web
   ls index.html who-is-who.html
   python -m http.server 4173 --bind 127.0.0.1
   ```
   The `ls` line must find both HTML files. If your Downloads filename differs, substitute the real name in the unzip command. Keep the Termux server running.
3. Turn on airplane mode if you want to ensure no remote account/API contact (localhost still works). Open **Samsung Internet** or **Chrome** at `http://127.0.0.1:4173/who-is-who.html`, not the live domain.
4. Search **Kevin Knuth** → open profile → attributed **Nimitz** Archive link → inspect the gold **Back to Who’s Who profile** action → tap it. It should return to **Kevin Knuth**, not Fravor. Repeat Fravor→Nimitz, Larry Warren→Rendlesham and Nick Pope→Rendlesham. Confirm the normal Archive case close button and the premium bottom nav still work.
5. From the website's **Archive** navigation (without coming from a Who profile), open a Nimitz case. The contextual gold Back button should remain hidden. Open a *different* case from a linked one: it should also hide when the marker no longer matches.
6. Test the phone's **Back gesture** and landscape screen. Record whether the app/browser exits unexpectedly, whether the wrong person appears, whether the case scroll resets, and whether any controls overlap the bottom navigation. Test publisher/source links online separately **without logging in**; they may intentionally open a separate browser tab.
7. Share a short **PASS / FAIL** summary or screenshots for each tested path. No need to email or upload any app credentials.

To stop the local server in Termux, use **Ctrl+C**. The unzipped files are a local test copy and do not change any live Netlify deployment.

## Expected M55 acceptance and known blockers

Pass requires a genuine GitHub Actions **success** for the exact M55 HEAD, the uploaded public-only artifact, and actual device feedback. At the point this report is written, CI-run lookup remains limited: commit statuses can be empty and the connected workflow-run accessor filters to PR-triggered runs, not the current push run. **No invented green checks or successful Android test**.

Next M56: resolve any genuine Actions failures; record Galaxy device observations; if these are successful and the owner approves, prepare a separately reviewed wider staging/release plan including pending Who’s Who explanatory pinned news. Independent human editorial signoff and real account RLS/abuse controls are required before any public numerical claim evidence scores or member voting.

## M55 red-run source audit and origin-binding fix (17 November 2026)

The owner reported a **red** M55 Actions result. The connected GitHub API cannot list the push-triggered run or its job logs, so the exact failing step cannot be asserted from Actions evidence. A deterministic mismatch was found during direct review of the committed **M54 static regression**: it required a marker from `http://127.0.0.1:4173` to be rejected if the current website URL was `https://another.example`, yet the resolver used the current site's origin to interpret a saved *relative* profile URL. Without a saved origin, the pure resolver would accept that synthetic case, so that assertion would fail.

**Correction committed to the M55 branch** (no production deployment): `assets/people-directory.js` now saves `origin: location.origin` in the session marker; `assets/who-archive-return.js` rejects a marker whose saved origin differs from the current Archive page origin. M54 static fixtures and isolated Chromium marker fixture now include the actual local origin and test missing/foreign values; the M55 contract requires both creation and validation of the origin field. A pre-fix stored marker missing the new field safely hides the contextual button until the user follows a profile-to-case link again.

The correction gives a specific explanation for at least one likely static-test failure, **not proof that the red GitHub run failed at that exact step**. Let the new push rerun; inspect the exact job logs before calling the workflow green or offering the ZIP. If the source/package job is green but Chromium red, use the specific browser test error to fix that separately, rather than weakening the case or rating safeguards.

## Confirmed Source & Package syntax failure fixed (17 November 2026)

The owner supplied the exact Actions log from Node.js v22.23.4: `node --check scripts/test_who_m55_site_flow_contract.cjs` failed at line 34 on `const module=read('assets/who-archive-return.js')` with `SyntaxError: Identifier 'module' has already been declared`. In a CommonJS `.cjs` file, `module` is a built-in wrapper parameter, so redeclaring it as a top-level lexical identifier is invalid. Fixed by renaming the variable and all four uses to `returnModule` in commit `f097eff4d11224923b1a4944da554385e9f7374e`. The existing return-link origin guard was preserved. The next Actions run must execute successfully before a local website test ZIP can be offered; no green result or ZIP has yet been verified.

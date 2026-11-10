# W.NE Research — optional Google Drive Word copies

**Current state, 10 November 2026 (M58 development):** The owner confirmed Google Cloud's Web OAuth client, Drive API, scope, authorised site origin and testing-user account, and subsequently confirmed a real website Google sign-in and successful test Word copy upload to their Drive. That user report verifies a manual upload, **not** an independent Google-console review, restored document, unattended backup, published Google OAuth status or approval for all visitors. M54 then fixed the shared local/Drive DOCX comparison-table exporter with offline real-browser tests. The M58 reconnect convenience is staged in development and **not live on Netlify**.

The previous implementation in `boydamo84-coder/WNE-Research-Edition`, `wne_source_v1_0_1/wne_google_drive_connect_v0910.py`, uses a Google **Desktop** OAuth credential and a local Python callback. Its credential file, tokens and encrypted-library server code cannot be published inside the static website. The Research browser integration retains the limited `drive.file` scope and new-copy workflow.



## M58 — remember Google Drive connection preference, not Google credentials

- Once a signed-in W.NE Research user authorises Google Drive successfully, the website remembers only a non-sensitive Boolean reconnect preference scoped to a SHA-256 hash of the verified Research owner. **No Google access token, refresh token, password, account email or Google account identifier is placed in localStorage/sessionStorage**, or in a public URL.
- The short-lived Google access token remains **in memory only** during the currently open editor page. A subsequent page load or expired token shows **Reconnect Google Drive**. A user click requests a fresh Google token without unnecessarily forcing the account selector when Google still remembers the prior consent. Google can still require user interaction, confirmation, account selection or sign-in. If that convenience attempt fails, the next click offers **Choose Google account**.
- The explicit Disconnect button forgets that device's reconnect preference; when an active token exists, it also requests Google permission revocation. It does not remove or overwrite Word backups. If Google permission expired before disconnect, users may separately review revocation in their Google Account's third-party connections.
- Reconnect is never triggered invisibly on page load, while signed out, or for a different Research owner. Google token handling and strict owner validation remain unchanged. The product must not claim **permanent Google login**, **background backup** or **automatic reauthorisation** with this client-side token flow. This is a one-click opt-in reconnect, not an unattended Google backup service.
- Keep **Google Drive backups manual in Research Edition** for now; the separately installed original W.NE Writer may use its independent planned/working automatic Drive full-library backup capability. Research's Supabase document autosave is separate from supplementary Drive Word backups.
- M58 stays on `fix/m58-drive-reconnect-ux-nov10` with `[skip netlify]` commits. Test in GitHub no-deploy CI and combine into one later owner-approved website release, preserving the owner's Netlify credit budget.

## Moving the OAuth website application out of Testing

This change is **in Google Cloud, not in a GitHub commit or Netlify publish**. The owner must open [Google Cloud Console](https://console.cloud.google.com/) using the **BDS Secure Backups** project, then:

1. Google Auth Platform → **Audience**: verify that user type is **External** and status is **Testing**, then select **Publish app** / move to **In production** when the actual Publishing UI permits it. Do not infer its status from a previous screenshot; review the live state. Testing can allow only listed test users (up to 100), and test-user authorisations generally expire after seven days.
2. Google Auth Platform → **Branding**: verify app display name, contact/support email, website home, privacy policy and required verified domain ownership (`uapdisclosuredesk.com`). Google Auth Platform → **Data access**: keep only the existing limited `https://www.googleapis.com/auth/drive.file` scope; do not request blanket `drive` permissions for basic Word copies.
3. Check Google's **Verification Centre** or the publishing prompts for any required brand/consent verification. The Drive API currently describes `drive.file` as **non-sensitive**, normally a simpler/basic verification path, but Google may still require branding/domain review. **Publishing to In production does not itself prove Google verification is complete or remove all warnings**; report any actual Google review requirements.
4. Re-test on a Google account **not listed as a test user**, after Google confirms Production/public access. Use a disposable Research report and test Connect → Drive upload → hash/readback → open generated DOCX outside W.NE → import as **new** private document → failed/revoked token and sign-out; leave the original unchanged.

Google's official sources: [Audience and Testing/Production](https://support.google.com/cloud/answer/15549945?hl=en), [Google browser token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [Drive `drive.file` scope classification](https://developers.google.com/workspace/drive/api/guides/api-specific-auth). A Google Drive plugin connected to ChatGPT cannot publish the website's OAuth project on the owner's behalf.

## 10 November 2026 — M52 website client registered

- User created **Disclosure Desk W.NE Research Web** as a new *Web application* client in the existing **BDS Secure Backups** Google Cloud project, alongside the existing **BDS Backup Runner** Desktop client; Desktop client was not changed.
- User supplied only the **public Web OAuth Client ID**, which is now in `research/google-drive-config.js` on `fix/post-m50-action-rails-citations-nov10`; no secret, OAuth JSON or token was added. `research/wne.html` loads `google-drive-config.js?v=m52` to bypass stale mobile caching.
- New no-deploy source test checks the exact config shape, public bundle inclusion, limited `drive.file` scope and use of Google Identity Services. The existing `scripts/test_research_drive_runtime.cjs` covers fictional upload/readback hash, owner mismatch, memory-only tokens and a hostile upload host.
- **Owner Google Cloud follow-ups (must be checked in the existing BDS project):** Google Drive API enabled; Google Auth Platform → Audience status (**Testing** or **In production**) and appropriate test accounts; Data access has `https://www.googleapis.com/auth/drive.file`; new Web client authorized JavaScript origin exactly `https://uapdisclosuredesk.com`; Branding/support/privacy configuration appropriate for public users.
- **Still unverified:** authentic Google account consent, real upload, Drive retrieval and Word recovery, and signed-in Samsung/iPhone acceptance. Test on a disposable report; never treat source CI as proof of a real Google connection. Do not trigger a production Netlify deploy solely for the public ID.
- The website's browser flow is **manual on-demand ordinary DOCX copies**, not the original encrypted full W.NE library backup or an automatic cloud scheduler. Do not overwrite any existing Drive files.

## Configuration needed before activation

### Owner setup values

Use the existing Google Cloud project for W.NE if appropriate, retaining its Desktop client. The website needs a separate Web application client. Only send the **Client ID** back for website configuration; it ends in `.apps.googleusercontent.com`. Do not send the Client secret or download/share a credentials JSON file.

| Google Cloud field | Website value |
| --- | --- |
| Application type | Web application |
| Client name | Disclosure Desk W.NE Research Web |
| Authorised JavaScript origins | `https://uapdisclosuredesk.com` |
| Authorised redirect URIs | None for this popup token integration |
| Enabled API | Google Drive API |
| Requested scope | `https://www.googleapis.com/auth/drive.file` |
| Privacy policy | `https://uapdisclosuredesk.com/privacy` |
| Testing audience | Add the Google accounts performing acceptance tests |

Google's current setup instructions: [create a Web application client and configure origins](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid). The client ID alone does not prove the API, audience and origin are configured correctly; complete the actual acceptance steps below. A Google Drive connection inside ChatGPT does not configure this website's Google OAuth client.

1. In the existing Google Cloud project, enable the Drive API and create an OAuth client of type **Web application**. Keep the existing Desktop client for the standalone Writer.
2. Add `https://uapdisclosuredesk.com` as an authorised JavaScript origin. Add `https://www.uapdisclosuredesk.com` only if that origin is actually used. For local QA, add the actual localhost origin separately; do not allow arbitrary preview origins.
3. Configure the consent screen for the `https://www.googleapis.com/auth/drive.file` scope and the site's real privacy/support pages. If the Google app is in Testing, add the test accounts; complete Google's publishing requirements before offering the connection publicly.
4. Put only the public web client ID in `research/google-drive-config.js`. **Never publish a client secret, desktop credential JSON, refresh token or service account.** The implementation uses Google Identity Services' browser token model and needs no secret or OAuth server endpoint.
5. On a disposable report and the owner's own Google account, connect, upload, confirm the read-back hash succeeds, open the actual downloaded Word file outside Disclosure Desk, then import one backup as a separate Research document. Cancel an import and confirm no new document is created. Test denial, expiry, popup blocking, offline, sign-out and account switching on Samsung/iPhone before release.

## User experience and limits

- File → Google Drive and Research Home → Google Drive open the same small panel.
- Connect Google Drive, Back up this document, Find my backups and Disconnect are the available actions.
- Uploads are manually requested, create new `.docx` files, and are read back and SHA-256 checked before success is reported. Existing Drive files are never updated or deleted.
- These are ordinary readable Word copies, not the standalone app's password-encrypted full-library archives. The panel states that distinction. They supplement Supabase autosave and local Word/library downloads; background or automatic Drive backup is not implemented.
- `drive.file` limits access to files created/authorised for this application. The list further filters app-created backups by a SHA-256 fingerprint of the signed-in Disclosure Desk owner. It does not scan the entire Drive.
- Access tokens are held in memory only and cleared on a Research account change. They are not placed in local/session storage, URLs, logs, Supabase or the static config. Account checks surround every transfer and OAuth attempt callbacks are tied to the initiating owner/epoch.
- The panel lists the latest 100 app-created Word backups. Import supports files under 14 MB and always uses the existing save-before-navigation and confirm-new-copy import pipeline. No claim is made that a Word reimport reproduces every W.NE-only setting or reference ledger.
- Before configuration, the panel clearly explains that the website connection needs setup and keeps Drive actions disabled. It does not claim a successful connection or backup.

Primary references: [Google token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [Drive scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), [resumable uploads](https://developers.google.com/workspace/drive/api/guides/manage-uploads).

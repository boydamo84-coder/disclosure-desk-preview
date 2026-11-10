# W.NE Research — optional Google Drive Word copies

M52: Public Google Web OAuth client ID was configured on the M51 development branch on 10 November 2026. **Not deployed.** Real Google OAuth consent, Drive API enablement and a live upload/restore have **not** been verified; do not advertise the website as connected until owner acceptance.

The previous implementation in `boydamo84-coder/WNE-Research-Edition`, `wne_source_v1_0_1/wne_google_drive_connect_v0910.py`, uses a Google **Desktop** OAuth credential and a local Python callback. Its credential file, tokens and encrypted-library server code cannot be published inside the static website. The Research browser integration retains the limited `drive.file` scope and new-copy workflow.

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

# W.NE Research Studio — Samsung acceptance drill
_8 November 2026 • Test plan, not proof of device acceptance_

**Release boundary:** All Milestones 11–16 discussed here are on feature branch `fix/research-mobile-profile-polish-nov08`. This is **not currently published** to uapdisclosuredesk.com. Do not run these steps against production or claim success until a separate test release is explicitly approved and available.

**Safety:** Only use a temporary account and disposable research content, never the user's book or original Boards. Keep independent copies of valuable work; do not test delete or restore with irreplaceable documents. Do not paste private access tokens, passwords or personally identifiable case information into screenshots.

## Samsung Chrome — staged real device checklist

- [ ] Open the agreed **separate preview URL** in Samsung Chrome, sign in to a test account. Verify W.NE Research Studio opens without redirect loops, and Home is reachable without abandoning unsaved editing.
- [ ] Create `SAMSUNG QA – Temporary Research` and add two sections. Enter `Ths is a sentnce. Source: https://example.org/` in the first, then a second paragraph. Verify status reports a confirmed save.
- [ ] Select just `sentnce`. Choose **Selection size → 16 px**. Verify only those letters change, adjacent text does not; Undo restores old formatting, Redo reapplies it. Check Gboard does not cover the formatting control or the document.
- [ ] Use **＋ Insert → Image** with a disposable photo, a caption and source. Use **＋ Insert → Compare** with two synthetic cases. Verify each preview and insertion, then wait for confirmed save.
- [ ] Open **Writing checks**, use Previous / Next between findings. Verify the active finding is highlighted and visible, but navigation does not summon Gboard or alter text. Select a safe correction deliberately; test Undo afterwards. If online LanguageTool is unavailable, note the exact status rather than claiming a successful check.
- [ ] Save, close the browser tab, reopen the same document and confirm the chosen section, text formatting, embedded figure and comparison still exist. Confirm Home remains accessible.
- [ ] Export **Word DOCX** and **PDF**; open each downloaded copy. Check size, caption, case table and source links against original. Record download filename and any missing content.
- [ ] Run **Backup Library ZIP** and independently save its file. In **Home → Restore Library ZIP**, inspect the archive, choose *one* test document and restore it as a **new copy**, never over the original. Confirm both documents have distinct IDs and equivalent content. Stop and investigate on partial failure; do not automatically retry.
- [ ] In **Research Library**, add `Rendlesham test note` and filter/search it. Reload: it should persist in this browser profile; don't infer it is cloud synced.
- [ ] Import the synthetic JSON fixture `docs/RESEARCH_STUDIO_DISPOSABLE_BOARD_QA.json` as a browser copy. Verify it is marked `On this device`, can open read-only and persists on reload. Use **Back up device Boards** separately; verify you can download the backup. Signed-in cloud Boards should be separately labelled and read-only.
- [ ] Temporarily disable the internet and re-open Research Library. Device Board/notes should remain accessible. Cloud Boards should display an honest unavailable status, not an empty or wiped library. Do not test cloud saves while offline.
- [ ] Switch to landscape and back. Verify split view, menus, suggestion panel and navigation remain usable without hidden buttons or horizontal overflow.
- [ ] Log out and, if safe with a separate disposable account, verify the first account's **cloud documents** do not appear in the second account. Browser-stored Research Notes/Board copies can remain in the shared browser profile and **are not account isolated**; do not use them for sensitive material on a shared device.

## Evidence to return
Report each problem as: **screen → action → expected → actual**, with a screenshot showing only disposable test content. Include browser version, orientation and whether online/offline. The release decision must separately check Android Chrome, iPhone Safari, real Supabase RLS and backup recovery. Automated Chromium fixtures do not substitute for these checks.

### Acceptance status
- Real Samsung Chrome: **NOT YET RUN**
- Real iPhone Safari: **NOT YET RUN**
- Signed-in full Research Studio end-to-end: **NOT YET RUN**
- Real secure per-user Google Drive OAuth backup: **NOT YET IMPLEMENTED**
- Live deployment: **NOT AUTHORISED**

Production source/hosting remain unchanged until the owner approves a separate staging and release plan.

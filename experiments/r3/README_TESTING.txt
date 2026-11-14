DISCLOSURE DESK — R3 ENCRYPTED LOCAL HYPOTHESIS LAB (PRIVATE ALPHA)
==================================================================
This test ZIP is NOT the live website or an installed APK. There is no
account login or cloud copy. This is an experimental passphrase-protected
single-browser LOCAL vault. Please use fictional/example data, not
sensitive research, until a full security audit has been completed.

TEST ON YOUR SAMSUNG GALAXY / TERMUX
1. Extract the new ZIP into Downloads/R3_Hypothesis_Lab_Encrypted_Test.
2. Stop the existing Termux Python server (CTRL + C).
3. In Termux, run:
   cd ~/storage/downloads/R3_Hypothesis_Lab_Encrypted_Test
   ls
   python -m http.server 4175 --bind 127.0.0.1
   (If you used a different folder name, update the cd line.)
4. On your SAME Chrome profile, visit http://127.0.0.1:4175
5. Tap "Load fictional demo". Tap "Enable encrypted local saving".
   Enter and confirm a UNIQUE passphrase at least 12 characters long.
6. Download your encrypted backup JSON. Keep the passphrase safe.
7. Edit a hypothesis and save its next revision.
8. Close the browser tab, reopen the same local URL and unlock using
   the passphrase. Inspect the saved comparison/revision history.
9. Test importing your encrypted backup on a separate fresh browser
   profile OR, after confirming you have a usable backup, explicitly
   delete the current local encrypted vault and import it again.

DESKTOP
Run from the extracted directory:
   python3 -m http.server 4175 --bind 127.0.0.1
and open http://127.0.0.1:4175.

ENCRYPTION / SAVING BEHAVIOUR
- Opt-in browser IndexedDB storage, encrypted with AES-256-GCM and a
  PBKDF2-SHA256-derived key (310,000 iterations; 16-byte random salt).
- Passphrase is not written to browser storage. Unlock is required each
  time the page reloads. The derived key remains only in tab memory
  while unlocked; it is cleared from app references when locking.
- Each completed saved revision is encrypted before the local write.
  Unsubmitted text in the editor is NOT autosaved.
- The encrypted JSON backup is user-initiated and is NOT plain text.
  Import authenticates/decrypts before writing, and refuses to overwrite
  an existing vault. A changed/tampered backup or wrong passphrase fails.
- Local storage is tied to the Chrome profile + URL origin
  (http://127.0.0.1:4175). Changing the port, clearing browser data,
  using Incognito, or browser removal can make the saved copy unavailable.
  Always keep an encrypted backup separately.
- Anyone with your passphrase AND access to the saved data can open it.
  There is NO passphrase recovery, encrypted cloud sync, remote account
  isolation or multi-user permission enforcement.
- This is an unaudited prototype. Do NOT claim it has a production
  security certification or guarantees against device compromise.
- The original 14-tab premium dock is a DISABLED design reference; the
  active live R2 website navigation was not changed.
- No research is uploaded, no Netlify deploy is performed and no site
  account or Supabase table has been modified.
- Browser Back and refresh discard any unsaved in-form edits. Only
  completed, successfully encrypted revisions persist.

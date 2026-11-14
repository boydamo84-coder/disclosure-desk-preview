DISCLOSURE DESK — R3 HYPOTHESIS LAB PRIVATE UI ALPHA
=================================================
This ZIP is an isolated offline research UI prototype. It is NOT the live
Disclosure Desk website, not connected to user accounts and not safe for
sensitive research yet. NO background saving happens.

ANDROID / GALAXY + TERMUX TEST
1. Download the ZIP from the successful GitHub Actions R3 workflow artifact.
2. Extract the ZIP into a folder on your phone, e.g. Download/r3-lab-test/.
3. In Termux, install Python if necessary: pkg install python
4. In Termux, use a local-only server for the extracted folder, e.g.:
   cd /sdcard/Download/r3-lab-test
   python -m http.server 4175 --bind 127.0.0.1
   (Adjust the folder path if extracted elsewhere. Your system may ask
    Termux for storage permission.)
5. In Chrome on that same phone, open http://127.0.0.1:4175
6. Press Load fictional demo. Test Write, Compare, History, and export.

DESKTOP TEST
From the extracted folder, run:
   python3 -m http.server 4175 --bind 127.0.0.1
Then open http://127.0.0.1:4175 in a browser.

IMPORTANT
- Use only invented/example data. No authenticated user protection exists.
- Data vanishes on refresh or close. Export explicitly to your phone as
  plain, UNENCRYPTED JSON if needed.
- The 14-tab navy/gold dock is a DESIGN REFERENCE. It does not navigate to
  the live website or modify the existing Android APK.
- All source URLs are opened only if YOU explicitly tap them; the interface
  never fetches external data itself.
- R2 production remains live and untouched. R3 is NOT deployed.
- The user interface currently has no import/restore, secure on-device
  storage, authentication, W.NE integration or sharing.

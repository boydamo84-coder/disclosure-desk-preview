# M111 — verified W.NE layout and Android tab customisation
2026-11-28 UTC

- Executable commit: `746a20ad9dec77587d926723d324671269c8a458`
- Build: [GitHub Actions 46109093954](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/46109093954), successful.
- Package: `com.boyddigitalstudios.disclosuredesk.beta.m111`, version 47 / 0.16.13-preview. Separate install; production package 47 / 0.16.13.
- Android target SDK 36, debug signature and zip alignment verified in CI. Play AAB and release APK unsigned. Existing owner upload key and Play acceptance remain required.
- All 161 allowlisted embedded website assets (20,432,344 bytes) verified against exact local staged source; CI manifest matches executable commit and branch. All three package SHA256 checks and 64-bit native alignment passed.
- W.NE: normal editable paragraphs between adjacent tables/comparison blocks, native Backspace and confirmed image removal, explicit Insert > Paragraph after block, image Move up/down, preserving image source/caption/width/alignment and table data. Real writer browser tests at 393 and 1280 px confirmed save/reopen and unrelated section integrity.
- Android only: News / Videos / Archive / Research / W.NE / More default; Who’s Who in More; five customisable slots with reorder/swap, save/cancel/reset, device-local persistence across shared docks, badge movement, no new network calls. Previous directory retention and save-before-navigation tests passed.
- Separate website production commit `f841c8e06184da97e782d919830c356e9818748c` changed ONLY `research/wne.html` and `research/research-workspace.html`. Live editor script verified byte-for-byte; redundant Home hidden only when a report is open, not library-only. No Android dock changes published to website. No Play Store submission.
- Physical Android acceptance still to be completed by owner.

## Checksums
```
064670a69e334817adcd110c16ce4f4b1a7c8473a36f60976879e367bdd38808  DisclosureDesk-M111-private-beta.apk
cc58488e2ec28e6e5d8887e259245ee0de6ea3ec106906f4b396b3d9cbcb7c4c  DisclosureDesk-M111-release-UNSIGNED.apk
951ec4779c459cdc7ac0a4f06606bb329f9c9c0bc61590fc66de2bc4140a0563  DisclosureDesk-M111-UNSIGNED.aab
```

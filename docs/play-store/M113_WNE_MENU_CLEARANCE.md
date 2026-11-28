# M113 — W.NE dialog clearance and final-block typing
28 November 2026 UTC — private Android candidate, NO WEB DEPLOY / NO PLAY UPLOAD.

- Owner physically reported M112 startup/app working well on Galaxy S24 Ultra; two screenshots show the expanded bottom navigation obscuring the crop dialog's Done button. A subsequent recording shows tapping below a final comparison targets its internal source note instead of a new report paragraph.
- Fix: reserve the measured dock height in the flex workspace, while hidden-menu and full-screen writing modes keep their previous available space. Separate image editor's scrollable controls from its always-reachable Done/Remove actions. Keep current crop, undo/redo, positioning and save logic.
- Extend existing block-gap normalization to the final table/comparison, preserving its contents and the document's standard save behavior. Existing paragraph-after control remains.
- Derived exclusively from M112 executable f4266807de7d582e04dc7161131f64648346b6d4 (successful run 46111449448); M113 0.16.15-preview/build 49 is separate beta package com.boyddigitalstudios.disclosuredesk.beta.m113.
- New real Chromium workspace fixture checks dock clearance and hit-testing at 320/393 px, actual crop and close, reduced height, typing into a top-level trailing comparison paragraph and full-screen restoration. Existing M111 regression additionally checks the final ordinary table. Fictional data only.
- Build and physical acceptance pending; no website deployment, database changes or Play upload. Preserve existing research; do not uninstall other installations.

# 27 November 2026 — research action polish and reader feedback

Production baseline: `086694b7fd94bbd4cee812ab9dff1e150b757924`.

- Owner identified the bright, low-contrast FOIA buttons on mobile and chose **+ W.NE Ref**. The Add to Board, + W.NE Ref, and Open W.NE controls now share a muted navy surface, gold text and border, a 44px minimum target and clear keyboard focus. The short W.NE label retains a fuller accessible name. Applied to the native research hub, standalone FOIA/PURSUE, and original investigation transfer actions. No changes to save semantics, source links, or existing references.
- Reader feedback highlighted an inconsistent archive headline. The previous 10,000+ static badge conflicted with 533 initially available (521 PURSUE records + 12 curated investigations); the larger archive asset contains 12,982 raw records. The badge now reflects the actual deduplicated loaded collection, including fallback and loading. Filters still display matching versus loaded totals.
- Device-only Board storage is explicitly stated in the common save picker and success toast; users are directed to the existing manual copy/import controls. No storage, account, cloud transfer or privacy behaviour changed.
- Removed a development-only Python server reference from the Research Studio empty state.
- Reader feedback about news quality is recorded for a separate editorial filter review. Do not invent publisher headlines, remove legitimate evidence, silently conflate source types, or alter stored Boards.
- Browser tests check 8.69:1 button contrast, 44px targets, visible compact label, actual reference save and deduplication, correct links, Board save warning, and archive count parity. Full research navigation, packaging and accessibility regression.

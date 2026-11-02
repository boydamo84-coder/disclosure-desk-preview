# Disclosure Desk — development handover
Updated 2026-11-02.

## Key recent events
- Hosted W.NE Research Edition was initially developed as a second simplified editor in a separate repository.
- That duplication was explicitly rejected by the user. Future integration must adapt the **existing W.NE Research Edition UI**, with original research menus, exports, citations, comparison tools.
- Research Edition staging branch was merged and a Netlify staging deployment succeeded 2026-11-02. It is a prototype for integration only.
- This Disclosure Desk preview repo was not intentionally changed during that staging release.

## Immediate next steps
1. Read `PROJECT_RULES.md`, `FEATURE_REGISTRY.md`, `PROJECT_MEMORY.md`.
2. Inspect current preview's existing features before changing them.
3. Coordinate the original Research Edition UI with existing Supabase account and `investigation_boards` infrastructure, preferably without new competing schemas.
4. Keep all user data safe; verify security, backups and account isolation.
5. Distinguish website preview, live website and APK builds before publishing.

## Session-end requirement
Update this handover with exact branch/commits, tests, outstanding defects and next action; avoid vague 'done' statuses.

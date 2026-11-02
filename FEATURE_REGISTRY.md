# Disclosure Desk — feature inventory (partial, verify code)
| Area | Where to inspect | Known state |
|---|---|---|
| Cloud sign-in/private Boards | `cloud-boards.js` | Existing Supabase `investigation_boards` code; user tested two-account isolation in prior sessions |
| Website/news/case/videos UI | `index.html` and linked assets | Existing preview application; detailed feature verification required before changes |
| Research Edition | Separate `boydamo84-coder/WNE-Research-Edition` repo | Reuse canonical original W.NE-derived interface, not staged simplified editor |
| Research Studio staging | Research Edition repo branch `staging/private-browser-qa` | Staging cloud tester and simplified browser editor, not approved final UI |
| Original W.NE | Separate `boydamo84-coder/W.NE` repo | Must not modify |

This table is an index, not an exhaustive claim of implementation. Inspect repo/search existing names and user-tested behaviour before adding a feature.

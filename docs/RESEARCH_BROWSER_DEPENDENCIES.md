# Research browser dependencies

The pinned browser builds are now served with the website, so an already-open editor does not depend on a CDN to create an emergency Word copy. Upstream license notices are retained in the exact distributed files. No Google credentials are included.

| File | SHA-256 |
|---|---|
| `research/vendor-jszip-3.10.1.js` | `acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e` |
| `research/vendor-dompurify-3.4.17.js` | `cd37898f9782adf54820c413191b5691803f0f137c799d6edcfd38523b4c2c31` |
| `research/vendor-docx-9.5.1.js` | `bb2908d72ffd8a3d896b455563733d3a2e708e1384a5140e05b3c6dd0b2f676d` |
| `research/vendor-mammoth-1.12.3.js` | `f9465c0e4b91c6ab5fe03db285aa3c5bd33a1d20da781b8dffc5676bc9689a95` |


Security refresh, 10 November 2026: DOMPurify 3.4.17 and Mammoth 1.12.3 replace the older 3.2.7 / 1.9.1 builds after upstream security review. Both package tarballs were SHA-512 verified against npm's exact-version metadata before copying their distributed browser files. See [DOMPurify release](https://github.com/cure53/DOMPurify/releases/tag/3.4.17), [DOMPurify advisory](https://github.com/cure53/DOMPurify/security/advisories/GHSA-v9jr-rg53-9pgp), and [Mammoth NEWS](https://github.com/mwilliamson/mammoth.js/blob/master/NEWS) for prototype-pollution / parser fixes. This does not assert that every upstream dependency has no possible vulnerability.

Word import runs in a disposable local Web Worker, not the editor thread, with a 30-second deadline. Its actual parser is tested against hostile style names and oversized/invalid packages. External file access and embedded style maps are disabled. ZIP metadata limits: 14 MiB input, 4,000 entries, 16 MiB per entry and 64 MiB total declared expansion. Converted HTML is capped at 16 MiB and is sanitised in the main document with the explicit HTML/attribute allowlist. Unsupported or failed imports leave the source file and original report intact. These bounds reduce resource-exhaustion risk; they are not an assertion that ZIP directory metadata proves actual decompression memory usage. The worker can be terminated on timeout, and untrusted document contents do not receive account tokens.

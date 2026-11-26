# Bouncer scanner pilot — live synthetic-only evaluation

26 November 2026 · Issue #18 · Development evaluation, **not release approval**

## Scope and account

Owner approved a separate free Bouncer evaluation account and creation of the key named `Disclosure Desk - Synthetic PDF QA`. Dashboard showed the free tier, 0/500 scans initially. Four submissions used only invented, non-user data. No actual research, production credentials, user data, storage objects, publishing route, W.NE host changes or paid services were used. The raw key was not recorded, committed or supplied to a public client. Dashboard-only tests; server-to-server API adapter not yet tested. No key is configured in production.

## Observed live dashboard results

| Synthetic input | Bytes | Verdict | Reported scan time | Assessment |
|---|---:|---|---:|---|
| Two-page valid fixture with text, vectors and image | 1,388 | CLEAN | 283 ms | Expected clean |
| Same style fixture containing inert PDF open-action JavaScript | 1,433 | SUSPICIOUS | 65 ms | Expected refusal; signature PUA.Pdf.Trojan.OpenActionObjectwithJavascript-1 (medium) |
| Deliberately malformed PDF-like bytes | 62 | CLEAN | 66 ms | Antivirus alone does not establish PDF validity; structural gate still required |
| Standard harmless 68-byte EICAR antivirus test text | 68 | MALICIOUS | 63 ms | Expected detection; Eicar-Test-Signature, signature/pattern indicators (high) |

All four dashboard SHA-256 values matched the exact local fixture bytes. Reported times are vendor scan durations, not measured complete upload round-trip speed or capacity. EICAR is harmless standardized test content and was never executed. No actual malware was used.

Fixture digests:
- valid: `69202d22889e8ed5a3f36e624351cac31c956689a9ddf74f3c201962033ad9ab`
- inactive test action: `f4e845fbebf7325b2c6912565821706dd81e6909d432f609408796208d0b8aec`
- malformed: `9f58a1e8daa3125b4a63bef274aa99de1b4580edf0313e6695595d95657647e7`
- EICAR: `275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f`

## Decision and remaining gates

Bouncer is a promising no-new-VM *candidate*, not a substitute for all PDF safety checks. Keep current 5 MB/100-page/250 MB combined quota, structural qpdf validation, restricted renderer, exact original hash binding, private quarantine, least-privilege access, no active original publication, and all existing fail-closed safeguards. Note provider documents approximately 4.5 MB direct v1 request limit despite 25 MB free v2 limit: a server-side integration must use the documented v2 flow for larger pilot files or explicitly preserve the current 5 MB cap another tested way; never send API keys to clients, log presigned upload credentials, or allow unverified endpoints. Do not replace or bypass the official ClamAV gate on the basis of these four tests.

Before any live integration, verify production-use eligibility with provider, security and actual engine coverage/freshness guarantees, applicable UK data-protection requirements including transfer to India (AWS Mumbai), privacy disclosures, processor terms and retention: policy states file deletion within 24 hours and retention of scan metadata while account is active. Obtain owner review and approval, and use only synthetic fixtures until then.

For any candidate server adapter, validate response envelope, completed status, clean verdict, engine success, exact expected scan ID, SHA256 and bytes; reject unknown/partial/mismatched responses, suspicious or malicious, timeout/network/401/429/5xx/quota and any unverified error. No user-visible file delivery unless every independent gate passes. Verify authenticated calls, error handling, quotas, signature freshness evidence or an explicitly reviewed equivalent assurance, max-size path, abuse controls, and mock/real tests separately. No real user upload or service activation currently authorised. No changes to prior production packaging gate or release approval scope. Oracle dedicated free host remains an alternative; existing W.NE LanguageTool VM must stay untouched.

References (checked 26 November 2026):
- https://usebouncer.dev/docs/
- https://usebouncer.dev/terms/
- https://usebouncer.dev/privacy/
- https://www.eicar.org/download-anti-malware-testfile/

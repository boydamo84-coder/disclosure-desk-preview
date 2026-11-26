# Community Research PDF scanner host readiness (no deployment)

26 November 2026 · Issue #18 · Proposed next real acceptance gate, pending owner-approved host access

The 5 MB / 100-page PDF-first pilot with a 250 MB combined storage cap is unchanged. W.NE already exports PDFs; the separate renderer preserves user-submitted layout in candidate page images. Neither Drive storage nor the successful isolated fixture tests substitute for official antivirus clearance. Keep live researchPublishing and every related feature gate OFF.

## No-cost compute candidate (not provisioned)

The owner's previously recorded W.NE LanguageTool VM is an Ampere A1 Flex in London, 1 OCPU / 6 GB RAM and approximately 47 GB boot volume. Its Java heap was configured at 2 GB. Do not resize, install on, restart or repurpose that instance.

Oracle's current Always Free documentation states 1,500 A1 OCPU hours and 9,000 GB-hours monthly, equivalent to 2 OCPUs / 12 GB across the tenancy, and 200 GB combined boot/block volume allowance in the home region. This is smaller than some older 4 OCPU / 24 GB references. A dedicated second A1 Flex with 1 OCPU / 6 GB, approximately 50 GB boot volume and no paid extras would fit the published compute allowance (even a 31-day month: 1,488 OCPU-hours and 8,928 GB-hours for both known VMs) if there are no additional consuming resources. Actual tenancy quotas, remaining capacity, plan and region availability must be checked in the console before creating anything. Oracle may reclaim idle Always Free instances; availability and continuity are not guaranteed. No paid upgrade is authorized.

- Region: existing tenancy home region (previously London); choose an availability domain with Always Free A1 capacity.
- Shape: VM.Standard.A1.Flex, 1 OCPU, 6 GB RAM.
- OS: a supported Always Free-eligible ordinary Ubuntu LTS ARM64 image, not an extra-cost developer image. Verify image and volume eligibility before confirming creation.
- Storage: standard approximately 50 GB boot volume within the free aggregate; no add-on volumes, reserved public address, paid load balancer, NAT gateway, or other new paid resource.
- Network: do not expose the scan worker, ClamAV socket, uploaded files, database or admin endpoint to the internet. Use least-privilege owner administration, narrow inbound access if needed for admin, tightly restricted update egress, and no network in individual scanning/rendering containers.
- Confirm no other existing resources consume the residual allowance. If allocation is unavailable or estimated price is nonzero, STOP. No workaround by using the LanguageTool VM.

ClamAV container documentation recommends 3 GiB minimum and 4 GiB preferred. 6 GB host memory is a plausible pilot, not a capacity benchmark. Run only one scan/representation job at a time, separate signature updates from scans by an operator-controlled lock, do not disable signature validation or freshness, and verify that OS, update process and worker have headroom. Avoid OOM; fail closed on timeout, warning, skipped scan, missing/invalid/stale signatures, unexpected receipts or insufficient capacity.

## Next actual gate (after owner authorizes/provisions isolated host)

1. Verify host shape, architecture, RAM, disk space, current free allowance and system health; confirm only the intended dedicated host is selected. Do not inspect real customer files or credentials.
2. Establish a maintained, patched ARM64 ClamAV/official FreshClam update process under least privilege. Record versions, dates, update outcome and verified signature metadata for main, daily and bytecode databases. Use the documented updater; no repeated full downloads or weakened verification. Keep official signatures read-only for the isolated worker, with no trust in client-supplied paths or filenames.
3. Use the exact worker and fixed fictional two-page PDF from the existing scanner QA. Run non-root, network-disabled, read-only container with bounded scratch, memory, CPU, pids, file limits and no host credentials. Measure wall time, peak RSS, disk/OS headroom, scan/update behaviour and failure modes. The worker must return its existing exact next-gate-only scan receipt. Test missing/stale signatures and synthetic refused inputs without malware samples. Stage 17's 12.6 MiB measurement occurred before full signature load and is not a capacity result.
4. Stop if any host or official-signature check fails. A passing result would close only the scanner-host gate; genuine trusted quarantine storage/reservation reconciliation, consent and secure approved publication/withdrawal interface, accessible delivery, actual role/abuse tests, strict production packaging, physical Android and explicit exact release approval remain separate.
5. Do not create public routes, publication transport, real upload endpoints, persistent service credentials, live storage objects or live Supabase changes as part of this host acceptance. Do not retry or work around the previously rejected publication operation.

## Storage decision

The existing private Google Drive option can be evaluated for authorized archival storage only; it does not scan uploaded PDFs for us or establish safe public delivery. The pilot cap includes every original and representation object until trusted deletion confirmation; verify actual provider object bytes and permissions in a separately reviewed integration. No storage writes are authorized in this host QA.

Official references (checked 26 November 2026):
- https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm
- https://docs.clamav.net/manual/Installing/Docker.html
- https://docs.clamav.net/manual/Usage/SignatureManagement.html

No production deployment, paid resource, host access, new upload, public release or schema modification occurred when recording this plan.

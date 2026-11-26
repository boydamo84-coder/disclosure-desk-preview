# One-off QA image only. Official ClamAV preloaded signature image, no update daemon.
# Do not build this regularly; production needs its own persistent, managed updater.
FROM clamav/clamav:1.5 AS signatures
FROM dd-pdf-scanner:qa
COPY --from=signatures /var/lib/clamav/ /signatures/
COPY test_official.py /worker/test_official.py

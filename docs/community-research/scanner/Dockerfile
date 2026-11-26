# Offline worker: install distribution security updates at build time; no updater or network in the scan job.
FROM ubuntu:24.04 AS worker
RUN printf '#!/bin/sh\nexit 101\n' >/usr/sbin/policy-rc.d && chmod 755 /usr/sbin/policy-rc.d \
 && apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 qpdf clamav \
 && rm -rf /var/lib/apt/lists/*
RUN groupadd --gid 10500 ddscanner && useradd --uid 10500 --gid 10500 --no-create-home --shell /usr/sbin/nologin ddscanner
WORKDIR /worker
COPY worker.py /worker/
USER 10500:10500
ENTRYPOINT ["python3","-I","/worker/worker.py"]
FROM worker AS qa
COPY test_worker.py /worker/

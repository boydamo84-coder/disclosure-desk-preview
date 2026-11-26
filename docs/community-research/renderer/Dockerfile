FROM ubuntu:24.04 AS renderer
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 python3-pil poppler-utils fonts-liberation && rm -rf /var/lib/apt/lists/*
RUN groupadd --gid 10501 ddrender && useradd --uid 10501 --gid 10501 --no-create-home --shell /usr/sbin/nologin ddrender
WORKDIR /renderer
COPY renderer.py /renderer/
ENV PYTHONDONTWRITEBYTECODE=1
USER 10501:10501
# No HTTP listener or production orchestrator; module only.
CMD ["/usr/bin/python3", "-B", "-c", "import renderer"]

FROM renderer AS qa
USER root
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3-reportlab && rm -rf /var/lib/apt/lists/*
COPY test_renderer.py /renderer/
USER 10501:10501

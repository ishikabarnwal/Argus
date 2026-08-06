# The AI service needs Tesseract, which is a system binary rather than a
# Python package — pytesseract only shells out to it.
#
# That is the whole reason this image exists. Render's native runtimes build
# without root, so `apt-get install` there fails with exit status 100 (apt
# cannot lock /var/lib/dpkg), and Render has no configuration field for apt
# packages. Inside a Docker build we are root, so the install just works.
FROM python:3.11-slim

# tesseract-ocr is the binary pytesseract calls; tesseract-ocr-eng is the
# English language data it needs to actually read anything. The slim image
# ships neither.
#
# --no-install-recommends and the apt-lists cleanup in the same layer keep
# the image small; deleting the lists in a later layer would not shrink it,
# because the earlier layer still carries them.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Requirements first, as their own layer: application code changes on every
# commit, dependencies rarely, so this keeps the slow pip install cached.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Fail the build rather than the first upload if Tesseract is somehow absent.
# A missing binary would otherwise surface as a 500 on a real user's
# screenshot, long after the deploy looked successful.
RUN tesseract --version

# Render sets PORT (10000 by default) and requires binding on 0.0.0.0 — a
# service listening on localhost is unreachable from its load balancer.
# Shell form on purpose: ${PORT} has to be expanded at runtime, and the exec
# form would pass it to uvicorn as a literal string.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}

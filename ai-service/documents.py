"""
Turning an uploaded file into text, whatever kind of file it is.

Both endpoints need the same question answered — "what is this, and how do I
read it?" — so it is answered once, here, rather than at each call site.

Two ways in:

    PDF     pdfplumber, reading the text layer the document already carries
    image   Tesseract, reading pixels

A PDF is not OCR'd. A bank statement exported from a bank is text that has
been laid out, not a picture of text, and running it through Tesseract would
throw away exact digits in favour of guessed ones. Account numbers are the
evidence, so the difference is not academic.
"""

import io

import pdfplumber

from ocr import extract_text_from_image

# %PDF-1.x, per the spec's file header. Checked over the opening bytes rather
# than the filename or the browser's content type: both are supplied by the
# caller and both are routinely wrong, while the header is what every PDF
# reader actually dispatches on.
#
# Not just data[:5] — the spec allows junk before the header, and some tools
# emit a byte-order mark or stray newlines there.
PDF_MAGIC = b"%PDF-"
PDF_SNIFF_BYTES = 1024


def looks_like_pdf(data: bytes) -> bool:
    return PDF_MAGIC in data[:PDF_SNIFF_BYTES]


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Every page's text, joined.

    `extract_text()` returns None for a page with no text layer — a scanned
    page, most often — so pages are coerced to "" and a wholly scanned
    document comes back empty rather than raising. The caller decides what an
    empty result means; see the note in main.py.
    """
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]

    return "\n".join(pages).strip()


def extract_text_from_file(data: bytes) -> str:
    """Read an uploaded file, dispatching on what it turns out to be."""
    if looks_like_pdf(data):
        return extract_text_from_pdf(data)
    return extract_text_from_image(data)

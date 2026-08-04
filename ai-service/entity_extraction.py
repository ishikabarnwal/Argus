import json
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import ClientError

from prompts import ENTITY_EXTRACTION_PROMPT

load_dotenv()

_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Pinned explicitly, never a "-latest" alias.
#
# This used to request gemini-flash-latest, which silently drifted onto
# gemini-3.6-flash — free tier 20 requests PER DAY. Nothing in the code
# changed; the model under it did, and uploads started failing once the day's
# twenty were spent. An alias is a moving target: pin it, so a change of model
# is a change of this line.
#
# Choosing the replacement, measured against this key:
#   gemini-2.5-flash, -flash-lite  404 "no longer available to new users"
#   gemini-2.0-flash, -flash-lite  429, no free-tier allowance
#   gemini-3.6-flash               works, but only 20/day
#   gemini-3.5-flash               works, but appended commentary after the
#                                  JSON object ("No wait, I need t…") even
#                                  with response_mime_type set — json.loads
#                                  would raise on that
#   gemini-3.5-flash-lite          clean JSON, larger daily allowance
MODEL = "gemini-3.5-flash-lite"


def extract_entities(text: str) -> dict:
    response = _client.models.generate_content(
        model=MODEL,
        contents=f"{ENTITY_EXTRACTION_PROMPT}\n\n---\n{text}",
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    return json.loads(response.text)


def _detail_of(details: dict, type_suffix: str) -> dict:
    """Find one entry in Google's error `details` list by its @type."""
    for item in details.get("error", {}).get("details", []):
        if item.get("@type", "").endswith(type_suffix):
            return item
    return {}


def describe_gemini_error(exc: ClientError) -> tuple[int, str]:
    """
    Turn a google-genai ClientError into an (HTTP status, message) pair.

    Rate limiting is passed through as 429 rather than folded into a generic
    failure, because it is the one error here the caller can do something
    about: waiting fixes it. Everything else becomes 502 — from the caller's
    point of view a service we depend on misbehaved, not a fault in what they
    sent us.
    """
    details = exc.details or {}

    if exc.code != 429:
        return 502, f"Gemini request failed ({exc.code}): {exc.message}"

    message = "Gemini quota exceeded"

    # Which quota ran out is the whole story: a per-minute limit clears itself
    # in a moment, a per-day limit means this key is done until it resets.
    # Only the quotaId distinguishes them, and Google returns a short
    # retryDelay for both, so the delay alone is actively misleading.
    violations = _detail_of(details, "QuotaFailure").get("violations") or [{}]
    quota_id = violations[0].get("quotaId")
    if quota_id:
        limit = violations[0].get("quotaValue")
        message += f" ({quota_id}{f', limit {limit}' if limit else ''})"

    retry_delay = _detail_of(details, "RetryInfo").get("retryDelay")
    if retry_delay:
        message += f" — retry in {retry_delay}"

    return 429, message

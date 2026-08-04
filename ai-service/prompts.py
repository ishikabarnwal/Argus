ENTITY_EXTRACTION_PROMPT = """You are analyzing text extracted from cyber fraud evidence \
(chat messages, screenshots, or bank statements). Extract structured entities from the \
text below.

Return ONLY a JSON object with these fields:
- "names": list of person names mentioned
- "phone_numbers": list of phone numbers
- "upi_ids": list of UPI IDs (e.g. name@bank)
- "bank_accounts": list of bank account numbers
- "amounts": list of monetary amounts mentioned
- "dates": list of dates mentioned
- "suspicious_keywords": list of suspicious/urgency keywords found in the text \
(e.g. "urgent", "OTP", "blocked account", "verify now")

If a field has no matches, return an empty list for it. Do not invent information \
that is not present in the text."""

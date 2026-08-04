# ARGUS

AI platform that takes scattered cyber fraud evidence (WhatsApp chats,
screenshots, bank statements) and turns it into a timeline, a relationship
graph, a fraud risk score, and a ready-to-file complaint report.

## Prototype scope
3 evidence types only: WhatsApp export, screenshot (OCR), bank statement.
Everything else from the original concept is future scope, not built now.

## Stack
- Frontend: React
- Backend: Node.js
- AI service: Python + FastAPI, Tesseract (OCR), Gemini API (not OpenAI — free tier)
- DB: MongoDB Atlas
- File storage: Cloudinary

## Differentiators
1. Missing-evidence detection — flags gaps, not just processes uploads.
2. Action-first output — tells victim what to do next, not just a report.
3. Citizen-facing/self-service, distinct from enterprise forensics tools.

## Data handling
Use synthetic/sample data for dev and demos, not real victims' data.

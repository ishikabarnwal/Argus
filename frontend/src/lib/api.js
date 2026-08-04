/**
 * Client for the Argus backend (backend/routes/evidence.js).
 *
 * Requests go to a relative /api path, which the Vite proxy forwards to
 * localhost:5000 — see the note in vite.config.js about CORS. Set
 * VITE_API_URL to point somewhere else (a deployed backend, say), and note
 * that doing so makes the calls genuinely cross-origin, at which point the
 * backend does need a CORS layer.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

/**
 * Files the OCR path cannot read.
 *
 * The backend sends any uploaded file to ai-service /ocr, which does
 * `PIL.Image.open(bytes)` — handed a WhatsApp .txt export that raises
 * UnidentifiedImageError, the service 500s and the upload comes back as a
 * 502. A text file therefore has to be read here and posted as `text`, which
 * routes it to /extract directly and skips OCR entirely. That is not a
 * workaround for a bug so much as using the right one of the two paths the
 * API already offers.
 */
function isTextFile(file) {
  return file.type.startsWith('text/') || /\.(txt|csv|log|md)$/i.test(file.name)
}

/**
 * The backend forwards the ai-service's response body verbatim, as a string,
 * so a message from that end arrives JSON-encoded one level down:
 * { error: 'ai-service /extract request failed', detail: '{"detail":"…"}' }.
 * Shown raw that is a blob of JSON in the middle of a sentence.
 */
function unwrapDetail(detail) {
  if (typeof detail !== 'string') return { text: detail, structured: false }
  try {
    const inner = JSON.parse(detail)
    // FastAPI's HTTPException serialises to { detail }.
    const text = inner.detail ?? inner.error ?? inner.message
    if (typeof text === 'string') return { text, structured: true }
  } catch {
    // Not JSON — a plain string, or a traceback. Pass it through as-is.
  }
  return { text: detail, structured: false }
}

/** Pulls the most useful message out of an error response body. */
async function errorFrom(response) {
  const fallback = `Request failed (${response.status})`
  try {
    const body = await response.json()
    const { text, structured } = unwrapDetail(body.detail)

    // A structured message stands on its own: "Gemini quota exceeded, retry
    // in 20s" does not need "ai-service /extract request failed" bolted in
    // front of it. Anything less certain keeps the backend's framing, which
    // at least says which hop broke.
    if (structured && text) return new Error(text)
    return new Error([body.error, text].filter(Boolean).join(' — ') || fallback)
  } catch {
    return new Error(fallback)
  }
}

/**
 * POST /api/evidence/upload — multipart, with either a file or raw text.
 * Resolves to the created Evidence document.
 */
export async function uploadEvidence({ caseId, type, file, text }) {
  const body = new FormData()
  body.append('caseId', caseId)
  body.append('type', type)

  if (file && isTextFile(file)) {
    body.append('text', await file.text())
  } else if (file) {
    body.append('file', file)
  } else {
    body.append('text', text)
  }

  const response = await fetch(`${API_BASE}/evidence/upload`, { method: 'POST', body })
  if (!response.ok) throw await errorFrom(response)
  return response.json()
}

/**
 * GET /api/evidence/:caseId — the whole case:
 *   { caseId, riskScore, riskLabel, evidenceCount, evidence: [...] }
 * with evidence oldest first. An unknown case is not an error; it comes back
 * scored 0 with an empty list.
 *
 * The score is computed and banded by the backend (backend/lib/riskScore.js),
 * so nothing here decides what "High risk" means.
 */
export async function fetchCase(caseId, { signal } = {}) {
  const response = await fetch(`${API_BASE}/evidence/${encodeURIComponent(caseId)}`, { signal })
  if (!response.ok) throw await errorFrom(response)
  return response.json()
}

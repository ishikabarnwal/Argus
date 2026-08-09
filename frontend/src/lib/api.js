/**
 * Client for the Argus backend (backend/routes/evidence.js).
 *
 * Requests go to a relative /api path, which the Vite proxy forwards to the
 * API in development. Set VITE_API_URL to point somewhere else — a deployed
 * backend, say — and the calls become genuinely cross-origin.
 *
 * The backend answers those, but only from origins listed in its
 * CORS_ORIGINS. Deploying this frontend to a new URL therefore means adding
 * that URL there too, or every request will be blocked by the browser while
 * the API itself looks perfectly healthy.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

const TOKEN_KEY = 'argus-token'

/* The token lives here rather than in the auth context because the fetch
 * helpers below need it and the context needs them — putting it in the
 * context would make the two modules import each other. */

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Private mode / storage disabled. The session still works until reload.
  }
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
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

async function postJson(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw await errorFrom(response)
  return response.json()
}

/* ---- auth --------------------------------------------------------- */

/**
 * POST /api/auth/signup → { token, user }.
 *
 * Creates a 'user' unless `inviteCode` matches the investigator code the
 * deployment was configured with. A wrong code is not an error and gets an
 * ordinary account — the API deliberately will not say which it was, so
 * there is nothing here to report either.
 */
export function signup({ email, password, inviteCode }) {
  return postJson('/auth/signup', { email, password, inviteCode })
}

/** POST /api/auth/login → { token, user } */
export function login({ email, password }) {
  return postJson('/auth/login', { email, password })
}

/** GET /api/auth/me → { user }. Throws if the stored token is no longer good. */
export async function fetchMe({ signal } = {}) {
  const response = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders(), signal })
  if (!response.ok) throw await errorFrom(response)
  return response.json()
}

/* ---- cases -------------------------------------------------------- */

/**
 * GET /api/cases → { cases: [...] }. The backend decides what is in the list:
 * a user's own cases, or every case for an investigator.
 */
export async function fetchCases({ signal } = {}) {
  const response = await fetch(`${API_BASE}/cases`, { headers: authHeaders(), signal })
  if (!response.ok) throw await errorFrom(response)
  return response.json()
}

/**
 * PATCH /api/cases/:caseId/status → { caseId, status }.
 *
 * Owner only; the API refuses it for investigators, who read every case and
 * change none. A case with no evidence cannot be set to 'ready_to_file' and
 * comes back 409 with the reason, which is worth showing as written.
 */
export async function updateCaseStatus(caseId, status) {
  const response = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw await errorFrom(response)
  return response.json()
}

/**
 * POST /api/cases/:caseId/report — the case as a PDF, saved to disk.
 *
 * The token lives in localStorage rather than a cookie, so the browser cannot
 * be pointed at the URL directly: the request has to carry an Authorization
 * header, which means fetching the bytes and triggering the save by hand.
 *
 * The object URL is revoked straight after the click. Skipping that holds the
 * whole file in memory until the tab is closed, which for a page someone
 * leaves open all day is a leak with no upside.
 */
export async function downloadReport(caseId) {
  const response = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/report`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) throw await errorFrom(response)

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `argus-${caseId}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

/* ---- evidence ----------------------------------------------------- */

/**
 * POST /api/evidence/upload — multipart, with either a file or raw text.
 * Resolves to the created Evidence document.
 *
 * Every file goes up as a file, including .txt and .csv. The backend decides
 * which of those it can OCR and which it should just read; this used to be
 * sorted out here, which left the same rule written in two places and the API
 * broken for anyone not calling it through this client.
 */
export async function uploadEvidence({ caseId, type, file, text }) {
  const body = new FormData()
  body.append('caseId', caseId)
  body.append('type', type)

  if (file) {
    body.append('file', file)
  } else {
    body.append('text', text)
  }

  // No Content-Type header: fetch sets it from the FormData, including the
  // multipart boundary, which cannot be written by hand.
  const response = await fetch(`${API_BASE}/evidence/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body,
  })
  if (!response.ok) throw await errorFrom(response)
  return response.json()
}

/**
 * GET /api/evidence/:caseId — the whole case:
 *   { caseId, riskScore, riskLabel, evidenceCount, evidence: [...] }
 * with evidence oldest first.
 *
 * A case you do not own answers 404 exactly as a case that does not exist
 * does, so there is nothing here to distinguish them either.
 *
 * The score is computed and banded by the backend (backend/lib/riskScore.js),
 * so nothing here decides what "High risk" means.
 */
export async function fetchCase(caseId, { signal } = {}) {
  const response = await fetch(`${API_BASE}/evidence/${encodeURIComponent(caseId)}`, {
    headers: authHeaders(),
    signal,
  })
  if (!response.ok) throw await errorFrom(response)
  return response.json()
}

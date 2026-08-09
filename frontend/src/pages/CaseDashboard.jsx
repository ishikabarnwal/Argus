import { useEffect, useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CaseGraph from '../components/CaseGraph'
import { IconChat, IconGap, IconImage, IconStatement } from '../components/Icons'
import StatusBadge from '../components/StatusBadge'
import { downloadReport, fetchCase, updateCaseStatus } from '../lib/api'
import { useAuth } from '../lib/auth'
import { STATUSES } from '../lib/caseStatus'
import { riskColorVar } from '../lib/risk'
import './CaseDashboard.css'

/** The real portal, not a placeholder. */
const CYBERCRIME_PORTAL = 'https://cybercrime.gov.in'

/**
 * Everything the backend holds for one case.
 *
 * The homepage preview is the reference for how this should look, and all of
 * it is real now except one panel: the risk score comes from
 * backend/lib/riskScore.js and the missing-evidence notice from
 * backend/lib/gaps.js, both computed from the entities actually extracted.
 * The preview's "next action" is still a mock — report generation does not
 * exist — and is deliberately not reproduced here.
 */

const TYPE_META = {
  whatsapp: { label: 'WhatsApp export', icon: <IconChat /> },
  screenshot: { label: 'Screenshot', icon: <IconImage /> },
  bank_statement: { label: 'Bank statement', icon: <IconStatement /> },
}

/**
 * Entity fields, in the order they are worth reading. Keys match
 * ai-service/prompts.py — change one and this list has to follow.
 *
 * `mono` marks the fields that are evidence in themselves: an account number
 * or a UPI ID misread as O-for-0 is a real failure, not a cosmetic one.
 */
const ENTITY_GROUPS = [
  { key: 'phone_numbers', label: 'Phone', mono: true },
  { key: 'upi_ids', label: 'UPI', mono: true },
  { key: 'bank_accounts', label: 'Account', mono: true },
  { key: 'amounts', label: 'Amount', mono: true },
  { key: 'dates', label: 'Date', mono: true },
  { key: 'names', label: 'Name', mono: false },
  // Urgency language is a hint, not a finding, so it is caution orange. Red
  // belongs to confirmed fraud signals only.
  { key: 'suspicious_keywords', label: 'Signal', mono: false, tone: 'caution' },
]

/**
 * extractedEntities is Mixed in the schema and comes from a model, so a field
 * can arrive missing, as a bare string, or as a list of objects. Everything
 * downstream assumes a list of strings.
 */
function entityList(entities, key) {
  const value = entities?.[key]
  const list = Array.isArray(value) ? value : value == null ? [] : [value]
  const cleaned = list
    .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
    .filter((item) => item && item.trim().length > 0)
  // Deduped because the value is the React key below, and a model listing the
  // same number twice would otherwise collide.
  return [...new Set(cleaned)]
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * What the case is missing, from backend/lib/gaps.js.
 *
 * Violet, not red: red is reserved for confirmed fraud signals, and "you have
 * not uploaded a bank statement" is an absence, not a finding. The same
 * treatment the empty evidence card uses, which is the other place on this
 * page where the subject is something that is not there.
 *
 * Sits above the timeline deliberately. The evidence below is what the case
 * has; this is the one section that says what it does not, and putting it
 * after a long list of cards would bury the thing that is easiest to act on.
 */
function Gaps({ gaps }) {
  return (
    <ul className="casegaps">
      {gaps.map((gap) => (
        <li className="casegap" key={gap.missingType}>
          <span className="casegap__icon" aria-hidden="true">
            <IconGap />
          </span>
          <div className="casegap__text">
            <h2 className="casegap__title">{gap.title}</h2>
            <p className="casegap__detail">{gap.detail}</p>
            {/* Mono, like everywhere else these values appear: they are
                account handles and figures, and a 0 read as an O is a real
                failure rather than a cosmetic one. */}
            <div className="casegap__chips">
              {gap.values.map((value) => (
                <span className="chip chip--mono" key={value}>
                  {value}
                </span>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Where the case has got to, and — for its owner — a way to change it.
 *
 * A select rather than four buttons: there is exactly one value, the options
 * are mutually exclusive, and a native control gets keyboard handling and a
 * usable mobile picker for free.
 *
 * Investigators see the badge and no control. They read every case and change
 * none, which the API enforces independently.
 */
function CaseStatus({ caseId, status, onChange }) {
  const { user } = useAuth()
  const fieldId = useId()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const canEdit = user?.role !== 'investigator'

  async function handleChange(event) {
    const next = event.target.value
    setSaving(true)
    setError(null)
    try {
      const saved = await updateCaseStatus(caseId, next)
      onChange(saved.status)
    } catch (err) {
      // The API refuses a case with no evidence calling itself ready to file,
      // and says why. That reason is worth showing as written.
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!canEdit) return <StatusBadge status={status} />

  return (
    <div className="casestatus">
      <label className="casestatus__label label-caps" htmlFor={fieldId}>
        Status
      </label>
      <select
        className="input casestatus__select"
        id={fieldId}
        value={status ?? 'building'}
        onChange={handleChange}
        disabled={saving}
      >
        {STATUSES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Caution, not alert — a refused change is a rule, not a fraud
          finding. */}
      {error && (
        <p className="casestate casestate--bad casestatus__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * The two things worth doing once a case has been read.
 *
 * Filing leads, because it is the action that actually helps the victim; the
 * report exists to be taken along with it. Both were dead spans in the
 * homepage mock before there was anything behind them.
 */
function NextAction({ caseId }) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)

  async function handleExport() {
    setExporting(true)
    setError(null)
    try {
      await downloadReport(caseId)
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div className="caseactions">
        <a
          className="btn btn--primary"
          href={CYBERCRIME_PORTAL}
          target="_blank"
          rel="noopener noreferrer"
        >
          File on cybercrime.gov.in
          <span className="sr-only"> (opens in a new tab)</span>
        </a>

        <button
          className="btn btn--outline"
          type="button"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Preparing PDF…' : 'Export PDF'}
        </button>
      </div>

      {/* Caution, not alert: a download that failed is a problem, not a
          fraud finding. */}
      {error && (
        <p className="casestate casestate--bad caseactions__error" role="alert">
          Could not generate the report — {error}
        </p>
      )}
    </>
  )
}

/** The homepage preview's timeline, over real uploads. */
function Timeline({ evidence }) {
  return (
    <div className="ctimeline">
      {evidence.map((item) => (
        <span className="ctimeline__event" key={item._id}>
          <span className="ctimeline__node" />
          <span className="ctimeline__date">{formatDate(item.uploadedAt)}</span>
          <span className="ctimeline__kind">{TYPE_META[item.type]?.label ?? item.type}</span>
        </span>
      ))}
    </div>
  )
}

function EvidenceCard({ item }) {
  const meta = TYPE_META[item.type] ?? { label: item.type, icon: null }
  const groups = ENTITY_GROUPS.map((group) => ({
    ...group,
    values: entityList(item.extractedEntities, group.key),
  })).filter((group) => group.values.length > 0)

  return (
    <article className="card efile">
      <header className="efile__head">
        <span className="efile__icon">{meta.icon}</span>
        <div>
          <h2 className="efile__title">{meta.label}</h2>
          <p className="efile__time text-caption">{formatDateTime(item.uploadedAt)}</p>
        </div>
      </header>

      {groups.length > 0 ? (
        <dl className="efile__groups">
          {groups.map((group) => (
            <div className="efile__group" key={group.key}>
              <dt className="efile__grouplabel label-caps">{group.label}</dt>
              <dd className="efile__chips">
                {group.values.map((value) => (
                  <span
                    className={`chip${group.mono ? ' chip--mono' : ''}${
                      group.tone === 'caution' ? ' chip--caution' : ''
                    }`}
                    key={value}
                  >
                    {value}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="efile__none">
          <IconGap />
          <span>Nothing extracted from this one — the text may not have held any entities.</span>
        </p>
      )}

      {/* Only when the original was actually kept. Pasted text has no file,
          and neither do uploads made while storage was switched off — an
          offer to view an original that is not there would be worse than no
          offer at all. */}
      {item.fileUrl && (
        <a
          className="efile__original"
          href={item.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View original{item.fileName ? ` — ${item.fileName}` : ''}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}

      {item.rawText && (
        <details className="efile__raw">
          <summary>Raw text</summary>
          <pre>{item.rawText}</pre>
        </details>
      )}
    </article>
  )
}

export default function CaseDashboard() {
  const { caseId } = useParams()
  const [caseFile, setCaseFile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Aborted on unmount so a slow response cannot land on a dead component,
    // and so StrictMode's double-mount in dev does not race itself.
    const controller = new AbortController()

    setCaseFile(null)
    setError(null)

    fetchCase(caseId, { signal: controller.signal })
      .then(setCaseFile)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })

    return () => controller.abort()
  }, [caseId])

  const evidence = caseFile?.evidence ?? null

  return (
    <section className="page">
      <div className="page__inner page__inner--wide">
        <header className="page__head casehead">
          <div>
            <p className="eyebrow label-caps">Case file</p>
            <div className="casehead__idrow">
              <h1 className="casehead__id">{caseId}</h1>
              {/* Only once there is evidence: a score of 0 on an empty case
                  means "nothing to judge", not "judged and found harmless",
                  and a Low risk badge would state the second. */}
              {evidence?.length > 0 && (
                <span
                  className="risk-badge"
                  style={{ '--risk': riskColorVar(caseFile.riskScore) }}
                >
                  {caseFile.riskScore} · {caseFile.riskLabel}
                </span>
              )}
              {caseFile && <StatusBadge status={caseFile.status} />}
            </div>
            {evidence && (
              <p className="section__lede lead casehead__count">
                {evidence.length === 0
                  ? 'Nothing filed against this case yet.'
                  : `${evidence.length} piece${evidence.length === 1 ? '' : 's'} of evidence.`}
              </p>
            )}
          </div>

          {/* Status sits beside the way to add evidence, because the two are
              the case's only controls and they belong together. */}
          <div className="casehead__actions">
            {caseFile && (
              <CaseStatus
                caseId={caseId}
                status={caseFile.status}
                onChange={(status) => setCaseFile((current) => ({ ...current, status }))}
              />
            )}

            <Link className="btn btn--primary" to={`/start?case=${encodeURIComponent(caseId)}`}>
              Add evidence
            </Link>
          </div>
        </header>

        {error && (
          <p className="casestate casestate--bad" role="alert">
            Could not load this case — {error}
          </p>
        )}

        {!error && evidence === null && <p className="casestate">Loading case file…</p>}

        {evidence?.length === 0 && (
          <div className="card casestate casestate--empty">
            <p>
              No evidence has been uploaded under <strong>{caseId}</strong> yet.
            </p>
            <Link className="btn btn--outline" to={`/start?case=${encodeURIComponent(caseId)}`}>
              Upload the first piece
            </Link>
          </div>
        )}

        {evidence?.length > 0 && (
          <>
            {/* Absent on a case with nothing missing, rather than shown empty
                with a reassuring line. "No gaps found" would overstate what
                three rules over model output can actually establish. */}
            {caseFile.gaps?.length > 0 && (
              <section className="casesection">
                <p className="label-caps casesection__label">Missing evidence</p>
                <Gaps gaps={caseFile.gaps} />
              </section>
            )}

            <section className="casesection">
              <p className="label-caps casesection__label">Next action</p>
              <NextAction caseId={caseId} />
            </section>

            <section className="casesection">
              <p className="label-caps casesection__label">Timeline</p>
              <Timeline evidence={evidence} />
            </section>

            <section className="casesection">
              <p className="label-caps casesection__label">Evidence</p>
              <div className="casefiles">
                {evidence.map((item) => (
                  <EvidenceCard item={item} key={item._id} />
                ))}
              </div>
            </section>

            {/* Last, because it is a summary of everything above it: the
                connections only mean something once you have seen what they
                were drawn from. */}
            <section className="casesection">
              <p className="label-caps casesection__label">Connections</p>
              <CaseGraph graph={caseFile.graph} evidenceCount={evidence.length} />
            </section>
          </>
        )}
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { IconChat, IconGap, IconImage, IconStatement } from '../components/Icons'
import { fetchCaseEvidence } from '../lib/api'
import './CaseDashboard.css'

/**
 * Everything the backend holds for one case.
 *
 * The homepage preview is the reference for how this should look, with one
 * honest difference: the preview shows a risk score and a "next action", and
 * nothing in the backend computes either. Inventing a number here would make
 * the screen say something the system does not actually know, so the score is
 * absent rather than faked.
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
  const [evidence, setEvidence] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Aborted on unmount so a slow response cannot land on a dead component,
    // and so StrictMode's double-mount in dev does not race itself.
    const controller = new AbortController()

    setEvidence(null)
    setError(null)

    fetchCaseEvidence(caseId, { signal: controller.signal })
      .then(setEvidence)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })

    return () => controller.abort()
  }, [caseId])

  return (
    <section className="page">
      <div className="page__inner page__inner--wide">
        <header className="page__head casehead">
          <div>
            <p className="eyebrow label-caps">Case file</p>
            <h1 className="casehead__id">{caseId}</h1>
            {evidence && (
              <p className="section__lede lead casehead__count">
                {evidence.length === 0
                  ? 'Nothing filed against this case yet.'
                  : `${evidence.length} piece${evidence.length === 1 ? '' : 's'} of evidence.`}
              </p>
            )}
          </div>

          <Link className="btn btn--primary" to={`/start?case=${encodeURIComponent(caseId)}`}>
            Add evidence
          </Link>
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
          </>
        )}
      </div>
    </section>
  )
}

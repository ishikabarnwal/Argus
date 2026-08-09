import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { fetchCases } from '../lib/api'
import { useAuth } from '../lib/auth'
import { riskColorVar } from '../lib/risk'
import './CasesList.css'

/**
 * Every case the signed-in account may see.
 *
 * One component for both roles: the backend decides what the list contains —
 * your own cases, or all of them if you are an investigator — so nothing here
 * filters anything. The only difference on this page is that investigators are
 * also told who each case belongs to.
 */
export default function CasesList() {
  const { user } = useAuth()
  const [cases, setCases] = useState(null)
  const [error, setError] = useState(null)

  const isInvestigator = user?.role === 'investigator'

  useEffect(() => {
    const controller = new AbortController()

    fetchCases({ signal: controller.signal })
      .then(({ cases: rows }) => setCases(rows))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })

    return () => controller.abort()
  }, [])

  return (
    <section className="page">
      <div className="page__inner page__inner--wide">
        <header className="page__head caseshead">
          <div>
            <p className="eyebrow label-caps">{isInvestigator ? 'All cases' : 'Your cases'}</p>
            <h1 className="section__title">
              {isInvestigator ? 'Every case on record.' : 'Your case files.'}
            </h1>
            <p className="section__lede lead">
              {isInvestigator
                ? 'Read-only. Investigator accounts can review any case but cannot add evidence.'
                : 'Only you can see these.'}
            </p>
          </div>

          {!isInvestigator && (
            <Link className="btn btn--primary" to="/start">
              New case
            </Link>
          )}
        </header>

        {error && (
          <p className="casestate casestate--bad" role="alert">
            Could not load cases — {error}
          </p>
        )}

        {!error && cases === null && <p className="casestate">Loading…</p>}

        {cases?.length === 0 && (
          <div className="card casestate casestate--empty">
            <p>
              {isInvestigator
                ? 'No cases have been filed yet.'
                : 'You have not started a case yet.'}
            </p>
            {!isInvestigator && (
              <Link className="btn btn--outline" to="/start">
                Add your first evidence
              </Link>
            )}
          </div>
        )}

        {cases?.length > 0 && (
          <ul className="caselist">
            {cases.map((row) => (
              <li key={row.caseId}>
                <Link className="card caselist__row" to={`/case/${encodeURIComponent(row.caseId)}`}>
                  <span className="caselist__id">{row.caseId}</span>

                  <span className="caselist__meta text-caption">
                    {row.evidenceCount} item{row.evidenceCount === 1 ? '' : 's'}
                    {row.ownerEmail ? ` · ${row.ownerEmail}` : ''}
                  </span>

                  <StatusBadge status={row.status} />

                  <span
                    className="risk-badge"
                    style={{ '--risk': riskColorVar(row.riskScore) }}
                  >
                    {row.riskScore} · {row.riskLabel}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

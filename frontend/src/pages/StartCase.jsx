import { useId, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconChat, IconImage, IconStatement } from '../components/Icons'
import { uploadEvidence } from '../lib/api'
import { generateCaseId } from '../lib/caseId'
import './StartCase.css'

/**
 * Upload screen. Posts one piece of evidence to the backend and hands off to
 * that case's dashboard.
 *
 * The three types are the three the product supports — see the scope rule in
 * docs/PROJECT_NOTES.md. The `id` values are the enum backend/models/Evidence.js
 * validates against, so they are not free to be prettied up.
 */

const TYPES = [
  {
    id: 'whatsapp',
    label: 'WhatsApp export',
    hint: 'The .txt file from Export chat',
    accept: '.txt',
    icon: <IconChat />,
  },
  {
    id: 'screenshot',
    label: 'Screenshot',
    hint: 'PNG or JPG — read with OCR',
    accept: 'image/*',
    icon: <IconImage />,
  },
  {
    id: 'bank_statement',
    label: 'Bank statement',
    hint: 'Text or CSV export, or a screenshot',
    accept: '.txt,.csv,image/*',
    icon: <IconStatement />,
  },
]

export default function StartCase() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fieldId = useId()

  // Generated once per mount, in a lazy initialiser — computing it in the
  // render body would hand out a new id on every keystroke elsewhere.
  const [caseId, setCaseId] = useState(() => searchParams.get('case') ?? generateCaseId())
  const [type, setType] = useState('whatsapp')
  const [source, setSource] = useState('file')
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const activeType = TYPES.find((t) => t.id === type)
  const hasPayload = source === 'file' ? Boolean(file) : text.trim().length > 0

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) {
      setFile(dropped)
      setError(null)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!caseId.trim()) return setError('Give the case an ID before uploading.')
    if (!hasPayload) {
      return setError(
        source === 'file' ? 'Choose a file to upload.' : 'Paste the evidence text first.',
      )
    }

    setSubmitting(true)
    setError(null)
    try {
      await uploadEvidence({
        caseId: caseId.trim(),
        type,
        file: source === 'file' ? file : null,
        text: source === 'text' ? text : null,
      })
      navigate(`/case/${encodeURIComponent(caseId.trim())}`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
    // No setSubmitting(false) on success — the navigation unmounts this.
  }

  return (
    <section className="page">
      <div className="page__inner start">
        <header className="page__head">
          <p className="eyebrow label-caps">New case</p>
          <h1 className="section__title">Add your first piece of evidence.</h1>
          <p className="section__lede lead">
            One file or one paste at a time. Argus reads it, pulls out the numbers and dates, and
            adds it to the case file.
          </p>
        </header>

        <form className="card start__form" onSubmit={handleSubmit} noValidate>
          {/* --- type ------------------------------------------------ */}
          <fieldset className="start__field">
            <legend className="start__legend label-caps">Evidence type</legend>
            <div className="start__types">
              {TYPES.map((option) => (
                <label
                  className={`typecard${type === option.id ? ' typecard--on' : ''}`}
                  key={option.id}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="type"
                    value={option.id}
                    checked={type === option.id}
                    onChange={() => {
                      setType(option.id)
                      // The accepted extensions change with the type, so a
                      // file picked for the previous one may no longer fit.
                      setFile(null)
                      setError(null)
                    }}
                  />
                  <span className="typecard__icon">{option.icon}</span>
                  <span className="typecard__label">{option.label}</span>
                  <span className="typecard__hint">{option.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* --- case id --------------------------------------------- */}
          <div className="start__field">
            <label className="start__legend label-caps" htmlFor={`${fieldId}-case`}>
              Case ID
            </label>
            <div className="start__caserow">
              <input
                className="input input--mono"
                id={`${fieldId}-case`}
                value={caseId}
                onChange={(event) => setCaseId(event.target.value)}
                spellCheck="false"
                autoComplete="off"
              />
              <button
                className="btn btn--outline btn--sm"
                type="button"
                onClick={() => setCaseId(generateCaseId())}
              >
                Regenerate
              </button>
            </div>
            <p className="start__note text-caption">
              Generated for you. Reuse an existing ID to add evidence to that case instead.
            </p>
          </div>

          {/* --- payload --------------------------------------------- */}
          <div className="start__field">
            <div className="start__sourcerow">
              <span className="start__legend label-caps">Evidence</span>
              <div className="segmented" role="group" aria-label="How to provide the evidence">
                <button
                  className={`segmented__btn${source === 'file' ? ' segmented__btn--on' : ''}`}
                  type="button"
                  onClick={() => setSource('file')}
                >
                  Upload a file
                </button>
                <button
                  className={`segmented__btn${source === 'text' ? ' segmented__btn--on' : ''}`}
                  type="button"
                  onClick={() => setSource('text')}
                >
                  Paste text
                </button>
              </div>
            </div>

            {source === 'file' ? (
              // A <label> rather than a div: it gives click-to-browse and
              // keyboard access to the hidden input for free, with no
              // synthetic click handling.
              <label
                className={`dropzone${dragging ? ' dropzone--over' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  className="sr-only"
                  type="file"
                  accept={activeType.accept}
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null)
                    setError(null)
                  }}
                />
                {file ? (
                  <>
                    <span className="dropzone__name">{file.name}</span>
                    <span className="dropzone__meta text-caption">
                      {(file.size / 1024).toFixed(1)} KB · click to replace
                    </span>
                  </>
                ) : (
                  <>
                    <span className="dropzone__name">Drop your file here</span>
                    <span className="dropzone__meta text-caption">
                      or click to browse — {activeType.hint.toLowerCase()}
                    </span>
                  </>
                )}
              </label>
            ) : (
              <textarea
                className="input start__textarea"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={10}
                placeholder={'Paste the chat, the transaction lines, or the message text here.'}
                aria-label="Evidence text"
              />
            )}
          </div>

          {/* Validation and failure both use caution orange. Red is reserved
              for confirmed fraud signals — a form error is not one. */}
          {error && (
            <p className="start__error" role="alert">
              {error}
            </p>
          )}

          <div className="start__actions">
            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Reading evidence…' : 'Upload and open case'}
            </button>
            <p className="start__note text-caption">
              Prototype build — synthetic sample data only, never a real victim&apos;s evidence.
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}

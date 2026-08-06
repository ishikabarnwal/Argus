import Reveal from '../Reveal'
import { IconAction, IconGap, IconLayers, IconOpenLock, IconSpark } from '../Icons'
import { riskColorVar, riskLabel } from '../../lib/risk'
import './CasePreview.css'

/**
 * Stats alongside a preview of what Argus actually produces.
 *
 * A stylised mock rather than a screenshot, so it stays legible at this size
 * and does not have to be re-shot every time the dashboard moves. Everything
 * it shows is real and reachable on /case/:caseId: the score, the timeline,
 * the extracted entities, the flagged gap, and both next actions — the portal
 * link and the PDF export.
 *
 * The buttons here stay dead spans all the same. This is a picture of the
 * product, and four working controls inside a role="img" would be a worse
 * lie than four inert ones.
 *
 * The mock is laid out in HTML rather than drawn in SVG, which is the second
 * attempt at it. SVG text does not wrap: every string sat at a hand-placed
 * `x` with a hand-measured panel width behind it, so the gap notice — the
 * longest line in the picture — ran past its own panel and out through the
 * right edge of the window. Any copy edit or font fallback re-broke it. In
 * flow layout the same line simply wraps, and the panels size to their
 * contents instead of the other way round.
 *
 * Every value here is invented. See the data rule in docs/PROJECT_NOTES.md.
 */

const STATS = [
  { id: 'types', icon: <IconLayers />, value: '3', label: 'Evidence types supported' },
  { id: 'score', icon: <IconAction />, value: '0–100', label: 'Rule-based fraud risk score' },
  { id: 'ai', icon: <IconSpark />, value: 'AI', label: 'Gemini-powered extraction' },
  { id: 'free', icon: <IconOpenLock />, value: '₹0', label: 'Free to use' },
]

/** Above HIGH_RISK_THRESHOLD, so this legitimately earns alert red. */
const DEMO_SCORE = 78
const DEMO_CASE = 'CASE-2026-0412'

/* The flagged date is the same one the gap notice names, so the eye can join
 * the two: the marked point on the timeline is the evidence that is missing. */
const TIMELINE = [
  { date: '02 Aug' },
  { date: '05 Aug' },
  { date: '12 Aug', flagged: true },
  { date: '14 Aug' },
  { date: '19 Aug' },
]

const EXTRACTED = ['+91 98765 43210', '₹25,000', 'rahul.s@okhdfc']

/** Widths of the dummy sidebar rows, as percentages. Uneven on purpose —
 *  four identical bars read as a loading skeleton, not as a filled sidebar. */
const RAIL_ROWS = [82, 66, 74, 58]

/**
 * Chrome-sized padlock. The shared set in Icons.jsx is drawn for 22px at
 * stroke 1.5; at 11px that weight disappears, so this one is its own.
 */
function LockGlyph() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8.5 11V7.5a3.5 3.5 0 0 1 7 0V11" />
    </svg>
  )
}

function CaseMock() {
  return (
    // role="img" collapses the whole mock to its label for assistive tech.
    // Without it a screen reader reads out a case ID, a risk score and a set
    // of button-looking spans as though they were a real record the user had
    // opened, which is a more confusing thing to hear than one description of
    // a picture.
    <div
      className="casemock"
      role="img"
      aria-label={`Preview of an Argus case view: case ${DEMO_CASE} scored ${DEMO_SCORE} out of 100, ${riskLabel(DEMO_SCORE)}, with a timeline of events, extracted entities, and a flagged missing bank statement.`}
    >
      {/* Browser chrome. The window buttons stay neutral grey rather than the
          usual red/amber/green: red is reserved for confirmed fraud signals
          across this product, and spending it on a decorative dot in a mockup
          is exactly the dilution that rule exists to prevent. */}
      <div className="casemock__chrome">
        <span className="casemock__lights">
          <i />
          <i />
          <i />
        </span>
        <span className="casemock__url">
          <LockGlyph />
          <span className="casemock__url-text">argus.app/case/2026-0412</span>
        </span>
      </div>

      <div className="casemock__app">
        <div className="casemock__rail">
          <span className="casemock__rail-active" />
          {RAIL_ROWS.map((width) => (
            <span className="casemock__rail-row" key={width} style={{ width: `${width}%` }} />
          ))}
        </div>

        <div className="casemock__pane">
          <div className="casemock__head">
            <span className="casemock__case">{DEMO_CASE}</span>
            <span className="risk-badge" style={{ '--risk': riskColorVar(DEMO_SCORE) }}>
              {DEMO_SCORE} · {riskLabel(DEMO_SCORE)}
            </span>
          </div>

          <div>
            <p className="casemock__label label-caps">Timeline</p>
            <div className="casemock__timeline">
              {TIMELINE.map((event) => (
                <span
                  className={`casemock__event${event.flagged ? ' casemock__event--flagged' : ''}`}
                  key={event.date}
                >
                  <span className="casemock__node" />
                  <span className="casemock__date">{event.date}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="casemock__label label-caps">Extracted</p>
            {/* Wraps. This is the row that used to run off the right edge. */}
            <div className="casemock__chips">
              {EXTRACTED.map((value) => (
                <span className="casemock__chip" key={value}>
                  {value}
                </span>
              ))}
            </div>
          </div>

          {/* Missing evidence — the differentiator, in gap violet. */}
          <p className="casemock__gap">
            <IconGap />
            <span>Missing: bank statement for 12 Aug — payment has no matching record</span>
          </p>

          <div>
            <p className="casemock__label label-caps">Next action</p>
            {/* Spans, not buttons. Nothing here does anything, and putting
                four dead controls in the tab order would be a lie. */}
            <div className="casemock__actions">
              <span className="casemock__btn casemock__btn--primary">File on cybercrime.gov.in</span>
              <span className="casemock__btn">Export PDF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CasePreview() {
  return (
    <section className="preview" id="preview">
      <div className="section__inner preview__inner">
        <Reveal className="preview__copy" from="left">
          <h2 className="section__title">
            Everything in one <em>case file</em>.
          </h2>
          <span className="preview__rule" aria-hidden="true" />
          <p className="section__lede lead">
            Upload what you have. Argus reads it, orders it, scores it, and shows you what the
            case is still missing.
          </p>

          <dl className="preview__stats">
            {STATS.map((s) => (
              <div className="stat" key={s.id}>
                <span className="stat__icon">{s.icon}</span>
                <div className="stat__text">
                  <dt className="stat__value tnum">{s.value}</dt>
                  <dd className="stat__label">{s.label}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal className="preview__art" from="right" delay={0.1}>
          <CaseMock />
        </Reveal>
      </div>
    </section>
  )
}

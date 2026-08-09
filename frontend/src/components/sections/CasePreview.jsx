import Reveal from '../Reveal'
import { IconAction, IconChat, IconGap, IconImage, IconLayers, IconOpenLock, IconSpark } from '../Icons'
import { riskColorVar, riskLabel } from '../../lib/risk'
import './CasePreview.css'

/**
 * Stats alongside the argument the whole product makes in one picture:
 * scattered evidence on the left, one ordered case on the right.
 *
 * This replaced a mock of the case dashboard in a browser window. The window
 * was a good drawing of the screen and a bad drawing of the point — it showed
 * where you end up without showing what you started with, so the thing Argus
 * actually does happened off-camera. The fragments are the missing half.
 *
 * Neither side is a screenshot. The left is three abstract shapes with
 * skeleton bars rather than legible content, because the fragments stand for
 * "a screenshot, a chat, a statement" generally and inventing readable
 * messages for them would be inventing evidence. The right shows only what
 * survives that: an ID, a score, three entities, one gap.
 *
 * Laid out in HTML rather than SVG, which is the lesson the old mock left
 * behind: SVG text does not wrap, so every string sat at a hand-placed `x`
 * with a hand-measured panel behind it, and any copy edit or font fallback
 * broke it. In flow layout the same line simply wraps.
 *
 * Motion is Reveal and nothing else — the same scroll entrance the rest of
 * the page uses, entering from the direction the pipeline runs. No bespoke
 * animation, and the composition is complete without any of it.
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

const EXTRACTED = ['+91 98765 43210', '₹25,000', 'rahul.s@okhdfc']

/** Widths of the skeleton bars, as percentages. Uneven on purpose — identical
 *  bars read as a loading state rather than as redacted content. */
const SHOT_BARS = [78, 54]
const CHAT_BARS = [88, 62, 40]

function Fragments() {
  return (
    <div className="scatter">
      <div className="frag frag--shot">
        <span className="frag__icon">
          <IconImage />
        </span>
        {SHOT_BARS.map((w) => (
          <span className="frag__bar" key={w} style={{ width: `${w}%` }} />
        ))}
      </div>

      <div className="frag frag--chat">
        <span className="frag__icon">
          <IconChat />
        </span>
        {CHAT_BARS.map((w) => (
          <span className="frag__bar" key={w} style={{ width: `${w}%` }} />
        ))}
      </div>

      <div className="frag frag--receipt">
        <span className="frag__rule" />
        <span className="frag__rule frag__rule--short" />
        <span className="frag__rule" />
        <span className="frag__amount">₹25,000</span>
      </div>
    </div>
  )
}

function TidyCase() {
  return (
    <div className="tidy">
      <div className="tidy__head">
        <span className="tidy__case">{DEMO_CASE}</span>
        <span className="risk-badge" style={{ '--risk': riskColorVar(DEMO_SCORE) }}>
          {DEMO_SCORE} · {riskLabel(DEMO_SCORE)}
        </span>
      </div>

      <div>
        <p className="tidy__label label-caps">Extracted</p>
        <div className="tidy__chips">
          {EXTRACTED.map((value) => (
            <span className="tidy__chip" key={value}>
              {value}
            </span>
          ))}
        </div>
      </div>

      {/* Missing evidence — the differentiator, in gap violet. */}
      <p className="tidy__gap">
        <IconGap />
        <span>Missing: bank statement for 12 Aug</span>
      </p>
    </div>
  )
}

/** Blue in, gold out — the same direction the pipeline diagram reads. */
function FlowArrow() {
  return (
    <span className="ba__arrow" aria-hidden="true">
      <svg width="54" height="16" viewBox="0 0 54 16" fill="none">
        <defs>
          <linearGradient id="ba-flow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--secondary-fill)" />
            <stop offset="1" stopColor="var(--accent-fill)" />
          </linearGradient>
        </defs>
        <path d="M2 8h44" stroke="url(#ba-flow)" strokeWidth="2" strokeLinecap="round" />
        <path
          d="m41 3 6 5-6 5"
          stroke="var(--accent-fill)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
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
          {/* One role="img" over the whole comparison, and it sits here rather
              than on the Reveal because Reveal forwards only the props it
              names. Read out piecemeal this is a pile of empty divs followed
              by a case record that does not exist; described once, it is what
              it looks like — a picture making a before-and-after argument. */}
          <div
            className="ba"
            role="img"
            aria-label={`Before: a screenshot, a chat message and a statement fragment, scattered and unsorted. After: one case file — ${DEMO_CASE}, scored ${DEMO_SCORE} out of 100, ${riskLabel(DEMO_SCORE)}, with a phone number, an amount and a UPI ID extracted, and a missing bank statement flagged.`}
          >
            <div className="ba__side">
              <Fragments />
              <p className="ba__caption label-caps">What you have</p>
            </div>

            <FlowArrow />

            <div className="ba__side">
              <TidyCase />
              <p className="ba__caption ba__caption--after label-caps">What you get</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

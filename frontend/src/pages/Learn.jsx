import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { IconClock, IconCoins, IconKey, IconSeal } from '../components/Icons'
import './Learn.css'

/**
 * The public explainer at /learn. Static — no API, no auth, nothing to load.
 *
 * Two rules govern the copy here more tightly than anywhere else on the site:
 *
 *   1. Every pattern is one Argus actually detects. The "In Argus" line on
 *      each card names the real rule behind it — suspicious keywords and the
 *      phone-beside-payment-handle pair, both in backend/lib/riskScore.js. If
 *      a rule changes, this page is wrong until it is changed too. Do not add
 *      a fifth pattern because it is well known; add it when it is detected.
 *   2. Calm, not alarmed. Someone reading this may be halfway through the
 *      thing it describes, and a page that shouts is a page they stop
 *      reading. No red anywhere — the palette reserves it for confirmed fraud
 *      signals, and general education is not one.
 *
 * The copy is deliberately short. An earlier draft gave each pattern a full
 * paragraph, and four paragraphs in four identical boxes is a wall of text
 * wearing a grid. One sentence per card is the budget; if a pattern cannot be
 * said in one, it is two patterns.
 */

const PATTERNS = [
  {
    id: 'urgency',
    icon: <IconClock />,
    title: 'Urgency and time pressure',
    body: 'The deadline is the message — pressure is what stops you pausing to check, and everything after it depends on you not pausing.',
    signal: 'Urgency phrases count as suspicious keywords, and each one found raises the score.',
  },
  {
    id: 'authority',
    icon: <IconSeal />,
    title: 'Borrowed authority',
    body: 'Your bank’s fraud team, the tax office, the courier, the police — the name does the work, and no real officer minds being called back.',
    signal: 'Names, numbers and handles are extracted from every file, so a claim can be set beside the rest of the case.',
  },
  {
    id: 'otp',
    icon: <IconKey />,
    title: 'The request for an OTP',
    body: 'A one-time password approves a payment; it never proves who you are, and nobody legitimate has any use for yours.',
    signal: '“OTP” is among the keywords flagged in a chat export or a screenshot.',
  },
  {
    id: 'fee',
    icon: <IconCoins />,
    title: 'A fee before the money',
    body: 'A refund, a prize, a parcel held at customs — each waiting behind one small payment, and it is never the last one.',
    signal: 'A contact number sitting beside a payment handle scores on its own.',
  },
]

const STEPS = [
  {
    id: 'otp',
    lead: 'Do not share an OTP, PIN, CVV or password.',
    body: 'Not with the bank, not with the police, not with anyone who called you. Nobody entitled to those has to ask you for them.',
  },
  {
    id: 'verify',
    lead: 'Hang up, then verify independently.',
    body: 'Call the number printed on your card or published on the official website — never a number, link or app sent to you in the message. If the call was genuine, calling back costs nothing.',
  },
  {
    id: 'pressure',
    lead: 'Refuse the deadline.',
    body: '“I will call you back” ends most of these conversations on its own. Anything that cannot survive ten minutes of checking was not real to begin with.',
  },
  {
    id: 'evidence',
    lead: 'Keep the evidence before you block.',
    body: 'Export the chat, screenshot the messages, save the transaction reference. Blocking first is the natural reaction, and it takes the record with it.',
  },
  {
    id: 'report',
    lead: 'Tell your bank first, then report it.',
    body: 'A bank can sometimes stop a transfer that is only minutes old, so it is the call that is worth making immediately. In India, cyber fraud is then reported on the 1930 helpline or at cybercrime.gov.in.',
  },
]

export default function Learn() {
  return (
    <div className="learn">
      {/* A title moment. Centred, given room on both sides, and carrying no
          content of its own — the page proper starts below it. */}
      <section className="section learn__intro">
        <div className="section__inner">
          <Reveal className="section__head section__head--center learn__title">
            <p className="eyebrow label-caps">How fraud works</p>
            <h1 className="section__title">
              Fraud runs on a <em>script</em>.
            </h1>
            <p className="section__lede lead">
              Being caught by one is not a failure of intelligence. It is what happens when someone
              manufactures urgency faster than you can check.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" id="patterns">
        <div className="section__inner">
          <Reveal className="section__head">
            <p className="eyebrow label-caps">What to look for</p>
            <h2 className="section__title">
              Four moves, in roughly this <em>order</em>.
            </h2>
            <p className="section__lede lead">
              They are rarely used one at a time. Urgency makes room for the other three.
            </p>
          </Reveal>

          {/* Urgency leads at full width and the rest follow in a row. The
              asymmetry is the lede's point made in layout — it is the move
              that makes room for the others, not one of four equals. */}
          <div className="learn__moves">
            {PATTERNS.map((pattern, i) => (
              <Reveal
                key={pattern.id}
                delay={i * 0.06}
                className={`card move${i === 0 ? ' move--lead' : ''}`}
              >
                <span className="move__head">
                  <span className="card__icon learn__pattern-icon">{pattern.icon}</span>
                  <span className="move__num tnum">{String(i + 1).padStart(2, '0')}</span>
                </span>
                <h3 className="card__title">{pattern.title}</h3>
                <p className="card__body">{pattern.body}</p>
                <div className="card__foot">
                  <p className="learn__signal text-small">
                    <span className="learn__signal-label label-caps">In Argus</span>
                    {pattern.signal}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="targeted">
        <div className="section__inner">
          <Reveal className="section__head">
            <p className="eyebrow label-caps">If you are targeted</p>
            <h2 className="section__title">
              Five things, in <em>this</em> order.
            </h2>
            <p className="section__lede lead">
              None of them require you to have worked out what is going on yet.
            </p>
          </Reveal>

          <Reveal>
            {/* A step-flow rather than a list of paragraphs: numbered nodes on
                a connecting line, so the order is drawn instead of merely
                implied. Static, unlike the homepage pipeline — this is
                something to follow, not something to play with.

                list-style: none strips list semantics in some screen readers,
                so the role is restated rather than assumed. */}
            <ol className="learn__flow" role="list">
              {STEPS.map((step) => (
                <li key={step.id} className="learn__flow-step">
                  <p className="learn__step-lead">{step.lead}</p>
                  <p className="learn__step-body">{step.body}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="section learn__cta">
        <div className="section__inner">
          <Reveal className="section__head section__head--center">
            <p className="eyebrow label-caps">If it already happened</p>
            <h2 className="section__title">
              Start with what you <em>have</em>.
            </h2>
            <p className="section__lede lead">
              You do not need the whole story or a tidy folder. A chat export, a screenshot and a
              bank statement are enough for Argus to build a timeline, score what it found, and
              tell you which piece is still missing.
            </p>
          </Reveal>

          <Reveal delay={0.08} className="learn__cta-actions">
            <Link className="btn btn--primary" to="/start">
              Start a case
            </Link>

            {/* The same honesty the homepage band carries, and it matters more
                here: this page can be reached by someone in the middle of it. */}
            <p className="learn__note text-caption">
              Argus organises evidence into a report you can file — it does not file anything
              on your behalf, and it is not a substitute for telling your bank. Prototype build:
              please use the synthetic sample case, not real evidence.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  )
}

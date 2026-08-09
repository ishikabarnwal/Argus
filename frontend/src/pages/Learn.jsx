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
 */

const PATTERNS = [
  {
    id: 'urgency',
    icon: <IconClock />,
    title: 'Urgency and time pressure',
    body: '“Your account will be blocked in 30 minutes.” “Act now or this goes to court.” The deadline is the message. Pressure is what stops you pausing to check, and every step after it depends on you not pausing. Real institutions leave you time, and their deadlines arrive in writing.',
    signal:
      'Urgency phrases are counted as suspicious keywords. Each one found raises the risk score, and the report lists the phrases it counted.',
  },
  {
    id: 'authority',
    icon: <IconSeal />,
    title: 'Borrowed authority',
    body: 'The caller is from your bank’s fraud team, the tax department, the courier, the police. The name does the work — most people argue less with an institution than with a stranger. Nobody legitimate minds being asked to prove who they are, and no real officer objects to being called back.',
    signal:
      'Names, phone numbers and payment handles are pulled out of every piece of evidence, so a claim made in a chat can be set beside what the statement and the screenshots say.',
  },
  {
    id: 'otp',
    icon: <IconKey />,
    title: 'The request for an OTP',
    body: 'A one-time password is the last step of a payment, not proof of identity. Anyone asking you to read one out is asking you to approve something, whatever the words around it say — to verify your account, to cancel a transaction, to confirm it is really you. There is no situation in which another person needs it.',
    signal:
      '“OTP” is among the keywords flagged in a chat export or a screenshot, and where it appears on the timeline is usually the moment the case turns.',
  },
  {
    id: 'fee',
    icon: <IconCoins />,
    title: 'A fee before the money',
    body: 'A refund, a prize, a loan, a job, a parcel held at customs — each waiting behind one small payment. Verification fee, processing charge, clearance duty. The sum is small on purpose: easy to pay, not worth an argument. It is never the last one.',
    signal:
      'A contact number appearing beside a payment handle scores on its own — someone to talk to and somewhere to send money is the shape of this pattern. Larger amounts add more.',
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
      <section className="section learn__intro">
        <div className="section__inner">
          <Reveal className="section__head">
            <p className="eyebrow label-caps">How fraud works</p>
            <h1 className="section__title">
              Fraud runs on a <em>script</em>.
            </h1>
            <p className="section__lede lead">
              Being caught by a scam is not a failure of intelligence. It is what happens when
              somebody manufactures urgency faster than you can check on it. The same few moves
              turn up in most of the cases Argus sees, and knowing the shape of one is usually
              enough to recognise it while it is happening — which is the only moment that helps.
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
              They are rarely used one at a time. Urgency makes room for the rest, and by the time
              money is mentioned the other three have usually already done their work.
            </p>
          </Reveal>

          <div className="card-grid learn__patterns">
            {PATTERNS.map((pattern, i) => (
              <Reveal key={pattern.id} delay={i * 0.08} className="card">
                <span className="card__icon learn__pattern-icon">{pattern.icon}</span>
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
              None of them require you to have worked out what is going on yet. They are worth
              doing on a suspicion.
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

import Reveal from '../Reveal'
import { IconAction, IconGap, IconPerson } from '../Icons'

/**
 * The three things Argus does that a generic evidence processor does not.
 * These are the product's actual differentiators, so they get the most
 * deliberate treatment on the page — including the one featured card.
 */
const ITEMS = [
  {
    id: 'gaps',
    icon: <IconGap />,
    title: 'Missing-evidence detection',
    body: 'Most tools process what you hand them. Argus flags what you did not — a gap in the timeline, a payment with no matching message, a number that appears once and never again.',
    href: '#evidence',
  },
  {
    id: 'action',
    icon: <IconAction />,
    title: 'Action-first output',
    body: 'Every case ends with what to do next: which portal, which form, which deadline. A report you can act on, not a document you have to interpret first.',
    href: '#start',
    featured: true,
  },
  {
    id: 'victim',
    icon: <IconPerson />,
    title: 'Built for the victim',
    body: 'Forensic platforms assume a trained investigator on the other side of the screen. Argus assumes the person it happened to, on possibly the worst day of their year.',
    href: '#start',
  },
]

export default function Differentiators() {
  return (
    <section className="section" id="why">
      <div className="section__inner">
        <Reveal className="section__head section__head--center">
          <p className="eyebrow label-caps">Why Argus</p>
          <h2 className="section__title">
            Built to find what is <em>missing</em>.
          </h2>
          <p className="section__lede lead">
            Evidence arrives scattered across apps, screenshots and statements. The hard part is
            never reading it — it is noticing what should be there and is not.
          </p>
        </Reveal>

        <div className="card-grid">
          {ITEMS.map((item, i) => (
            <Reveal
              key={item.id}
              from="up"
              delay={i * 0.08}
              className={`card card--centered${item.featured ? ' card--featured' : ''}`}
            >
              {item.featured && <span className="card__flag">Most asked for</span>}
              <span className="card__badge">{item.icon}</span>
              <h3 className="card__title">{item.title}</h3>
              <p className="card__body">{item.body}</p>
              <div className="card__foot">
                <a
                  className={`btn btn--sm ${item.featured ? 'btn--primary' : 'btn--outline'}`}
                  href={item.href}
                >
                  Learn more
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

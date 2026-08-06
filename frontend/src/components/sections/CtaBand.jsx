import { Link } from 'react-router-dom'
import Reveal from '../Reveal'
import './CtaBand.css'

export default function CtaBand() {
  return (
    <section className="section cta-band" id="start">
      <div className="section__inner">
        <Reveal className="cta-band__inner">
          <p className="eyebrow label-caps">Start here</p>
          <h2 className="section__title">
            Turn the pile into a <em>case</em>.
          </h2>
          <p className="section__lede lead">
            Upload what you have. Argus will tell you what it found, what it scored, and what is
            still missing.
          </p>

          <div className="cta-band__actions">
            <Link className="btn btn--primary" to="/start">
              Start a case
            </Link>
            {/* Was a <button> with no handler, offering a report that does not
                exist — a dead control in the tab order, promising a feature
                twice over. Points at the preview section instead, which does. */}
            <a className="btn btn--ghost" href="#preview">
              See a case file
            </a>
          </div>

          {/* Honest about what this build is. Argus is a prototype and the
              project rule is synthetic data only — the page should say so
              rather than imply it is ready for a real victim's evidence. */}
          <p className="cta-band__note text-caption">
            Prototype build — please use the synthetic sample case, not real evidence.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

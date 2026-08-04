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
            Upload what you have. Argus will tell you what it found, what is missing, and what to
            do about it.
          </p>

          <div className="cta-band__actions">
            <Link className="btn btn--primary" to="/start">
              Start a case
            </Link>
            <button type="button" className="btn btn--ghost">
              See a sample report
            </button>
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

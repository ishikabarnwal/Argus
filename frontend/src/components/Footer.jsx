import { Link } from 'react-router-dom'
import { useSectionHref } from '../lib/sectionHref'
import './Footer.css'

export default function Footer() {
  const sectionHref = useSectionHref()

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__mark" aria-hidden="true" />
          <span className="footer__name">Argus</span>
          <span className="footer__tag text-caption">Cyber fraud evidence, organised.</span>
        </div>

        <nav className="footer__nav" aria-label="Footer">
          <a href={sectionHref('why')}>Why Argus</a>
          <a href={sectionHref('evidence')}>Evidence</a>
          <Link to="/start">Start a case</Link>
        </nav>
      </div>
    </footer>
  )
}

import { Link } from 'react-router-dom'
import Reveal from '../Reveal'
import HeroShield from './HeroShield'
import './Hero.css'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__inner">
        <Reveal className="hero__copy" from="left">
          <h1 className="display-hero">Every fraud leaves a pattern.</h1>
          <p className="lead hero__sub">
            Argus turns scattered evidence — chats, screenshots, bank statements — into a timeline,
            a relationship graph, and a complaint ready to file.
          </p>
          <div className="hero__cta">
            <Link className="btn btn--primary" to="/start">
              Start a case
            </Link>
          </div>
        </Reveal>

        <Reveal className="hero__art" from="right" delay={0.1}>
          <HeroShield />
        </Reveal>
      </div>
    </section>
  )
}
